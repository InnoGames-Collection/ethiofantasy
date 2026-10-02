import type { AnswerSubmissionItem } from '../../networking/api/MatchSubmissionService';

export interface MatchStats {
    goals: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalQuestions: number;
    accuracy: number;            // Percentage 0-100%
    possessionPercent: number;   // Percentage e.g. 68%
    avgResponseTime: number;     // Seconds
    maxCombo: number;
    coinsEarned: number;
    xpEarned: number;
    matchRating: number;         // 1.0 to 10.0
}

export class QuizEngine {
    private _goals: number = 0;
    private _correct: number = 0;
    private _incorrect: number = 0;
    private _total: number = 0;
    private _currentCombo: number = 0;
    private _maxCombo: number = 0;
    private _responseTimes: number[] = [];
    private _answerSubmissions: AnswerSubmissionItem[] = [];

    public reset(): void {
        this._goals = 0;
        this._correct = 0;
        this._incorrect = 0;
        this._total = 0;
        this._currentCombo = 0;
        this._maxCombo = 0;
        this._responseTimes = [];
        this._answerSubmissions = [];
    }

    public recordAnswer(
        isCorrect: boolean,
        responseTimeSec: number,
        questionId?: string,
        selectedIndex?: number
    ): { isGoal: boolean; coins: number; xp: number } {
        this._total++;
        this._responseTimes.push(responseTimeSec);

        if (questionId && selectedIndex !== undefined) {
            this._answerSubmissions.push({
                questionId,
                selectedIndex,
                responseTimeMs: Math.round(responseTimeSec * 1000)
            });
        }

        if (isCorrect) {
            this._goals++;
            this._correct++;
            this._currentCombo++;
            if (this._currentCombo > this._maxCombo) {
                this._maxCombo = this._currentCombo;
            }

            const baseCoins = 100;
            const comboBonus = (this._currentCombo - 1) * 25;
            const coins = baseCoins + comboBonus;
            const xp = 20 + (this._currentCombo * 5);

            return { isGoal: true, coins, xp };
        } else {
            this._incorrect++;
            this._currentCombo = 0;
            return { isGoal: false, coins: 0, xp: 0 };
        }
    }

    public get answerSubmissions(): AnswerSubmissionItem[] {
        return this._answerSubmissions;
    }

    public calculateFinalStats(): MatchStats {
        const accuracy = this._total > 0 ? Math.round((this._correct / this._total) * 100) : 0;
        const possessionPercent = Math.min(Math.max(Math.round(accuracy * 0.85 + 15), 30), 85);
        
        const sumTime = this._responseTimes.reduce((a, b) => a + b, 0);
        const avgResponseTime = this._responseTimes.length > 0 ? parseFloat((sumTime / this._responseTimes.length).toFixed(1)) : 0;

        const totalCoins = (this._correct * 100) + (this._maxCombo * 50);
        const totalXp = (this._correct * 20) + (this._maxCombo * 10);

        // Match rating 1.0 to 10.0 scale
        let rating = 5.0 + (accuracy / 20) + (this._maxCombo * 0.4);
        if (avgResponseTime > 0 && avgResponseTime < 5) rating += 1.0;
        const matchRating = parseFloat(Math.min(Math.max(rating, 3.0), 10.0).toFixed(1));

        return {
            goals: this._goals,
            correctAnswers: this._correct,
            incorrectAnswers: this._incorrect,
            totalQuestions: this._total,
            accuracy,
            possessionPercent,
            avgResponseTime,
            maxCombo: this._maxCombo,
            coinsEarned: totalCoins,
            xpEarned: totalXp,
            matchRating
        };
    }
}
