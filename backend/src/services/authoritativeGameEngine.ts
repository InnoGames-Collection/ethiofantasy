import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { getEatDateString, getEatTimestampString } from '../utils/time.js';
import { normalizeMsisdn, maskMsisdn, DailyChallengeEngine } from './dailyChallengeEngine.js';

export interface AnswerSubmissionResult {
  success: boolean;
  isCorrect?: boolean;
  baseScore?: number;
  speedScore?: number;
  questionScore?: number;
  totalScore?: number;
  elapsedSeconds?: number;
  nextQuestionIndex?: number;
  isCompleted?: boolean;
  error?: string;
  code?: string;
}

export interface SanitizedQuestion {
  id: string;
  category: string;
  questionText: string;
  prompt_en?: string;
  prompt_am?: string;
  prompt_om?: string;
  options: string[];
  options_en?: string[];
  options_am?: string[];
  imageUrl?: string;
  imageCaption?: string;
  difficulty?: string;
}

export class AuthoritativeGameEngine {
  /**
   * Starts or resumes a daily challenge session.
   * QUESTIONS ARE STRICTLY STRIPPED OF CORRECT ANSWERS AND EXPLANATIONS.
   */
  static async startDailySession(rawMsisdn: string): Promise<{
    success: boolean;
    sessionId?: string;
    attemptId?: string;
    challengeDate?: string;
    currentIndex?: number;
    currentScore?: number;
    questions?: SanitizedQuestion[];
    code?: string;
    error?: string;
  }> {
    const msisdn = normalizeMsisdn(rawMsisdn);
    const today = getEatDateString();

    // 1. Verify player is actively subscribed (Ethio Telecom VAS billing gating)
    const subRes = await pool.query(
      `SELECT status FROM subscriptions WHERE msisdn = $1 AND status = 'ACTIVE' LIMIT 1`,
      [msisdn]
    );

    // Also check test subscriber table in non-production
    let isTestSub = false;
    if (process.env.NODE_ENV !== 'production') {
      const testRes = await pool.query(
        `SELECT msisdn FROM test_subscriber_otps WHERE msisdn = $1 LIMIT 1`,
        [msisdn]
      );
      isTestSub = testRes.rows.length > 0;
    }

    if (subRes.rows.length === 0 && !isTestSub) {
      return {
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        error: 'Active Ethio Telecom subscription required to play. Text OK to 9401.',
      };
    }

    // Ensure daily challenge exists in database (authoritative foreign key guard)
    await DailyChallengeEngine.ensureDailyChallenge(today);

    // 2. Check for completed attempt today
    const attRes = await pool.query(
      `SELECT attempt_id, is_completed FROM daily_attempts WHERE player_msisdn = $1 AND attempt_date = $2`,
      [msisdn, today]
    );

    if (attRes.rows.length > 0 && attRes.rows[0].is_completed) {
      return {
        success: false,
        code: 'ALREADY_COMPLETED',
        error: "Today's Daily Challenge has already been completed. Next challenge opens tomorrow at 00:00 EAT.",
      };
    }

    // 3. Check for existing active session in PostgreSQL
    const sessionRes = await pool.query(
      `SELECT * FROM player_quiz_sessions 
       WHERE player_msisdn = $1 AND challenge_date = $2 AND is_completed = FALSE 
       LIMIT 1`,
      [msisdn, today]
    );

    let session = sessionRes.rows[0];

    if (!session) {
      // Pick 10 active questions randomly from the pool
      const questionsRes = await pool.query(
        `SELECT id, category, question_text, prompt_en, prompt_am, prompt_om,
                options, options_en, options_am, image_url, image_caption,
                difficulty, correct_index
         FROM quiz_questions
         WHERE is_active = TRUE
         ORDER BY RANDOM()
         LIMIT 10`
      );

      if (questionsRes.rows.length < 10) {
        throw new Error('Insufficient questions published in database question bank.');
      }

      const questionIds = questionsRes.rows.map((q) => q.id);

      // Cache authoritative answer map in Redis (TTL: 20 minutes)
      const answerKeyMap: Record<string, number> = {};
      questionsRes.rows.forEach((q) => {
        answerKeyMap[q.id] = q.correct_index;
      });

      try {
        await cache.set(`session_answers:${msisdn}:${today}`, JSON.stringify(answerKeyMap), 'EX', 1200);
      } catch (err) {
        console.warn('[Cache] Could not store session answers in Redis, using database fallback');
      }

      const insertSession = await pool.query(
        `INSERT INTO player_quiz_sessions 
         (player_msisdn, challenge_id, challenge_date, total_questions, question_ids, current_question_index, current_question_started_at)
         VALUES ($1, $2, $3, 10, $4, 0, NOW())
         ON CONFLICT (player_msisdn, challenge_date) DO UPDATE
         SET current_question_started_at = NOW()
         RETURNING *`,
        [msisdn, `dc_${today}`, today, JSON.stringify(questionIds)]
      );

      session = insertSession.rows[0];

      // Ensure initial daily_attempt row exists
      await pool.query(
        `INSERT INTO daily_attempts (attempt_id, challenge_id, player_msisdn, attempt_date, started_at, is_completed, score, total_response_time_ms)
         VALUES ($1, $2, $3, $4, NOW(), FALSE, 0, 0)
         ON CONFLICT (player_msisdn, attempt_date) DO NOTHING`,
        [`att_${session.session_id}`, `dc_${today}`, msisdn, today]
      );
    }

    // 4. Fetch sanitized questions for the client (STRIP ALL CORRECT ANSWERS & EXPLANATIONS)
    const qIds: string[] = typeof session.question_ids === 'string' 
      ? JSON.parse(session.question_ids) 
      : session.question_ids;

    const sanitizedQuestionsRes = await pool.query(
      `SELECT id, category, question_text, prompt_en, prompt_am, prompt_om,
              options, options_en, options_am, image_url, image_caption, difficulty
       FROM quiz_questions
       WHERE id = ANY($1)`,
      [qIds]
    );

    // Map questions to match original randomized order
    const qMap = new Map(sanitizedQuestionsRes.rows.map((q) => [q.id, q]));
    const orderedQuestions: SanitizedQuestion[] = qIds
      .map((id) => {
        const row = qMap.get(id);
        if (!row) return null;
        let opts: string[] = [];
        if (Array.isArray(row.options)) opts = row.options;
        else if (Array.isArray(row.options_en)) opts = row.options_en;
        else if (typeof row.options === 'string') {
          try { opts = JSON.parse(row.options); } catch { opts = []; }
        }

        return {
          id: row.id,
          category: row.category,
          questionText: row.question_text || row.prompt_en || '',
          prompt_en: row.prompt_en,
          prompt_am: row.prompt_am,
          prompt_om: row.prompt_om,
          options: opts,
          options_en: row.options_en,
          options_am: row.options_am,
          imageUrl: row.image_url,
          imageCaption: row.image_caption,
          difficulty: row.difficulty,
          // Zero answer keys or explanations included!
        };
      })
      .filter(Boolean) as SanitizedQuestion[];

    return {
      success: true,
      sessionId: session.session_id,
      attemptId: `att_${session.session_id}`,
      challengeDate: today,
      currentIndex: session.current_question_index,
      currentScore: session.score,
      questions: orderedQuestions,
    };
  }

