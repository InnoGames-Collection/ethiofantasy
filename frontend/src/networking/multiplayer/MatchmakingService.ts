import type { UserRow } from '../supabase/types';
import { QuestionBank } from '../../core/quiz/QuestionBank';

export interface OpponentMatchInfo {
    liveMatchId: string;
    opponent: UserRow;
    questionIds: string[];
}

export type MatchFoundListener = (info: OpponentMatchInfo) => void;

const ETHIOPIAN_RIVALS = [
    { name: 'Abebe_Bikila', eloOffset: 25 },
    { name: 'Selam_Addis', eloOffset: -15 },
    { name: 'Dawit_Gunner', eloOffset: 40 },
    { name: 'Kenenisa_Goal', eloOffset: 10 },
    { name: 'Yohannes_Ibex', eloOffset: -30 },
    { name: 'Haile_Gebrselassie', eloOffset: 55 },
    { name: 'Tadesse_Coffee', eloOffset: 5 },
    { name: 'Almaz_StGeorge', eloOffset: -10 },
    { name: 'Fasil_Kenema', eloOffset: 20 },
    { name: 'Derartu_Tulu', eloOffset: 35 },
];

export class MatchmakingService {
    private static _instance: MatchmakingService | null = null;
    private _inQueue: boolean = false;
    private _searchTimeoutId: any = null;
    private _listeners: Set<MatchFoundListener> = new Set();

    public static getInstance(): MatchmakingService {
        if (!MatchmakingService._instance) {
            MatchmakingService._instance = new MatchmakingService();
        }
        return MatchmakingService._instance;
    }

    public async joinQueue(user: UserRow, competitionId?: string): Promise<{ success: boolean; error?: string }> {
        if (this._inQueue) return { success: true };
        this._inQueue = true;

        console.log('[MatchmakingService] Searching for live opponent on Ethio Telecom network...');

        // Realistic matchmaking delay (2 - 3.5 seconds)
        const delayMs = 2000 + Math.random() * 1500;

        this._searchTimeoutId = setTimeout(async () => {
            if (!this._inQueue) return;

            // 1. Pick a realistic Ethiopian opponent
            const rival = ETHIOPIAN_RIVALS[Math.floor(Math.random() * ETHIOPIAN_RIVALS.length)];
            const userElo = user.elo_rating || 1200;
            const opponentElo = Math.max(800, userElo + rival.eloOffset + Math.floor((Math.random() - 0.5) * 20));

            const opponent: UserRow = {
                id: `opp_${Date.now()}`,
                role: 'player',
                username: rival.name,
                phone: null,
                avatar_url: null,
                locale: user.locale || 'en',
                elo_rating: opponentElo,
                coins: Math.floor(100 + Math.random() * 300),
                xp: Math.floor(200 + Math.random() * 500),
                total_matches: Math.floor(15 + Math.random() * 30),
                total_wins: Math.floor(8 + Math.random() * 20),
                subscription_tier: 'basic',
                streak_count: Math.floor(1 + Math.random() * 5),
                streak_last_date: null,
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
                referral_code: null,
                referred_by: null
            };

            // 2. Fetch match questions
            const questions = await QuestionBank.getInstance().fetchQuestions(
                competitionId || 'world-cup',
                10,
                user.locale || 'en'
            );
            const questionIds = questions.map((q, idx) => q.id || `q_${idx + 1}`);

            this._inQueue = false;
            this._notifyMatchFound({
                liveMatchId: `live_match_${Date.now()}`,
                opponent,
                questionIds
            });
        }, delayMs);

        return { success: true };
    }

    public async leaveQueue(_userId?: string): Promise<void> {
        this._inQueue = false;
        if (this._searchTimeoutId) {
            clearTimeout(this._searchTimeoutId);
            this._searchTimeoutId = null;
        }
    }

    public onMatchFound(listener: MatchFoundListener): () => void {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    private _notifyMatchFound(info: OpponentMatchInfo): void {
        this._listeners.forEach(l => l(info));
    }

    public get isSearching(): boolean {
        return this._inQueue;
    }
}
