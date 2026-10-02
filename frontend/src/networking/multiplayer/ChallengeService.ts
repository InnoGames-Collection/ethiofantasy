import type { ChallengeRow, UserRow } from '../supabase/types';

export interface ExtendedChallengeInfo {
    id: string;
    challenger: UserRow;
    opponent: UserRow;
    questionIds: string[];
    status: string;
    expiresAt: string;
}

export class ChallengeService {
    private static _instance: ChallengeService | null = null;
    private _challenges: ChallengeRow[] = [];

    public static getInstance(): ChallengeService {
        if (!ChallengeService._instance) {
            ChallengeService._instance = new ChallengeService();
        }
        return ChallengeService._instance;
    }

    public async sendChallenge(
        challengerId: string,
        opponentId: string,
        matchId: string,
        questionIds: string[]
    ): Promise<{ success: boolean; error?: string }> {
        this._challenges.push({
            id: `ch_${Date.now()}`,
            challenger_id: challengerId,
            opponent_id: opponentId,
            match_id: matchId,
            question_ids: questionIds,
            status: 'pending',
            created_at: new Date().toISOString()
        } as ChallengeRow);
        return { success: true };
    }

    public async getPendingChallenges(userId: string): Promise<ChallengeRow[]> {
        return this._challenges.filter(c => c.opponent_id === userId && c.status === 'pending');
    }
}
