import type { UserRow } from '../../networking/supabase/types';
import { ApiClient } from '../../networking/api/ApiClient';

export interface UserProfile {
    username: string;
    coins: number;
    xp: number;
    highScores: Record<string, number>;
    unlockedItems: string[];
    phone?: string;
    eloRating?: number;
    streakCount?: number;
    role?: 'admin' | 'player';
    totalMatches?: number;
    totalWins?: number;
}

export class SaveManager {
    private _profile: UserProfile;
    private _cloudUserId: string | null = null;
    private _apiClient: ApiClient;

    constructor() {
        this._profile = this._defaultProfile();
        this._apiClient = ApiClient.getInstance();
    }

    public get cloudUserId(): string | null {
        return this._cloudUserId;
    }

    private _defaultProfile(): UserProfile {
        return {
            username: 'Ethio Fan',
            coins: 50,
            xp: 0,
            highScores: { 'football-quiz': 0 },
            unlockedItems: ['default-ball', 'default-jersey'],
            eloRating: 1200,
            streakCount: 0,
            totalMatches: 0,
            totalWins: 0
        };
    }

    public syncWithCloudUser(user: UserRow): void {
        this._cloudUserId = user.id;
        this._profile.username = user.username;
        this._profile.coins = user.coins;
        this._profile.xp = user.xp;
        this._profile.eloRating = user.elo_rating;
        this._profile.streakCount = user.streak_count;
        this._profile.totalMatches = user.total_matches;
        this._profile.totalWins = user.total_wins;
        if (user.phone) {
            this._profile.phone = user.phone;
        }
        this.save();
    }

    public save(): void {
        if (this._cloudUserId && this._apiClient.getToken()) {
            this._apiClient.put('/player/profile', {
                username: this._profile.username
            }).catch(err => {
                console.warn('[SaveManager] Non-critical profile sync warning:', err.message);
            });
        }
    }

    public get profile(): UserProfile {
        return this._profile;
    }

    public updateUsername(name: string): void {
        this._profile.username = name;
        this.save();
    }

    public updateHighScore(gameId: string, score: number): boolean {
        const currentHigh = this._profile.highScores[gameId] || 0;
        if (score > currentHigh) {
            this._profile.highScores[gameId] = score;
            this._profile.xp += Math.floor(score * 0.5);
            this.save();
            return true;
        }
        return false;
    }

    public addCoins(amount: number): void {
        this._profile.coins += amount;
        this.save();
    }

    public addXp(amount: number): void {
        this._profile.xp += amount;
        this.save();
    }

    public incrementMatchStats(won: boolean): void {
        this._profile.totalMatches = (this._profile.totalMatches || 0) + 1;
        if (won) {
            this._profile.totalWins = (this._profile.totalWins || 0) + 1;
        }
        this.save();
    }

    public updateStreak(count: number): void {
        this._profile.streakCount = count;
        this.save();
    }

    public isAdmin(): boolean {
        return this._profile.role === 'admin';
    }
}
