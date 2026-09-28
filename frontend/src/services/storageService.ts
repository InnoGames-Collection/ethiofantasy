import { UserProgress } from '../types/quiz';

const STORAGE_KEY = 'football_quiz_ethiofantasy_v2';

const DEFAULT_PROGRESS: UserProgress = {
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

export const loadUserProgress = (): UserProgress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      // Ensure Level 1 is always in unlockedLevelIds
      unlockedLevelIds: parsed.unlockedLevelIds && parsed.unlockedLevelIds.length > 0
        ? parsed.unlockedLevelIds
        : [1],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
};

export const saveUserProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress', e);
  }
};

export const resetUserProgress = (): UserProgress => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear progress', e);
  }
  return { ...DEFAULT_PROGRESS };
};
