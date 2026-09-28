import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { env } from '../config/env.js';

export async function verifySpSignature(req: FastifyRequest, reply: FastifyReply) {
  // If in development mode without secret, permit
  if (env.NODE_ENV === 'development' && env.SP_WEBHOOK_SECRET === 'ethiofantasy-hmac-webhook-secret-2026') {
    return;
  }

  const signature = req.headers['x-signature'] as string;
  if (!signature) {
    reply.status(401).send({ error: 'Missing X-Signature header' });
    return;
  }

  const rawBody = JSON.stringify(req.body);
  const expected = 'sha256=' + crypto.createHmac('sha256', env.SP_WEBHOOK_SECRET).update(rawBody).digest('hex');

  if (signature !== expected) {
    reply.status(403).send({ error: 'Invalid HMAC webhook signature' });
    return;
  }
}