  /**
   * Server-authoritative answer validation with wall-clock latency checking.
   * Completely ignores any client-supplied latency timestamps to prevent speed-score forging.
   */
  static async submitAnswer(params: {
    msisdn: string;
    sessionId?: string;
    attemptId?: string;
    questionId: string;
    selectedIndex: number | null;
  }): Promise<AnswerSubmissionResult> {
    const norm = normalizeMsisdn(params.msisdn);
    const today = getEatDateString();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Locate active session by sessionId or attemptId or (msisdn, today)
      let queryStr = `SELECT * FROM player_quiz_sessions WHERE player_msisdn = $1 AND is_completed = FALSE`;
      const queryParams: any[] = [norm];

      if (params.sessionId) {
        queryStr += ` AND session_id = $2`;
        queryParams.push(params.sessionId);
      } else if (params.attemptId) {
        const extractedSessionId = params.attemptId.replace(/^att_/, '');
        queryStr += ` AND (session_id::text = $2 OR session_id::text = $3)`;
        queryParams.push(extractedSessionId, params.attemptId);
      } else {
        queryStr += ` AND challenge_date = $2`;
        queryParams.push(today);
      }

      queryStr += ` FOR UPDATE LIMIT 1`;

      const sessionRes = await client.query(queryStr, queryParams);

      if (sessionRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Session not found or already completed.' };
      }

      const session = sessionRes.rows[0];
      const qIds: string[] = typeof session.question_ids === 'string' 
        ? JSON.parse(session.question_ids) 
        : session.question_ids;
      const currentQId = qIds[session.current_question_index];

      if (currentQId !== params.questionId) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Out-of-order question submission detected.' };
      }

