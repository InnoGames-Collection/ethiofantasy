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
   * Ensure challenge exists for today with questions populated, and return full details
   */
  async getTodayChallenge(msisdn: string, date: string, locale: 'en' | 'am' | 'om' = 'en') {
    const norm = normalizeMsisdn(msisdn);
    const challengeId = `dc_${date}`;

    let chRes = await pool.query(
      `SELECT challenge_id, challenge_date, title, prize_pool_etb, questions 
       FROM daily_challenges 
       WHERE challenge_date = $1`,
      [date]
    );

    let questions: any[] = [];
    if (chRes.rows.length === 0 || !chRes.rows[0].questions || chRes.rows[0].questions.length === 0) {
      // Pick 10 questions from quiz_questions table
      const qRes = await pool.query(
        `SELECT id, category, prompt_en, prompt_am, prompt_om,
                options_en, options_am, options_om,
                correct_index, difficulty, fact, learning_tip
         FROM quiz_questions 
         WHERE is_active = TRUE
         ORDER BY RANDOM() 
         LIMIT 10`
      );

      questions = qRes.rows;
      await pool.query(
        `INSERT INTO daily_challenges (challenge_id, challenge_date, title, prize_pool_etb, questions)
         VALUES ($1, $2, $3, 5000, $4)
         ON CONFLICT (challenge_date) 
         DO UPDATE SET questions = EXCLUDED.questions`,
        [challengeId, date, `Daily Football Challenge — ${date}`, JSON.stringify(questions)]
      );
    } else {
      questions = typeof chRes.rows[0].questions === 'string' 
        ? JSON.parse(chRes.rows[0].questions) 
        : chRes.rows[0].questions;
    }

    const check = await this.checkEligibility(norm, date);

    // Map questions for requested locale
    const mappedQuestions = questions.map((row: any) => {
      let prompt = row.prompt_en;
      let options = row.options_en;

      if (locale === 'am' && row.prompt_am && row.options_am?.length) {
        prompt = row.prompt_am;
        options = row.options_am;
      } else if (locale === 'om' && row.prompt_om && row.options_om?.length) {
        prompt = row.prompt_om;
        options = row.options_om;
      }

      return {
        id: row.id,
        category: row.category,
        prompt: prompt || row.prompt_en,
        options: options || row.options_en || [],
        correctIndex: row.correct_index,
        difficulty: row.difficulty,
        fact: row.fact,
        learningTip: row.learning_tip,
        promptEn: row.prompt_en,
        promptAm: row.prompt_am,
        promptOm: row.prompt_om,
        optionsEn: row.options_en,
        optionsAm: row.options_am,
        optionsOm: row.options_om,
      };
    });

    return {
      id: challengeId,
      challengeDate: date,
      themeEn: 'Daily Football Quiz Challenge',
      themeAm: 'የዕለቱ የእግር ኳስ ጥያቄ ተግዳሮት',
      themeOm: 'Qormaata Gaaffii Kubbaa Miilaa Guyyaa',
      bonusMultiplier: 1.5,
      canAttempt: check.canAttempt,
      completed: check.attempt?.is_completed || false,
      reason: check.reason,
      attempt: check.attempt,
      questions: mappedQuestions,
    };
  },

  /**
   * Start a daily challenge session
   */
  async startAttempt(msisdn: string, date: string): Promise<{ attemptId: string; challengeId: string }> {
    const norm = normalizeMsisdn(msisdn);
    const attemptId = `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const challengeId = `dc_${date}`;

    // Ensure challenge exists
    let chRes = await pool.query(`SELECT challenge_id FROM daily_challenges WHERE challenge_date = $1`, [date]);
    if (chRes.rows.length === 0) {
      await this.getTodayChallenge(norm, date);
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
