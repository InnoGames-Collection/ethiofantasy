import type { GameSessionRow } from '../supabase/types';

export class GameSessionService {
    private static _instance: GameSessionService | null = null;
    private _activeSession: GameSessionRow | null = null;
    private _history: GameSessionRow[] = [];

    private constructor() {}

    public static getInstance(): GameSessionService {
        if (!GameSessionService._instance) {
            GameSessionService._instance = new GameSessionService();
        }
        return GameSessionService._instance;
    }

    public async createSession(
        matchType: string,
        competitionId: string | null,
        difficulty: string | number,
        questionIds: string[]
    ): Promise<GameSessionRow | null> {
        const diffNum = typeof difficulty === 'string' ? parseInt(difficulty, 10) || 1 : difficulty;
        this._activeSession = {
            id: `sess_${Date.now()}`,
            user_id: 'current_user',
            competition_id: competitionId,
            match_type: matchType as any,
            state: 'playing',
            difficulty: diffNum,
            total_questions: questionIds.length,
            current_question: 0,
            correct_count: 0,
            wrong_count: 0,
            timeout_count: 0,
            score: 0,
            final_score: null,
            accuracy: 100,
            avg_response_time: 0,
            max_combo: 0,
            time_remaining: 60,
            question_ids: questionIds,
            started_at: new Date().toISOString(),
            paused_at: null,
            completed_at: null,
            updated_at: new Date().toISOString()
        };
        return this._activeSession;
    }

    public async getActiveSession(): Promise<GameSessionRow | null> {
        return this._activeSession;
    }

    public async recordAnswer(
        _sessionId: string,
        _questionId: string,
        _index: number,
        _chosenIdx: number,
        _correctIndex: number,
        isCorrect: boolean,
        _responseTime?: number
    ): Promise<void> {
        if (this._activeSession) {
            this._activeSession.current_question++;
            if (isCorrect) {
                this._activeSession.correct_count++;
                this._activeSession.score += 10;
            } else {
                this._activeSession.wrong_count++;
            }
        }
    }

    public async completeSession(
        _sessionId: string,
        score: number,
        accuracy?: number,
        avgResponseTime?: number,
        maxCombo?: number
    ): Promise<void> {
        if (this._activeSession) {
            this._activeSession.state = 'completed';
            this._activeSession.score = score;
            this._activeSession.final_score = score;
            if (accuracy !== undefined) this._activeSession.accuracy = accuracy;
            if (avgResponseTime !== undefined) this._activeSession.avg_response_time = avgResponseTime;
            if (maxCombo !== undefined) this._activeSession.max_combo = maxCombo;
            this._activeSession.completed_at = new Date().toISOString();
            this._history.unshift({ ...this._activeSession });
        }
    }

    public async abandonSession(_sessionId: string): Promise<void> {
        if (this._activeSession) {
            this._activeSession.state = 'abandoned';
            this._history.unshift({ ...this._activeSession });
        }
    }

    public async getHistory(limit: number = 50): Promise<GameSessionRow[]> {
        return this._history.slice(0, limit);
    }
}