      // Anti-replay check
      const existingAnswers: any[] = typeof session.session_answers === 'string'
        ? JSON.parse(session.session_answers)
        : session.session_answers;

      if (existingAnswers.some((a) => a.questionId === params.questionId)) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Duplicate submission rejected: Question already answered.' };
      }

      // Calculate elapsed time using SERVER WALL CLOCK ONLY
      const nowMs = Date.now();
      const qStartMs = session.current_question_started_at 
        ? new Date(session.current_question_started_at).getTime() 
        : nowMs - 10000;
      const elapsedSeconds = Math.max(0.01, (nowMs - qStartMs) / 1000);

      // 10.0s rule with 1.5s tolerance for mobile VAS latency
      const isTimeout = elapsedSeconds > 11.5;

      // Retrieve correct answer key from Redis or database
      let answerKey: number | null = null;
      try {
        const cachedAnswers = await cache.get(`session_answers:${norm}:${today}`);
        if (cachedAnswers) {
          const parsed = JSON.parse(cachedAnswers);
          answerKey = parsed[params.questionId] ?? null;
        }
      } catch (err) {}

      if (answerKey === null) {
        const qDb = await client.query(
          `SELECT correct_index FROM quiz_questions WHERE id = $1`,
          [params.questionId]
        );
        answerKey = qDb.rows[0]?.correct_index ?? null;
      }

      const isCorrect = !isTimeout && params.selectedIndex !== null && params.selectedIndex === answerKey;
      const baseScore = isCorrect ? 1 : 0;

      // Speed points calculation: ceil(10.0 - elapsedSeconds)
      let speedScore = 0;
      if (isCorrect) {
        const clampedElapsed = Math.min(10.0, elapsedSeconds);
        speedScore = Math.max(0, Math.ceil(10.0 - clampedElapsed));
      }

      const questionScore = baseScore + speedScore;
      const newTotalScore = session.score + questionScore;
      const newTotalResponseTimeMs = session.total_response_time_ms + Math.round(Math.min(10.0, elapsedSeconds) * 1000);
      const nextIndex = session.current_question_index + 1;
      const isCompleted = nextIndex >= session.total_questions;

      existingAnswers.push({
        questionId: params.questionId,
        selectedIndex: params.selectedIndex,
        isCorrect,
        baseScore,
        speedScore,
        questionScore,
        elapsedSeconds: parseFloat(Math.min(10.0, elapsedSeconds).toFixed(3)),
        submittedAt: new Date().toISOString(),
      });

      if (isCompleted) {
        // Finalize session in PostgreSQL
        await client.query(
          `UPDATE player_quiz_sessions 
           SET score = $1, total_response_time_ms = $2, session_answers = $3,
               is_completed = TRUE, completed_at = NOW()
           WHERE session_id = $4`,
          [newTotalScore, newTotalResponseTimeMs, JSON.stringify(existingAnswers), session.session_id]
        );

        // Mirror into daily_attempts table
        await client.query(
          `UPDATE daily_attempts 
           SET score = $1, total_response_time_ms = $2, answers = $3,
               is_completed = TRUE, submitted_at = NOW(), final_submission_timestamp = NOW()
           WHERE attempt_id = $4 OR (player_msisdn = $5 AND attempt_date = $6)`,
          [newTotalScore, newTotalResponseTimeMs, JSON.stringify(existingAnswers), `att_${session.session_id}`, norm, today]
        );

        // Update player statistics
        await client.query(
          `UPDATE players 
           SET daily_challenge_participations = daily_challenge_participations + 1,
               best_score = GREATEST(best_score, $1),
               last_active_at = NOW()
           WHERE msisdn = $2`,
          [newTotalScore, norm]
        );

        await client.query('COMMIT');

        // Post-commit: invalidate Redis session answer cache
        try {
          await cache.del(`session_answers:${norm}:${today}`);
        } catch (e) {}

        // Post-commit: update Redis leaderboard
        this.updateRedisLeaderboard(norm).catch((e) => console.error('[Leaderboard Update Error]', e));
      } else {
        // Advance to next question and start next question timer NOW
        await client.query(
          `UPDATE player_quiz_sessions 
           SET score = $1, total_response_time_ms = $2, session_answers = $3,
               current_question_index = $4, current_question_started_at = NOW()
           WHERE session_id = $5`,
          [newTotalScore, newTotalResponseTimeMs, JSON.stringify(existingAnswers), nextIndex, session.session_id]
        );

        await client.query('COMMIT');
      }

      return {
        success: true,
        isCorrect,
        baseScore,
        speedScore,
        questionScore,
        totalScore: newTotalScore,
        elapsedSeconds: parseFloat(Math.min(10.0, elapsedSeconds).toFixed(3)),
        nextQuestionIndex: nextIndex,
        isCompleted,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[SubmitAnswer Error]', err);
      return { success: false, error: err.message || 'Internal error processing answer' };
    } finally {
      client.release();
    }
  }

  /**
   * Pushes 7-day cumulative score into Redis Sorted Set for O(log N) leaderboard queries.
   */
  static async updateRedisLeaderboard(msisdn: string): Promise<void> {
    const today = getEatDateString();
    const cycleRes = await pool.query(
      `SELECT cycle_number, start_date FROM weekly_competitions WHERE status = 'ACTIVE' LIMIT 1`
    );
    const cycle = cycleRes.rows[0];
    if (!cycle) return;

    const scoreRes = await pool.query(
      `SELECT SUM(score) as total_score, SUM(total_response_time_ms) as total_time
       FROM daily_attempts
       WHERE player_msisdn = $1 AND attempt_date >= $2::date AND attempt_date <= $3::date AND is_completed = TRUE`,
      [msisdn, cycle.start_date, today]
    );

    const totalScore = parseInt(scoreRes.rows[0]?.total_score || '0', 10);
    const totalTimeMs = parseInt(scoreRes.rows[0]?.total_time || '0', 10);

    // Composite float score for deterministic tie-breaking:
    // Integer part = Score (e.g. 250)
    // Fractional part = Inverted Response Time (1 - (time_ms / 1,000,000,000))
    const tieBreaker = Math.max(0, 1 - totalTimeMs / 1000000000);
    const compositeScore = totalScore + tieBreaker;

    const redisKey = `leaderboard:cycle:${cycle.cycle_number}`;
    try {
      await cache.zadd(redisKey, compositeScore, msisdn);
      await cache.expire(redisKey, 86400 * 8); // 8-day TTL
      await cache.del('leaderboard:active_cycle:top10');
    } catch (err) {
      console.warn('[Cache] Could not update Redis ZSET leaderboard:', err);
    }
  }
}
