import { ApiClient } from '../api/ApiClient';
import type { SubscriptionTier } from '../supabase/types';
import { SubscriptionManager } from './SubscriptionManager';

export interface VASSessionResult {
    success: boolean;
    msisdn?: string;
    tier?: SubscriptionTier;
    expiresAt?: string;
    message?: string;
}

export type SubscriptionChangeListener = (tier: SubscriptionTier) => void;

export class VASService {
    private static _instance: VASService | null = null;
    private _listeners: Set<SubscriptionChangeListener> = new Set();
    private _apiClient: ApiClient;
    private _shortcode: string = '9401';

    private constructor() {
        this._apiClient = ApiClient.getInstance();

        // Listen for window focus to re-check subscription when returning from SMS app
        if (typeof window !== 'undefined') {
            window.addEventListener('focus', () => {
                this.checkActiveSubscription().catch(console.warn);
            });
        }
    }

    public static getInstance(): VASService {
        if (!VASService._instance) {
            VASService._instance = new VASService();
        }
        return VASService._instance;
    }

    public subscribeToUserSubscription(_userId: string, onUpdate: SubscriptionChangeListener): () => void {
        this._listeners.add(onUpdate);
        return () => this._listeners.delete(onUpdate);
    }

    /**
     * Queries Fastify backend /api/player/me to check active subscription in PostgreSQL
     */
    public async checkActiveSubscription(): Promise<boolean> {
        try {
            const res = await this._apiClient.get('/player/me');
            if (res && res.success && res.player) {
                const isSub = Boolean(res.player.isSubscribed);
                const tier: SubscriptionTier = isSub ? 'basic' : 'free';
                SubscriptionManager.getInstance().setTier(tier);
                this._notifyListeners(tier);
                return isSub;
            }
        } catch (err) {
            console.warn('[VASService] Failed to check active subscription:', err);
        }
        return false;
    }

    public async verifySubscription(msisdn: string): Promise<VASSessionResult> {
        const isSub = await this.checkActiveSubscription();
        if (isSub) {
            return {
                success: true,
                msisdn,
                tier: 'basic',
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
                message: 'Ethio Telecom VAS Subscription Active'
            };
        }

        return {
            success: false,
            message: 'No active Ethio Telecom VAS subscription found for this number.'
        };
    }

    public async requestSubscription(msisdn: string, _tier: SubscriptionTier): Promise<{ success: boolean; smsUri: string; message: string }> {
        const smsUri = `sms:${this._shortcode}?body=OK`;
        return {
            success: true,
            smsUri,
            message: `Send OK to ${this._shortcode} from your Ethio Telecom phone to activate 2 Birr/day access.`
        };
    }

    private _notifyListeners(tier: SubscriptionTier): void {
        this._listeners.forEach(l => l(tier));
    }
}
