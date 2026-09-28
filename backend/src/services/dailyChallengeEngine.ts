import { pool } from '../config/database.js';

export function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('09')) return '251' + digits.substring(1);
  if (digits.startsWith('9')) return '251' + digits;
  if (digits.startsWith('07')) return '251' + digits.substring(1);
  if (digits.startsWith('7')) return '251' + digits;
  return digits;
}

export function maskMsisdn(msisdn: string): string {
  const norm = normalizeMsisdn(msisdn);
  if (norm.length >= 9) {
    const prefix = norm.startsWith('251') ? '0' + norm.substring(3, 5) : norm.substring(0, 3);
    const suffix = norm.slice(-3);
    return `${prefix}*****${suffix}`;
  }
  return '091*****212';
}

export const DailyChallengeEngine = {
  /**
   * Check if player has already attempted today's challenge
   */
  async checkEligibility(msisdn: string, date: string): Promise<{ canAttempt: boolean; reason?: string; attempt?: any }> {
    const norm = normalizeMsisdn(msisdn);
    const result = await pool.query(
      `SELECT * FROM daily_attempts WHERE player_msisdn = $1 AND attempt_date = $2`,
      [norm, date]
    );

    if (result.rows.length > 0) {
      const attempt = result.rows[0];
      return {
        canAttempt: false,
        reason: attempt.is_completed ? 'ALREADY_COMPLETED_TODAY' : 'ATTEMPT_IN_PROGRESS',
        attempt,
      };
    }

    return { canAttempt: true };
  },

  /**
   * Start a daily challenge session
   */
  async startAttempt(msisdn: string, date: string): Promise<{ attemptId: string; challengeId: string }> {
    const norm = normalizeMsisdn(msisdn);
    const attemptId = `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Ensure challenge exists for today, or create fallback
    let chRes = await pool.query(`SELECT challenge_id FROM daily_challenges WHERE challenge_date = $1`, [date]);
    let challengeId = chRes.rows[0]?.challenge_id;

    if (!challengeId) {
      challengeId = `dc_${date}`;
      await pool.query(
        `INSERT INTO daily_challenges (challenge_id, challenge_date, title, prize_pool_etb, questions)
         VALUES ($1, $2, $3, 5000, '[]'::jsonb)
         ON CONFLICT (challenge_date) DO NOTHING`,
        [challengeId, date, `Daily Football Challenge — ${date}`]
      );
    }

    await pool.query(
      `INSERT INTO daily_attempts (attempt_id, challenge_id, player_msisdn, attempt_date, started_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (player_msisdn, attempt_date) DO NOTHING`,
      [attemptId, challengeId, norm, date]
    );

    return { attemptId, challengeId };
  },

  /**
   * Complete attempt, record score & duration
   */
  async completeAttempt(attemptId: string, score: number, totalResponseTimeMs: number): Promise<void> {
    await pool.query(
      `UPDATE daily_attempts 
       SET score = $1, total_response_time_ms = $2, is_completed = TRUE, submitted_at = NOW()
       WHERE attempt_id = $3`,
      [score, totalResponseTimeMs, attemptId]
    );
  }
};
