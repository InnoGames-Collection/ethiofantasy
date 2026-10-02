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

    // Defensive permanent progression: Level 1 always unlocked, deduplicate, filter valid 1..100
    const rawUnlocked: number[] = Array.isArray(parsed.unlockedLevelIds) ? parsed.unlockedLevelIds : [1];
    const unlockedLevelIds: number[] = Array.from<number>(
      new Set<number>([1, ...rawUnlocked.filter((id): id is number => typeof id === 'number' && id >= 1 && id <= 100)])
    ).sort((a, b) => a - b);

    const rawCompleted: number[] = Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [];
    const completedLevelIds: number[] = Array.from<number>(
      new Set<number>(rawCompleted.filter((id): id is number => typeof id === 'number' && id >= 1 && id <= 100))
    ).sort((a, b) => a - b);

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      hearts: 5, // Fresh 5 hearts for gameplay attempts
      unlockedLevelIds,
      completedLevelIds,
      levelStars: parsed.levelStars || {},
      levelScores: parsed.levelScores || {},
      levelPercentages: parsed.levelPercentages || {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
};

export const saveUserProgress = (progress: UserProgress): void => {
  try {
    // UNIVERSAL PROGRESSION RULE:
    // Once unlocked, a level remains unlocked permanently.
    // Progress cannot be decreased or relocked by replaying, failing, or any event.
    const existing = loadUserProgress();

    // 1. Unlocked levels can NEVER shrink or lose previously unlocked levels
    const mergedUnlocked: number[] = Array.from<number>(
      new Set<number>([1, ...(existing.unlockedLevelIds || []), ...(progress.unlockedLevelIds || [])])
    ).filter((id: number) => id >= 1 && id <= 100).sort((a, b) => a - b);

    // 2. Completed levels can NEVER shrink
    const mergedCompleted: number[] = Array.from<number>(
      new Set<number>([...(existing.completedLevelIds || []), ...(progress.completedLevelIds || [])])
    ).filter((id: number) => id >= 1 && id <= 100).sort((a, b) => a - b);

    // 3. Best scores per level: NEVER replace a better score with a worse score
    const mergedScores: Record<number, number> = { ...(existing.levelScores || {}) };
    for (const [lvl, score] of Object.entries(progress.levelScores || {})) {
      const lvlNum = Number(lvl);
      mergedScores[lvlNum] = Math.max(mergedScores[lvlNum] || 0, score);
    }

    // 4. Best stars per level: NEVER replace better stars with worse stars
    const mergedStars: Record<number, number> = { ...(existing.levelStars || {}) };
    for (const [lvl, stars] of Object.entries(progress.levelStars || {})) {
      const lvlNum = Number(lvl);
      mergedStars[lvlNum] = Math.max(mergedStars[lvlNum] || 0, stars);
    }

    // 5. Best percentage per level: NEVER replace higher accuracy with lower
    const mergedPercentages: Record<number, number> = { ...(existing.levelPercentages || {}) };
    for (const [lvl, pct] of Object.entries(progress.levelPercentages || {})) {
      const lvlNum = Number(lvl);
      mergedPercentages[lvlNum] = Math.max(mergedPercentages[lvlNum] || 0, pct);
    }

    // Total stars: sum of best stars across levels
    const totalStars = Object.values(mergedStars).reduce((a, b) => a + b, 0);

    // Total score: at least existing total score or sum of best scores
    const sumOfBestScores = Object.values(mergedScores).reduce((a, b) => a + b, 0);
    const totalScore = Math.max(existing.score || 0, progress.score || 0, sumOfBestScores);

    const safeProgress: UserProgress = {
      ...progress,
      score: totalScore,
      stars: Math.max(existing.stars || 0, progress.stars || 0, totalStars),
      hearts: 5,
      unlockedLevelIds: mergedUnlocked,
      completedLevelIds: mergedCompleted,
      levelStars: mergedStars,
      levelScores: mergedScores,
      levelPercentages: mergedPercentages,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeProgress));
  } catch (e) {
    console.error('Failed to save user progress', e);
  }
};

export const resetUserProgress = (): UserProgress => {
  // Production safe: preserves unlocked levels and returns current safe progress
  return loadUserProgress();
};
