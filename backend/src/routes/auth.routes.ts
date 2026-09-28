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
    const { phoneNumber } = req.body as { phoneNumber: string };
    if (!phoneNumber) {
      return reply.status(400).send({ error: 'Phone number is required' });
    }

    const norm = normalizeMsisdn(phoneNumber);
    if (norm.length < 9) {
      return reply.status(400).send({ error: 'Invalid Ethiopian phone format' });
    }

    // In demo/dev mode, allow 123456
    const otp = env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in cache with 5 minute TTL
    await cache.set(`otp:${norm}`, otp, 'EX', 300);

    // Send MT SMS
    await SpService.sendMt({
      msisdn: norm,
      message: `Your EthioFantasy verification code is ${otp}. Valid for 5 minutes.`,
      type: 'otp',
    });

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
    const { phoneNumber, otpCode } = req.body as { phoneNumber: string; otpCode: string };
    const norm = normalizeMsisdn(phoneNumber);
    const cachedOtp = await cache.get(`otp:${norm}`);

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
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    return reply.send({
      success: true,
      token,
      profile: {
        msisdn: norm,
        maskedMsisdn: masked,
        isLoggedIn: true,
        isSubscribed,
        coins: player.coins,
        totalStars: player.total_stars,
        currentLevel: player.current_level,
      },
    });
  });
}
