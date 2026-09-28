import { FastifyRequest, FastifyReply } from 'fastify';
import { cache } from '../config/cache.js';

export async function rateLimiter(req: FastifyRequest, reply: FastifyReply) {
  const ip = req.ip || '127.0.0.1';
  const key = `rl:${ip}`;

  try {
    const current = await cache.incr(key);
    if (current === 1) {
      await cache.expire(key, 60);
    }
    if (current > 120) {
      reply.status(429).send({ error: 'Too Many Requests — rate limit exceeded' });
      return;
    }
  } catch {
    // If Valkey is unavailable, allow the request
  }
}
