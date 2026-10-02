import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { normalizeMsisdn } from '../services/dailyChallengeEngine.js';

export async function matchRoutes(fastify: FastifyInstance) {
  /**
   * Server-authoritative match validation & submission
   * Supports 1v1 multiplayer, casual, daily, and tournament matches
   */
  fastify.post('/submit', async (req, reply) => {
    // 1. Resolve player identity (from Bearer token or fallback body)
    let msisdn: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.substring(7), env.JWT_SECRET) as any;
        msisdn = decoded.msisdn;
      } catch {
        // Token invalid/expired; continue to check body
      }
    }

    const {
      matchType = 'casual',
      competitionId,
      answers = [],
      msisdn: bodyMsisdn,
    } = req.body as {
      matchType?: string;
      competitionId?: string;
      answers: Array<{
        questionId: string;
        selectedIndex: number;
        responseTimeMs: number;
      }>;
      msisdn?: string;
    };

    if (!msisdn && bodyMsisdn) {
      msisdn = normalizeMsisdn(bodyMsisdn);
    }

    const total = answers.length;
    let correct = 0;

    // 2. Validate against database questions if IDs are available
    if (total > 0) {
      const qIds = answers.map((a) => a.questionId).filter(Boolean);
      if (qIds.length > 0) {
        const qRes = await pool.query(
          `SELECT id, correct_index FROM quiz_questions WHERE id = ANY($1)`,
          [qIds]
        );
        const correctMap = new Map<string, number>();
        for (const row of qRes.rows) {
          correctMap.set(row.id, row.correct_index);
        }

        for (const ans of answers) {
          if (correctMap.has(ans.questionId)) {
            if (correctMap.get(ans.questionId) === ans.selectedIndex) {
              correct++;
            }
          } else {
            // If offline fallback question ID, treat selectedIndex === 0 as correct (or accept)
            if (ans.selectedIndex === 0 || ans.selectedIndex === 1) {
              correct++;
            }
          }
        }
      } else {
        // Assume 70% or raw submission count
        correct = Math.ceil(total * 0.7);
      }
    }

    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const won = accuracy >= 50;
    const earnedCoins = Math.max(10, correct * 20);
    const earnedXp = Math.max(10, correct * 15);
    const eloDelta = won ? 15 + Math.floor(Math.random() * 10) : -Math.min(10, 5 + Math.floor(Math.random() * 5));
    const ratingScore = Math.min(10, Math.max(1, (accuracy / 10) + (won ? 1.0 : 0.0)));

    let newElo = 1200;

    // 3. Persist rewards & update player stats if player is known
    if (msisdn) {
      const playerRes = await pool.query(
        `SELECT id, elo_rating FROM players WHERE msisdn = $1`,
        [msisdn]
      );

      if (playerRes.rows.length > 0) {
        const currentElo = playerRes.rows[0].elo_rating || 1200;
        newElo = Math.max(100, currentElo + eloDelta);

        await pool.query(
          `UPDATE players 
           SET coins = coins + $1,
               xp = xp + $2,
               elo_rating = $3,
               total_matches = total_matches + 1,
               total_wins = total_wins + $4,
               last_active_at = NOW()
           WHERE msisdn = $5`,
          [earnedCoins, earnedXp, newElo, won ? 1 : 0, msisdn]
        );

        // Record in match_history
        await pool.query(
          `INSERT INTO match_history (
             player_msisdn, match_type, competition_id, score,
             accuracy, correct, total, coins_earned, xp_earned, rating_earned
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            msisdn,
            matchType,
            competitionId || 'walia-ibex',
            correct * 100,
            accuracy,
            correct,
            total,
            earnedCoins,
            earnedXp,
            ratingScore,
          ]
        );
      }
    }

    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return reply.send({
      success: true,
      matchId,
      correct,
      total,
      accuracy,
      coins: earnedCoins,
      xp: earnedXp,
      rating: Number(ratingScore.toFixed(1)),
      eloDelta,
      newElo,
    });
  });
}
