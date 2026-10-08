import { UserProgress, Question } from '../types/quiz';

export const DEFAULT_PROGRESS: UserProgress = {
  score: 0,
  stars: 0,
  hearts: 5,
  unlockedLevelIds: [1], // ONLY Level 1 unlocked initially! Levels 2-100 locked
  completedLevelIds: [],
  levelStars: {},
  levelScores: {},
  levelPercentages: {},
  soundEnabled: true,
  musicEnabled: true,
};

/**
 * Returns default initial progression state in-memory (No LocalStorage)
 */
export const getDefaultUserProgress = (): UserProgress => {
  return { ...DEFAULT_PROGRESS };
};

/**
 * Loads authoritative user progression directly from PostgreSQL via API
 */
export async function fetchUserProgressFromDb(msisdn?: string): Promise<UserProgress> {
  if (!msisdn) {
    return { ...DEFAULT_PROGRESS };
  }

  try {
    const res = await fetch(`/api/quiz/progress?msisdn=${encodeURIComponent(msisdn)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.progress) {
        return {
          ...DEFAULT_PROGRESS,
          ...data.progress,
          hearts: 5,
        };
      }
    }
  } catch (err) {
    console.warn('[StorageService] Error fetching user progress from database:', err);
  }

  return { ...DEFAULT_PROGRESS };
}

/**
 * Submits level completion directly to PostgreSQL via API and returns updated UserProgress
 */
export async function submitLevelProgressToDb(params: {
  msisdn: string;
  levelId: number;
  stars: number;
  score: number;
  percentage?: number;
}): Promise<UserProgress> {
  try {
    const res = await fetch('/api/quiz/submit-level', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.progress) {
        return {
          ...DEFAULT_PROGRESS,
          ...data.progress,
          hearts: 5,
        };
      }
    }
  } catch (err) {
    console.error('[StorageService] Failed to submit level progress to database:', err);
  }

  return fetchUserProgressFromDb(params.msisdn);
}

/**
 * Fetches 10 randomized questions for a given level directly from PostgreSQL
 */
export async function fetchLevelQuestionsFromDb(levelId: number): Promise<Question[]> {
  try {
    const res = await fetch(`/api/quiz/level/${levelId}/questions`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch (err) {
    console.warn('[StorageService] Failed to fetch level questions from DB:', err);
  }

  return [];
}
