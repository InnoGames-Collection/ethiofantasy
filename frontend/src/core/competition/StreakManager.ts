import { SaveManager } from '../managers/SaveManager';

export interface StreakClaimResult {
    success: boolean;
    streak: number;
    bonusCoins: number;
    isMilestone: boolean;
    message?: string;
}

export class StreakManager {
    private static _instance: StreakManager | null = null;
    private _saveManager: SaveManager;

    private constructor(saveManager: SaveManager) {
        this._saveManager = saveManager;
    }

    public static getInstance(saveManager?: SaveManager): StreakManager {
        if (!StreakManager._instance) {
            if (!saveManager) {
                throw new Error('[StreakManager] SaveManager required for initialization.');
            }
            StreakManager._instance = new StreakManager(saveManager);
        }
        return StreakManager._instance;
    }

    public async claimDailyStreak(): Promise<StreakClaimResult> {
        const currentStreak = (this._saveManager.profile.streakCount || 0) + 1;
        const bonusCoins = 50 + currentStreak * 10;
        this._saveManager.addCoins(bonusCoins);
        this._saveManager.updateStreak(currentStreak);

        return {
            success: true,
            streak: currentStreak,
            bonusCoins,
            isMilestone: currentStreak % 7 === 0
        };
    }

    public get currentStreak(): number {
        return this._saveManager.profile.streakCount || 0;
    }
}
