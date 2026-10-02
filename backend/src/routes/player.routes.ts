import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';
import { verifyAuth } from '../middleware/auth.js';

export async function playerRoutes(fastify: FastifyInstance) {
  /**
   * Get current authenticated player's profile & live subscription status
   */
  fastify.get('/me', { preHandler: [verifyAuth] }, async (req, reply) => {
    const msisdn = req.user?.msisdn;
    if (!msisdn) {
      return reply.status(401).send({ error: 'Unauthenticated' });
    }

    const playerRes = await pool.query(
      `SELECT * FROM players WHERE msisdn = $1 LIMIT 1`,
      [msisdn]
    );

    if (playerRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Player profile not found' });
    }

    const player = playerRes.rows[0];

    // Check active subscription
    const subRes = await pool.query(
      `SELECT status, plan_type, next_billing_at 
       FROM subscriptions 
       WHERE msisdn = $1 AND status = 'ACTIVE' 
       LIMIT 1`,
      [msisdn]
    );
    const isSubscribed = subRes.rows.length > 0;
    const subscriptionTier = isSubscribed ? 'basic' : 'free';

    return reply.send({
      success: true,
      player: {
        id: player.id,
        msisdn: player.msisdn,
        maskedMsisdn: player.masked_msisdn,
        username: player.username,
        coins: player.coins,
        totalStars: player.total_stars,
        currentLevel: player.current_level,
        xp: player.xp,
        eloRating: player.elo_rating,
        streakCount: player.streak_count,
        totalMatches: player.total_matches,
        totalWins: player.total_wins,
        locale: player.locale || 'en',
        avatarUrl: player.avatar_url,
        isSubscribed,
        subscriptionTier,
        role: 'player',
      },
    });
  });

  /**
   * Update player profile (username, language preference, avatar)
   */
  fastify.put('/profile', { preHandler: [verifyAuth] }, async (req, reply) => {
    const msisdn = req.user?.msisdn;
    if (!msisdn) {
      return reply.status(401).send({ error: 'Unauthenticated' });
    }

    const { username, locale, avatarUrl } = req.body as {
      username?: string;
      locale?: string;
      avatarUrl?: string;
    };

    const updateRes = await pool.query(
      `UPDATE players 
       SET username = COALESCE($1, username),
           locale = COALESCE($2, locale),
           avatar_url = COALESCE($3, avatar_url),
           last_active_at = NOW()
       WHERE msisdn = $4
       RETURNING *`,
      [username ?? null, locale ?? null, avatarUrl ?? null, msisdn]
    );

    if (updateRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    const player = updateRes.rows[0];
    return reply.send({
      success: true,
      profile: {
        username: player.username,
        locale: player.locale,
        avatarUrl: player.avatar_url,
      },
    });
  });
}
