import { ApiClient } from '../api/ApiClient';
import type { UserRow, UserUpdate, UserPreferenceRow } from '../supabase/types';

export class ProfileService {
    private static _instance: ProfileService | null = null;
    private _profileCache: UserRow | null = null;
    private _apiClient: ApiClient;

    private constructor() {
        this._apiClient = ApiClient.getInstance();
    }

    public static getInstance(): ProfileService {
        if (!ProfileService._instance) {
            ProfileService._instance = new ProfileService();
        }
        return ProfileService._instance;
    }

    public async getProfile(): Promise<UserRow | null> {
        try {
            const res = await this._apiClient.get('/player/me');
            if (res && res.player) {
                const p = res.player;
                const row: UserRow = {
                    id: p.id,
                    username: p.username,
                    phone: p.msisdn,
                    avatar_url: p.avatarUrl,
                    locale: p.locale || 'en',
                    elo_rating: p.eloRating || 1200,
                    coins: p.coins || 0,
                    xp: p.xp || 0,
                    total_matches: p.totalMatches || 0,
                    total_wins: p.totalWins || 0,
                    subscription_tier: p.subscriptionTier || 'free',
                    streak_count: p.streakCount || 0,
                    streak_last_date: null,
                    role: 'player',
                    referral_code: null,
                    referred_by: null,
                    created_at: new Date().toISOString(),
                    last_active: new Date().toISOString()
                };
                this._profileCache = row;
                return row;
            }
        } catch (err) {
            console.warn('[ProfileService] Failed to get profile:', err);
        }
        return this._profileCache;
    }
    
    public async updateProfile(updates: UserUpdate): Promise<void> {
        try {
            await this._apiClient.put('/player/profile', {
                username: updates.username,
                locale: updates.locale,
                avatarUrl: updates.avatar_url
            });
        } catch (err) {
            console.warn('[ProfileService] Error updating profile:', err);
        }
    }

    public async getPreferences(): Promise<UserPreferenceRow | null> {
        try {
            const raw = localStorage.getItem('ETHIO_FOOTBALL_PREFERENCES');
            if (raw) return JSON.parse(raw);
        } catch {}
        return {
            user_id: 'current_user',
            locale: 'en',
            sound_enabled: true,
            vibration_enabled: true,
            dark_mode: true,
            notif_daily: true,
            notif_tournament: true,
            notif_rewards: true,
            notif_announcements: true,
            notif_subscription: true,
            notif_system: true,
            updated_at: new Date().toISOString()
        };
    }

    public async updatePreferences(prefs: Partial<UserPreferenceRow>): Promise<void> {
        try {
            const current = (await this.getPreferences()) || ({} as UserPreferenceRow);
            const updated = { ...current, ...prefs, updated_at: new Date().toISOString() };
            localStorage.setItem('ETHIO_FOOTBALL_PREFERENCES', JSON.stringify(updated));
        } catch (err) {
            console.warn('[ProfileService] Error updating preferences:', err);
        }
    }
    
    public subscribeToProfile(_userId: string, _callback: (profile: UserRow) => void): () => void {
        return () => {};
    }
}
