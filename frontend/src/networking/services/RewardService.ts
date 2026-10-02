import type { RewardRow } from '../supabase/types';

export class RewardService {
    private static _instance: RewardService | null = null;
    private _rewards: RewardRow[] = [
        {
            id: 'rw-1',
            user_id: 'default',
            type: 'daily',
            description_en: 'Daily Kickoff Reward',
            description_am: 'የዕለቱ የመክፈቻ ሽልማት',
            description_om: 'Badhaasa Jalqaba Guyyaa',
            coins: 100,
            xp: 50,
            claimed: false,
            claimed_at: null,
            expires_at: null,
            created_at: new Date().toISOString()
        }
    ];

    private constructor() {}

    public static getInstance(): RewardService {
        if (!RewardService._instance) {
            RewardService._instance = new RewardService();
        }
        return RewardService._instance;
    }

    public async getRewards(): Promise<RewardRow[]> {
        return [...this._rewards];
    }

    public async getUnclaimedCount(): Promise<number> {
        return this._rewards.filter(r => !r.claimed).length;
    }

    public async claimReward(id: string): Promise<RewardRow | null> {
        const r = this._rewards.find(rw => rw.id === id);
        if (r && !r.claimed) {
            r.claimed = true;
            r.claimed_at = new Date().toISOString();
            return r;
        }
        return null;
    }

    public subscribeToRewards(_userId: string, _callback: (reward: RewardRow) => void): () => void {
        return () => {};
    }
}
