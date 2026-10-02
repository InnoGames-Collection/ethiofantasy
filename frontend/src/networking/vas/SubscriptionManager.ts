import type { SubscriptionTier } from '../supabase/types';
import { SaveManager } from '../../core/managers/SaveManager';

export class SubscriptionManager {
    private static _instance: SubscriptionManager | null = null;
    private _saveManager: SaveManager;
    private _currentTier: SubscriptionTier = 'free';

    private constructor(saveManager: SaveManager) {
        this._saveManager = saveManager;
        console.log(`[SubscriptionManager] Initialized with user profile ${this._saveManager.profile.username}`);
    }

    public static getInstance(saveManager?: SaveManager): SubscriptionManager {
        if (!SubscriptionManager._instance) {
            if (!saveManager) {
                throw new Error('[SubscriptionManager] SaveManager required for initialization.');
            }
            SubscriptionManager._instance = new SubscriptionManager(saveManager);
        }
        return SubscriptionManager._instance;
    }

    public get currentTier(): SubscriptionTier {
        return this._currentTier;
    }

    public setTier(tier: SubscriptionTier): void {
        this._currentTier = tier;
        console.log(`[SubscriptionManager] Updated subscription tier to: ${tier}`);
    }

    public isFeatureUnlocked(requiredTier: SubscriptionTier): boolean {
        const ranks: Record<SubscriptionTier, number> = {
            free: 1,
            basic: 2,
            premium: 3
        };

        return ranks[this._currentTier] >= ranks[requiredTier];
    }
}
