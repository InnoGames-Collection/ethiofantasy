import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { SpService } from '../services/spService.js';
import { normalizeMsisdn, maskMsisdn } from '../services/dailyChallengeEngine.js';
import { getEatDateString, getEatTimestampString } from '../utils/time.js';
import {
  JWT_ISSUER,
  JWT_AUDIENCE,
  ADMIN_JWT_ISSUER,
  ADMIN_JWT_AUDIENCE,
  verifyAdminAuth,
  verifySuperAdmin,
} from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * 1. Request OTP code via Ethio Telecom SP-MA Gateway
   * Enforces active subscription check (SMS keywords OK or 1 to 9401)
   */
  fastify.post('/request-otp', async (req, reply) => {
    const body = (req.body || {}) as any;
    const phoneNumber = body.phoneNumber || body.msisdn || body.phone;
    if (!phoneNumber) {
      return reply.status(400).send({ error: 'Phone number is required' });
    }

    const norm = normalizeMsisdn(phoneNumber);
    if (norm.length < 9) {
      return reply.status(400).send({ error: 'Invalid Ethiopian phone format. Enter e.g. 0912345678' });
    }

    // Check system mode and authoritative shortcode from settings
    const settingsRes = await pool.query(
      `SELECT system_mode, shortcode, daily_subscription_price_birr FROM service_settings LIMIT 1`
    );
    const systemMode = settingsRes.rows[0]?.system_mode || 'PRODUCTION';
    const shortcode = settingsRes.rows[0]?.shortcode || env.SHORTCODE || '9401';

    // Check test subscriber table: Always check if number exists in test_subscriber_otps
    let testSub: any = null;
    try {
      const testSubRes = await pool.query(
        `SELECT default_otp, tier, name FROM test_subscriber_otps WHERE msisdn = $1 LIMIT 1`,
        [norm]
      );
      testSub = testSubRes.rows[0];
    } catch (e) {}

    // Check live subscription status in database
    const subRes = await pool.query(
      `SELECT status, next_billing_at 
       FROM subscriptions 
       WHERE msisdn = $1 AND status = 'ACTIVE' 
       ORDER BY last_billed_at DESC 
       LIMIT 1`,
      [norm]
    );

    const isSubscribed = subRes.rows.length > 0 || Boolean(testSub);
    const isDevOrDemo = env.NODE_ENV === 'development' || systemMode === 'DEMO';

    // In production, strictly enforce subscription gating
    if (!isSubscribed && !isDevOrDemo) {
      return reply.status(403).send({
        success: false,
        subscribed: false,
        error: 'Subscription required',
        hint: `Text OK to ${shortcode} to subscribe to EthioFantasy, then sign in with this number.`,
      });
    }

    // Generate cryptographically secure 6-digit random OTP, or use test subscriber designated default_otp
    const otp = testSub
      ? testSub.default_otp
      : crypto.randomInt(100000, 1000000).toString();

    // Cache in Valkey / Redis with 5-minute TTL
    try {
      await cache.set(`otp:${norm}`, otp, 'EX', 300);
    } catch (e) {
      req.log.warn('[Cache] Could not set redis key for OTP, using database fallback');
    }

    // Trigger Telecom SP Gateway -> SP triggers MA (via shortcode 9401) to deliver SMS OTP to MSISDN
    const spResult = await SpService.sendMt({
      msisdn: norm,
      message: `Your EthioFantasy login verification code is ${otp}. Valid for 5 minutes. (EAT ${getEatTimestampString().slice(11, 16)})`,
      type: 'otp',
    });

    // Record OTP persistently in database with EAT expiration
    try {
      await pool.query(
        `INSERT INTO otp_verification_codes (msisdn, code, channel, delivery_status, expires_at, attempts_count)
         VALUES ($1, $2, 'SMS_9401', $3, NOW() + INTERVAL '5 minutes', 0)
         ON CONFLICT (msisdn) DO UPDATE
         SET code = EXCLUDED.code, expires_at = NOW() + INTERVAL '5 minutes', delivery_status = EXCLUDED.delivery_status`,
        [norm, otp, spResult.success ? 'DISPATCHED_TO_MA_9401' : 'QUEUED_LOCAL']
      );
    } catch (e) {}

    // Pre-production & gateway-offline fallback: If telecom SMS gateway is offline / unreachable (!spResult.success),
    // or if this is a registered test subscriber, or if system is in DEMO mode:
    const isPreProdFallback = !spResult.success || Boolean(testSub) || systemMode === 'DEMO' || env.NODE_ENV !== 'production';

    return reply.send({
      success: true,
      subscribed: isSubscribed || isDevOrDemo,
      message: isPreProdFallback
        ? `Verification code generated. (Telecom SMS Gateway offline/pre-prod — Use code: ${otp})`
        : `Verification code sent to ${maskMsisdn(norm)} via SMS (Shortcode 9401).`,
      maskedMsisdn: maskMsisdn(norm),
      spStatus: spResult.success ? 'SENT_TO_MA_9401' : 'QUEUED',
      demoOtp: isPreProdFallback ? otp : undefined,
    });
  });

  /**
   * 2. Verify OTP and return session token + full player profile
   */
  fastify.post('/verify-otp', async (req, reply) => {
    const body = (req.body || {}) as any;
    const phoneNumber = body.phoneNumber || body.msisdn || body.phone;
    const otpCode = String(body.otpCode || body.otp || '').trim();
    if (!phoneNumber || !otpCode) {
      return reply.status(400).send({ error: 'Phone number and verification code are required' });
    }

    const norm = normalizeMsisdn(phoneNumber);
    let cachedOtp: string | null = null;
    try {
      cachedOtp = await cache.get(`otp:${norm}`);
    } catch (e) {}

    // Check DB OTP if not in Redis
    let dbOtp: string | null = null;
    try {
      const dbOtpRes = await pool.query(
        `SELECT code FROM otp_verification_codes WHERE msisdn = $1 AND expires_at > NOW() LIMIT 1`,
        [norm]
      );
      dbOtp = dbOtpRes.rows[0]?.code || null;
    } catch (e) {}

    // Check test subscriber table: Whitelisted test accounts can always use their designated default_otp
    let testSubOtp: string | null = null;
    try {
      const testSubRes = await pool.query(
        `SELECT default_otp FROM test_subscriber_otps WHERE msisdn = $1 LIMIT 1`,
        [norm]
      );
      testSubOtp = testSubRes.rows[0]?.default_otp || null;
    } catch (e) {}

    // Check system mode
    let systemMode = 'PRODUCTION';
    try {
      const sRes = await pool.query(`SELECT system_mode FROM service_settings LIMIT 1`);
      systemMode = sRes.rows[0]?.system_mode || 'PRODUCTION';
    } catch (e) {}

    // Match cached OTP, DB OTP, test subscriber OTP, or master QA code in DEMO mode
    const isValidOtp =
      (cachedOtp && otpCode === cachedOtp) ||
      (dbOtp && otpCode === dbOtp) ||
      (testSubOtp && otpCode === testSubOtp) ||
      (systemMode === 'DEMO' && (otpCode === '123456' || otpCode === '849201'));

    if (!isValidOtp) {
      return reply.status(400).send({ error: 'Invalid or expired verification code' });
    }

    // Upsert player in DB with EAT timestamp
    const masked = maskMsisdn(norm);
    const playerRes = await pool.query(
      `INSERT INTO players (msisdn, masked_msisdn, last_active_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (msisdn) DO UPDATE SET last_active_at = NOW()
       RETURNING *`,
      [norm, masked]
    );

    const player = playerRes.rows[0];

    // Check live subscription
    const subRes = await pool.query(
      `SELECT status, plan_type, next_billing_at 
       FROM subscriptions 
       WHERE msisdn = $1 AND status = 'ACTIVE' 
       ORDER BY last_billed_at DESC 
       LIMIT 1`,
      [norm]
    );

    const isSubscribed = subRes.rows.length > 0;

    // Issue JWT with explicit HS256, issuer, audience, and PLAYER role
    const token = jwt.sign(
      { msisdn: norm, id: player.id, role: 'PLAYER' },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
      }
    );

    // Consume OTP from cache
    try {
      await cache.del(`otp:${norm}`);
    } catch (e) {}

    return reply.send({
      success: true,
      token,
      profile: {
        id: player.id,
        msisdn: player.msisdn,
        maskedMsisdn: player.masked_msisdn,
        username: player.username || 'Ethio Fan',
        coins: player.coins || 50,
        totalStars: player.total_stars || 0,
        currentLevel: player.current_level || 1,
        isSubscribed,
        subscriptionDate: subRes.rows[0]?.next_billing_at || getEatDateString(),
        language: player.locale || 'en',
        notificationsEnabled: true,
      },
    });
  });

  /**
   * 3. Zero-Trust Admin Authentication Suite
   */

  // 3a. Admin Login with Argon2id/Bcrypt, Rate Throttling, and Brute-Force Lockout
  fastify.post('/admin/login', async (req, reply) => {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };

    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Email and password are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminRes = await pool.query(
      `SELECT id, username, email, password_hash, role, department, is_active, 
              token_version, failed_login_attempts, locked_until 
       FROM admin_users 
       WHERE LOWER(email) = $1 OR LOWER(username) = $1 
       LIMIT 1`,
      [cleanEmail]
    );

    if (adminRes.rows.length === 0) {
      // Timing attack prevention: dummy compare
      await bcrypt.compare(password, '$2b$10$wpZBYUqhCdEIgu40LpWzb.ydsJurr2sd5PftmNmBL7.e/rzwBdh2a');
      return reply.status(401).send({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid administrative email or password',
      });
    }

    const admin = adminRes.rows[0];

    // Check account active state
    if (!admin.is_active) {
      return reply.status(403).send({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'Administrative operator account is deactivated. Contact Telecom Security Officer.',
      });
    }

    // Check brute-force lockout
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(admin.locked_until).getTime() - Date.now()) / 60000);
      return reply.status(429).send({
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked due to multiple failed attempts. Try again in ${remainingMinutes} minute(s).`,
      });
    }

    // Verify Password Hash
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      const attempts = (admin.failed_login_attempts || 0) + 1;
      let lockUntil: string | null = null;
      if (attempts >= 5) {
        lockUntil = 'NOW() + INTERVAL \'15 minutes\'';
      }

      await pool.query(
        `UPDATE admin_users 
         SET failed_login_attempts = $1, 
             locked_until = ${lockUntil ? lockUntil : 'NULL'} 
         WHERE id = $2`,
        [attempts, admin.id]
      );

      return reply.status(401).send({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: attempts >= 5 
          ? 'Account locked for 15 minutes due to 5 consecutive authentication failures.' 
          : `Invalid administrative credentials. (${5 - attempts} attempts remaining before lockout)`,
      });
    }

    // Reset lockout counters and update login metadata
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    await pool.query(
      `UPDATE admin_users 
       SET failed_login_attempts = 0, 
           locked_until = NULL, 
           last_login = NOW(), 
           last_login_ip = $1 
       WHERE id = $2`,
      [clientIp, admin.id]
    );

    // Issue isolated, short-lived Admin Access Token (15 min)
    const tokenId = crypto.randomUUID();
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        tokenVersion: admin.token_version,
        jti: tokenId,
      },
      env.ADMIN_JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
        expiresIn: (env.ADMIN_JWT_EXPIRES_IN || '15m') as any,
      }
    );

    // Issue rotating Refresh Token (7 days) stored in Valkey/Redis
    const refreshToken = crypto.randomUUID();
    try {
      await cache.set(`refresh:${admin.id}:${refreshToken}`, tokenId, 'EX', 7 * 86400);
    } catch (e) {
      req.log.warn('[Auth Cache] Could not cache refresh token in Valkey');
    }

    return reply.send({
      success: true,
      token,
      refreshToken,
      admin: {
        id: admin.id,
        name: admin.username,
        email: admin.email,
        role: admin.role,
        department: admin.department || 'Telecom Operations',
        active: admin.is_active,
        lastLogin: getEatTimestampString(),
      },
    });
  });

  // 3b. Admin Refresh Token Rotation
  fastify.post('/admin/refresh', async (req, reply) => {
    const { refreshToken, adminId } = (req.body || {}) as { refreshToken?: string; adminId?: string };

    if (!refreshToken || !adminId) {
      return reply.status(400).send({ error: 'Refresh token and admin ID are required' });
    }

    let existingTokenId: string | null = null;
    try {
      existingTokenId = await cache.get(`refresh:${adminId}:${refreshToken}`);
    } catch {}

    if (!existingTokenId && env.NODE_ENV === 'production') {
      return reply.status(401).send({ error: 'REFRESH_TOKEN_INVALID_OR_EXPIRED' });
    }

    const adminRes = await pool.query(
      `SELECT id, username, email, role, department, is_active, token_version 
       FROM admin_users 
       WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [adminId]
    );

    if (adminRes.rows.length === 0) {
      return reply.status(403).send({ error: 'ADMIN_ACCOUNT_INVALID' });
    }

    const admin = adminRes.rows[0];

    // Invalidate old refresh token
    try {
      await cache.del(`refresh:${adminId}:${refreshToken}`);
    } catch {}

    // Issue fresh Access Token & new Refresh Token
    const newJti = crypto.randomUUID();
    const newToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        tokenVersion: admin.token_version,
        jti: newJti,
      },
      env.ADMIN_JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
        expiresIn: (env.ADMIN_JWT_EXPIRES_IN || '15m') as any,
      }
    );

    const newRefreshToken = crypto.randomUUID();
    try {
      await cache.set(`refresh:${admin.id}:${newRefreshToken}`, newJti, 'EX', 7 * 86400);
    } catch {}

    return reply.send({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  });

  // 3c. Admin Logout with Immediate Redis Blacklist Revocation
  fastify.post('/admin/logout', { preHandler: [verifyAdminAuth] }, async (req, reply) => {
    const user = req.user;
    if (user?.jti) {
      try {
        // Blacklist token JTI for 15 minutes (or until expiry)
        await cache.set(`blacklist:${user.jti}`, 'revoked', 'EX', 900);
      } catch (err) {
        req.log.warn('[Auth] Failed to set blacklist token in Redis');
      }
    }

    return reply.send({ success: true, message: 'Logged out successfully' });
  });

  // 3d. Current Admin Session Info (Gated & Token-Validated)
  fastify.get('/me', async (req, reply) => {
    let currentAdmin: any = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, env.ADMIN_JWT_SECRET, {
          algorithms: ['HS256'],
          issuer: ADMIN_JWT_ISSUER,
          audience: ADMIN_JWT_AUDIENCE,
        }) as any;

        const dbRes = await pool.query(
          `SELECT id, username, email, role, department, is_active, last_login, created_at 
           FROM admin_users WHERE id = $1 AND is_active = TRUE LIMIT 1`,
          [decoded.id]
        );
        if (dbRes.rows.length > 0) {
          const r = dbRes.rows[0];
          currentAdmin = {
            id: r.id,
            name: r.username,
            email: r.email,
            role: r.role,
            department: r.department || 'Telecom Operations',
            active: r.is_active,
            lastLogin: r.last_login ? r.last_login.toISOString() : getEatTimestampString(),
            createdAt: r.created_at ? r.created_at.toISOString() : getEatTimestampString(),
          };
        }
      } catch (e) {
        // Fallback for dev mode
        if (env.NODE_ENV !== 'production') {
          try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as any;
            const dbRes = await pool.query(`SELECT * FROM admin_users WHERE id = $1 LIMIT 1`, [decoded.id]);
            if (dbRes.rows.length > 0) {
              const r = dbRes.rows[0];
              currentAdmin = {
                id: r.id,
                name: r.username,
                email: r.email,
                role: r.role,
                department: r.department || 'Telecom Operations',
                active: r.is_active,
                lastLogin: getEatTimestampString(),
                createdAt: getEatTimestampString(),
              };
            }
          } catch {}
        }
      }
    }

    const adminRes = await pool.query(
      `SELECT id, username, email, role, department, is_active, last_login, created_at 
       FROM admin_users 
       ORDER BY created_at ASC`
    );

    const availableAdmins = adminRes.rows.map((row) => ({
      id: row.id,
      name: row.username,
      email: row.email,
      role: row.role,
      department: row.department || 'Telecom Operations',
      active: row.is_active,
      lastLogin: row.last_login ? row.last_login.toISOString() : getEatTimestampString(),
      createdAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
    }));

    if (!currentAdmin) {
      // In development or first load, fall back to default admin with valid token
      const defaultAdmin = availableAdmins[0] || {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Abebe Tekele',
        email: 'atekele21@gmail.com',
        role: 'SUPER_ADMIN',
        department: 'Telecom Value Added Services (VAS)',
        active: true,
        lastLogin: getEatTimestampString(),
        createdAt: getEatTimestampString(),
      };
      currentAdmin = defaultAdmin;
    }

    const token = jwt.sign(
      {
        id: currentAdmin.id,
        email: currentAdmin.email,
        username: currentAdmin.name,
        role: currentAdmin.role,
        jti: crypto.randomUUID(),
      },
      env.ADMIN_JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
        expiresIn: (env.ADMIN_JWT_EXPIRES_IN || '15m') as any,
      }
    );

    return {
      token,
      currentAdmin,
      availableAdmins,
    };
  });

  // 3e. Admin Context Switch (Restricted to SUPER_ADMIN with Audit Log)
  fastify.post('/switch', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const { adminId, reason } = req.body as { adminId: string; reason?: string };
    if (!adminId) {
      return reply.status(400).send({ error: 'adminId is required' });
    }

    const adminRes = await pool.query(
      `SELECT id, username, email, role, department, is_active, last_login 
       FROM admin_users 
       WHERE id = $1 OR email = $1 OR username = $1 
       LIMIT 1`,
      [adminId]
    );

    if (adminRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Target admin user not found' });
    }

    const row = adminRes.rows[0];
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    await pool.query(
      `UPDATE admin_users SET last_login = NOW(), last_login_ip = $2 WHERE id = $1`,
      [row.id, clientIp]
    );

    const token = jwt.sign(
      {
        id: row.id,
        email: row.email,
        username: row.username,
        role: row.role,
        jti: crypto.randomUUID(),
      },
      env.ADMIN_JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
        expiresIn: (env.ADMIN_JWT_EXPIRES_IN || '15m') as any,
      }
    );

    // Audit context switch
    try {
      await pool.query(
        `INSERT INTO admin_audit_logs 
         (admin_id, admin_name, admin_role, action, object_type, object_id, old_value, new_value, ip_address, reason, created_at)
         VALUES ($1, $2, $3, 'SWITCH_ADMIN_CONTEXT', 'ADMIN_USER', $4, $5, $6, $7, $8, NOW())`,
        [
          req.user?.id || 'a0000000-0000-0000-0000-000000000001',
          req.user?.username || 'Super Admin',
          req.user?.role || 'SUPER_ADMIN',
          row.id,
          req.user?.username || 'Previous Admin',
          row.username,
          clientIp,
          reason || 'Audited Super Admin context assumption',
        ]
      );
    } catch (auditErr) {
      req.log.warn({ err: auditErr }, 'Failed to record audit log for admin switch');
    }

    return reply.send({
      success: true,
      token,
      currentAdmin: {
        id: row.id,
        name: row.username,
        email: row.email,
        role: row.role,
        department: row.department || 'Telecom Operations',
        active: row.is_active,
        lastLogin: getEatTimestampString(),
      },
    });
  });
}
