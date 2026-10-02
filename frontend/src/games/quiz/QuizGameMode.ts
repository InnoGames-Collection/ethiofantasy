import { IGameMode, GameModeMetadata } from '../../core/interfaces/IGameMode';
import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { QuizEngine } from '../../core/quiz/QuizEngine';
import { CompetitionRegistry } from '../../core/quiz/CompetitionRegistry';
import { QuestionBank } from '../../core/quiz/QuestionBank';
import { ScoreboardQuestionScreen } from '../../ui/screens/ScoreboardQuestionScreen';
import { MatchStatsScreen } from '../../ui/screens/MatchStatsScreen';
import { i18n } from '../../localization/i18n';

export class QuizGameMode implements IGameMode {
    public readonly metadata: GameModeMetadata = {
        id: 'football-quiz',
        name: 'Football Quiz League',
        description: 'Televised sports match quiz with match stats, goal celebrations, and rewards!'
    };

    private _uiManager!: UIManager;
    private _audioManager!: AudioManager;
    private _saveManager!: SaveManager;
    private _quizEngine!: QuizEngine;
    private _activeScoreboard: ScoreboardQuestionScreen | null = null;
    private _targetCompetitionId: string = 'walia-ibex';
    private _preloadedQuestions: any[] | null = null;
    
    public matchType: string = 'casual';
    public dailyChallengeId?: string;

    public async initialize(uiManager: UIManager): Promise<void> {
        this._uiManager = uiManager;
        this._quizEngine = new QuizEngine();

        const winAny = window as any;
        this._audioManager = winAny.ethioAudio || new AudioManager();
        this._saveManager = winAny.ethioSave || new SaveManager();
    }

    public async start(): Promise<void> {
        const comp = CompetitionRegistry.getById(this._targetCompetitionId) || CompetitionRegistry.getAll()[0];
        
        let questions = this._preloadedQuestions;
        if (!questions || questions.length === 0) {
            questions = await QuestionBank.getInstance().fetchQuestions(comp.id, 10, i18n.currentLocale as any);
        }

        this._activeScoreboard = new ScoreboardQuestionScreen(
            this._uiManager,
            this._audioManager,
            this._quizEngine,
            comp,
            questions,
            {
                onMatchComplete: (stats, finalScore) => this._showMatchStats(comp.id, stats, finalScore),
                onExitMatch: () => this.destroy()
            }
        );

        this._activeScoreboard.startMatch();
    }

    public async resume(session: any): Promise<void> {
        const comp = CompetitionRegistry.getById(session.matchType) || CompetitionRegistry.getAll()[0];
        
        this._activeScoreboard = new ScoreboardQuestionScreen(
            this._uiManager,
            this._audioManager,
            this._quizEngine,
            comp,
            session.questions,
            {
                onMatchComplete: (stats, finalScore) => this._showMatchStats(comp.id, stats, finalScore),
                onExitMatch: () => this.destroy()
            }
        );

        this._activeScoreboard.resumeSession(session);
    }

    public setCompetition(compId: string): void {
        this._targetCompetitionId = compId;
    }

    public setPreloadedQuestions(questions: any[]): void {
        this._preloadedQuestions = questions;
    }

    private _showMatchStats(gameId: string, stats: any, finalScore: number): void {
        const winAny = window as any;
        if (winAny.ethioCache) {
            winAny.ethioCache.setQuizActive(false);
        }
        
        // Pass the actual match type instead of hardcoding to gameId if it's daily
        const typeToPass = this.matchType === 'daily' ? 'daily' : gameId;
        
        const statsScreen = new MatchStatsScreen(
            this._uiManager,
            this._saveManager,
            this._audioManager,
            stats,
            finalScore,
            typeToPass,
            () => {
                const winAny = window as any;
                if (winAny.ethioCloseGame) {
                    winAny.ethioCloseGame();
                } else if (winAny.ethioReloadHome) {
                    winAny.ethioReloadHome();
                }
            }
        );
        
        if (this.matchType === 'daily' && this.dailyChallengeId) {
            (statsScreen as any).dailyChallengeId = this.dailyChallengeId;
        }
        
        statsScreen.render();
    }

    public update(_deltaTime: number): void {}

    public destroy(): void {
        if (this._activeScoreboard) {
            this._activeScoreboard.destroy();
            this._activeScoreboard = null;
        }
        this._uiManager.clear();
        console.log('[QuizGameMode] Destroyed.');
        const winAny = window as any;
        if (winAny.ethioCloseGame) {
            winAny.ethioCloseGame();
        } else if (winAny.ethioReloadHome) {
            winAny.ethioReloadHome();
        }
    }
}
