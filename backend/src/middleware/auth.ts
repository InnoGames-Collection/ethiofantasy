import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';

export type UserRole =
  | 'PLAYER'
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'OPERATOR'
  | 'REPORTING_ADMIN'
  | 'AUDITOR';

export interface AuthenticatedUser {
  id: string;
  msisdn?: string;
  role: UserRole;
  email?: string;
  username?: string;
  tokenVersion?: number;
  jti?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    rawBodyBuffer?: Buffer;
  }
}

// Player Token Specifications
export const JWT_ISSUER = 'ethiofantasy-auth-service';
export const JWT_AUDIENCE = 'ethiofantasy-platform';

// Dedicated Admin Token Specifications (Zero-Trust Key & Scope Isolation)
export const ADMIN_JWT_ISSUER = 'ethiofantasy-admin-auth-service';
export const ADMIN_JWT_AUDIENCE = 'ethiofantasy-admin-portal';

/**
 * Validates regular Player JWT access token with HS256 enforcement.
 */
export async function verifyAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header with Bearer token',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as AuthenticatedUser;

    if (!decoded.id || !decoded.msisdn) {
      reply.status(401).send({
        success: false,
        error: 'INVALID_TOKEN_PAYLOAD',
        message: 'Player token claims missing mandatory identity fields',
      });
      return;
    }

    req.user = decoded;
  } catch (err: any) {
    req.log.warn({ err: err.message }, 'Player JWT authentication verification failed');
    reply.status(401).send({
      success: false,
      error: 'TOKEN_INVALID_OR_EXPIRED',
      message: 'Session token has expired or is cryptographically invalid',
    });
    return;
  }
}

/**
 * Validates Dedicated Admin JWT token with strict signature, issuer, audience,
 * Redis revocation blacklist check, and PostgreSQL active status check.
 */
export async function verifyAdminAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: 'UNAUTHORIZED_ADMIN',
      message: 'Administrative endpoint requires Bearer token authorization',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    let decoded: AuthenticatedUser | null = null;

    // 1. Attempt verification with dedicated ADMIN_JWT_SECRET
    try {
      decoded = jwt.verify(token, env.ADMIN_JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      }) as AuthenticatedUser;
    } catch (err: any) {
      // Allow legacy development token fallback if in dev mode
      if (env.NODE_ENV !== 'production') {
        try {
          decoded = jwt.verify(token, env.JWT_SECRET, {
            algorithms: ['HS256'],
          }) as AuthenticatedUser;
        } catch {
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (!decoded || !decoded.id || (!decoded.email && !decoded.username)) {
      reply.status(401).send({
        success: false,
        error: 'INVALID_ADMIN_PAYLOAD',
        message: 'Admin token claims missing mandatory administrative identity fields',
      });
      return;
    }

    // 2. Reject regular players attempting to access admin endpoints
    if (decoded.role === 'PLAYER') {
      reply.status(403).send({
        success: false,
        error: 'FORBIDDEN_PLAYER_ACCESS',
        message: 'Player accounts cannot access administrative control plane',
      });
      return;
    }

    // 3. Check Redis / Valkey token blacklist (immediate revocation on logout)
    if (decoded.jti) {
      try {
        const isBlacklisted = await cache.get(`blacklist:${decoded.jti}`);
        if (isBlacklisted) {
          reply.status(401).send({
            success: false,
            error: 'TOKEN_REVOKED',
            message: 'Administrative session token has been revoked or logged out',
          });
          return;
        }
      } catch (cacheErr) {
        req.log.warn({ err: cacheErr }, '[Auth] Cache check failed for token blacklist');
      }
    }

    // 4. Authoritative Database Account State Check (Lockout, Active, Token Version)
    const adminCheck = await pool.query(
      `SELECT id, username, email, role, is_active, token_version, locked_until 
       FROM admin_users 
       WHERE id = $1 
       LIMIT 1`,
      [decoded.id]
    );

    if (adminCheck.rows.length === 0) {
      reply.status(403).send({
        success: false,
        error: 'ADMIN_NOT_FOUND',
        message: 'Admin account record does not exist',
      });
      return;
    }

    const admin = adminCheck.rows[0];

    if (!admin.is_active) {
      reply.status(403).send({
        success: false,
        error: 'ADMIN_ACCOUNT_DISABLED',
        message: 'Admin operator account is inactive or revoked',
      });
      return;
    }

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      reply.status(403).send({
        success: false,
        error: 'ADMIN_ACCOUNT_LOCKED',
        message: 'Admin account is temporarily locked due to repeated authentication failures',
      });
      return;
    }

    // Verify token version (if token version was bumped upon password change/revocation)
    if (decoded.tokenVersion !== undefined && admin.token_version !== undefined) {
      if (decoded.tokenVersion < admin.token_version) {
        reply.status(401).send({
          success: false,
          error: 'TOKEN_VERSION_STALE',
          message: 'Session invalidated due to credential update or security revocation',
        });
        return;
      }
    }

    req.user = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      tokenVersion: admin.token_version,
      jti: decoded.jti,
    };
  } catch (err: any) {
    req.log.warn({ err: err.message }, 'Admin JWT verification failed');
    reply.status(401).send({
      success: false,
      error: 'ADMIN_TOKEN_INVALID',
      message: 'Admin session token has expired or is invalid. Please log in again.',
    });
    return;
  }
}

/**
 * Granular Role-Based Access Control Factory for Administrative APIs.
 */
export function requireAdminRoles(allowedRoles: UserRole[]) {
  return async function (req: FastifyRequest, reply: FastifyReply): Promise<void> {
    await verifyAdminAuth(req, reply);
    if (reply.sent) return;

    if (!req.user) {
      reply.status(401).send({ success: false, error: 'UNAUTHENTICATED' });
      return;
    }

    const currentRole = req.user.role;
    const isAllowed =
      allowedRoles.includes(currentRole) ||
      (currentRole === 'OPERATIONS_ADMIN' && allowedRoles.includes('OPERATOR')) ||
      (currentRole === 'OPERATOR' && allowedRoles.includes('OPERATIONS_ADMIN'));

    if (!isAllowed) {
      req.log.warn(
        { userId: req.user.id, role: req.user.role, required: allowedRoles, url: req.url },
        'Access denied: Insufficient RBAC privileges'
      );
      reply.status(403).send({
        success: false,
        error: 'FORBIDDEN_INSUFFICIENT_ROLE',
        message: `Action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }
  };
}

// Preconfigured RBAC Guards for Administrative Routes
export const verifyAdmin = requireAdminRoles([
  'SUPER_ADMIN',
  'OPERATIONS_ADMIN',
  'OPERATOR',
  'REPORTING_ADMIN',
  'AUDITOR',
]);

export const verifySuperAdmin = requireAdminRoles(['SUPER_ADMIN']);

export const verifyOperationsAdmin = requireAdminRoles([
  'SUPER_ADMIN',
  'OPERATIONS_ADMIN',
  'OPERATOR',
]);

export const verifyContentModerator = requireAdminRoles([
  'SUPER_ADMIN',
  'OPERATIONS_ADMIN',
  'OPERATOR',
]);

export const verifyAuditorOrAdmin = requireAdminRoles([
  'SUPER_ADMIN',
  'OPERATIONS_ADMIN',
  'REPORTING_ADMIN',
  'AUDITOR',
]);
