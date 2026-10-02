import {
  DailyChallenge,
  DailyChallengeAttempt,
  DailyChallengeAnswer,
  DailyChallengeState,
  EthioLeaderboardEntry,
  Question,
} from '../types/quiz';
import { getDailyChallengeQuestionsForDate } from '../data/dailyChallengeData';

/**
 * ======================================================================
 * AUTHORITATIVE DAILY CHALLENGE COMPETITION ENGINE
 * ======================================================================
 * 
 * Rules enforced:
 * 1. Exactly ONE attempt per player per calendar day (playerId + challengeDate).
 * 2. 10 SECONDS per question.
 * 3. Base Score = 1 point if correct, 0 if wrong or timeout.
 * 4. Speed component: remaining seconds rounded down (up to 10 points).
 *    Answer immediately: 10 speed points
 *    Answer after 1s: 9 speed points
 *    Answer after 2s: 8 speed points
 *    ...
 *    Answer after 9s: 1 speed point
 *    Answer at/after 10s: 0 speed points
 *    Final question score = 1 + speed points (only for correct answer).
 * 5. Accurate timestamps recorded with millisecond precision (UTC).
 * 6. Deterministic 5-tier tie-breaker:
 *    1. Higher 7-Day Score
 *    2. Higher total Daily Challenge score
 *    3. Faster cumulative answer time (lower totalResponseTime)
 *    4. Earlier authoritative final submission timestamp
 *    5. Stable unique playerId
 * 7. Level Game scores NEVER enter Daily Challenge or 7-Day competition totals.
 */

/**
 * East Africa Time (EAT) UTC+3:00 date & timestamp calculation
 */
