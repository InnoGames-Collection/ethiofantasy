import {
  UserProfile,
  DailyChallengeState,
  EthioLeaderboardEntry,
  Question,
  DailyChallengeAttempt,
  DailyChallengeAnswer,
  QuestionResult,
} from '../types/quiz';
import { getDailyChallengeQuestionsForDate } from '../data/dailyChallengeData';

const USER_PROFILE_KEY = 'ethiofantasy_user_profile_v1';
const DAILY_CHALLENGE_PREFIX = 'ethiofantasy_daily_challenge_v2_';
const DAILY_REVIEW_PREFIX = 'ethiofantasy_daily_review_v2_';

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
 * Save user answers and results for a completed Daily Challenge session
 */
export function saveDailyChallengeReview(
  rawMsisdn: string,
  challengeDate: string,
  results: QuestionResult[],
  levelScore: number,
  totalResponseTime: number = 0
): void {
  try {
    const playerId = normalizeMsisdn(rawMsisdn);
    const key = `${DAILY_REVIEW_PREFIX}${playerId}_${challengeDate}`;
    const payload: StoredDailyReview = {
      playerId,
      challengeDate,
      results,
      levelScore,
      totalResponseTime,
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save daily challenge review', e);
  }
}

/**
 * Retrieve saved Daily Challenge review by player and date
 */
export function getDailyChallengeReview(
  rawMsisdn: string,
  challengeDate: string
): StoredDailyReview | null {
  try {
    const playerId = normalizeMsisdn(rawMsisdn);
    const key = `${DAILY_REVIEW_PREFIX}${playerId}_${challengeDate}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * User Profile Management (Default is strictly logged out for Tier-0 security)
 */
const DEFAULT_PROFILE: UserProfile = {
  msisdn: '',
  maskedMsisdn: '',
  isLoggedIn: false,
  isSubscribed: false,
  subscriptionDate: '',
  language: 'en',
  notificationsEnabled: true,
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.msisdn || !parsed.isLoggedIn) {
      return DEFAULT_PROFILE;
    }
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      maskedMsisdn: maskMsisdn(parsed.msisdn),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    const withMask = {
      ...profile,
      maskedMsisdn: profile.msisdn ? maskMsisdn(profile.msisdn) : '',
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(withMask));
  } catch (e) {
    console.error('Error saving EthioFantasy profile', e);
  }
}

/**
 * Load authoritative Daily Challenge state for the player from cache or local store
 */
export function loadDailyChallengeState(msisdn: string): DailyChallengeState {
  const today = getCurrentServiceDate();
  const { dayNumber } = getCycleDayInfo(today);
  const defaultState: DailyChallengeState = {
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

  if (!msisdn) return defaultState;

  const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(msisdn)}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const state = JSON.parse(raw);
      if (state.date !== today) {
        state.date = today;
        state.completed = false;
        state.todayScore = 0;
        state.currentDayInCycle = dayNumber;
        state.activeAttempt = null;
      }
      return state;
    }
  } catch {}

  return defaultState;
}

/**
 * Records daily challenge score locally and synchronizes state
 */
export function recordDailyChallengeScore(
  msisdn: string,
  pointsEarned: number,
  responseTime: number = 0
): DailyChallengeState {
  const currentState = loadDailyChallengeState(msisdn);
  const today = getCurrentServiceDate();
  const { dayNumber } = getCycleDayInfo(today);

  const updatedHistory = { ...currentState.history, [today]: pointsEarned };
  const updatedResponseTimes = { ...currentState.historyResponseTimes, [today]: responseTime };
  const updatedTimestamps = { ...currentState.historyTimestamps, [today]: new Date().toISOString() };

  const sevenDayTotal = Object.values(updatedHistory).reduce((sum, score) => sum + (Number(score) || 0), 0);
  const totalCumulativeResponseTime = Object.values(updatedResponseTimes).reduce((sum, time) => sum + (Number(time) || 0), 0);

  const newState: DailyChallengeState = {
    ...currentState,
    date: today,
    completed: true,
    todayScore: pointsEarned,
    history: updatedHistory,
    historyResponseTimes: updatedResponseTimes,
    historyTimestamps: updatedTimestamps,
    currentDayInCycle: dayNumber,
    sevenDayTotal,
    totalCumulativeResponseTime,
    activeAttempt: null,
  };

  if (msisdn) {
    const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(msisdn)}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch {}

    if (currentState.activeAttempt?.attemptId) {
      completeDailyChallenge({
        msisdn,
        attemptId: currentState.activeAttempt.attemptId,
      }).catch(err => console.warn('[completeDailyChallenge background sync error]', err));
    }
  }

  return newState;
}

/**
 * Asynchronously fetches authoritative Daily Challenge state directly from PostgreSQL
 */
export async function fetchDailyChallengeState(msisdn: string): Promise<DailyChallengeState> {
  const today = getCurrentServiceDate();
  const { dayNumber } = getCycleDayInfo(today);
  const fallback = loadDailyChallengeState(msisdn);

  if (!msisdn) return fallback;

  try {
    const resp = await fetch(`/api/daily-challenge/status?msisdn=${encodeURIComponent(msisdn)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.state) {
        const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(msisdn)}`;
        localStorage.setItem(storageKey, JSON.stringify(data.state));
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
 * Submit an answer to the server-authoritative engine
 */
export async function submitDailyChallengeAnswer(params: {
  msisdn: string;
  sessionId?: string;
  attemptId?: string;
  questionId: string;
  questionStartTimestamp?: string;
  answerTimestamp?: string;
  selectedOptionIndex: number | null;
  selectedIndex?: number | null;
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
 * Complete Daily Challenge and save score to 7-Day total
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
    if (data.state) {
      const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(params.msisdn)}`;
      localStorage.setItem(storageKey, JSON.stringify(data.state));
    }
    return data;
  } catch (err: any) {
    return { success: false, error: 'Network error completing challenge.' };
  }
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
export function getDailyChallengeQuestions(dateStr: string): Question[] {
  return getDailyChallengeQuestionsForDate(dateStr);
}
