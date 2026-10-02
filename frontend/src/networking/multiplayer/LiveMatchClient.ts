import { MatchSubmissionService } from '../api/MatchSubmissionService';

export interface LiveMatchEventData {
    event: 'ANSWER_SUBMITTED' | 'QUESTION_ADVANCE' | 'MATCH_FINISH';
    userId: string;
    questionIndex?: number;
    score?: number;
    isCorrect?: boolean;
    finalScores?: { playerA: number; playerB: number };
}

export type LiveMatchEventListener = (event: LiveMatchEventData) => void;

export class LiveMatchClient {
    private _matchId: string;
    private _listeners: Set<LiveMatchEventListener> = new Set();
    private _opponentScore: number = 0;
    private _opponentTimer: any = null;

    constructor(matchId: string) {
        this._matchId = matchId;
    }

    public get matchId(): string {
        return this._matchId;
    }

    public connect(): void {
        console.log(`[LiveMatchClient] Connected to live match session ${this._matchId}`);
    }

    public async sendAnswer(
        userId: string,
        questionIndex: number,
        isCorrect: boolean,
        currentScore: number
    ): Promise<void> {
        // 1. Notify player's own answer immediately
        this._notify({
            event: 'ANSWER_SUBMITTED',
            userId,
            questionIndex,
            score: currentScore,
            isCorrect
        });

        // 2. Simulate realistic opponent response after a natural human-like delay
        if (this._opponentTimer) {
            clearTimeout(this._opponentTimer);
        }

        const opponentDelayMs = 1500 + Math.random() * 2000;
        this._opponentTimer = setTimeout(() => {
            const oppCorrect = Math.random() < 0.70;
            if (oppCorrect) {
                this._opponentScore += 100;
            }

            this._notify({
                event: 'ANSWER_SUBMITTED',
                userId: 'opp_match_bot',
                questionIndex,
                score: this._opponentScore,
                isCorrect: oppCorrect
            });
        }, opponentDelayMs);
    }

    public sendFinishMatch(userId: string, finalScore: number): void {
        if (this._opponentTimer) {
            clearTimeout(this._opponentTimer);
            this._opponentTimer = null;
        }

        const payload: LiveMatchEventData = {
            event: 'MATCH_FINISH',
            userId,
            score: finalScore,
            finalScores: {
                playerA: finalScore,
                playerB: this._opponentScore
            }
        };

        this._notify(payload);

        // Record live 1v1 match in Fastify backend
        MatchSubmissionService.getInstance().submitMatch({
            matchType: 'live_1v1',
            answers: []
        }).catch(err => {
            console.warn('[LiveMatchClient] Background match submit warning:', err);
        });
    }

    public onEvent(listener: LiveMatchEventListener): () => void {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    private _notify(data: LiveMatchEventData): void {
        this._listeners.forEach(l => l(data));
    }

    public disconnect(): void {
        if (this._opponentTimer) {
            clearTimeout(this._opponentTimer);
            this._opponentTimer = null;
        }
        this._listeners.clear();
        console.log(`[LiveMatchClient] Disconnected from match ${this._matchId}`);
    }
}
