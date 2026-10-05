import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { getEatDateString, getEatTimestampString, getEatIsoWeekInfo } from '../utils/time.js';
import { DailyChallengeEngine, maskMsisdn } from './dailyChallengeEngine.js';

export class CompetitionLifecycleService {
  /**
   * Synchronizes daily challenge statuses in East Africa Time (EAT).
   * - Closes any past daily challenges whose window has elapsed (< today EAT)
   * - Ensures today's daily challenge exists and is OPEN with 10 questions
   */
  static async syncDailyChallengesStatus(): Promise<any> {
    const today = getEatDateString();

    // 1. Mark any past challenges that are still OPEN as CLOSED
    await pool.query(
      `UPDATE daily_challenges 
       SET status = 'CLOSED' 
       WHERE challenge_date < $1::date AND status = 'OPEN'`,
      [today]
    );

    // 2. Mark any expired uncompleted quiz sessions as expired/completed
    await pool.query(
      `UPDATE player_quiz_sessions
       SET is_completed = TRUE, completed_at = NOW()
       WHERE challenge_date < $1::date AND is_completed = FALSE`,
      [today]
    );

    // 3. Ensure today's challenge is initialized and active
    const todayChallenge = await DailyChallengeEngine.ensureDailyChallenge(today);
    return todayChallenge;
  }

  /**
   * Authoritative settlement engine for a weekly competition.
   * Can be invoked manually by Operations Admin or automatically by EAT scheduler.
   */
  static async settleCompetition(params: {
    competitionId: string;
    reason: string;
    adminName: string;
    adminId?: string;
  }): Promise<{
    success: boolean;
    alreadySettled?: boolean;
    message: string;
    finalizedAt?: string;
    totalWinners?: number;
    totalPrizesDistributed?: number;
    error?: string;
  }> {
    const { competitionId, reason, adminName, adminId } = params;
    const lockKey = `lock:settlement:weekly:${competitionId}`;

    let acquiredLock = false;
    try {
      const lockRes = await cache.set(lockKey, '1', 'PX', 30000, 'NX');
      acquiredLock = lockRes === 'OK';
    } catch {
      acquiredLock = true;
    }

    if (!acquiredLock) {
      return {
        success: false,
        error: 'SETTLEMENT_IN_PROGRESS',
        message: 'A tournament settlement operation is currently executing for this cycle.',
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`weekly_settle_${competitionId}`]);

      const compRes = await client.query(
        `SELECT * FROM weekly_competitions WHERE competition_id = $1 FOR UPDATE`,
        [competitionId]
      );

      if (compRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'COMPETITION_NOT_FOUND', message: 'Weekly competition cycle not found' };
      }

      const comp = compRes.rows[0];

      if (comp.settlement_status === 'SETTLED') {
        await client.query('ROLLBACK');
        return {
          success: true,
          alreadySettled: true,
          message: 'Tournament cycle already settled and prizes allocated. Idempotent return.',
          finalizedAt: comp.finalized_at ? comp.finalized_at.toISOString() : undefined,
        };
      }

      await client.query(
        `UPDATE weekly_competitions SET settlement_status = 'SETTLING' WHERE competition_id = $1`,
        [competitionId]
      );

      const startDate = comp.start_date instanceof Date ? comp.start_date.toISOString().slice(0, 10) : String(comp.start_date).slice(0, 10);
      const endDate = comp.end_date instanceof Date ? comp.end_date.toISOString().slice(0, 10) : String(comp.end_date).slice(0, 10);

      // Deterministic ranking:
      // 1. Total 7-day score (DESC)
      // 2. Total response time ms (ASC)
      // 3. Final submission timestamp (ASC)
      // 4. MSISDN (ASC)
      const attemptsRes = await client.query(
        `SELECT player_msisdn, 
                SUM(score)::int as total_7day_score, 
                SUM(total_response_time_ms)::int as total_response_time_ms,
                MIN(final_submission_timestamp) as first_finish,
                COUNT(attempt_id)::int as days_participated
         FROM daily_attempts
         WHERE attempt_date >= $1::date AND attempt_date <= $2::date AND is_completed = TRUE
         GROUP BY player_msisdn
         ORDER BY total_7day_score DESC, total_response_time_ms ASC, first_finish ASC, player_msisdn ASC
         LIMIT 50`,
        [startDate, endDate]
      );

      const prizeRules = Array.isArray(comp.prize_rules) ? comp.prize_rules : [
        { rank: 1, label: '1st Grand Champion', prizeAmountBirr: 20000, prizeType: 'TELEBIRR_CASH', description: 'Weekly Champion' },
        { rank: 2, label: '2nd Place', prizeAmountBirr: 12000, prizeType: 'TELEBIRR_CASH', description: 'Runner up' },
        { rank: 3, label: '3rd Place', prizeAmountBirr: 5000, prizeType: 'TELEBIRR_CASH', description: 'Bronze medalist' },
      ];

      let rank = 1;
      let totalPrizesDistributed = 0;
      let totalWinnersCount = 0;

      await client.query(`DELETE FROM weekly_leaderboard WHERE competition_id = $1`, [competitionId]);

