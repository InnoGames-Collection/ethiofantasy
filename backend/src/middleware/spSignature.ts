import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { env } from '../config/env.js';

export async function verifySpSignature(req: FastifyRequest, reply: FastifyReply) {
  if (env.NODE_ENV === 'test') {
    return;
  }

  const signature = req.headers['x-signature'] as string;
  if (!signature) {
    reply.status(401).send({ error: 'Missing X-Signature header' });
    return;
  }

  const rawBuffer = req.rawBodyBuffer || Buffer.from(JSON.stringify(req.body));
  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', env.SP_WEBHOOK_SECRET).update(rawBuffer).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    reply.status(403).send({ error: 'Invalid HMAC webhook signature' });
    return;
  }
}
