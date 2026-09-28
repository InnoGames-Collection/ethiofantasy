import {
  UserProfile,
  DailyChallengeState,
  EthioLeaderboardEntry,
  Question,
  DailyChallengeAttempt,
  DailyChallengeAnswer,
} from '../types/quiz';
import { getDailyChallengeQuestionsForDate } from '../data/dailyChallengeData';
import {
  calculateQuestionScore,
  calculateSpeedPoints,
  compareLeaderboardEntries,
  getCompetitionCycleInfo,
  getAuthoritativeTop10Leaderboard,
  checkDailyChallengeEligibility,
  startDailyChallengeSession as engineStartSession,
  recordAuthoritativeAnswer as engineRecordAnswer,
  completeAuthoritativeAttempt as engineCompleteAttempt,
  getCurrentDateUTC,
  normalizeMsisdn as engineNormalize,
  maskMsisdn as engineMask,
} from './authoritativeChallengeEngine';

const USER_PROFILE_KEY = 'ethiofantasy_user_profile_v1';
const DAILY_CHALLENGE_PREFIX = 'ethiofantasy_daily_challenge_v2_';

export {
  calculateQuestionScore,
  calculateSpeedPoints,
  compareLeaderboardEntries,
};

export function normalizeMsisdn(input: string): string {
  return engineNormalize(input);
}

export function maskMsisdn(msisdn: string): string {
  return engineMask(msisdn);
}

export function getCurrentServiceDate(): string {
  return getCurrentDateUTC();
}

export function getCycleDayInfo(currentDateStr: string): { dayNumber: number; daysRemaining: number } {
  const info = getCompetitionCycleInfo(currentDateStr);
  return { dayNumber: info.dayNumber, daysRemaining: info.daysRemaining };
}

/**
 * User Profile Management
 */
const DEFAULT_PROFILE: UserProfile = {
  msisdn: '251965112122',
  maskedMsisdn: '251*******22',
  isLoggedIn: true,
  isSubscribed: true,
  subscriptionDate: '2026-09-20',
  language: 'en',
  notificationsEnabled: true,
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      maskedMsisdn: maskMsisdn(parsed.msisdn || DEFAULT_PROFILE.msisdn),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    const withMask = {
      ...profile,
      maskedMsisdn: maskMsisdn(profile.msisdn),
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(withMask));
  } catch (e) {
    console.error('Error saving EthioFantasy profile', e);
  }
}

/**
 * Load authoritative Daily Challenge state for the player
 */
export function loadDailyChallengeState(msisdn: string): DailyChallengeState {
  const today = getCurrentServiceDate();
  const { dayNumber, daysRemaining } = getCycleDayInfo(today);
  const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(msisdn)}`;

  try {
    const raw = localStorage.getItem(storageKey);
    let state: DailyChallengeState;

    if (raw) {
      state = JSON.parse(raw);
    } else {
      // Use authoritative engine to generate seed state
      const seed = checkDailyChallengeEligibility(msisdn).state;
      state = seed;
    }

    // Check if day rolled over
    if (state.date !== today) {
      state.date = today;
      state.completed = false;
      state.todayScore = 0;
      state.currentDayInCycle = dayNumber;
      state.activeAttempt = null;
    }

    // Recalculate 7-day total strictly from Daily Challenge history
    const total = Object.values(state.history).reduce((acc, curr) => acc + curr, 0);
    state.sevenDayTotal = total;

    return state;
  } catch {
    return checkDailyChallengeEligibility(msisdn).state;
  }
}

/**
 * Start or resume a Daily Challenge Session
 * Enforces exactly ONE attempt per calendar day
 */
export async function startDailyChallenge(msisdn: string): Promise<{
  success: boolean;
  attempt?: DailyChallengeAttempt;
  questions?: Question[];
  error?: string;
}> {
  // Attempt to call authoritative server endpoint
  try {
    const resp = await fetch('/api/daily-challenge/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msisdn }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data;
    } else if (resp.status === 403) {
      const data = await resp.json();
      return { success: false, error: data.error || "Today's Daily Challenge already completed." };
    }
  } catch {
    // Fallback to local authoritative engine if server is unreachable
  }

  // Local authoritative engine enforcement
  const result = engineStartSession(msisdn);
  if (result.success && result.attempt) {
    // Persist in localStorage as well
    const state = loadDailyChallengeState(msisdn);
    state.activeAttempt = result.attempt;
    const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(msisdn)}`;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }
  return result;
}

