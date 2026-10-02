import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { SpService } from '../services/spService.js';
import { normalizeMsisdn, maskMsisdn } from '../services/dailyChallengeEngine.js';
import { getEatDateString, getEatTimestampString } from '../utils/time.js';

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
    const settingsRes = await pool.query(`SELECT system_mode, shortcode, daily_subscription_price_birr FROM service_settings LIMIT 1`);
    const systemMode = settingsRes.rows[0]?.system_mode || 'PRODUCTION';
    const shortcode = settingsRes.rows[0]?.shortcode || env.SHORTCODE || '900';

    // 1. Check if MSISDN is a pre-seeded test/QA subscriber in database
    let testSub: any = null;
    try {
      const testSubRes = await pool.query(
        `SELECT default_otp, tier, name FROM test_subscriber_otps WHERE msisdn = $1 LIMIT 1`,
        [norm]
      );
      testSub = testSubRes.rows[0];
    } catch (e) {}

    // 2. Check live subscription status in database
    const subRes = await pool.query(
      `SELECT status, expires_at, next_billing_at 
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

    // Determine 6-digit OTP code (Test subscribers use predefined deterministic code)
    const otp = testSub
      ? testSub.default_otp
      : isDevOrDemo
      ? '849201'
      : Math.floor(100000 + Math.random() * 900000).toString();

    // Cache in Valkey / Redis with 5-minute TTL
    try {
      await cache.set(`otp:${norm}`, otp, 'EX', 300);
    } catch (e) {
      console.warn('[Cache] Could not set redis key for OTP, using database fallback');
    }

    // Trigger Telecom SP Gateway -> SP triggers MA (via shortcode 900) to deliver SMS OTP to MSISDN
    const spResult = await SpService.sendMt({
      msisdn: norm,
      message: `Your EthioFantasy login verification code is ${otp}. Valid for 5 minutes. (EAT ${getEatTimestampString().slice(11, 16)})`,
      type: 'otp',
    });

    // Record OTP persistently in database with EAT expiration
    try {
      await pool.query(
        `INSERT INTO otp_verification_codes (msisdn, code, channel, delivery_status, expires_at, attempts_count)
         VALUES ($1, $2, 'SMS_900', $3, NOW() + INTERVAL '5 minutes', 0)
         ON CONFLICT (msisdn) DO UPDATE
         SET code = EXCLUDED.code, expires_at = NOW() + INTERVAL '5 minutes', delivery_status = EXCLUDED.delivery_status`,
        [norm, otp, spResult.success ? 'DISPATCHED_TO_MA_900' : 'QUEUED_LOCAL']
      );
    } catch (e) {}

    return reply.send({
      success: true,
      subscribed: isSubscribed || isDevOrDemo,
      message: `Verification code sent to ${maskMsisdn(norm)} via SMS (Shortcode 900).`,
      maskedMsisdn: maskMsisdn(norm),
      spStatus: spResult.success ? 'SENT_TO_MA_900' : 'QUEUED',
      demoOtp: (testSub || isDevOrDemo) ? otp : undefined,
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

    // Check test subscriber table
    let testSubOtp: string | null = null;
    try {
      const testSubRes = await pool.query(
        `SELECT default_otp FROM test_subscriber_otps WHERE msisdn = $1 LIMIT 1`,
        [norm]
      );
      testSubOtp = testSubRes.rows[0]?.default_otp || null;
    } catch (e) {}

    // Allow matching cached OTP, DB OTP, test subscriber default OTP, or standard test codes
    const isValidOtp =
      (cachedOtp && otpCode === cachedOtp) ||
      (dbOtp && otpCode === dbOtp) ||
      (testSubOtp && otpCode === testSubOtp) ||
      (env.NODE_ENV === 'development' && (otpCode === '123456' || otpCode === '849201'));

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

    // Issue JWT
    const token = jwt.sign(
      { msisdn: norm, id: player.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
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
   * 3. Admin Authentication: Me & Switch
   */
  fastify.get('/me', async () => {
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

    return {
      currentAdmin: availableAdmins[0] || {
        id: 'adm-001',
        name: 'Abebe Tekele',
        email: 'atekele21@gmail.com',
        role: 'SUPER_ADMIN',
        department: 'Telecom Value Added Services (VAS)',
        active: true,
        lastLogin: getEatTimestampString(),
        createdAt: getEatTimestampString(),
      },
      availableAdmins,
    };
  });

  fastify.post('/switch', async (req, reply) => {
    const { adminId } = req.body as { adminId: string };
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
      return reply.status(404).send({ error: 'Admin user not found' });
    }

    const row = adminRes.rows[0];
    await pool.query(`UPDATE admin_users SET last_login = NOW() WHERE id = $1`, [row.id]);

    return reply.send({
      success: true,
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
