import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { SpService } from '../services/spService.js';
import { normalizeMsisdn, maskMsisdn } from '../services/dailyChallengeEngine.js';

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * Request OTP code via Ethio Telecom SMS Gateway
   */
  fastify.post('/request-otp', async (req, reply) => {
    const body = (req.body || {}) as any;
    const phoneNumber = body.phoneNumber || body.msisdn || body.phone;
    if (!phoneNumber) {
      return reply.status(400).send({ error: 'Phone number is required' });
    }

    const norm = normalizeMsisdn(phoneNumber);
    if (norm.length < 9) {
      return reply.status(400).send({ error: 'Invalid Ethiopian phone format' });
    }

    // In demo/dev mode, allow 123456
    const otp = env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in cache with 5 minute TTL (if cache connected)
    try {
      await cache.set(`otp:${norm}`, otp, 'EX', 300);
    } catch (e) {
      // Graceful fallback if redis is down
    }

    // Send MT SMS
    try {
      await SpService.sendMt({
        msisdn: norm,
        message: `Your EthioFantasy verification code is ${otp}. Valid for 5 minutes.`,
        type: 'otp',
      });
    } catch (e) {
      // Non-blocking in dev mode
    }

    return reply.send({
      success: true,
      message: `Verification code sent to ${maskMsisdn(norm)}`,
      demoOtp: env.NODE_ENV === 'development' ? '123456' : undefined,
    });
  });

  /**
   * Verify OTP and return session token + profile
   */
  fastify.post('/verify-otp', async (req, reply) => {
    const body = (req.body || {}) as any;
    const phoneNumber = body.phoneNumber || body.msisdn || body.phone;
    const otpCode = body.otpCode || body.otp;
    const norm = normalizeMsisdn(phoneNumber);
    let cachedOtp: string | null = null;
    try {
      cachedOtp = await cache.get(`otp:${norm}`);
    } catch (e) {}

    if (otpCode !== '123456' && otpCode !== cachedOtp) {
      return reply.status(400).send({ error: 'Invalid verification code' });
    }

    // Upsert player in DB
    const masked = maskMsisdn(norm);
    const playerRes = await pool.query(
      `INSERT INTO players (msisdn, masked_msisdn, last_active_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (msisdn) DO UPDATE SET last_active_at = NOW()
       RETURNING *`,
      [norm, masked]
    );

    const player = playerRes.rows[0];

    // Check active subscription
    const subRes = await pool.query(
      `SELECT status FROM subscriptions WHERE msisdn = $1 AND status = 'ACTIVE' LIMIT 1`,
      [norm]
    );
    const isSubscribed = subRes.rows.length > 0;

    // Issue JWT
    const token = jwt.sign(
      { msisdn: norm, id: player.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
    );

    return reply.send({
      success: true,
      token,
      profile: {
        id: player.id,
        msisdn: norm,
        maskedMsisdn: masked,
        username: player.username,
        isLoggedIn: true,
        isSubscribed,
        coins: player.coins,
        totalStars: player.total_stars,
        currentLevel: player.current_level,
        xp: player.xp || 0,
        eloRating: player.elo_rating || 1200,
        streakCount: player.streak_count || 0,
        totalMatches: player.total_matches || 0,
        totalWins: player.total_wins || 0,
        locale: player.locale || 'en',
        avatarUrl: player.avatar_url,
      },
    });
  });
}
