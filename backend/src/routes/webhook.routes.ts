import { FastifyInstance } from 'fastify';
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
   * Inbound Ethio Telecom Subscription Webhook (Airtime Charging / DLR / Opt-out)
   */
  fastify.post('/subscription', async (req, reply) => {
    // 1. Timing-Safe HMAC Verification (Skip in test environment)
    if (env.NODE_ENV !== 'test') {
      const signature = req.headers['x-signature'] as string;
      const rawBuffer = (req as any).rawBodyBuffer as Buffer;

      if (!signature || !rawBuffer) {
        return reply.status(401).send({ error: 'Missing X-Signature header or request body' });
      }

      const hmac = crypto.createHmac('sha256', env.SP_WEBHOOK_SECRET);
      hmac.update(rawBuffer);
      const expectedSignature = 'sha256=' + hmac.digest('hex');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        req.log.error({ signature, expected: expectedSignature }, 'HMAC webhook signature validation failed');
        return reply.status(403).send({ error: 'Invalid HMAC signature' });
      }
    }

    const body = req.body as WebhookBody;
    const { event, msisdn } = body;
    const requestId = body.request_id || body.transaction_id || `req_${Date.now()}_${Math.random()}`;

    if (!event || !msisdn) {
      return reply.status(400).send({ error: 'Missing mandatory parameters (event, msisdn)' });
    }

    const norm = normalizeMsisdn(msisdn);
    const masked = maskMsisdn(norm);

    // 2. Distributed Lock to prevent concurrent racing on the same MSISDN
    const lockKey = `lock:webhook:${norm}`;
    let acquired = false;
    try {
      const lockRes = await cache.set(lockKey, '1', 'PX', 5000, 'NX');
      acquired = Boolean(lockRes);
    } catch (err) {
      // If Redis is temporarily unavailable, proceed with database transactional safety
      acquired = true;
    }

    if (!acquired) {
      return reply.status(429).send({ error: 'Concurrent event processing in flight' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Idempotency Check via Database Audit Table
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

      // 4. Atomic Subscription State Updates
      if (event === 'subscribe' || event === 'renew') {
        await client.query(
          `INSERT INTO subscriptions (msisdn, shortcode, service_id, status, renew_count, last_billed_at, next_billing_at, updated_at)
           VALUES ($1, $2, $3, 'ACTIVE', 1, NOW(), NOW() + INTERVAL '1 day', NOW())
           ON CONFLICT (msisdn) DO UPDATE SET
             status = 'ACTIVE',
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
           SET status = 'UNSUBSCRIBED', updated_at = NOW() 
           WHERE msisdn = $1`,
          [norm]
        );
      } else if (event === 'billing_failed') {
        await client.query(
          `UPDATE subscriptions 
           SET status = 'SUSPENDED', failure_reason = 'INSUFFICIENT_AIRTIME', updated_at = NOW() 
           WHERE msisdn = $1`,
          [norm]
        );
      }

      await client.query('COMMIT');

      // 5. Post-Commit Actions (MT Notifications)
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
  });

  /**
   * Inbound Delivery Status Callback (DLR)
   */
  fastify.post('/dlr', async (req, reply) => {
    return reply.send({ received: true });
  });
}
