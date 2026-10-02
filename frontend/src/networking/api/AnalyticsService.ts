export interface PlatformAnalytics {
    activePlayers: number;
    totalMatches: number;
    activeCompetitions: number;
    subscribedUsers: number;
    smsOtpSuccessRate: string;
    avgLatencyMs: number;
}

export class AnalyticsService {
    private static _instance: AnalyticsService | null = null;

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService._instance) {
            AnalyticsService._instance = new AnalyticsService();
        }
        return AnalyticsService._instance;
    }

    public async fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
        return {
            activePlayers: 124500,
            totalMatches: 1850000,
            activeCompetitions: 15,
            subscribedUsers: 88200,
            smsOtpSuccessRate: '99.4%',
            avgLatencyMs: 12
        };
    }
}
