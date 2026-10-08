import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { env } from '../config/env.js';
import { normalizeMsisdn, maskMsisdn } from '../services/dailyChallengeEngine.js';
import { SpService } from '../services/spService.js';

interface WebhookBody {
  event: 'subscribe' | 'unsubscribe' | 'renew' | 'billing_failed';
  request_id?: string;
  transaction_id?: string;
  service_id?: string;
  msisdn: string;
  timestamp?: number;
}

export async function webhookRoutes(fastify: FastifyInstance) {
  // Capture raw body buffer for cryptographically accurate HMAC validation
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    (req as any).rawBodyBuffer = body;
    try {
      const json = JSON.parse(body.toString('utf8'));
      done(null, json);
    } catch (err: any) {
      done(err, undefined);
    }
  });

  /**
   * Reusable Inbound Subscription Handler with Timing-Safe HMAC & Idempotency
   */
  const handleSubscriptionWebhook = async (req: FastifyRequest, reply: FastifyReply) => {
    // 1. Timing-Safe HMAC Verification
    if (env.NODE_ENV !== 'test') {
      const signature = (req.headers['x-signature'] as string) || '';
      const rawBuffer = (req as any).rawBodyBuffer as Buffer;

      if (!signature || !rawBuffer) {
        return reply.status(401).send({ error: 'Missing X-Signature header or request body' });
      }

      const secret = env.PORTAL_WEBHOOK_SECRET || env.SP_WEBHOOK_SECRET;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(rawBuffer);
      const computedDigest = hmac.digest('hex').toLowerCase();

      // Normalize: strip 'sha256=' prefix if present and convert to lowercase hex
      const cleanHeaderSig = signature.replace(/^sha256=/i, '').trim().toLowerCase();

      const sigBuf = Buffer.from(cleanHeaderSig, 'utf8');
      const expBuf = Buffer.from(computedDigest, 'utf8');

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        req.log.warn({ signature, expected: computedDigest }, 'HMAC webhook signature validation failed');
        return reply.status(403).send({ error: 'Invalid HMAC signature' });
      }
    }

    const body = req.body as WebhookBody;
    const { event, msisdn } = body;
    const requestId = body.request_id || body.transaction_id || `req_${Date.now()}_${Math.random()}`;

    if (!event || !msisdn) {
      return reply.status(400).send({ error: 'Missing mandatory parameters (event, msisdn)' });
    }

    // 2. Replay Protection: Check timestamp window (5 minutes max)
    if (body.timestamp) {
      const nowMs = Date.now();
      const tsMs = body.timestamp > 1e11 ? body.timestamp : body.timestamp * 1000;
      if (Math.abs(nowMs - tsMs) > 300000) {
        return reply.status(400).send({ error: 'Timestamp expired (max 5 minutes skew)' });
      }
    }

    const norm = normalizeMsisdn(msisdn);
    const masked = maskMsisdn(norm);

    // 3. Distributed Lock to prevent concurrent racing on the same MSISDN
    const lockKey = `lock:webhook:${norm}`;
    let acquired = false;
    try {
      const lockRes = await cache.set(lockKey, '1', 'PX', 5000, 'NX');
      acquired = Boolean(lockRes);
    } catch (err) {
      acquired = true;
    }

    if (!acquired) {
      return reply.status(429).send({ error: 'Concurrent event processing in flight' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 4. Idempotency Check via Database Audit Table
      const existingRes = await client.query(
        `SELECT id FROM sp_webhook_events WHERE request_id = $1 LIMIT 1`,
        [requestId]
      );

      if (existingRes.rows.length > 0) {
        await client.query('ROLLBACK');
        req.log.info({ requestId, msisdn: norm }, 'Duplicate webhook event discarded idempotently');
        return reply.send({ success: true, status: 'IDEMPOTENT_DUPLICATE_IGNORED' });
      }

      // Record Audit Event
      await client.query(
        `INSERT INTO sp_webhook_events (event_type, request_id, msisdn, service_id, raw_payload, processing_status, processed_at)
         VALUES ($1, $2, $3, $4, $5, 'SUCCESS', NOW())`,
        [event, requestId, norm, body.service_id || env.SP_SERVICE_ID, JSON.stringify(body)]
      );

      // 5. Atomic Subscription State Updates
      if (event === 'subscribe' || event === 'renew') {
        await client.query(
          `INSERT INTO subscriptions (msisdn, shortcode, service_id, status, renew_count, price_etb, last_billed_at, next_billing_at, updated_at)
           VALUES ($1, $2, $3, 'ACTIVE', 1, 2.00, NOW(), NOW() + INTERVAL '1 day', NOW())
           ON CONFLICT (msisdn) DO UPDATE SET
             status = 'ACTIVE',
             shortcode = $2,
             price_etb = 2.00,
             renew_count = subscriptions.renew_count + 1,
             last_billed_at = NOW(),
             next_billing_at = NOW() + INTERVAL '1 day',
             updated_at = NOW()`,
          [norm, env.SHORTCODE, body.service_id || env.SP_SERVICE_ID]
        );

        // Ensure Player Record Exists
        await client.query(
          `INSERT INTO players (msisdn, masked_msisdn, last_active_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (msisdn) DO UPDATE SET last_active_at = NOW()`,
          [norm, masked]
        );
      } else if (event === 'unsubscribe') {
        await client.query(
          `UPDATE subscriptions 
           SET status = 'UNSUBSCRIBED', updated_at = NOW(), cancellation_reason = 'USER_OPT_OUT'
           WHERE msisdn = $1`,
          [norm]
        );
      } else if (event === 'billing_failed') {
        await client.query(
          `UPDATE subscriptions 
           SET status = 'SUSPENDED', failure_reason = 'INSUFFICIENT_AIRTIME', suspended_at = NOW(), updated_at = NOW() 
           WHERE msisdn = $1`,
          [norm]
        );
      }

      await client.query('COMMIT');

      // 6. Post-Commit Actions (MT Notifications)
      if (event === 'subscribe') {
        SpService.sendMt({
          msisdn: norm,
          message: `Welcome to EthioFantasy! Subscribed (2 ETB/day). Answer daily football questions & win 50,000 ETB! Play: https://ethiofantasy.${env.DOMAIN}`,
          type: 'optin',
        }).catch((e) => req.log.error(e, 'Failed to send welcome SMS'));
      }

      return reply.send({ success: true, processed: event, requestId });
    } catch (err: any) {
      await client.query('ROLLBACK');
      req.log.error({ err, requestId }, 'Transactional webhook processing failed');
      return reply.status(500).send({ error: 'Internal processing error', detail: err.message });
    } finally {
      client.release();
      try {
        await cache.del(lockKey);
      } catch (e) {}
    }
  };

  /**
   * Inbound Ethio Telecom Subscription Webhook (Routes supported: /subscription and /webhooks/subscription)
   */
  fastify.post('/subscription', handleSubscriptionWebhook);
  fastify.post('/webhooks/subscription', handleSubscriptionWebhook);

  /**
   * Outbound MT SMS Dispatch Route (for OTPs, notifications, prize disbursements)
   */
  fastify.post('/mt/send', async (req, reply) => {
    const apiKey = (req.headers['x-api-key'] as string) || (req.headers['authorization'] as string)?.replace(/^Bearer /i, '');
    if (apiKey !== env.SP_API_KEY && apiKey !== env.CRON_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized MT dispatch request' });
    }

    const { msisdn, message, type = 'business', extTransactionId } = req.body as {
      msisdn: string;
      message: string;
      type?: 'otp' | 'optin' | 'optout' | 'business';
      extTransactionId?: string;
    };

    if (!msisdn || !message) {
      return reply.status(400).send({ error: 'msisdn and message are required' });
    }

    const norm = normalizeMsisdn(msisdn);
    const result = await SpService.sendMt({
      msisdn: norm,
      message,
      type,
      extTransactionId,
    });

    return reply.status(result.success ? 200 : 502).send(result);
  });

  /**
   * Inbound Delivery Status Callback (DLR)
   */
  fastify.post('/dlr', async (req, reply) => {
    return reply.send({ received: true });
  });
  fastify.post('/webhooks/dlr', async (req, reply) => {
    return reply.send({ received: true });
  });
}
