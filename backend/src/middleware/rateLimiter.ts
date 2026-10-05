import { FastifyRequest, FastifyReply } from 'fastify';
import { cache } from '../config/cache.js';

export async function rateLimiter(req: FastifyRequest, reply: FastifyReply) {
  // Exclude healthcheck probes from rate limiting
  const url = req.url || '';
  if (url.startsWith('/health') || url.startsWith('/healthz')) {
    return;
  }

  // Determine rate limiting identifier (CGNAT-aware)
  let key: string;
  let maxRequests = 120; // Default limit per minute

  if (req.user?.msisdn || req.user?.id) {
    // Authenticated user rate limiting per MSISDN / user ID
    const userId = req.user.msisdn || req.user.id;
    key = `rl:user:${userId}`;
    maxRequests = 180;
  } else {
    // Unauthenticated rate limiting: generous window for cellular CGNAT gateways
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    key = `rl:ip:${Array.isArray(ip) ? ip[0] : ip}`;
    maxRequests = 600;
  }

  try {
    const current = await cache.incr(key);
    if (current === 1) {
      await cache.expire(key, 60);
    }
    if (current > maxRequests) {
      reply.status(429).send({
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please wait a moment before trying again.',
      });
      return;
    }
  } catch {
    // If cache is temporarily unreachable, fail open to avoid service disruption
  }
}
