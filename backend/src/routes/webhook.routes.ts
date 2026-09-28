import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';
import { verifySpSignature } from '../middleware/spSignature.js';
import { SpService } from '../services/spService.js';
import { normalizeMsisdn, maskMsisdn } from '../services/dailyChallengeEngine.js';
import { env } from '../config/env.js';

export async function webhookRoutes(fastify: FastifyInstance) {
  /**
   * Inbound Subscription Lifecycle Webhook from Telecom SP Gateway
   * Contract: partner-mt-and-webhooks.openapi.yaml
   */
  fastify.post('/subscription', { preHandler: [verifySpSignature] }, async (req, reply) => {
    const body = req.body as {
      event: 'subscribe' | 'unsubscribe' | 'renew' | 'billing_failed';
      request_id?: string;
      service_id?: string;
      msisdn: string;
      timestamp?: number;
    };

    const { event, request_id, service_id, msisdn } = body;
    if (!event || !msisdn) {
      return reply.status(400).send({ error: 'Missing required parameters' });
    }

    const norm = normalizeMsisdn(msisdn);
    const masked = maskMsisdn(norm);

    // 1. Audit log raw webhook event
    await pool.query(
      `INSERT INTO sp_webhook_events (event_type, request_id, msisdn, service_id, raw_payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [event, request_id || `req_${Date.now()}`, norm, service_id || env.SP_SERVICE_ID, JSON.stringify(body)]
    );

    // 2. Process event
    if (event === 'subscribe' || event === 'renew') {
      await pool.query(
        `INSERT INTO subscriptions (msisdn, shortcode, service_id, status, renew_count, last_billed_at, next_billing_at, updated_at)
         VALUES ($1, $2, $3, 'ACTIVE', 1, NOW(), NOW() + INTERVAL '1 day', NOW())
         ON CONFLICT (id) DO NOTHING`,
        [norm, env.SHORTCODE, service_id || env.SP_SERVICE_ID]
      );

      // Ensure player record exists
      await pool.query(
        `INSERT INTO players (msisdn, masked_msisdn, last_active_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (msisdn) DO UPDATE SET last_active_at = NOW()`,
        [norm, masked]
      );

      // Send Welcome MT SMS
      if (event === 'subscribe') {
        await SpService.sendMt({
          msisdn: norm,
          message: `Welcome to EthioFantasy! You are subscribed (5 ETB/day). Test your football knowledge & win 20,000 ETB: https://ethiofantasy.${env.DOMAIN}`,
          type: 'optin',
        });
      }
    } else if (event === 'unsubscribe') {
      await pool.query(
        `UPDATE subscriptions 
         SET status = 'UNSUBSCRIBED', updated_at = NOW() 
         WHERE msisdn = $1`,
        [norm]
      );
    }

    return reply.send({ success: true, processed: event });
  });

  /**
   * Inbound Delivery Status Callback (DLR)
   */
  fastify.post('/dlr', async (req, reply) => {
    return reply.send({ received: true });
  });
}
