import { FastifyInstance } from 'fastify';
import { DailyChallengeEngine, normalizeMsisdn } from '../services/dailyChallengeEngine.js';
import { AuthoritativeGameEngine } from '../services/authoritativeGameEngine.js';
import { CompetitionLifecycleService } from '../services/competitionLifecycleService.js';
import { pool } from '../config/database.js';
import { getEatDateString } from '../utils/time.js';

export async function dailyChallengeRoutes(fastify: FastifyInstance) {
  /**
   * 1. Check Daily Challenge Status & Once-per-day restriction
   */
  fastify.get('/status', async (req, reply) => {
    const query = (req.query || {}) as { msisdn?: string };
    const msisdn = query.msisdn || '251965112122';

    // Synchronize daily challenge windows in EAT
    await CompetitionLifecycleService.syncDailyChallengesStatus();

    const check = await DailyChallengeEngine.checkEligibility(msisdn);
    return reply.send({
      success: true,
      eligible: check.eligible,
      canAttempt: check.eligible,
      reason: check.reason,
      state: check.state,
    });
  });

  /**
   * 2. Start or Resume Daily Challenge Session (Strictly 1 attempt per day per MSISDN in EAT)
   * Sanitizes all questions by stripping answer keys (correct_index / correctAnswerIndex / explanation).
   */
  fastify.post('/start', async (req, reply) => {
    const body = (req.body || {}) as { msisdn?: string };
    if (!body.msisdn) {
      return reply.status(400).send({ success: false, error: 'MSISDN is required' });
    }

    const result = await AuthoritativeGameEngine.startDailySession(body.msisdn);
    if (!result.success) {
      return reply.status(403).send(result);
    }

    return reply.send(result);
  });

  /**
   * 3. Authoritative Answer Validation & Scoring (10s countdown, 1 base + speed points)
   * Calculates latency from server wall-clock timer, rejecting forged client timestamps.
   */
  fastify.post('/submit-answer', async (req, reply) => {
    const payload = (req.body || {}) as {
      msisdn?: string;
      rawMsisdn?: string;
      sessionId?: string;
      attemptId?: string;
      questionId: string;
      selectedOptionIndex?: number | null;
      selectedIndex?: number | null;
    };

    const msisdn = payload.msisdn || payload.rawMsisdn;
    if (!msisdn || !payload.questionId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required parameters: msisdn, questionId',
      });
    }

    const selectedIdx = payload.selectedOptionIndex !== undefined 
      ? payload.selectedOptionIndex 
      : (payload.selectedIndex !== undefined ? payload.selectedIndex : null);

    const result = await AuthoritativeGameEngine.submitAnswer({
      msisdn,
      sessionId: payload.sessionId,
      attemptId: payload.attemptId,
      questionId: payload.questionId,
      selectedIndex: selectedIdx,
    });

    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.send(result);
  });

  /**
   * 4. Finalize Daily Challenge Attempt and Update 7-Day Competition Total
   */
  fastify.post('/complete', async (req, reply) => {
    const body = (req.body || {}) as { msisdn?: string; rawMsisdn?: string; attemptId: string };
    const msisdn = body.msisdn || body.rawMsisdn;

    if (!msisdn || !body.attemptId) {
      return reply.status(400).send({ success: false, error: 'msisdn and attemptId are required' });
    }

    const result = await DailyChallengeEngine.completeAttempt(msisdn, body.attemptId);
    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.send(result);
  });

  /**
   * 5. Get Daily Challenge Review for Date directly from PostgreSQL
   */
  fastify.get('/review', async (req, reply) => {
    const query = (req.query || {}) as { msisdn?: string; date?: string };
    if (!query.msisdn) {
      return reply.status(400).send({ success: false, error: 'MSISDN is required' });
    }

    const norm = normalizeMsisdn(query.msisdn);
    const date = query.date || getEatDateString();

    // Query session or attempt in PostgreSQL
    const sessionRes = await pool.query(
      `SELECT score, total_response_time_ms, session_answers, is_completed
       FROM player_quiz_sessions
       WHERE player_msisdn = $1 AND challenge_date = $2
       LIMIT 1`,
      [norm, date]
    );

    let answers: any[] = [];
    let score = 0;
    let totalResponseTime = 0;

    if (sessionRes.rows.length > 0) {
      const s = sessionRes.rows[0];
      score = s.score || 0;
      totalResponseTime = (s.total_response_time_ms || 0) / 1000;
      answers = typeof s.session_answers === 'string'
        ? JSON.parse(s.session_answers)
        : (s.session_answers || []);
    } else {
      const attRes = await pool.query(
        `SELECT score, total_response_time_ms, answers
         FROM daily_attempts
         WHERE player_msisdn = $1 AND attempt_date = $2
         LIMIT 1`,
        [norm, date]
      );
      if (attRes.rows.length > 0) {
        const a = attRes.rows[0];
        score = a.score || 0;
        totalResponseTime = (a.total_response_time_ms || 0) / 1000;
        answers = typeof a.answers === 'string' ? JSON.parse(a.answers) : (a.answers || []);
      }
    }

    if (answers.length === 0) {
      return reply.send({
        success: true,
        results: [],
        levelScore: 0,
        totalResponseTime: 0,
      });
    }

    // Fetch full question metadata (text, options, explanation) from DB
    const qIds = answers.map((a) => a.questionId).filter(Boolean);
    const qRes = await pool.query(
      `SELECT id, category, question_text, prompt_en, options, options_en, correct_index, explanation
       FROM quiz_questions
       WHERE id = ANY($1)`,
      [qIds]
    );

    const qMap = new Map(qRes.rows.map((q) => [q.id, q]));

    const results = answers.map((ans, idx) => {
      const q = qMap.get(ans.questionId);
      let opts: string[] = [];
      if (q) {
        if (Array.isArray(q.options)) opts = q.options;
        else if (Array.isArray(q.options_en)) opts = q.options_en;
        else if (typeof q.options === 'string') {
          try { opts = JSON.parse(q.options); } catch {}
        }
      }

      const selectedIdx = ans.selectedIndex ?? ans.selectedOptionIndex;
      const isCorrect = Boolean(ans.isCorrect);
      const correctIdx = q ? q.correct_index : 0;
      const userAnswer = (selectedIdx !== null && selectedIdx !== undefined && opts[selectedIdx])
        ? opts[selectedIdx]
        : 'Timed Out';
      const correctAnswer = opts[correctIdx] || '';

      return {
        questionNumber: idx + 1,
        questionText: q?.question_text || q?.prompt_en || `Question ${idx + 1}`,
        categoryTitle: q?.category || 'DAILY CHALLENGE',
        options: opts,
        selectedOptionIndex: selectedIdx,
        userAnswer,
        correctAnswer,
        correctAnswerIndex: correctIdx,
        isCorrect,
        timeRemaining: Math.max(0, Math.round(10 - (ans.elapsedSeconds || 10))),
        elapsedSeconds: ans.elapsedSeconds || 10,
        baseScore: ans.baseScore || 0,
        speedScore: ans.speedScore || 0,
        finalQuestionScore: ans.questionScore || (ans.baseScore || 0) + (ans.speedScore || 0),
        explanation: q?.explanation || '',
      };
    });

    return reply.send({
      success: true,
      results,
      levelScore: score,
      totalResponseTime,
    });
  });
}
