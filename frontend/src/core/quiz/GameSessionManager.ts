import { QuestionData } from '../../ui/screens/ScoreboardQuestionScreen';
import { GameSessionService } from '../../networking/services/GameSessionService';

export type SessionState = 'Ready' | 'Starting' | 'Playing' | 'Paused' | 'Resumed' | 'Completed' | 'Abandoned' | 'Expired';

export interface GameSession {
    cloudSessionId?: string;
    sessionId: string;
    matchType: string;
    startTime: number;
    totalQuestions: number;
    difficulty: string;
    currentScore: number;
    currentIndex: number;
    timeLeftSec: number;
    questions: QuestionData[];
    choices: number[];
    responseTimes: number[];
    state: SessionState;
    correctCount: number;
    wrongCount: number;
    timeOutCount: number;
}

export class GameSessionManager {
    private static _instance: GameSessionManager | null = null;
    private readonly STORAGE_KEY = 'ETHIO_ACTIVE_SESSION_V3';

    public static getInstance(): GameSessionManager {
        if (!GameSessionManager._instance) {
            GameSessionManager._instance = new GameSessionManager();
        }
        return GameSessionManager._instance;
    }

    public createSession(matchType: string, difficulty: string, questions: QuestionData[]): GameSession {
        const session: GameSession = {
            sessionId: 'SESS-' + Math.floor(100000 + Math.random() * 900000),
            matchType,
            startTime: Date.now(),
            totalQuestions: questions.length,
            difficulty,
            currentScore: 0,
            currentIndex: 0,
            timeLeftSec: 15,
            questions,
            choices: [],
            responseTimes: [],
            state: 'Playing',
            correctCount: 0,
            wrongCount: 0,
            timeOutCount: 0
        };

        // Asynchronously create the session in Supabase so it shows up in "Live Match"
        const questionIds = questions.map(q => String(q.id));
        GameSessionService.getInstance().createSession(matchType, matchType, difficulty, questionIds).then(cloudSession => {
            if (cloudSession && cloudSession.id) {
                session.cloudSessionId = cloudSession.id;
                this.saveSession(session);
            }
        });

        this.saveSession(session);
        return session;
    }

    public getActiveSession(): GameSession | null {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) return null;
        try {
            const session: GameSession = JSON.parse(saved);
            if (session.state === 'Completed' || session.state === 'Abandoned' || session.state === 'Expired') {
                return null;
            }
            
            // Auto-discard sessions older than 4 hours (14,400,000 ms)
            if (Date.now() - session.startTime > 14400000) {
                this.clearSession();
                return null;
            }
            
            return session;
        } catch (e) {
            return null;
        }
    }

    public saveSession(session: GameSession): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    }

    public clearSession(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    public autoSaveProgress(
        session: GameSession,
        index: number,
        chosenIdx: number,
        responseTime: number,
        isCorrect: boolean,
        score: number,
        timeLeftSec: number
    ): void {
        session.currentIndex = index;
        session.choices.push(chosenIdx);
        session.responseTimes.push(responseTime);
        session.currentScore = score;
        session.timeLeftSec = timeLeftSec;

        if (chosenIdx === -1) {
            session.timeOutCount++;
        } else if (isCorrect) {
            session.correctCount++;
        } else {
            session.wrongCount++;
        }

        if (session.cloudSessionId) {
            const questionId = String(session.questions[index].id);
            const correctIndex = session.questions[index].correctIndex ?? -1;
            GameSessionService.getInstance().recordAnswer(
                session.cloudSessionId,
                questionId,
                index,
                chosenIdx,
                correctIndex,
                isCorrect,
                responseTime
            );
        }

        this.saveSession(session);
    }

    public abandonSession(session: GameSession): void {
        session.state = 'Abandoned';
        this.saveSession(session);
        this.addToHistory(session);
        
        if (session.cloudSessionId) {
            GameSessionService.getInstance().abandonSession(session.cloudSessionId);
        }
        
        this.clearSession();
    }

    public completeSession(session: GameSession, finalScore: number): void {
        session.state = 'Completed';
        session.currentScore = finalScore;
        this.saveSession(session);
        this.addToHistory(session);
        
        if (session.cloudSessionId) {
            const accuracy = session.totalQuestions > 0 ? Math.round((session.correctCount / session.totalQuestions) * 100) : 0;
            const avgTime = session.responseTimes.length > 0 ? session.responseTimes.reduce((a, b) => a + b, 0) / session.responseTimes.length : 0;
            GameSessionService.getInstance().completeSession(
                session.cloudSessionId,
                finalScore,
                accuracy,
                avgTime,
                0 // maxCombo - could be added to session if needed
            );
        }
        
        this.clearSession();
    }

    public addToHistory(_session: GameSession): void {
        // Session history is tracked server-side via GameSessionService.
        // No localStorage history storage.
    }
}