/**
 * Submit an answer to the server-authoritative engine
 */
export async function submitDailyChallengeAnswer(params: {
  msisdn: string;
  attemptId: string;
  questionId: string;
  questionStartTimestamp: string;
  answerTimestamp: string;
  selectedOptionIndex: number | null;
}): Promise<{
  success: boolean;
  answer?: DailyChallengeAnswer;
  attempt?: DailyChallengeAttempt;
  error?: string;
}> {
  try {
    const resp = await fetch('/api/daily-challenge/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch {
    // Fallback to local authoritative engine
  }

  return engineRecordAnswer({
    rawMsisdn: params.msisdn,
    attemptId: params.attemptId,
    questionId: params.questionId,
    questionStartTimestamp: params.questionStartTimestamp,
    answerTimestamp: params.answerTimestamp,
    selectedOptionIndex: params.selectedOptionIndex,
  });
}

/**
 * Complete Daily Challenge and save score to 7-Day total
 */
export async function completeDailyChallenge(params: {
  msisdn: string;
  attemptId: string;
}): Promise<{
  success: boolean;
  state: DailyChallengeState;
}> {
  let finalState: DailyChallengeState | undefined;

  try {
    const resp = await fetch('/api/daily-challenge/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (resp.ok) {
      const data = await resp.json();
      finalState = data.state;
    }
  } catch {
    // Fallback to local authoritative engine
  }

  if (!finalState) {
    const res = engineCompleteAttempt({
      rawMsisdn: params.msisdn,
      attemptId: params.attemptId,
    });
    finalState = res.state || loadDailyChallengeState(params.msisdn);
  }

  // Persist locally
  const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(params.msisdn)}`;
  localStorage.setItem(storageKey, JSON.stringify(finalState));

  return { success: true, state: finalState };
}

/**
 * Legacy wrapper for backward compatibility
 */
export function recordDailyChallengeScore(
  msisdn: string,
  score: number,
  totalResponseTime: number = 45.0
): DailyChallengeState {
  const today = getCurrentServiceDate();
  const current = loadDailyChallengeState(msisdn);

  const updatedHistory = {
    ...current.history,
    [today]: score,
  };

  const updatedTimes = {
    ...(current.historyResponseTimes || {}),
    [today]: totalResponseTime,
  };

  const isoNow = new Date().toISOString();
  const updatedTimestamps = {
    ...(current.historyTimestamps || {}),
    [today]: isoNow,
  };

  const total = Object.values(updatedHistory).reduce((acc, curr) => acc + curr, 0);
  const totalTime = Object.values(updatedTimes).reduce((acc, curr) => acc + curr, 0);

  const updated: DailyChallengeState = {
    ...current,
    date: today,
    completed: true,
    todayScore: score,
    history: updatedHistory,
    historyResponseTimes: updatedTimes,
    historyTimestamps: updatedTimestamps,
    sevenDayTotal: total,
    totalCumulativeResponseTime: totalTime,
    lastSubmissionTimestamp: isoNow,
    activeAttempt: null,
  };

  try {
    const storageKey = `${DAILY_CHALLENGE_PREFIX}${normalizeMsisdn(msisdn)}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving daily challenge', e);
  }

  return updated;
}

/**
 * Get 7-Day Competition Leaderboard
 * Masked MSISDN ONLY. 5-Tier Deterministic Tie-Breaker.
 */
export function getTop10Leaderboard(
  currentUserMsisdn: string,
  _ignoredScore?: number
): { top10: EthioLeaderboardEntry[]; userPosition: EthioLeaderboardEntry | null } {
  return getAuthoritativeTop10Leaderboard(currentUserMsisdn);
}

/**
 * Get Daily Challenge Question Set
 * Strictly uses DAILY_CHALLENGE exclusive question pool (NEVER Level Game questions)
 */
export function getDailyChallengeQuestions(dateStr: string): Question[] {
  return getDailyChallengeQuestionsForDate(dateStr);
}
