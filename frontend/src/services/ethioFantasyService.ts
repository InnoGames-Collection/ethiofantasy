import {
  UserProfile,
  DailyChallengeState,
  EthioLeaderboardEntry,
  Question,
  DailyChallengeAttempt,
  QuestionResult,
} from '../types/quiz';

export interface StoredDailyReview {
  playerId: string;
  challengeDate: string; // YYYY-MM-DD
  results: QuestionResult[];
  levelScore: number;
  totalResponseTime: number;
  submittedAt: string;
}

export function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('0')) return '251' + digits.slice(1);
  if (digits.length === 9) return '251' + digits;
  return digits;
}

export function maskMsisdn(msisdn: string): string {
  const norm = normalizeMsisdn(msisdn);
  if (norm.length >= 12) {
    return `${norm.slice(0, 3)}*****${norm.slice(-3)}`;
  }
  return norm;
}

/**
 * Returns current calendar date in East Africa Time (EAT, UTC+3).
 */
export function getCurrentServiceDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Calculates competition cycle day information in EAT (Monday=1 .. Sunday=7).
 */
export function getCycleDayInfo(currentDateStr?: string): { dayNumber: number; daysRemaining: number } {
  const dateStr = currentDateStr || getCurrentServiceDate();
  const date = new Date(`${dateStr}T00:00:00+03:00`);
  const dayOfWeek = date.getUTCDay();
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
  return { dayNumber, daysRemaining: 7 - dayNumber };
}