export function getCurrentDateEAT(): string {
  const eatTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const yyyy = eatTime.getUTCFullYear();
  const mm = String(eatTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(eatTime.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getCurrentTimestampEAT(): string {
  const now = new Date();
  const eatTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const yyyy = eatTime.getUTCFullYear();
  const mm = String(eatTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(eatTime.getUTCDate()).padStart(2, '0');
  const hh = String(eatTime.getUTCHours()).padStart(2, '0');
  const min = String(eatTime.getUTCMinutes()).padStart(2, '0');
  const ss = String(eatTime.getUTCSeconds()).padStart(2, '0');
  const ms = String(eatTime.getUTCMilliseconds()).padStart(3, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+03:00`;
}

// Keep getCurrentDateUTC as alias returning EAT date
export function getCurrentDateUTC(): string {
  return getCurrentDateEAT();
}

export function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('09')) return '251' + digits.substring(1);
  if (digits.startsWith('9')) return '251' + digits;
  return digits.length > 0 ? digits : '251912345678';
}

export function maskMsisdn(msisdn: string): string {
  const norm = normalizeMsisdn(msisdn);
  if (norm.length >= 6) {
    const start = norm.substring(0, 3); // "251"
    const end = norm.substring(norm.length - 3); // e.g. "122"
    return `${start}*****${end}`;
  }
  return '251*****123';
}

export function getCompetitionCycleInfo(dateStr: string): {
  dayNumber: number; // 1..7 (Monday=1, Sunday=7)
  cycleStartDate: string;
  daysRemaining: number;
} {
  const date = new Date(dateStr + 'T00:00:00+03:00');
  const dayOfWeek = date.getUTCDay(); // 0 is Sun, 1 is Mon...
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
  const daysRemaining = 7 - dayNumber;

  // Monday of the current week
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (dayNumber - 1));
  const yyyy = monday.getUTCFullYear();
  const mm = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(monday.getUTCDate()).padStart(2, '0');

  return {
    dayNumber,
    cycleStartDate: `${yyyy}-${mm}-${dd}`,
    daysRemaining,
  };
}

/**
 * Speed points calculation:
 * Remaining seconds rounded down from 10.0s countdown.
 */
export function calculateSpeedPoints(elapsedSeconds: number): number {
  if (elapsedSeconds >= 10.0) return 0;
  if (elapsedSeconds <= 0.05) return 10;
  const speed = Math.ceil(10.0 - elapsedSeconds);
  return Math.max(0, Math.min(10, speed));
}

export function calculateQuestionScore(
  isCorrect: boolean,
  elapsedSeconds: number
): {
  baseScore: number;
  speedScore: number;
  finalScore: number;
} {
  if (!isCorrect || elapsedSeconds >= 10.0) {
    return { baseScore: 0, speedScore: 0, finalScore: 0 };
  }
  const baseScore = 1;
  const speedScore = calculateSpeedPoints(elapsedSeconds);
  return {
    baseScore,
    speedScore,
    finalScore: baseScore + speedScore,
  };
}

/**
 * In-memory authoritative store for server / engine
 */
interface ServerStore {
  attempts: Map<string, DailyChallengeAttempt>; // key: `${playerId}_${challengeDate}`
  states: Map<string, DailyChallengeState>; // key: playerId
}

const memoryStore: ServerStore = {
  attempts: new Map(),
  states: new Map(),
};

/**
 * Initialize or seed simulated competition players for Top 10 Leaderboard
 * (Realistic 7-day competition scores in authentic ~200-300 pts range)
 */
const SEED_COMPETITION_PLAYERS: Array<{
  maskedMsisdn: string;
  sevenDayScore: number;
  totalResponseTime: number;
  finalSubmissionTimestamp: string;
  participationDays: number;
}> = [
  { maskedMsisdn: '251*****114', sevenDayScore: 284, totalResponseTime: 231.4, finalSubmissionTimestamp: '2026-09-25T11:02:14.210Z', participationDays: 7 },
  { maskedMsisdn: '251*****189', sevenDayScore: 271, totalResponseTime: 245.8, finalSubmissionTimestamp: '2026-09-25T11:15:22.440Z', participationDays: 7 },
  { maskedMsisdn: '251*****103', sevenDayScore: 265, totalResponseTime: 219.1, finalSubmissionTimestamp: '2026-09-25T10:48:05.120Z', participationDays: 7 },
  { maskedMsisdn: '251*****177', sevenDayScore: 258, totalResponseTime: 260.3, finalSubmissionTimestamp: '2026-09-25T12:30:19.890Z', participationDays: 6 },
  { maskedMsisdn: '251*****142', sevenDayScore: 252, totalResponseTime: 251.7, finalSubmissionTimestamp: '2026-09-25T13:04:41.330Z', participationDays: 6 },
  { maskedMsisdn: '251*****195', sevenDayScore: 244, totalResponseTime: 270.2, finalSubmissionTimestamp: '2026-09-25T13:22:10.510Z', participationDays: 6 },
  { maskedMsisdn: '251*****131', sevenDayScore: 239, totalResponseTime: 264.9, finalSubmissionTimestamp: '2026-09-25T14:01:03.110Z', participationDays: 6 },
  { maskedMsisdn: '251*****166', sevenDayScore: 230, totalResponseTime: 285.4, finalSubmissionTimestamp: '2026-09-25T14:10:55.780Z', participationDays: 5 },
  { maskedMsisdn: '251*****118', sevenDayScore: 221, totalResponseTime: 292.0, finalSubmissionTimestamp: '2026-09-25T14:25:30.900Z', participationDays: 5 },
  { maskedMsisdn: '251*****150', sevenDayScore: 215, totalResponseTime: 288.6, finalSubmissionTimestamp: '2026-09-25T14:40:12.600Z', participationDays: 5 },
  { maskedMsisdn: '251*****127', sevenDayScore: 204, totalResponseTime: 310.1, finalSubmissionTimestamp: '2026-09-25T15:00:21.140Z', participationDays: 5 },
  { maskedMsisdn: '251*****162', sevenDayScore: 198, totalResponseTime: 315.5, finalSubmissionTimestamp: '2026-09-25T15:12:09.800Z', participationDays: 4 },
];

/**
 * Load or initialize authoritatively the player's DailyChallengeState
 */
export function getOrCreatePlayerState(rawMsisdn: string): DailyChallengeState {
  const playerId = normalizeMsisdn(rawMsisdn);
  const today = getCurrentDateUTC();
  const { dayNumber, cycleStartDate } = getCompetitionCycleInfo(today);

  let state = memoryStore.states.get(playerId);
  if (!state) {
    // Generate realistic prior days in current 7-day cycle for demo engagement
    const baseHistory: Record<string, number> = {};
    const baseTimes: Record<string, number> = {};
    const baseTimestamps: Record<string, string> = {};
    const d = new Date(today + 'T00:00:00Z');

    for (let i = 1; i < dayNumber; i++) {
      const past = new Date(d);
      past.setUTCDate(d.getUTCDate() - i);
      const y = past.getUTCFullYear();
      const m = String(past.getUTCMonth() + 1).padStart(2, '0');
      const dt = String(past.getUTCDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dt}`;
      baseHistory[dateKey] = 32 + (i * 3);
      baseTimes[dateKey] = 38.5 + (i * 1.5);
      baseTimestamps[dateKey] = `${dateKey}T12:00:00.000Z`;
    }

    const initialTotal = Object.values(baseHistory).reduce((a, b) => a + b, 0);
    const initialTime = Object.values(baseTimes).reduce((a, b) => a + b, 0);

    state = {
      date: today,
      completed: false,
      todayScore: 0,
      history: baseHistory,
      historyResponseTimes: baseTimes,
      historyTimestamps: baseTimestamps,
      competitionCycleStart: cycleStartDate,
      currentDayInCycle: dayNumber,
      sevenDayTotal: initialTotal,
      totalCumulativeResponseTime: initialTime,
      activeAttempt: null,
    };
    memoryStore.states.set(playerId, state);
  }

  // Check if calendar date rolled over to next day
  if (state.date !== today) {
    state.date = today;
    state.completed = false;
    state.todayScore = 0;
    state.currentDayInCycle = dayNumber;
    state.activeAttempt = null;

    // Recalculate 7-day total for current 7-day cycle window
    const total = Object.values(state.history).reduce((a, b) => a + b, 0);
    state.sevenDayTotal = total;
  }

  return state;
}

/**
 * Server Authoritative Check: Can player start Daily Challenge today?
 */
export function checkDailyChallengeEligibility(rawMsisdn: string): {
  eligible: boolean;
  reason?: string;
  state: DailyChallengeState;
} {
  const playerId = normalizeMsisdn(rawMsisdn);
  const today = getCurrentDateUTC();
  const state = getOrCreatePlayerState(playerId);

  const attemptKey = `${playerId}_${today}`;
  const existingAttempt = memoryStore.attempts.get(attemptKey);

  if (existingAttempt && existingAttempt.status === 'COMPLETED') {
    return {
      eligible: false,
      reason: 'TODAY_CHALLENGE_COMPLETED',
      state: {
        ...state,
        completed: true,
        todayScore: existingAttempt.totalScore,
      },
    };
  }

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
}

/**
 * Server Authoritative: Start or restore Daily Challenge Session
 */
export function startDailyChallengeSession(rawMsisdn: string): {
  success: boolean;
  attempt?: DailyChallengeAttempt;
  questions?: Question[];
  error?: string;
} {
  const playerId = normalizeMsisdn(rawMsisdn);
  const today = getCurrentDateUTC();
  const state = getOrCreatePlayerState(playerId);

  const attemptKey = `${playerId}_${today}`;
  let attempt = memoryStore.attempts.get(attemptKey);

  // If already completed today, DENY
  if (attempt && attempt.status === 'COMPLETED') {
    return {
      success: false,
      error: "Today's Daily Challenge has already been completed. Available tomorrow.",
    };
  }

  const questions = getDailyChallengeQuestionsForDate(today);

  // If session already in progress, restore it
  if (attempt && attempt.status === 'IN_PROGRESS') {
    state.activeAttempt = attempt;
    return {
      success: true,
      attempt,
      questions,
    };
  }

  // Create new authoritative session
  attempt = {
    attemptId: `att_${playerId}_${today}_${Date.now()}`,
    playerId,
    challengeId: `dc_${today}`,
    challengeDate: today,
    startedAt: new Date().toISOString(),
    status: 'IN_PROGRESS',
    totalScore: 0,
    totalResponseTime: 0,
    answers: [],
  };

  memoryStore.attempts.set(attemptKey, attempt);
  state.activeAttempt = attempt;

  return {
    success: true,
    attempt,
    questions,
  };
}

/**
 * Server Authoritative: Record Answer
 */
export function recordAuthoritativeAnswer(params: {
  rawMsisdn: string;
  attemptId: string;
  questionId: string;
  questionStartTimestamp: string;
  answerTimestamp: string;
  selectedOptionIndex: number | null;
}): {
  success: boolean;
  answer?: DailyChallengeAnswer;
  attempt?: DailyChallengeAttempt;
  error?: string;
} {
  const playerId = normalizeMsisdn(params.rawMsisdn);
  const today = getCurrentDateUTC();
  const attemptKey = `${playerId}_${today}`;
  const attempt = memoryStore.attempts.get(attemptKey);

  if (!attempt || attempt.attemptId !== params.attemptId || attempt.status !== 'IN_PROGRESS') {
    return { success: false, error: 'Invalid or completed attempt session.' };
  }

  // Find question in today's challenge questions
  const questions = getDailyChallengeQuestionsForDate(today);
  const question = questions.find((q) => q.id === params.questionId);
  if (!question) {
    return { success: false, error: 'Question not found in today\'s challenge pool.' };
  }

  // Calculate elapsed time strictly from timestamps with ms precision
  const startTime = Date.parse(params.questionStartTimestamp);
  const answerTime = Date.parse(params.answerTimestamp);
  const elapsedRaw = (answerTime - startTime) / 1000;
  const elapsedSeconds = Math.max(0, Math.min(10.0, isNaN(elapsedRaw) ? 10.0 : elapsedRaw));

  // Determine correctness
  const isCorrect =
    params.selectedOptionIndex !== null &&
    params.selectedOptionIndex === question.correctAnswerIndex;

  const { baseScore, speedScore, finalScore } = calculateQuestionScore(
    isCorrect,
    elapsedSeconds
  );

  const answerRecord: DailyChallengeAnswer = {
    answerId: `ans_${params.questionId}_${Date.now()}`,
    attemptId: attempt.attemptId,
    questionId: params.questionId,
    questionStartTimestamp: params.questionStartTimestamp,
    answerTimestamp: params.answerTimestamp,
    elapsedSeconds: parseFloat(elapsedSeconds.toFixed(3)),
    isCorrect,
    baseScore,
    speedScore,
    finalQuestionScore: finalScore,
    selectedOptionIndex: params.selectedOptionIndex,
  };

  attempt.answers.push(answerRecord);
  attempt.totalScore = attempt.answers.reduce((acc, a) => acc + a.finalQuestionScore, 0);
  attempt.totalResponseTime = parseFloat(
    attempt.answers.reduce((acc, a) => acc + a.elapsedSeconds, 0).toFixed(3)
  );

  return {
    success: true,
    answer: answerRecord,
    attempt,
  };
}

/**
 * Server Authoritative: Finalize Attempt
 */
export function completeAuthoritativeAttempt(params: {
  rawMsisdn: string;
  attemptId: string;
}): {
  success: boolean;
  state?: DailyChallengeState;
  attempt?: DailyChallengeAttempt;
  error?: string;
} {
  const playerId = normalizeMsisdn(params.rawMsisdn);
  const today = getCurrentDateUTC();
  const attemptKey = `${playerId}_${today}`;
  const attempt = memoryStore.attempts.get(attemptKey);

  if (!attempt || attempt.attemptId !== params.attemptId) {
    return { success: false, error: 'Attempt session not found.' };
  }

  const finalIso = new Date().toISOString();
  attempt.status = 'COMPLETED';
  attempt.completedAt = finalIso;
  attempt.finalSubmissionTimestamp = finalIso;

  const state = getOrCreatePlayerState(playerId);
  state.completed = true;
  state.todayScore = attempt.totalScore;
  state.history[today] = attempt.totalScore;

  if (!state.historyResponseTimes) state.historyResponseTimes = {};
  state.historyResponseTimes[today] = attempt.totalResponseTime;

  if (!state.historyTimestamps) state.historyTimestamps = {};
  state.historyTimestamps[today] = finalIso;

  state.sevenDayTotal = Object.values(state.history).reduce((a, b) => a + b, 0);
  state.totalCumulativeResponseTime = Object.values(state.historyResponseTimes).reduce(
    (a, b) => a + b,
    0
  );
  state.lastSubmissionTimestamp = finalIso;
  state.activeAttempt = null;

  return {
    success: true,
    state,
    attempt,
  };
}

/**
 * Deterministic Tie-Breaker Comparison Function
 * 1. Higher 7-Day Score
 * 2. Higher total Daily Challenge score (todayScore)
 * 3. Faster cumulative answer time (lower totalResponseTime)
 * 4. Earlier authoritative final submission timestamp
 * 5. Stable unique playerId/MSISDN
 */
export function compareLeaderboardEntries(
  a: EthioLeaderboardEntry,
  b: EthioLeaderboardEntry
): number {
  // 1. Higher 7-Day Score
  if (b.sevenDayScore !== a.sevenDayScore) {
    return b.sevenDayScore - a.sevenDayScore;
  }
  // 2. Higher single/today score
  const todayA = a.todayScore ?? 0;
  const todayB = b.todayScore ?? 0;
  if (todayB !== todayA) {
    return todayB - todayA;
  }
  // 3. Faster cumulative answer time (lower is better)
  const timeA = a.totalResponseTime ?? 9999;
  const timeB = b.totalResponseTime ?? 9999;
  if (Math.abs(timeA - timeB) > 0.001) {
    return timeA - timeB;
  }
  // 4. Earlier final submission timestamp
  const tsA = a.finalSubmissionTimestamp ?? '9999';
  const tsB = b.finalSubmissionTimestamp ?? '9999';
  if (tsA !== tsB) {
    return tsA.localeCompare(tsB);
  }
  // 5. Stable unique identifier
  return a.maskedMsisdn.localeCompare(b.maskedMsisdn);
}

/**
 * Get Ranked Top 10 Leaderboard + User Position
 * Masked MSISDN ONLY. NO names, NO full phone numbers.
 */
export function getAuthoritativeTop10Leaderboard(
  rawMsisdn: string
): {
  top10: EthioLeaderboardEntry[];
  userPosition: EthioLeaderboardEntry | null;
} {
  const currentMasked = maskMsisdn(rawMsisdn);
  const state = getOrCreatePlayerState(rawMsisdn);

  const currentUserEntry: EthioLeaderboardEntry = {
    rank: 0,
    maskedMsisdn: currentMasked,
    sevenDayScore: state.sevenDayTotal,
    todayScore: state.todayScore,
    totalResponseTime: state.totalCumulativeResponseTime,
    finalSubmissionTimestamp: state.lastSubmissionTimestamp,
    isCurrentUser: true,
    participationDays: Object.keys(state.history).length,
  };

  const pool: EthioLeaderboardEntry[] = [
    currentUserEntry,
    ...SEED_COMPETITION_PLAYERS.filter((p) => p.maskedMsisdn !== currentMasked).map((p) => ({
      rank: 0,
      maskedMsisdn: p.maskedMsisdn,
      sevenDayScore: p.sevenDayScore,
      totalResponseTime: p.totalResponseTime,
      finalSubmissionTimestamp: p.finalSubmissionTimestamp,
      isCurrentUser: false,
      participationDays: p.participationDays,
    })),
  ];

  pool.sort(compareLeaderboardEntries);

  const ranked: EthioLeaderboardEntry[] = pool.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const top10 = ranked.slice(0, 10);
  const userRanked = ranked.find((e) => e.isCurrentUser);

  let userPosition: EthioLeaderboardEntry | null = null;
  if (userRanked && userRanked.rank > 10) {
    userPosition = userRanked;
  }

  return { top10, userPosition };
}