      for (const p of attemptsRes.rows) {
        const currentRank = rank++;
        const rule = prizeRules.find((r: any) => r.rank === currentRank);
        const prizeBirr = rule ? parseFloat(rule.prizeAmountBirr || 0) : 0;
        if (prizeBirr > 0) {
          totalPrizesDistributed += prizeBirr;
          totalWinnersCount++;
        }

        await client.query(
          `INSERT INTO weekly_leaderboard 
           (competition_id, player_msisdn, masked_msisdn, total_7day_score, total_response_time_ms, rank, prize_etb, is_disbursed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
          [
            competitionId,
            p.player_msisdn,
            maskMsisdn(p.player_msisdn),
            p.total_7day_score,
            p.total_response_time_ms,
            currentRank,
            prizeBirr,
          ]
        );
      }

      const now = new Date();
      await client.query(
        `UPDATE weekly_competitions 
         SET status = 'FINALIZED',
             settlement_status = 'SETTLED',
             total_winners = $1,
             total_prizes_distributed_birr = $2,
             finalized_at = $3,
             finalized_by = $4,
             finalized_by_id = $5
         WHERE competition_id = $6`,
        [
          totalWinnersCount,
          totalPrizesDistributed,
          now,
          adminName,
          adminId || null,
          competitionId,
        ]
      );

      // Audit log entry
      try {
        await client.query(
          `INSERT INTO admin_audit_logs 
           (admin_id, username, action, object_type, object_id, details, ip_address)
           VALUES ($1, $2, 'WEEKLY_COMPETITION_SETTLED', 'weekly_competition', $3, $4, '127.0.0.1')`,
          [
            adminId || null,
            adminName,
            competitionId,
            JSON.stringify({
              reason,
              totalWinnersCount,
              totalPrizesDistributed,
              participantsRanked: attemptsRes.rows.length,
            }),
          ]
        );
      } catch (e) {}

      await client.query('COMMIT');

      // Clear cache
      try {
        await cache.del('leaderboard:active_cycle:top10');
        await cache.del(`lock:settlement:weekly:${competitionId}`);
      } catch (e) {}

      return {
        success: true,
        message: 'Tournament cycle successfully finalized, ranked, and prize allocated.',
        finalizedAt: now.toISOString(),
        totalWinners: totalWinnersCount,
        totalPrizesDistributed,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[Settlement Error]', err);
      return { success: false, error: 'SETTLEMENT_FAILED', message: err.message };
    } finally {
      client.release();
    }
  }

  /**
   * Synchronizes weekly competition cycles in East Africa Time (EAT):
   * - If the active competition cycle has passed its Sunday 23:59:59 EAT cutoff,
   *   it automatically settles it and activates the current week's cycle.
   * - Ensures the current week's ISO cycle (comp_cycle_YYYY_wWW) exists and is ACTIVE.
   */
  static async syncWeeklyCompetitionStatus(): Promise<any> {
    const today = getEatDateString();
    const isoInfo = getEatIsoWeekInfo(today);

    // 1. Fetch active competition
    const activeRes = await pool.query(
      `SELECT * FROM weekly_competitions 
       WHERE status = 'ACTIVE' 
       ORDER BY cycle_number DESC 
       LIMIT 1`
    );

    const activeComp = activeRes.rows[0];

    if (activeComp) {
      const activeEndDate = activeComp.end_date instanceof Date
        ? activeComp.end_date.toISOString().slice(0, 10)
        : String(activeComp.end_date).slice(0, 10);

      // If active competition has passed its Sunday 23:59:59 EAT cutoff (i.e. end_date < today)
      if (activeEndDate < today) {
        console.log(`[Lifecycle] Active cycle ${activeComp.competition_id} ended on ${activeEndDate}. Auto-settling in EAT...`);
        await this.settleCompetition({
          competitionId: activeComp.competition_id,
          reason: `Automatic weekly rollover settlement at Sunday 23:59:59 EAT cutoff`,
          adminName: 'Automated EAT Scheduler',
        });
      }
    }

    // 2. Ensure current week's cycle exists and is ACTIVE
    const currentWeekRes = await pool.query(
      `SELECT * FROM weekly_competitions WHERE competition_id = $1 LIMIT 1`,
      [isoInfo.cycleId]
    );

    if (currentWeekRes.rows.length === 0) {
      console.log(`[Lifecycle] Initializing current week competition ${isoInfo.cycleId} (${isoInfo.startDate} to ${isoInfo.endDate})...`);
      const defaultPrizeRules = [
        { rank: 1, label: '1st Grand Champion', prizeAmountBirr: 20000, prizeType: 'TELEBIRR_CASH', description: 'Weekly Champion' },
        { rank: 2, label: '2nd Place', prizeAmountBirr: 12000, prizeType: 'TELEBIRR_CASH', description: 'Runner up' },
        { rank: 3, label: '3rd Place', prizeAmountBirr: 5000, prizeType: 'TELEBIRR_CASH', description: 'Bronze medalist' },
        { rank: 4, label: '4th - 10th Place', prizeAmountBirr: 1000, prizeType: 'TELEBIRR_CASH', description: 'Top 10 Finishers' },
      ];

      const insertRes = await pool.query(
        `INSERT INTO weekly_competitions 
         (competition_id, cycle_number, title, period_label, start_date, end_date, status, settlement_status, prize_pool_etb, prize_rules)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 'UNSETTLED', 50000.00, $7)
         ON CONFLICT (competition_id) DO UPDATE SET status = 'ACTIVE'
         RETURNING *`,
        [
          isoInfo.cycleId,
          isoInfo.weekNumber,
          `7-Day Telecom Championship (Week ${isoInfo.weekNumber})`,
          `Week ${isoInfo.weekNumber} (${isoInfo.startDate} to ${isoInfo.endDate})`,
          isoInfo.startDate,
          isoInfo.endDate,
          JSON.stringify(defaultPrizeRules),
        ]
      );
      return insertRes.rows[0];
    } else if (currentWeekRes.rows[0].status !== 'ACTIVE' && currentWeekRes.rows[0].settlement_status !== 'SETTLED') {
      await pool.query(
        `UPDATE weekly_competitions SET status = 'ACTIVE' WHERE competition_id = $1`,
        [isoInfo.cycleId]
      );
    }

    return currentWeekRes.rows[0];
  }
}
