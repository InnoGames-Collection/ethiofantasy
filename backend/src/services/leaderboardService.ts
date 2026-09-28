import { pool } from '../config/database.js';
import { maskMsisdn, normalizeMsisdn } from './dailyChallengeEngine.js';

export const LeaderboardService = {
  /**
   * Get Top 10 for the current active weekly competition cycle
   */
  async getWeeklyLeaderboard(userMsisdn?: string) {
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

    const lbRes = await pool.query(
      `SELECT rank, player_msisdn, masked_msisdn, total_7day_score, total_response_time_ms, prize_etb 
       FROM weekly_leaderboard 
       WHERE competition_id = $1 
       ORDER BY rank ASC 
       LIMIT 10`,
      [activeComp.competition_id]
    );

    let userPosition = null;
    if (userMsisdn) {
      const norm = normalizeMsisdn(userMsisdn);
      const userRes = await pool.query(
        `SELECT rank, player_msisdn, masked_msisdn, total_7day_score, total_response_time_ms, prize_etb 
         FROM weekly_leaderboard 
         WHERE competition_id = $1 AND player_msisdn = $2`,
        [activeComp.competition_id, norm]
      );
      if (userRes.rows.length > 0) {
        userPosition = userRes.rows[0];
      }
    }

    return {
      competition: activeComp,
      top10: lbRes.rows,
      userPosition,
    };
  }
};