export function calculateSpeedPoints(elapsedSeconds: number): number {
  const clamped = Math.max(0, Math.min(10.0, elapsedSeconds));
  return Math.max(0, Math.ceil(10.0 - clamped));
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

export function compareLeaderboardEntries(a: EthioLeaderboardEntry, b: EthioLeaderboardEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.totalResponseTime - b.totalResponseTime;
}

/**
 * Checks whether detailed Review is locked for a given Daily Challenge date in EAT.
 * Active challenges (today or future) are locked. Past challenges are unlocked.
 */
export function isDailyChallengeReviewLocked(challengeDate?: string): boolean {
  if (!challengeDate) return true;
  const today = getCurrentServiceDate();
  return challengeDate >= today;
}

/**
 * User Profile Management (In-Memory ONLY - No LocalStorage)
 */
export const DEFAULT_PROFILE: UserProfile = {
  msisdn: '',
  maskedMsisdn: '',
  isLoggedIn: false,
  isSubscribed: false,
  subscriptionDate: '',
  language: 'en',
  notificationsEnabled: true,
};

export function getDefaultUserProfile(): UserProfile {
  return { ...DEFAULT_PROFILE };
}

/**
 * Default Daily Challenge State in-memory
 */
export function getDefaultDailyChallengeState(): DailyChallengeState {
  const today = getCurrentServiceDate();
  const { dayNumber } = getCycleDayInfo(today);
  return {
    date: today,
    completed: false,
    todayScore: 0,
    history: {},
    historyResponseTimes: {},
    historyTimestamps: {},
    competitionCycleStart: today,
    currentDayInCycle: dayNumber,
    sevenDayTotal: 0,
    totalCumulativeResponseTime: 0,
    activeAttempt: null,
  };
}

/**
 * Asynchronously fetches authoritative Daily Challenge state directly from PostgreSQL
 */
export async function fetchDailyChallengeState(msisdn: string): Promise<DailyChallengeState> {
  const fallback = getDefaultDailyChallengeState();
  if (!msisdn) return fallback;

  try {
    const resp = await fetch(`/api/daily-challenge/status?msisdn=${encodeURIComponent(msisdn)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.state) {
        return data.state;
      }
    }
  } catch (err) {
    console.warn('[DailyChallenge state fetch failed]', err);
  }

  return fallback;
}

/**
 * Start or resume a Daily Challenge Session via PostgreSQL backend
 * Enforces exactly ONE attempt per calendar day in EAT
 */
export async function startDailyChallenge(msisdn: string): Promise<{
  success: boolean;
  attempt?: DailyChallengeAttempt;
  questions?: Question[];
  sessionId?: string;
  attemptId?: string;
  currentIndex?: number;
  currentScore?: number;
  sessionAnswers?: any[];
  error?: string;
}> {
  try {
    const resp = await fetch('/api/daily-challenge/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msisdn }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || "Unable to start Daily Challenge." };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: 'Network error communicating with server.' };
  }
}

/**
 * Submit an answer to the server-authoritative engine in PostgreSQL
 */
export async function submitDailyChallengeAnswer(params: {
  msisdn: string;
  sessionId?: string;
  attemptId?: string;
  questionId: string;
  selectedOptionIndex: number | null;
}): Promise<{
  success: boolean;
  isCorrect?: boolean;
  baseScore?: number;
  speedScore?: number;
  questionScore?: number;
  totalScore?: number;
  elapsedSeconds?: number;
  nextQuestionIndex?: number;
  isCompleted?: boolean;
  answers?: any[];
  error?: string;
}> {
  try {
    const resp = await fetch('/api/daily-challenge/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await resp.json();
    return data;
  } catch (err: any) {
    return { success: false, error: 'Network error submitting answer.' };
  }
}

/**
 * Complete Daily Challenge and save score to 7-Day total in PostgreSQL
 */
export async function completeDailyChallenge(params: {
  msisdn: string;
  attemptId: string;
}): Promise<{
  success: boolean;
  state?: DailyChallengeState;
  error?: string;
}> {
  try {
    const resp = await fetch('/api/daily-challenge/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await resp.json();
    return data;
  } catch (err: any) {
    return { success: false, error: 'Network error completing challenge.' };
  }
}

/**
 * Fetch Daily Challenge Review directly from PostgreSQL backend
 */
export async function fetchDailyChallengeReview(
  msisdn: string,
  date?: string
): Promise<{
  success: boolean;
  results: QuestionResult[];
  levelScore: number;
  totalResponseTime: number;
}> {
  if (!msisdn) {
    return { success: false, results: [], levelScore: 0, totalResponseTime: 0 };
  }

  try {
    const targetDate = date || getCurrentServiceDate();
    const resp = await fetch(`/api/daily-challenge/review?msisdn=${encodeURIComponent(msisdn)}&date=${encodeURIComponent(targetDate)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.success) {
        return {
          success: true,
          results: data.results || [],
          levelScore: data.levelScore || 0,
          totalResponseTime: data.totalResponseTime || 0,
        };
      }
    }
  } catch (err) {
    console.warn('[Review fetch failed]', err);
  }

  return { success: false, results: [], levelScore: 0, totalResponseTime: 0 };
}

/**
 * Fetch 7-Day Competition Leaderboard from Authoritative Fastify API Gateway
 * Masked MSISDN ONLY. 5-Tier Deterministic Tie-Breaker.
 */
export async function fetchTop10Leaderboard(
  currentUserMsisdn: string
): Promise<{ top10: EthioLeaderboardEntry[]; userPosition: EthioLeaderboardEntry | null }> {
  if (!currentUserMsisdn) {
    return { top10: [], userPosition: null };
  }
  try {
    const res = await fetch(`/api/leaderboard?msisdn=${encodeURIComponent(currentUserMsisdn)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.top10)) {
        return {
          top10: data.top10.map((entry: any) => {
            const finalScore = Number(entry.sevenDayScore ?? entry.score ?? 0);
            return {
              rank: entry.rank,
              maskedMsisdn: entry.maskedMsisdn,
              sevenDayScore: finalScore,
              score: finalScore,
              totalResponseTime: entry.totalResponseTime ?? 0,
              participationDays: entry.participationDays ?? 1,
              isCurrentUser: Boolean(entry.isCurrentUser),
            };
          }),
          userPosition: data.currentUserPosition ? {
            rank: data.currentUserPosition.rank,
            maskedMsisdn: data.currentUserPosition.maskedMsisdn,
            sevenDayScore: Number(data.currentUserPosition.sevenDayScore ?? data.currentUserPosition.score ?? 0),
            score: Number(data.currentUserPosition.sevenDayScore ?? data.currentUserPosition.score ?? 0),
            totalResponseTime: data.currentUserPosition.totalResponseTime ?? 0,
            participationDays: data.currentUserPosition.participationDays ?? 1,
            isCurrentUser: true,
          } : null,
        };
      }
    }
  } catch (err) {
    console.warn('[Leaderboard fetch failed]', err);
  }
  return { top10: [], userPosition: null };
}

/**
 * Initial synchronous resolver fallback for 7-Day Competition Leaderboard
 */
export function getTop10Leaderboard(
  _currentUserMsisdn: string,
  _ignoredScore?: number
): { top10: EthioLeaderboardEntry[]; userPosition: EthioLeaderboardEntry | null } {
  return { top10: [], userPosition: null };
}

/**
 * Get Daily Challenge Question Set
 * Strictly uses DAILY_CHALLENGE exclusive question pool
 */
export function getDailyChallengeQuestions(_dateStr: string): Question[] {
  return [];
}
