import { ApiClient } from '../../networking/api/ApiClient';
import type { UserRow, Locale, SubscriptionTier } from '../../networking/supabase/types';
import { SaveManager } from '../managers/SaveManager';

export type AuthStateListener = (user: UserRow | null) => void;

/**
 * Manages user authentication state (Phone OTP via Ethio Telecom Shortcode 9401),
 * session persistence (JWT Bearer via Fastify 5 API), and synchronization with SaveManager.
 */
export class AuthManager {
    private static _instance: AuthManager | null = null;
    private _currentUser: UserRow | null = null;
    private _listeners: Set<AuthStateListener> = new Set();
    private _saveManager: SaveManager;
    private _apiClient: ApiClient;
    private _devOtpCode: string = '';

    private constructor(saveManager: SaveManager) {
        this._saveManager = saveManager;
        this._apiClient = ApiClient.getInstance();

        // Listen for token expiry or 401s from ApiClient
        this._apiClient.onAuthError(() => {
            this._currentUser = null;
            this._notifyListeners();
        });

        this._initSession();
    }

    public static normalisePhone(raw: string): string {
        const digits = raw.replace(/\D/g, '');
        if (digits.startsWith('251')) return digits;
        if (digits.startsWith('0')) return '251' + digits.slice(1);
        if (digits.startsWith('+')) return digits.slice(1);
        return '251' + digits;
    }

    public static getInstance(saveManager?: SaveManager): AuthManager {
        if (!AuthManager._instance) {
            if (!saveManager) {
                throw new Error('[AuthManager] SaveManager required for initial instantiation.');
            }
            AuthManager._instance = new AuthManager(saveManager);
        }
        return AuthManager._instance;
    }

    private async _initSession(): Promise<void> {
        const token = this._apiClient.getToken();
        if (!token) {
            console.log('[AuthManager] No stored JWT token found.');
            this._currentUser = null;
            this._notifyListeners();
            return;
        }

        try {
            console.log('[AuthManager] Restoring session from stored JWT...');
            await this.refreshProfile();
        } catch (err) {
            console.warn('[AuthManager] Failed to restore session from token:', err);
            this._currentUser = null;
            this._apiClient.clearToken();
            this._notifyListeners();
        }
    }

    public async refreshProfile(): Promise<void> {
        try {
            const res = await this._apiClient.get('/player/me');
            if (res && res.success && res.player) {
                const p = res.player;
                const userRow: UserRow = {
                    id: p.id,
                    username: p.username || `Fan_${p.msisdn?.slice(-4) || '2026'}`,
                    phone: p.msisdn || null,
                    avatar_url: p.avatarUrl || null,
                    locale: (p.locale as Locale) || 'en',
                    elo_rating: p.eloRating || 1200,
                    coins: p.coins || 0,
                    xp: p.xp || 0,
                    total_matches: p.totalMatches || 0,
                    total_wins: p.totalWins || 0,
                    subscription_tier: (p.subscriptionTier as SubscriptionTier) || (p.isSubscribed ? 'basic' : 'free'),
                    streak_count: p.streakCount || 0,
                    streak_last_date: null,
                    role: 'player',
                    referral_code: null,
                    referred_by: null,
                    created_at: new Date().toISOString(),
                    last_active: new Date().toISOString()
                };

                this._currentUser = userRow;
                this._saveManager.syncWithCloudUser(userRow);
                this._notifyListeners();
            }
        } catch (err) {
            console.warn('[AuthManager] refreshProfile error:', err);
            throw err;
        }
    }

    public async signInWithPhone(phoneNumber: string): Promise<{ success: boolean; error?: string; demoOtp?: string }> {
        const norm = AuthManager.normalisePhone(phoneNumber);
        try {
            const res = await this._apiClient.post('/auth/request-otp', { phoneNumber: norm });
            if (res && res.success) {
                if (res.demoOtp) {
                    this._devOtpCode = res.demoOtp;
                }
                return { success: true, demoOtp: res.demoOtp };
            }
            return { success: false, error: res?.error || 'Failed to send OTP' };
        } catch (err: any) {
            return { success: false, error: err.message || 'Network error requesting OTP' };
        }
    }

    public async verifyOtp(phoneNumber: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
        const norm = AuthManager.normalisePhone(phoneNumber);
        try {
            const res = await this._apiClient.post('/auth/verify-otp', {
                phoneNumber: norm,
                otpCode: otpCode.trim()
            });

            if (res && res.success && res.token) {
                this._apiClient.setToken(res.token);

                const p = res.profile;
                const userRow: UserRow = {
                    id: p.id || `pl_${norm}`,
                    username: p.username || `Fan_${norm.slice(-4)}`,
                    phone: norm,
                    avatar_url: p.avatarUrl || null,
                    locale: (p.locale as Locale) || 'en',
                    elo_rating: p.eloRating || 1200,
                    coins: p.coins || 50,
                    xp: p.xp || 0,
                    total_matches: p.totalMatches || 0,
                    total_wins: p.totalWins || 0,
                    subscription_tier: p.isSubscribed ? 'basic' : 'free',
                    streak_count: p.streakCount || 0,
                    streak_last_date: null,
                    role: 'player',
                    referral_code: null,
                    referred_by: null,
                    created_at: new Date().toISOString(),
                    last_active: new Date().toISOString()
                };

                this._currentUser = userRow;
                this._saveManager.syncWithCloudUser(userRow);
                this._notifyListeners();
                return { success: true };
            }

            return { success: false, error: res?.error || 'Invalid OTP code' };
        } catch (err: any) {
            return { success: false, error: err.message || 'OTP verification failed' };
        }
    }

    public async signOut(): Promise<void> {
        this._apiClient.clearToken();
        this._currentUser = null;
        this._notifyListeners();
    }

    public subscribe(listener: AuthStateListener): () => void {
        this._listeners.add(listener);
        listener(this._currentUser);
        return () => this._listeners.delete(listener);
    }

    private _notifyListeners(): void {
        this._listeners.forEach(listener => listener(this._currentUser));
    }

    public get currentUser(): UserRow | null {
        return this._currentUser;
    }

    public get isGuest(): boolean {
        return false;
    }

    public get isAuthenticated(): boolean {
        return this._currentUser !== null;
    }

    public get devOtpCode(): string {
        return this._devOtpCode;
    }
}
