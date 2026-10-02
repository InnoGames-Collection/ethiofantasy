import { ApiClient } from '../../networking/api/ApiClient';
import type { ExtendedQuestionData } from '../quiz/QuestionBank';
import { QuestionBank } from '../quiz/QuestionBank';
import { i18n } from '../../localization/i18n';

export interface DailyChallengeInfo {
    id?: string;
    themeEn: string;
    themeAm?: string;
    themeOm?: string;
    bonusMultiplier: number;
    completed: boolean;
    questions: ExtendedQuestionData[];
}

export class DailyChallengeManager {
    private static _instance: DailyChallengeManager | null = null;
    private _apiClient: ApiClient;

    private constructor() {
        this._apiClient = ApiClient.getInstance();
    }

    public static getInstance(): DailyChallengeManager {
        if (!DailyChallengeManager._instance) {
            DailyChallengeManager._instance = new DailyChallengeManager();
        }
        return DailyChallengeManager._instance;
    }

    public async getTodayChallenge(): Promise<DailyChallengeInfo> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await this._apiClient.get('/daily-challenge/status', {
                date: today,
                locale: i18n.currentLocale
            });

            if (res && res.questions && Array.isArray(res.questions) && res.questions.length > 0) {
                return {
                    id: res.id || `dc_${today}`,
                    themeEn: res.themeEn || 'Daily Football Quiz Challenge',
                    themeAm: res.themeAm || 'የዕለቱ የእግር ኳስ ጥያቄ ተግዳሮት',
                    themeOm: res.themeOm || 'Qormaata Gaaffii Kubbaa Miilaa Guyyaa',
                    bonusMultiplier: res.bonusMultiplier || 1.5,
                    completed: Boolean(res.completed),
                    questions: res.questions as ExtendedQuestionData[]
                };
            }
        } catch (err) {
            console.warn('[DailyChallengeManager] Fastify API fetch failed, using local fallback:', err);
        }

        // Offline / Fallback Daily Challenge
        const questions = await QuestionBank.getInstance().fetchQuestions('world-cup', 10, i18n.currentLocale as any);
        return {
            id: `dc_fallback_${new Date().toISOString().split('T')[0]}`,
            themeEn: "Daily Champions Challenge",
            themeAm: "የዕለቱ የሻምፒዮኖች ተግዳሮት",
            themeOm: "Qormaata Chaampiyoonii Guyyaa",
            bonusMultiplier: 1.5,
            completed: false,
            questions
        };
    }

    public async startChallenge(msisdn: string): Promise<{ success: boolean; attemptId?: string; challengeId?: string }> {
        try {
            const res = await this._apiClient.post('/daily-challenge/start', {
                msisdn,
                date: new Date().toISOString().split('T')[0]
            });
            return res;
        } catch (err: any) {
            console.warn('[DailyChallengeManager] startChallenge error:', err);
            return { success: false };
        }
    }

    public async completeChallenge(attemptId: string, score: number, totalResponseTimeMs: number): Promise<boolean> {
        try {
            const res = await this._apiClient.post('/daily-challenge/complete', {
                attemptId,
                score,
                totalResponseTimeMs
            });
            return Boolean(res?.success);
        } catch (err) {
            console.warn('[DailyChallengeManager] completeChallenge error:', err);
            return false;
        }
    }
}
