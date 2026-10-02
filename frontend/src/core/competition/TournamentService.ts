import { LeaderboardService } from '../leaderboard/LeaderboardService';

export interface TournamentLeaderboardEntry {
    userId: string;
    username: string;
    score: number;
    matchesPlayed: number;
    totalTimeMs: number;
}

export class TournamentService {
    private static _instance: TournamentService | null = null;

    private constructor() {}

    public static getInstance(): TournamentService {
        if (!TournamentService._instance) {
            TournamentService._instance = new TournamentService();
        }
        return TournamentService._instance;
    }

    public async getLeaderboard(_periodType: 'weekly' | 'monthly' | 'yearly', limit: number = 100): Promise<TournamentLeaderboardEntry[]> {
        try {
            const entries = await LeaderboardService.getInstance().getLeaderboard(undefined, 'weekly', limit);
            return entries.map(e => ({
                userId: e.userId,
                username: e.username,
                score: e.score,
                matchesPlayed: e.matchesPlayed,
                totalTimeMs: 45000
            }));
        } catch (e) {
            console.warn('[TournamentService] Error fetching tournament leaderboard:', e);
            return [];
        }
    }
}
