import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthPayload {
  msisdn: string;
  role?: string;
  adminId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthPayload;
  }
}

export async function verifyAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = decoded;
  } catch {
    reply.status(401).send({ error: 'Invalid or expired session token' });
    return;
  }
}

export async function verifyAdmin(req: FastifyRequest, reply: FastifyReply) {
  await verifyAuth(req, reply);
  if (!req.user || !['SUPER_ADMIN', 'OPERATOR', 'AUDITOR'].includes(req.user.role || '')) {
    reply.status(403).send({ error: 'Forbidden: Insufficient operator privileges' });
    return;
  }
}
