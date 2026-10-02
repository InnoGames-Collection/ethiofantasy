import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { QuizEngine, MatchStats } from '../../core/quiz/QuizEngine';
import { Competition } from '../../core/quiz/CompetitionRegistry';
import { GameSessionManager, GameSession } from '../../core/quiz/GameSessionManager';
import { ConfettiCanvas } from '../components/ConfettiCanvas';
import { RollingCounter } from '../components/RollingCounter';
import { GameModeBanner } from '../components/GameModeBanner';

export interface ScoreboardCallbacks {
    onMatchComplete: (stats: MatchStats, finalScore: number) => void;
    onExitMatch: () => void;
}

export interface QuestionData {
    id?: string;
    answerHash?: string;
    prompt: string;
    options: string[];
    correctIndex?: number;
    explanation?: string;
    fact?: string;
    learningTip?: string;
}

export class ScoreboardQuestionScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _quizEngine: QuizEngine;
    private _competition: Competition;
    private _questions: QuestionData[];
    private _callbacks: ScoreboardCallbacks;

    private _currentIndex: number = 0;
    private _timerInterval: any = null;
    private _timeLeftSec: number = 15;
    private _startTimeMs: number = 0;
    private _hasKickedOff: boolean = false;
    
    private _session: GameSession | null = null;

    private _isPaused: boolean = false;
    private _isDestroyed: boolean = false;
    private _nextQuestionTimeoutId: any = null;
    private _visibilityHandler: () => void;
    private _networkOfflineHandler: () => void;
    private _networkOnlineHandler: () => void;

    constructor(
        uiManager: UIManager,
        audioManager: AudioManager,
        quizEngine: QuizEngine,
        competition: Competition,
        questions: QuestionData[],
        callbacks: ScoreboardCallbacks
    ) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._quizEngine = quizEngine;
        this._competition = competition;
        this._questions = questions;
        this._callbacks = callbacks;

        // Visibility / Pause Listener
        this._visibilityHandler = () => {
            if (document.visibilityState === 'hidden' && this._hasKickedOff && !this._isPaused && this._currentIndex < this._questions.length) {
                this._showPauseOverlay();
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);

        // Network Monitor Listeners
        this._networkOfflineHandler = () => {
            if (this._hasKickedOff && !this._isPaused && this._currentIndex < this._questions.length) {
                this._showLeaveWarning();
                const text = document.getElementById('match-exit-dialog')?.querySelector('div > div:nth-child(2)');
                if (text) {
                    text.innerHTML = '⚠️ Your connection was lost. Reconnect to continue playing.';
                }
            }
        };
        this._networkOnlineHandler = () => {
            if (this._hasKickedOff && this._isPaused && this._currentIndex < this._questions.length) {
                this._hideLeaveWarning();
            }
        };
        window.addEventListener('ethio-network-offline', this._networkOfflineHandler);
        window.addEventListener('ethio-network-online', this._networkOnlineHandler);
    }

    public startMatch(): void {
        this._quizEngine.reset();
        this._currentIndex = 0;
        this._hasKickedOff = false;
        
        // Initialize Game Session Manager
        this._session = GameSessionManager.getInstance().createSession(
            this._competition.id,
            'Medium',
            this._questions
        );

        (window as any).ethioReviewData = { questions: [], choices: [] };
        
        (window as any).ethioOnBackPress = () => {
            if (!this._hasKickedOff) {
                this._callbacks.onExitMatch();
                return true;
            }
            const modal = document.getElementById('match-exit-dialog');
            if (modal && modal.style.display !== 'none') {
                this._hideLeaveWarning();
            } else {
                this._showLeaveWarning();
            }
            return true; 
        };

        this._renderKickOffScreen();
    }

    public resumeSession(session: GameSession): void {
        this._quizEngine.reset();
        this._session = session;
        this._questions = session.questions;
        this._currentIndex = session.currentIndex;
        this._hasKickedOff = true;
        this._isPaused = false;

        // Restore quiz engine stats from session progress
        for (let i = 0; i < session.choices.length; i++) {
            const chosen = session.choices[i];
            const correct = session.questions[i].correctIndex;
            const time = session.responseTimes[i];
            this._quizEngine.recordAnswer(chosen === correct, time);
        }

        // Restore review data in memory for resumed sessions
        (window as any).ethioReviewData = { questions: session.questions || [], choices: session.choices || [] };

        (window as any).ethioOnBackPress = () => {
            const modal = document.getElementById('match-exit-dialog');
            if (modal && modal.style.display !== 'none') {
                this._hideLeaveWarning();
            } else {
                this._showLeaveWarning();
            }
            return true; 
        };

        this._renderQuestion(session.timeLeftSec);
    }

    private _renderKickOffScreen(): void {
        const root = this._uiManager.container;
        const bannerFileName = this._competition.id === 'all' ? 'QUICK MATCH.png' : 'DAILY CHALLENGE.png';

        root.innerHTML = `
            <div class="stadium-container ethio-bg-quiz" style="pointer-events: auto; display: flex; align-items: center; justify-content: center; padding: 0 28px; position: relative; height: 100vh; overflow: hidden;">
                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-lights"></div>
                
                <!-- Dark Overlay -->
                <div style="position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); z-index: 5; animation: fade-in 250ms ease-out;"></div>

                <!-- Content Wrapper -->
                <div class="kick-off-wrapper" style="position: relative; z-index: 10; width: 100%; max-width: 600px; margin: 0 auto; padding: 0 16px;">
                    
                    ${GameModeBanner.render({
                        bannerUrl: `/assets/banners/${bannerFileName}`,
                        icon: this._competition.badge,
                        title: this._competition.name,
                        buttonId: 'kick-off-btn',
                        buttonText: i18n.currentLocale === 'am' ? 'ጀምር' : (i18n.currentLocale === 'om' ? 'EGGALI' : 'KICK OFF'),
                        showCloseButton: true
                    })}

                </div>
            </div>
            <style>
                @keyframes popupScale {
                    from { transform: scale(0.92); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes fade-up-delay {
                    from { transform: translateY(16px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                #kick-off-btn:active { transform: scale(0.96); box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 2px 8px rgba(0,0,0,0.5); }
                #match-exit-btn:active { transform: scale(0.9); }
            </style>
        `;

        document.getElementById('match-exit-btn')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if ((window as any).ethioHandleBack) {
                (window as any).ethioHandleBack();
            }
        });

        document.getElementById('kick-off-btn')?.addEventListener('click', () => {
            this._audioManager.playQuizWhistle();
            this._hasKickedOff = true;
            this._renderQuestion();
        });
    }

    private _renderQuestion(startTimerSec: number = 10): void {
        if (this._isDestroyed) return;
        if (!this._hasKickedOff) {
            this._renderKickOffScreen();
            return;
        }

        if (this._currentIndex >= this._questions.length) {
            this._stopTimer();
            this._completeMatch();
            return;
        }

        const q = this._questions[this._currentIndex];
        const root = this._uiManager.container;
        const currentGoals = this._quizEngine.calculateFinalStats().goals;
        const currentXP = currentGoals * 100;
        
        // Removed old audio arrival
        
        // Show category indicator
        root.innerHTML = `
            <div class="stadium-container ethio-bg-quiz" style="pointer-events: auto; display: flex; flex-direction: column; height: 100vh; overflow: hidden; position: relative;">
                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                <!-- PREMIUM GAMING HEADER -->
                <div style="
                    display: flex; 
                    flex-direction: column;
                    background: rgba(7,27,45,0.95);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    position: relative;
                    z-index: 10;
                ">
                    <!-- Top Bar Info Row -->
                    <div class="top-bar-row" style="
                        display: flex; 
                        align-items: center; 
                        justify-content: space-between; 
                        gap: 8px;
                        padding: clamp(8px, 1.5vh, 12px) 16px;
                        width: 100%;
                        box-sizing: border-box;
                    ">
                        <!-- Leave Button -->
                        <button id="match-exit-btn" class="top-bar-chip" style="width: 48px !important; height: 48px !important; border-radius: 24px !important; padding: 0 !important; flex-shrink: 0; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px;"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        
                        <!-- Score Chip -->
                        <div class="top-bar-chip" style="width: 100px; justify-content: center; box-sizing: border-box;">
                            <span class="top-bar-icon" style="font-size: 16px;">⚽</span>
                            <span id="match-score" class="top-bar-text" style="color: var(--tv-gold-primary);">${currentXP}</span>
                        </div>

                        <!-- Timer Chip -->
                        <div id="timer-chip" class="top-bar-chip" style="width: 100px; justify-content: center; box-sizing: border-box;">
                            <span class="top-bar-icon" style="font-size: 16px;">⏱️</span>
                            <span id="timer-text" class="top-bar-text" style="font-family: var(--fds-font-mono); font-variant-numeric: tabular-nums; display: inline-block; min-width: 32px; text-align: left;">
                                ${String(startTimerSec)}s
                            </span>
                        </div>

                        <!-- Progress Chip -->
                        <div class="top-bar-chip" style="width: 100px; justify-content: center; box-sizing: border-box;">
                            <span class="top-bar-icon" style="font-size: 16px;">📝</span>
                            <span class="top-bar-text" style="font-family: var(--fds-font-mono); font-variant-numeric: tabular-nums; display: inline-block; min-width: 32px; text-align: left;">
                                ${this._currentIndex + 1}/${this._questions.length}
                            </span>
                        </div>
                    </div>

                    <!-- Clean Progress Bar -->
                    <div style="position: relative; height: 4px; background: rgba(0,0,0,0.5); overflow: hidden;">
                        <div style="
                            height: 100%; 
                            width: ${((this._currentIndex + 1) / this._questions.length) * 100}%; 
                            background: linear-gradient(90deg, #009624 0%, #00C853 100%); 
                            transition: width 350ms cubic-bezier(0.16, 1, 0.3, 1);
                        "></div>
                    </div>
                </div>

                <!-- Quiz Area -->
                <div style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: clamp(12px, 2vh, 20px);
                    max-width: 600px;
                    margin: 0 auto;
                    width: 100%;
                    box-sizing: border-box;
                    z-index: 10;
                    position: relative;
                    min-height: 0;
                ">
                    <!-- Question Card Wrapper (Scrollable if needed) -->
                    <div style="flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; overflow-y: auto; margin-bottom: clamp(12px, 2vh, 24px); padding: 0 4px;" class="hide-scrollbar">
                        <div class="anim-q-card" style="
                            width: 100%;
                            margin: auto 0;
                            padding: clamp(12px, 2.5vh, 24px) 16px;
                            background: rgba(7, 27, 45, 0.75);
                            backdrop-filter: blur(12px);
                            border: 1px solid rgba(255,255,255,0.15);
                            border-radius: 24px;
                            box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 0 12px rgba(255,255,255,0.1);
                            text-align: center;
                            box-sizing: border-box;
                            flex-shrink: 0;
                        ">
                            <h2 style="
                                font-size: clamp(15px, 3vh, 24px); 
                                font-weight: 700; 
                                color: white; 
                                line-height: 1.3; 
                                letter-spacing: 0.2px; 
                                margin: 0; 
                                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                            ">
                                ${q.prompt}
                            </h2>
                        </div>
                    </div>

                    <!-- ANSWERS GRID (Never scrolls) -->
                    <div id="answers-grid" style="flex: 0 0 auto; display: flex; flex-direction: column; gap: clamp(6px, 1.2vh, 14px); width: 100%; padding-bottom: 24px; padding-left: 4px; padding-right: 4px; box-sizing: border-box; pointer-events: none;">
                        ${q.options.map((opt, i) => `
                            <button class="option-btn anim-a-card" style="animation-delay: ${180 + i * 30}ms;" data-index="${i}">
                                <span class="option-badge">${String.fromCharCode(65 + i)}</span>
                                <span class="option-text">${opt}</span>
                                <span class="feedback-icon" style="font-size: 24px; opacity: 0; transform: scale(0.5); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); margin-left: 12px;"></span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- TRANSLUCENT FEEDBACK OVERLAY -->
                <div id="feedback-overlay" style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0.8);
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 1000;
                    padding: 24px;
                    border-radius: 16px;
                    text-align: center;
                    min-width: 260px;
                    backdrop-filter: blur(8px);
                    border: 2px solid;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                    box-sizing: border-box;
                ">
                    <div id="feedback-anim" style="font-size: 64px; display: inline-block;">⚽</div>
                    <div id="feedback-text" style="font-size: var(--fds-font-xl); font-weight: 900; letter-spacing: 2px; margin-top: 12px; text-transform: uppercase; font-family: var(--tv-mono);"></div>
                    <div id="feedback-subtext" style="font-size: var(--fds-font-sm); color: var(--fds-text-muted); margin-top: 4px; font-weight: 700;"></div>
                </div>

                <!-- MATCH EXIT CONFIRMATION DIALOG -->
                <div id="match-exit-dialog" style="
                    display: none; 
                    position: fixed; 
                    top: 0; left: 0; 
                    width: 100%; height: 100%; 
                    background: rgba(0, 0, 0, 0.4); 
                    backdrop-filter: blur(4px);
                    z-index: 10000; 
                    align-items: center; justify-content: center;
                    padding: 20px; box-sizing: border-box;
                    animation: fade-in 0.2s ease-out;
                ">
                    <div class="glass-card" style="
                        width: 100%; max-width: 320px; 
                        padding: 24px; text-align: center; 
                        border-radius: 20px;
                        background: rgba(7, 27, 45, 0.95);
                        border: 1px solid rgba(255,255,255,0.1);
                        box-shadow: 0 16px 40px rgba(0,0,0,0.5);
                    ">
                        <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-text-main); margin-bottom: 8px;">Leave Quiz?</div>
                        <div style="font-size: var(--fds-font-sm); color: var(--fds-text-dim); margin-bottom: 24px; line-height: 1.4;">Your current progress will be lost.</div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button id="btn-pause-resume" style="width: 100%; padding: 14px; border-radius: 12px; border: none; background: linear-gradient(135deg, #00C853, #009624); color: white; font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,200,83,0.3);">Stay</button>
                            <button id="btn-pause-leave" style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.1); color: #EF4444; font-weight: bold; font-size: 16px; cursor: pointer;">Leave Quiz</button>
                        </div>
                    </div>
                </div>

                <!-- MATCH PAUSED DIALOG -->
                <div id="match-paused-dialog" style="
                    display: none; 
                    position: fixed; 
                    top: 0; left: 0; 
                    width: 100%; height: 100%; 
                    background: rgba(7, 27, 45, 0.95); 
                    z-index: 10001; 
                    align-items: center; justify-content: center;
                    padding: 20px; box-sizing: border-box;
                    animation: fade-in 0.2s ease-out;
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 24px;">⏸️</div>
                        <div style="font-size: 28px; font-weight: 900; color: white; margin-bottom: 12px; letter-spacing: 1px;">Match Paused</div>
                        <div style="font-size: 16px; color: #94A3B8; margin-bottom: 40px;">Tap Continue to resume.</div>
                        <button id="btn-resume-paused" style="width: 100%; max-width: 240px; padding: 18px; border-radius: 16px; border: none; background: linear-gradient(135deg, #00C853, #009624); color: white; font-weight: 900; font-size: 18px; cursor: pointer; box-shadow: 0 8px 24px rgba(0,200,83,0.4); text-transform: uppercase;">Continue</button>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes q-slide-in {
                    0% { transform: translate3d(120vw, 0, 0); opacity: 0.5; }
                    100% { transform: translate3d(0, 0, 0); opacity: 1; }
                }
                @keyframes a-slide-in {
                    0% { transform: translate3d(120vw, 0, 0); opacity: 0; }
                    100% { transform: translate3d(0, 0, 0); opacity: 1; }
                }
                .top-bar-chip {
                    background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 20px;
                    height: 40px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    white-space: nowrap;
                    box-shadow: 
                        inset 0 1px 1px rgba(255,255,255,0.2), 
                        inset 0 -2px 4px rgba(0,0,0,0.3),
                        0 4px 12px rgba(0,0,0,0.4);
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                    color: white;
                    font-weight: 800;
                    cursor: pointer;
                }
                .top-bar-chip::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 40%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
                    pointer-events: none;
                }
                .top-bar-chip:active {
                    transform: scale(0.96);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4);
                }
                @media (hover: hover) {
                    .top-bar-chip:hover {
                        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
                        border-color: rgba(255,255,255,0.3);
                    }
                }
                .top-bar-text {
                    font-size: clamp(15px, 4vw, 18px);
                    font-weight: 900;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                    position: relative;
                    z-index: 2;
                }
                .top-bar-icon {
                    position: relative;
                    z-index: 2;
                }
                
                .option-btn {
                    width: 100%;
                    min-height: clamp(44px, 6vh, 64px);
                    padding: clamp(8px, 1.2vh, 16px) 20px;
                    background: linear-gradient(180deg, #12A64B 0%, #065F33 100%);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 18px;
                    color: white;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 
                        inset 0 2px 4px rgba(255,255,255,0.4),
                        inset 0 -4px 8px rgba(0,0,0,0.3), 
                        0 10px 30px rgba(0,0,0,0.4);
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                    flex-shrink: 1;
                }
                .option-btn::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 40%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
                    border-radius: 16px 16px 0 0;
                    pointer-events: none;
                }
                .option-badge {
                    width: 38px; height: 38px; 
                    border-radius: 50%; 
                    background: rgba(255,255,255,0.15); 
                    display: flex; align-items: center; justify-content: center; 
                    font-size: 18px; font-weight: bold; color: white;
                    flex-shrink: 0;
                    box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
                    position: relative;
                    z-index: 2;
                }
                .option-text {
                    flex: 1; 
                    font-size: clamp(14px, 2.5vh, 18px); 
                    font-weight: 600; 
                    color: white; 
                    line-height: 1.3; 
                    word-wrap: break-word; 
                    overflow-wrap: break-word;
                    position: relative;
                    z-index: 2;
                }
                .option-btn:active:not(:disabled) { 
                    transform: scale(0.98); 
                    box-shadow: inset 0 4px 12px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.2);
                    background: linear-gradient(180deg, #15a34d 0%, #086136 100%);
                }
                .option-btn.selected {
                    border-color: #FFD54F !important;
                    box-shadow: 0 0 20px rgba(255, 213, 79, 0.4), inset 0 2px 4px rgba(255,255,255,0.2) !important;
                }
                .option-btn.correct { 
                    background: linear-gradient(180deg, #00C853 0%, #009624 100%) !important; 
                    border-color: #4ADE80 !important; 
                    box-shadow: 0 0 24px rgba(74, 222, 128, 0.5), inset 0 2px 4px rgba(255,255,255,0.3) !important;
                    animation: correctPulse 400ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                .option-btn.wrong { 
                    background: linear-gradient(180deg, #EF4444 0%, #B91C1C 100%) !important; 
                    border-color: #F87171 !important; 
                    box-shadow: 0 0 24px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(255,255,255,0.3) !important;
                    animation: wrongShake 400ms ease-in-out;
                }
                .option-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }
                
                .option-btn.correct .feedback-icon { opacity: 1 !important; transform: scale(1) !important; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
                .option-btn.wrong .feedback-icon { opacity: 1 !important; transform: scale(1) !important; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
                .option-btn.correct .feedback-icon::after { content: '✓'; }
                .option-btn.wrong .feedback-icon::after { content: '✕'; }

                .anim-q-card {
                    animation: q-slide-in 450ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    animation-delay: 80ms;
                    opacity: 0;
                }
                .anim-a-card {
                    animation: a-slide-in 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    opacity: 0;
                }
                @media (prefers-reduced-motion: reduce) {
                    .anim-q-card, .anim-a-card {
                        animation: simple-fade-in 120ms ease-out forwards !important;
                        transform: none !important;
                    }
                }
                @keyframes correctPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                    100% { transform: scale(1); }
                }
                @keyframes wrongShake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-6px); }
                    40%, 80% { transform: translateX(6px); }
                }

                @keyframes goal-bounce {
                    0% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.2); text-shadow: 0 10px 20px rgba(0,200,83,0.5); }
                    100% { transform: translateY(0) scale(1); }
                }
                @keyframes save-shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-12px); }
                    40%, 80% { transform: translateX(12px); }
                }
                
                @keyframes subtle-pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0px rgba(245, 158, 11, 0); }
                    50% { transform: scale(1.05); box-shadow: 0 0 12px rgba(245, 158, 11, 0.5); border-color: rgba(245, 158, 11, 0.8); }
                    100% { transform: scale(1); box-shadow: 0 0 0px rgba(245, 158, 11, 0); }
                }
                .time-low {
                    animation: subtle-pulse 1s infinite ease-in-out;
                    color: #F59E0B !important;
                    border-color: rgba(245, 158, 11, 0.5) !important;
                }
                .time-low span {
                    color: #F59E0B !important;
                }
                
                @media (max-width: 420px) {
                    .top-bar-row {
                        padding: 6px 4px !important;
                        gap: 4px !important;
                    }
                    .top-bar-chip {
                        padding: 4px 6px !important;
                        gap: 4px !important;
                    }
                    .top-bar-icon {
                        font-size: 13px !important;
                    }
                    .top-bar-text {
                        font-size: 13px !important;
                    }
                }
            </style>
        `;

        this._startTimer(startTimerSec);
        this._bindOptionButtons();
        this._bindPauseButtons();

        // Release touch lock at exactly 120ms
        setTimeout(() => {
            if (this._isDestroyed) return;
            const grid = document.getElementById('answers-grid');
            if (grid) grid.style.pointerEvents = 'auto';
        }, 120);

        // Sensory Feedback
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            this._audioManager.playClick();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(10); } catch(e) {}
            }
        }
    }

    private _startTimer(startVal: number = 10): void {
        this._stopTimer();
        this._timeLeftSec = startVal;
        this._startTimeMs = performance.now();

        const timerText = document.getElementById('timer-text');

        const drawTimer = () => {
            if (timerText) {
                timerText.innerText = `${String(this._timeLeftSec)}s`;
                const timerChip = document.getElementById('timer-chip');
                if (timerChip) {
                    if (this._timeLeftSec <= 5) {
                        timerChip.classList.add('time-low');
                    } else {
                        timerChip.classList.remove('time-low');
                    }
                }
            }
        };

        drawTimer();

        this._timerInterval = setInterval(() => {
            if (this._isPaused) return;

            this._timeLeftSec--;
            
            drawTimer();

            // Save remaining time to active session state for resumption auto-save
            if (this._session) {
                this._session.timeLeftSec = this._timeLeftSec;
                GameSessionManager.getInstance().saveSession(this._session);
            }

            if (this._isDestroyed || this._isPaused) return;

            if (this._timeLeftSec <= 0) {
                this._audioManager.playQuizWhistle();
                this._handleTimeOut();
                return;
            }
        }, 1000);
    }

    private _stopTimer(): void {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    private _showLeaveWarning(): void {
        const modal = document.getElementById('match-exit-dialog');
        if (modal) modal.style.display = 'flex';
    }

    private _hideLeaveWarning(): void {
        const modal = document.getElementById('match-exit-dialog');
        if (modal) modal.style.display = 'none';
    }

    private _showPauseOverlay(): void {
        this._isPaused = true;
        this._stopTimer();
        const modal = document.getElementById('match-paused-dialog');
        if (modal) modal.style.display = 'flex';
    }

    private _hidePauseOverlay(): void {
        this._isPaused = false;
        const modal = document.getElementById('match-paused-dialog');
        if (modal) modal.style.display = 'none';
        this._startTimer(this._timeLeftSec);
    }

    private _leaveMatch(): void {
        this._stopTimer();
        if (this._session) {
            GameSessionManager.getInstance().clearSession();
        }
        (window as any).ethioOnBackPress = null;
        this.destroy();
        this._callbacks.onExitMatch();
    }

    private _bindPauseButtons(): void {
        document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._hideLeaveWarning();
        });

        document.getElementById('btn-pause-leave')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._leaveMatch();
        });

        document.getElementById('btn-resume-paused')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._hidePauseOverlay();
        });
    }

    private _bindOptionButtons(): void {
        document.getElementById('match-exit-btn')?.addEventListener('click', () => {
            this._showLeaveWarning();
        });

        const options = document.querySelectorAll('.option-btn');
        options.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                if (target.disabled) return;
                
                // Immediately lock all buttons
                const buttons = document.querySelectorAll('.option-btn');
                buttons.forEach(b => (b as HTMLButtonElement).disabled = true);
                
                // Pause timer instantly
                this._stopTimer();
                
                // 1. Play answer selected audio and wait for completion
                await this._audioManager.playQuizAnswerSelected();

                // Extract index and evaluate
                const chosenIdx = parseInt(target.getAttribute('data-index') || '0');
                
                if (this._isDestroyed) return;
                this._onOptionSelected(chosenIdx, target);
            });
        });
    }

    private async _onOptionSelected(chosenIndex: number, targetBtn: HTMLButtonElement): Promise<void> {
        let responseTimeSec = parseFloat(((performance.now() - this._startTimeMs) / 1000).toFixed(1));
        
        // Anti-cheat: prevent timer manipulation (> 10.5s)
        if (responseTimeSec > 10.5) {
            await this._handleTimeOut();
            return;
        }

        const q = this._questions[this._currentIndex];
        const correctIdx = await this._findCorrectIndex(q);

        const isCorrect = chosenIndex === correctIdx;
        


        const buttons = document.querySelectorAll('.option-btn');

        const isFinalQuestion = this._currentIndex === this._questions.length - 1;
        let audioPromise: Promise<void> = Promise.resolve();

        if (isCorrect) {
            targetBtn.classList.add('correct');
            audioPromise = this._audioManager.playQuizCorrectAnswer();
            ConfettiCanvas.burst(window.innerWidth / 2, window.innerHeight / 3, 50, ['#FFD54F', '#00C853', '#3B82F6', '#FFFFFF']);
            this._showFeedbackOverlay(true);

        } else {
            targetBtn.classList.add('wrong');
            if (correctIdx !== undefined) {
                const correctBtn = buttons[correctIdx] as HTMLButtonElement;
                if (correctBtn) {
                    correctBtn.classList.add('correct');
                }
            }
            audioPromise = this._audioManager.playQuizWrongAnswer();
            this._showFeedbackOverlay(false);
        }

        // Wait for the correct/wrong audio to completely finish
        await audioPromise;
        if (this._isDestroyed) return;

        // If it's the final question, play whistle and wait for it BEFORE advancing
        if (isFinalQuestion) {
            await this._audioManager.playQuizWhistle();
            if (this._isDestroyed) return;
        }

        // Calculate and record the score ONLY AFTER the complete audio sequence finishes
        this._quizEngine.recordAnswer(isCorrect, responseTimeSec, q.id, chosenIndex);
        const currentGoals = this._quizEngine.calculateFinalStats().goals;

        // Auto Save progress
        if (this._session) {
            GameSessionManager.getInstance().autoSaveProgress(
                this._session,
                this._currentIndex + 1,
                chosenIndex,
                responseTimeSec,
                isCorrect,
                currentGoals * 100,
                15
            );
        }
        
        if (isCorrect) {
            const scoreEl = document.getElementById('match-score');
            if (scoreEl) {
                RollingCounter.animate(scoreEl, (currentGoals - 1) * 100, currentGoals * 100, 600, (v) => `${Math.round(v)}`);
            }
        }

        this._hideFeedbackOverlay();
        this._currentIndex++;
        this._renderQuestion();
    }

    private _showFeedbackOverlay(isGoal: boolean): void {
        const overlay = document.getElementById('feedback-overlay');
        const anim = document.getElementById('feedback-anim');
        const text = document.getElementById('feedback-text');
        const sub = document.getElementById('feedback-subtext');
        
        if (overlay && anim && text && sub) {
            overlay.style.borderColor = isGoal ? 'var(--tv-pitch-green)' : 'var(--tv-gold-primary)';
            overlay.style.background = isGoal 
                ? 'linear-gradient(135deg, rgba(0,200,83,0.25) 0%, rgba(7,27,45,0.96) 100%)' 
                : 'linear-gradient(135deg, rgba(255,213,79,0.18) 0%, rgba(7,27,45,0.96) 100%)';
            overlay.style.color = isGoal ? 'var(--tv-pitch-green)' : 'var(--tv-gold-primary)';
            
            anim.innerText = isGoal ? '⚽🥅' : '🧤⚽';
            anim.style.animation = isGoal ? 'goal-bounce 0.6s ease-in-out infinite' : 'save-shake 0.4s ease-in-out infinite';
            
            text.innerText = isGoal ? 'GOAL!' : 'SAVED!';
            sub.innerText = isGoal ? 'Brilliant strike into the net!' : 'Keeper parries the shot away!';
            
            overlay.style.opacity = '1';
            overlay.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    }

    private _hideFeedbackOverlay(): void {
        const overlay = document.getElementById('feedback-overlay');
        if (overlay) {
            overlay.style.pointerEvents = 'none';
            overlay.style.opacity = '0';
            overlay.style.transform = 'translate(-50%, -50%) scale(0.8)';
        }
    }

    private async _handleTimeOut(): Promise<void> {
        const responseTimeSec = 15;
        
        const q = this._questions[this._currentIndex];
        const correctIdx = await this._findCorrectIndex(q);


        
        const buttons = document.querySelectorAll('.option-btn');
        if (correctIdx !== undefined) {
            const correctBtn = buttons[correctIdx] as HTMLButtonElement;
            if (correctBtn) {
                correctBtn.classList.add('correct');
            }
        }



        this._showFeedbackOverlay(false);
        const text = document.getElementById('feedback-text');
        const sub = document.getElementById('feedback-subtext');
        if (text && sub) {
            text.innerText = 'TIME OUT!';
            sub.innerText = 'Speed up next time!';
        }

        const isFinalQuestion = this._currentIndex === this._questions.length - 1;
        
        await this._audioManager.playQuizWrongAnswer();
        if (this._isDestroyed) return;
        
        if (isFinalQuestion) {
            await this._audioManager.playQuizWhistle();
            if (this._isDestroyed) return;
        }

        // Calculate and record the score ONLY AFTER the complete audio sequence finishes
        this._quizEngine.recordAnswer(false, responseTimeSec, q.id, -1);
        const currentGoals = this._quizEngine.calculateFinalStats().goals;
        if (this._session) {
            GameSessionManager.getInstance().autoSaveProgress(
                this._session,
                this._currentIndex + 1,
                -1,
                responseTimeSec,
                false,
                currentGoals * 100,
                15
            );
        }

        this._hideFeedbackOverlay();
        this._currentIndex++;
        this._renderQuestion();
    }

    private _completeMatch(): void {
        let stats = this._quizEngine.calculateFinalStats();
        let finalScore = (stats.goals * 100) + (stats.accuracy * 5) + Math.round(Math.max(0, 15 - stats.avgResponseTime) * stats.goals * 15);
        if (stats.accuracy === 100) finalScore += 500;

        // Save session completion to history
        if (this._session) {
            GameSessionManager.getInstance().completeSession(this._session, finalScore);
        }

        // Save review game questions and choices
        // Save review data in memory for the post-match review screen
        (window as any).ethioReviewData = { questions: this._questions, choices: this._session ? this._session.choices : [] };

        // Refresh cloud profile stats asynchronously
        import('../../core/auth/AuthManager').then(m => m.AuthManager.getInstance().refreshProfile());

        (window as any).ethioOnBackPress = null;
        
        // 🚀 INSTANT TRANSITION: Fire onMatchComplete immediately with local stats
        this._callbacks.onMatchComplete(stats, finalScore);

        // 🔄 ASYNC BACKGROUND OPERATION: Server-authoritative match validation
        if (this._session) {
            import('../../networking/api/MatchSubmissionService').then(({ MatchSubmissionService }) => {
                MatchSubmissionService.getInstance().submitMatch({
                    matchType: this._session!.matchType as any,
                    competitionId: this._competition.id,
                    answers: this._quizEngine.answerSubmissions
                }).then(res => {
                    console.log('[Anti-Cheat] Match validated and recorded with Fastify backend:', res.matchId);
                }).catch(e => console.warn('[Anti-Cheat] Background validation warning:', e));
            });
        }
    }
    
    public destroy(): void {
        this._isDestroyed = true;
        this._stopTimer();
        this._audioManager.stopAllQuizAudio();
        if (this._nextQuestionTimeoutId) {
            clearTimeout(this._nextQuestionTimeoutId);
            this._nextQuestionTimeoutId = null;
        }
        document.removeEventListener('visibilitychange', this._visibilityHandler);
        window.removeEventListener('ethio-network-offline', this._networkOfflineHandler);
        window.removeEventListener('ethio-network-online', this._networkOnlineHandler);
        
        this._quizEngine = null as any;
        this._session = null;
        (window as any).ethioOnBackPress = null;
        if (this._uiManager && this._uiManager.container) {
            this._uiManager.container.innerHTML = '';
        }
    }

    private async _findCorrectIndex(q: QuestionData): Promise<number | undefined> {
        if (q.correctIndex !== undefined) return q.correctIndex;

        if ((q as any).answerHash) {
            for (let i = 0; i < 4; i++) {
                const hash = await this._sha256(`${q.id}:${i}:ethio-secret-salt`);
                if (hash === (q as any).answerHash) {
                    q.correctIndex = i; // Save permanently for the review screen
                    return i;
                }
            }
        }
        return undefined;
    }
    
    private async _sha256(str: string): Promise<string> {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
