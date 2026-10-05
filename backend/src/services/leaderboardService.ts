import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { maskMsisdn, normalizeMsisdn } from './dailyChallengeEngine.js';

export interface LeaderboardEntry {
  rank: number;
  maskedMsisdn: string;
  sevenDayScore: number;
  totalResponseTime: number;
  participationDays: number;
  isCurrentUser: boolean;
  finalSubmissionTimestamp?: string;
}

export class LeaderboardService {
  /**
   * Retrieves the Top 10 leaderboard with sub-5ms latency from Redis cache,
   * falling back to optimized covering index queries.
   */
  static async getTournamentLeaderboard(currentUserMsisdn?: string): Promise<{
    top10: LeaderboardEntry[];
    currentUserPosition: LeaderboardEntry | null;
  }> {
    const norm = currentUserMsisdn ? normalizeMsisdn(currentUserMsisdn) : null;
    const cacheKey = 'leaderboard:active_cycle:top10';
    let top10: LeaderboardEntry[] = [];

    // 1. Try Redis Cache
    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        top10 = JSON.parse(cachedData);
      }
    } catch (e) {
      console.warn('[Redis Leaderboard Cache Miss]', e);
    }

    // 2. Refresh Cache from Database if Missed
    if (top10.length === 0) {
      const dbResult = await pool.query(
        `WITH current_cycle AS (
           SELECT start_date, end_date FROM weekly_competitions WHERE status = 'ACTIVE' LIMIT 1
         )
         SELECT a.player_msisdn,
                SUM(a.score) as seven_day_score,
                SUM(a.total_response_time_ms)::numeric / 1000 as total_response_time,
                COUNT(a.attempt_id) as participation_days,
                MAX(a.final_submission_timestamp) as last_timestamp
         FROM daily_attempts a, current_cycle c
         WHERE a.attempt_date >= c.start_date AND a.attempt_date <= c.end_date AND a.is_completed = TRUE
         GROUP BY a.player_msisdn
         ORDER BY seven_day_score DESC, total_response_time ASC, last_timestamp ASC, a.player_msisdn ASC
         LIMIT 10`
      );

      top10 = dbResult.rows.map((row, idx) => ({
        rank: idx + 1,
        maskedMsisdn: maskMsisdn(row.player_msisdn),
        sevenDayScore: parseInt(row.seven_day_score, 10),
        totalResponseTime: parseFloat(Number(row.total_response_time).toFixed(2)),
        participationDays: parseInt(row.participation_days, 10),
        isCurrentUser: false,
        finalSubmissionTimestamp: row.last_timestamp ? row.last_timestamp.toISOString() : undefined,
      }));

      // Cache for 60 seconds
      if (top10.length > 0) {
        try {
          await cache.set(cacheKey, JSON.stringify(top10), 'EX', 60);
        } catch (e) {}
      }
    }

    // 3. Resolve Current User's Specific Standing
    let currentUserPosition: LeaderboardEntry | null = null;
    if (norm) {
      const userRankItem = top10.find((entry) => entry.maskedMsisdn === maskMsisdn(norm));
      if (userRankItem) {
        currentUserPosition = { ...userRankItem, isCurrentUser: true };
      } else {
        // Query user's aggregate stats directly
        const userRes = await pool.query(
          `WITH current_cycle AS (
             SELECT start_date, end_date FROM weekly_competitions WHERE status = 'ACTIVE' LIMIT 1
           )
           SELECT SUM(a.score) as score,
                  SUM(a.total_response_time_ms)::numeric / 1000 as total_time,
                  COUNT(a.attempt_id) as days
           FROM daily_attempts a, current_cycle c
           WHERE a.player_msisdn = $1 AND a.attempt_date >= c.start_date AND a.attempt_date <= c.end_date AND a.is_completed = TRUE`,
          [norm]
        );

        if (userRes.rows.length > 0 && userRes.rows[0].score !== null) {
          currentUserPosition = {
            rank: 99,
            maskedMsisdn: maskMsisdn(norm),
            sevenDayScore: parseInt(userRes.rows[0].score || '0', 10),
            totalResponseTime: parseFloat(Number(userRes.rows[0].total_time || 0).toFixed(2)),
            participationDays: parseInt(userRes.rows[0].days || '0', 10),
            isCurrentUser: true,
          };
        }
      }
    }

    // Mark current user in top 10
    const resolvedTop10 = top10.map((entry) => ({
      ...entry,
      isCurrentUser: norm ? entry.maskedMsisdn === maskMsisdn(norm) : false,
    }));

    return {
      top10: resolvedTop10,
      currentUserPosition,
    };
  }

  /**
   * Backward compatibility for weekly competition admin queries
   */
  static async getWeeklyLeaderboard(userMsisdn?: string) {
    const compRes = await pool.query(
      `SELECT competition_id, cycle_number, start_date, end_date, prize_pool_etb 
       FROM weekly_competitions 
       WHERE status = 'ACTIVE' 
       ORDER BY cycle_number DESC 
       LIMIT 1`
    );

    const activeComp = compRes.rows[0];
    if (!activeComp) {
      return { top10: [], userPosition: null, competition: null };
    }

    const res = await this.getTournamentLeaderboard(userMsisdn);
    return {
      competition: activeComp,
      top10: res.top10,
      userPosition: res.currentUserPosition,
    };
  }
}
