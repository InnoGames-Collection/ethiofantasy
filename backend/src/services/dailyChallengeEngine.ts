import { pool } from '../config/database.js';
import {
  getEatDateString,
  getEatTimestampString,
  getCompetitionCycleInfoEAT,
  isDailyChallengeReviewLockedEAT,
} from '../utils/time.js';

export function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('09') || digits.startsWith('07')) return '251' + digits.substring(1);
  if (digits.startsWith('9') || digits.startsWith('7')) return '251' + digits;
  return digits.length > 0 ? digits : '251965112122';
}

export function maskMsisdn(msisdn: string): string {
  const norm = normalizeMsisdn(msisdn);
  if (norm.length >= 6) {
    const start = norm.substring(0, 3);
    const end = norm.substring(norm.length - 3);
    return `${start}*****${end}`;
  }
  return '251*****122';
}

export const DailyChallengeEngine = {
  /**
   * Calculate speed score: remaining seconds rounded down from 10.0s countdown
   */
  calculateSpeedPoints(elapsedSeconds: number): number {
    if (elapsedSeconds >= 10.0) return 0;
    if (elapsedSeconds <= 0.05) return 10;
    const speed = Math.ceil(10.0 - elapsedSeconds);
    return Math.max(0, Math.min(10, speed));
  },

  /**
   * Calculate state for player in current 7-day cycle (UTC+3 EAT)
   */
  async getPlayerState(rawMsisdn: string) {
    const norm = normalizeMsisdn(rawMsisdn);
    const today = getEatDateString();
    const cycle = getCompetitionCycleInfoEAT(today);

    // Fetch attempts for the current 7-day cycle
    const attemptsRes = await pool.query(
      `SELECT attempt_id, attempt_date, score, total_response_time_ms, is_completed, submitted_at, final_submission_timestamp, answers
       FROM daily_attempts
       WHERE player_msisdn = $1 AND attempt_date >= $2::date AND attempt_date <= $3::date
       ORDER BY attempt_date ASC`,
      [norm, cycle.cycleStartDate, today]
    );

    const history: Record<string, number> = {};
    const historyTimes: Record<string, number> = {};
    const historyTimestamps: Record<string, string> = {};

    let todayAttempt: any = null;

    for (const row of attemptsRes.rows) {
      const d = row.attempt_date instanceof Date 
        ? row.attempt_date.toISOString().slice(0, 10) 
        : String(row.attempt_date).slice(0, 10);
      
      history[d] = row.score || 0;
      historyTimes[d] = (row.total_response_time_ms || 0) / 1000;
      if (row.submitted_at || row.final_submission_timestamp) {
        historyTimestamps[d] = (row.final_submission_timestamp || row.submitted_at).toISOString();
      }

      if (d === today) {
        todayAttempt = row;
      }
    }

    const sevenDayTotal = Object.values(history).reduce((a, b) => a + b, 0);
    const totalCumulativeResponseTime = Object.values(historyTimes).reduce((a, b) => a + b, 0);

    const completed = todayAttempt ? Boolean(todayAttempt.is_completed) : false;
    const todayScore = todayAttempt ? todayAttempt.score || 0 : 0;

    return {
      date: today,
      completed,
      todayScore,
      history,
      historyResponseTimes: historyTimes,
      historyTimestamps,
      competitionCycleStart: cycle.cycleStartDate,
      currentDayInCycle: cycle.dayNumber,
      sevenDayTotal,
      totalCumulativeResponseTime,
      lastSubmissionTimestamp: todayAttempt?.final_submission_timestamp?.toISOString() || undefined,
      activeAttempt: (todayAttempt && !completed) ? {
        attemptId: todayAttempt.attempt_id,
        playerId: norm,
        challengeId: `dc_${today}`,
        challengeDate: today,
        startedAt: todayAttempt.submitted_at?.toISOString() || getEatTimestampString(),
        status: 'IN_PROGRESS',
        totalScore: todayScore,
        totalResponseTime: (todayAttempt.total_response_time_ms || 0) / 1000,
        answers: todayAttempt.answers || [],
      } : null,
    };
  },

  /**
   * Check eligibility (strictly once per day per MSISDN in EAT)
   */
  async checkEligibility(rawMsisdn: string) {
    const norm = normalizeMsisdn(rawMsisdn);
    const state = await this.getPlayerState(norm);

    if (state.completed) {
      return {
        eligible: false,
        reason: 'TODAY_CHALLENGE_COMPLETED',
        state,
      };
    }

    return {
      eligible: true,
      state,
    };
  },

  /**
   * Ensure today's challenge exists in DB with 10 questions
   */
  async ensureDailyChallenge(today: string) {
    const challengeId = `dc_${today}`;
    const chRes = await pool.query(
      `SELECT * FROM daily_challenges WHERE challenge_date = $1`,
      [today]
    );

    if (chRes.rows.length > 0 && chRes.rows[0].questions && chRes.rows[0].questions.length > 0) {
      return chRes.rows[0];
    }

    // Pick 10 active questions from pool
    const qRes = await pool.query(
      `SELECT id, category, question_text as "questionText",
              options, correct_index as "correctAnswerIndex",
              image_url as "imageUrl", image_caption as "imageCaption",
              image_source as "imageSource", image_source_url as "imageSourceUrl",
              image_license as "imageLicense", image_status as "imageStatus",
              explanation, difficulty, type
       FROM quiz_questions
       WHERE is_active = TRUE
       ORDER BY RANDOM()
       LIMIT 10`
    );

    let questions = qRes.rows;
    if (questions.length === 0) {
      // Fallback questions if db question table was empty
      questions = [
        {
          id: 'q-dc-01',
          category: 'ETHIOPIAN FOOTBALL',
          questionText: 'Which club is the most successful in the Ethiopian Premier League history?',
          options: ['Saint George SC', 'Ethiopian Coffee SC', 'Fasil Kenema', 'Hawassa City'],
          correctAnswerIndex: 0,
          difficulty: 'MEDIUM',
          type: 'club',
          imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
          imageCaption: 'Historic Ethiopian Premier League Stadium',
          explanation: 'Saint George SC has won over 30 Ethiopian championship titles.',
        },
      ];
    }

    const defaultPrizeRules = [
      { rank: 1, label: '1st Place Champion', prizeAmountBirr: 1000, prizeType: 'TELEBIRR_CASH', description: 'Top score + fastest time' },
      { rank: 2, label: '2nd Place Runner-Up', prizeAmountBirr: 500, prizeType: 'TELEBIRR_CASH', description: '2nd best score' },
      { rank: 3, label: '3rd Place Bronze', prizeAmountBirr: 250, prizeType: 'TELEBIRR_CASH', description: '3rd best score' },
    ];

    const insertRes = await pool.query(
      `INSERT INTO daily_challenges (challenge_id, challenge_date, title, prize_pool_etb, questions, status, prize_rules)
       VALUES ($1, $2, $3, 5000, $4, 'OPEN', $5)
       ON CONFLICT (challenge_date) DO UPDATE SET questions = EXCLUDED.questions
       RETURNING *`,
      [challengeId, today, `Daily Football Challenge — ${today}`, JSON.stringify(questions), JSON.stringify(defaultPrizeRules)]
    );

    return insertRes.rows[0];
  },

  /**
   * Start or restore Daily Challenge Session
   */
  async startSession(rawMsisdn: string) {
    const norm = normalizeMsisdn(rawMsisdn);
    const today = getEatDateString();
    const challenge = await this.ensureDailyChallenge(today);
    const questions = typeof challenge.questions === 'string' ? JSON.parse(challenge.questions) : challenge.questions;

    // Check existing attempt
    const attRes = await pool.query(
      `SELECT * FROM daily_attempts WHERE player_msisdn = $1 AND attempt_date = $2`,
      [norm, today]
    );

    if (attRes.rows.length > 0) {
      const existing = attRes.rows[0];
      if (existing.is_completed) {
        return {
          success: false,
          error: "Today's Daily Challenge has already been completed. Available tomorrow at 00:00 EAT.",
        };
      }

      // Resume in-progress session
      return {
        success: true,
        attempt: {
          attemptId: existing.attempt_id,
          playerId: norm,
          challengeId: `dc_${today}`,
          challengeDate: today,
          startedAt: existing.started_at?.toISOString() || getEatTimestampString(),
          status: 'IN_PROGRESS',
          totalScore: existing.score || 0,
          totalResponseTime: (existing.total_response_time_ms || 0) / 1000,
          answers: existing.answers || [],
        },
        questions,
      };
    }

    const attemptId = `att_${norm}_${today}_${Date.now()}`;
    const newAttempt = {
      attemptId,
      playerId: norm,
      challengeId: `dc_${today}`,
      challengeDate: today,
      startedAt: getEatTimestampString(),
      status: 'IN_PROGRESS',
      totalScore: 0,
      totalResponseTime: 0,
      answers: [],
    };

    await pool.query(
      `INSERT INTO daily_attempts (attempt_id, challenge_id, player_msisdn, score, total_response_time_ms, is_completed, attempt_date, started_at, answers)
       VALUES ($1, $2, $3, 0, 0, FALSE, $4, NOW(), '[]'::jsonb)`,
      [attemptId, `dc_${today}`, norm, today]
    );

    return {
      success: true,
      attempt: newAttempt,
      questions,
    };
  },

  /**
   * Authoritative answer evaluation with 10s countdown and speed scoring
   */
  async recordAnswer(params: {
    rawMsisdn: string;
    attemptId: string;
    questionId: string;
    questionStartTimestamp: string | number;
    answerTimestamp: string | number;
    selectedOptionIndex: number | null;
  }) {
    const norm = normalizeMsisdn(params.rawMsisdn);
    const today = getEatDateString();

    const attRes = await pool.query(
      `SELECT * FROM daily_attempts WHERE attempt_id = $1 AND player_msisdn = $2`,
      [params.attemptId, norm]
    );

    if (attRes.rows.length === 0 || attRes.rows[0].is_completed) {
      return { success: false, error: 'Invalid or already completed challenge attempt.' };
    }

    const currentAttempt = attRes.rows[0];
    const challenge = await this.ensureDailyChallenge(today);
    const questions: any[] = typeof challenge.questions === 'string' ? JSON.parse(challenge.questions) : challenge.questions;
    const question = questions.find((q) => q.id === params.questionId);

    if (!question) {
      return { success: false, error: "Question not found in today's challenge pool." };
    }

    // Parse start and end timestamps (ISO string or Epoch ms)
    const startTime = typeof params.questionStartTimestamp === 'number' 
      ? params.questionStartTimestamp 
      : Date.parse(params.questionStartTimestamp);
    const answerTime = typeof params.answerTimestamp === 'number'
      ? params.answerTimestamp
      : Date.parse(params.answerTimestamp);

    const elapsedRaw = (answerTime - startTime) / 1000;
    const elapsedSeconds = Math.max(0, Math.min(10.0, isNaN(elapsedRaw) ? 10.0 : elapsedRaw));

    const isCorrect = params.selectedOptionIndex !== null && params.selectedOptionIndex === (question.correctAnswerIndex ?? question.correct_index);
    const baseScore = isCorrect ? 1 : 0;
    const speedScore = isCorrect ? this.calculateSpeedPoints(elapsedSeconds) : 0;
    const finalScore = baseScore + speedScore;

    const answerRecord = {
      answerId: `ans_${params.questionId}_${Date.now()}`,
      attemptId: params.attemptId,
      questionId: params.questionId,
      questionStartTimestamp: typeof params.questionStartTimestamp === 'string' ? params.questionStartTimestamp : new Date(startTime).toISOString(),
      answerTimestamp: typeof params.answerTimestamp === 'string' ? params.answerTimestamp : new Date(answerTime).toISOString(),
      elapsedSeconds: parseFloat(elapsedSeconds.toFixed(3)),
      isCorrect,
      baseScore,
      speedScore,
      finalQuestionScore: finalScore,
      selectedOptionIndex: params.selectedOptionIndex,
    };

    const existingAnswers: any[] = currentAttempt.answers || [];
    existingAnswers.push(answerRecord);

    const totalScore = existingAnswers.reduce((acc, a) => acc + (a.finalQuestionScore || 0), 0);
    const totalResponseTimeSec = existingAnswers.reduce((acc, a) => acc + (a.elapsedSeconds || 0), 0);
    const totalResponseTimeMs = Math.round(totalResponseTimeSec * 1000);

    await pool.query(
      `UPDATE daily_attempts 
       SET score = $1, total_response_time_ms = $2, answers = $3
       WHERE attempt_id = $4`,
      [totalScore, totalResponseTimeMs, JSON.stringify(existingAnswers), params.attemptId]
    );

    return {
      success: true,
      answer: answerRecord,
      attempt: {
        attemptId: params.attemptId,
        playerId: norm,
        challengeId: `dc_${today}`,
        challengeDate: today,
        status: 'IN_PROGRESS',
        totalScore,
        totalResponseTime: parseFloat(totalResponseTimeSec.toFixed(3)),
        answers: existingAnswers,
      },
    };
  },

  /**
   * Finalize Daily Challenge attempt and update 7-Day competition total
   */
  async completeAttempt(rawMsisdn: string, attemptId: string) {
    const norm = normalizeMsisdn(rawMsisdn);
    const today = getEatDateString();

    const attRes = await pool.query(
      `SELECT * FROM daily_attempts WHERE attempt_id = $1 AND player_msisdn = $2`,
      [attemptId, norm]
    );

    if (attRes.rows.length === 0) {
      return { success: false, error: 'Attempt session not found' };
    }

    const nowEat = getEatTimestampString();

    await pool.query(
      `UPDATE daily_attempts 
       SET is_completed = TRUE, submitted_at = NOW(), final_submission_timestamp = NOW()
       WHERE attempt_id = $1`,
      [attemptId]
    );

    // Update player aggregate stats
    await pool.query(
      `UPDATE players 
       SET daily_challenge_participations = daily_challenge_participations + 1,
           best_score = GREATEST(best_score, $1),
           last_active_at = NOW()
       WHERE msisdn = $2`,
      [attRes.rows[0].score || 0, norm]
    );

    const state = await this.getPlayerState(norm);

    return {
      success: true,
      state,
      attempt: {
        attemptId,
        playerId: norm,
        challengeId: `dc_${today}`,
        challengeDate: today,
        status: 'COMPLETED',
        totalScore: attRes.rows[0].score || 0,
        totalResponseTime: (attRes.rows[0].total_response_time_ms || 0) / 1000,
        completedAt: nowEat,
        finalSubmissionTimestamp: nowEat,
        answers: attRes.rows[0].answers || [],
      },
    };
  },

  /**
   * Authoritative 7-Day Competition Leaderboard (deterministic 5-tier tie-breaking)
   */
  async getLeaderboard(rawMsisdn?: string) {
    const today = getEatDateString();
    const cycle = getCompetitionCycleInfoEAT(today);
    const userNorm = rawMsisdn ? normalizeMsisdn(rawMsisdn) : null;

    // Aggregate all daily attempts for the active 7-day cycle window
    const lbRes = await pool.query(
      `SELECT player_msisdn,
              SUM(score) as "sevenDayScore",
              SUM(total_response_time_ms)::numeric / 1000 as "totalResponseTime",
              MAX(final_submission_timestamp) as "lastTimestamp",
              COUNT(attempt_id) as "participationDays"
       FROM daily_attempts
       WHERE attempt_date >= $1::date AND attempt_date <= $2::date AND is_completed = TRUE
       GROUP BY player_msisdn
       ORDER BY "sevenDayScore" DESC, "totalResponseTime" ASC, "lastTimestamp" ASC, player_msisdn ASC
       LIMIT 100`,
      [cycle.cycleStartDate, today]
    );

    let rank = 1;
    let userEntry: any = null;
    const top10: any[] = [];

    for (const row of lbRes.rows) {
      const isCurrent = userNorm && row.player_msisdn === userNorm;
      const entry = {
        rank,
        maskedMsisdn: maskMsisdn(row.player_msisdn),
        sevenDayScore: parseInt(row.sevenDayScore || '0', 10),
        totalResponseTime: parseFloat(Number(row.totalResponseTime || 0).toFixed(3)),
        finalSubmissionTimestamp: row.lastTimestamp ? row.lastTimestamp.toISOString() : undefined,
        participationDays: parseInt(row.participationDays || '1', 10),
        isCurrentUser: Boolean(isCurrent),
      };

      if (rank <= 10) {
        top10.push(entry);
      }
      if (isCurrent) {
        userEntry = entry;
      }
      rank++;
    }

    // If user not in top 100, calculate their entry directly
    if (userNorm && !userEntry) {
      const userState = await this.getPlayerState(userNorm);
      userEntry = {
        rank: rank,
        maskedMsisdn: maskMsisdn(userNorm),
        sevenDayScore: userState.sevenDayTotal,
        totalResponseTime: parseFloat(userState.totalCumulativeResponseTime.toFixed(3)),
        participationDays: Object.keys(userState.history).length,
        isCurrentUser: true,
      };
    }

    return {
      top10,
      currentUserPosition: userEntry,
    };
  },
};
