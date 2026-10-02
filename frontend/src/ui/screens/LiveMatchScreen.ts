import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { LiveMatchClient, LiveMatchEventData } from '../../networking/multiplayer/LiveMatchClient';
import { ELORatingSystem } from '../../networking/multiplayer/ELORatingSystem';
import type { ExtendedQuestionData } from '../../core/quiz/QuestionBank';
import type { UserRow } from '../../networking/supabase/types';
import { DesignSystem } from '../theme/DesignSystem';
import { i18n } from '../../localization/i18n';

export class LiveMatchScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _saveManager: SaveManager;
    private _opponent: UserRow;
    private _questions: ExtendedQuestionData[];
    private _onComplete: () => void;

    private _client: LiveMatchClient;
    private _currentIndex: number = 0;
    private _myScore: number = 0;
    private _opponentScore: number = 0;
    
    private _timerInterval: any = null;
    private _timeLeftSec: number = 10;
    
    private _hasPlayedFullTimeWhistle: boolean = false;
    
    private _answers: any[] = [];
    private _isDestroyed: boolean = false;

    constructor(
        uiManager: UIManager,
        audioManager: AudioManager,
        saveManager: SaveManager,
        matchId: string,
        opponent: UserRow,
        questions: ExtendedQuestionData[],
        onComplete: () => void
    ) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._saveManager = saveManager;
        this._opponent = opponent;
        this._questions = questions;
        this._onComplete = onComplete;

        this._client = new LiveMatchClient(matchId);
    }

    public startMatch(): void {
        this._client.connect();
        this._client.onEvent((evt: LiveMatchEventData) => {
            if (evt.userId === this._opponent.id && evt.event === 'ANSWER_SUBMITTED') {
                if (evt.score !== undefined) {
                    this._opponentScore = evt.score;
                    const oppScoreEl = document.getElementById('opponent-score');
                    if (oppScoreEl) oppScoreEl.innerText = `${this._opponentScore}`;
                }
            }
        });

        this.render();
    }

    public render(): void {
        const root = this._uiManager.container;
        const myProfile = this._saveManager.profile;
        const q = this._questions[this._currentIndex];

        if (!q) {
            this._showFinalResults();
            return;
        }

        const promptText = i18n.currentLocale === 'am' ? (q.promptAm || q.promptEn || q.prompt) : (i18n.currentLocale === 'om' ? (q.promptOm || q.promptEn || q.prompt) : (q.promptEn || q.prompt));
        const optionsList = i18n.currentLocale === 'am' ? (q.optionsAm && q.optionsAm.length === q.options.length ? q.optionsAm : q.options) : (i18n.currentLocale === 'om' ? (q.optionsOm && q.optionsOm.length === q.options.length ? q.optionsOm : q.options) : (q.optionsEn && q.optionsEn.length === q.options.length ? q.optionsEn : q.options));

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; display: flex; flex-direction: column;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                
                <!-- Live Header -->
                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 16px 20px; 
                    background: rgba(7,27,45,0.95);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="background: #EF4444; color: var(--fds-text-main); font-size: var(--fds-font-xs); font-weight: 900; padding: 4px 8px; border-radius: 4px; letter-spacing: 1px;">${i18n.currentLocale === 'am' ? 'ቀጥታ 1v1' : (i18n.currentLocale === 'om' ? 'KALLATTII 1v1' : 'LIVE 1v1')}</span>
                        <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--fds-text-main);">${i18n.currentLocale === 'am' ? `ዙር ${this._currentIndex + 1} ከ ${this._questions.length}` : (i18n.currentLocale === 'om' ? `MARSAA ${this._currentIndex + 1} / ${this._questions.length}` : `ROUND ${this._currentIndex + 1} OF ${this._questions.length}`)}</div>
                    </div>
                    <button id="live-exit-btn" style="background: none; border: none; color: var(--fds-text-main); font-weight: bold; cursor: pointer; font-size: 24px;">✕</button>
                </div>

                <!-- Smooth Progress Timer -->
                <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1);">
                    <div id="live-timer-bar" style="height: 100%; width: 100%; background: var(--tv-pitch-green); transition: width 1s linear, background-color 0.3s;"></div>
                </div>

                <!-- Scoreboard vs Opponent -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background: rgba(0,0,0,0.4);">
                    <div style="text-align: left;">
                        <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); margin-bottom: 4px;">${i18n.currentLocale === 'am' ? 'እርስዎ' : (i18n.currentLocale === 'om' ? 'ISIN' : 'YOU')}</div>
                        <div style="font-size: var(--fds-font-md); font-weight: 900; color: var(--fds-text-main); margin-bottom: 4px;">${myProfile.username}</div>
                        <div id="my-score" style="font-size: 24px; font-weight: 900; color: var(--tv-pitch-green);">${this._myScore}</div>
                    </div>
                    <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-red-live); background: rgba(239,68,68,0.15); padding: 8px 16px; border-radius: 20px;">VS</div>
                    <div style="text-align: right;">
                        <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); margin-bottom: 4px;">${i18n.currentLocale === 'am' ? 'ተፎካካሪ' : (i18n.currentLocale === 'om' ? 'DORMAA' : 'OPPONENT')}</div>
                        <div style="font-size: var(--fds-font-md); font-weight: 900; color: var(--fds-text-main); margin-bottom: 4px;">${this._opponent.username}</div>
                        <div id="opponent-score" style="font-size: 24px; font-weight: 900; color: #F59E0B;">${this._opponentScore}</div>
                    </div>
                </div>

                <!-- Quiz Area -->
                <div style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                    width: 100%;
                ">
                    <!-- High-Focus Question Text -->
                    <div class="anim-q-card" style="
                        font-size: clamp(20px, 3vh, 28px);
                        font-weight: 800;
                        color: var(--fds-text-main);
                        text-align: center;
                        line-height: 1.4;
                        margin-bottom: 40px;
                        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                    ">${promptText}</div>

                    <!-- Large Answer Buttons -->
                    <div id="live-answers-grid" style="display: flex; flex-direction: column; gap: 16px; width: 100%; pointer-events: none;">
                        ${optionsList.map((opt, i) => `
                            <button class="live-option-btn anim-a-card" data-index="${i}" style="
                                animation-delay: ${180 + i * 30}ms;
                                display: flex;
                                align-items: center;
                                width: 100%;
                                padding: 20px;
                                background: rgba(255,255,255,0.03);
                                border: 2px solid rgba(255,255,255,0.1);
                                border-radius: 16px;
                                color: var(--fds-text-main);
                                font-size: 18px;
                                font-weight: 700;
                                text-align: left;
                                cursor: pointer;
                                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                position: relative;
                                overflow: hidden;
                            ">
                                <span style="
                                    width: 32px; height: 32px; 
                                    border-radius: 50%; 
                                    background: rgba(255,255,255,0.1); 
                                    display: flex; align-items: center; justify-content: center; 
                                    margin-right: 16px; 
                                    font-size: var(--fds-font-sm); font-weight: 900;
                                ">${String.fromCharCode(65 + i)}</span>
                                <span style="flex: 1;">${opt}</span>
                                <span class="feedback-icon" style="font-size: 24px; opacity: 0; transform: scale(0.5); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Feedback Overlay (Fixed Bottom) -->
                <div id="live-feedback-overlay" style="
                    position: fixed;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%) scale(0.9);
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 100;
                    width: 90%;
                    max-width: 400px;
                    background: rgba(7,27,45,0.95);
                    border: 2px solid;
                    border-radius: 20px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                    backdrop-filter: blur(10px);
                ">
                    <div id="live-feedback-icon" style="font-size: 32px;"></div>
                    <div id="live-feedback-text" style="font-size: 24px; font-weight: 900; font-family: var(--tv-mono); letter-spacing: 1px;"></div>
                </div>
            </div>
            <style>
                @keyframes q-drop-in {
                    0% { transform: translate3d(0, -140px, 0) scale(0.98); opacity: 0; }
                    1% { transform: translate3d(0, -140px, 0) scale(0.98); opacity: 1; }
                    84% { transform: translate3d(0, 5px, 0) scale(1); opacity: 1; }
                    92% { transform: translate3d(0, -2px, 0) scale(1); opacity: 1; }
                    100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
                }
                @keyframes a-drop-in {
                    0% { transform: translate3d(0, -70px, 0) scale(0.97); opacity: 0; }
                    1% { transform: translate3d(0, -70px, 0) scale(0.97); opacity: 1; }
                    80% { transform: translate3d(0, 3px, 0) scale(1); opacity: 1; }
                    90% { transform: translate3d(0, -1px, 0) scale(1); opacity: 1; }
                    100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
                }
                .anim-q-card {
                    animation: q-drop-in 250ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    animation-delay: 80ms;
                    opacity: 0;
                }
                .anim-a-card {
                    animation: a-drop-in 150ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    opacity: 0;
                }
                .live-option-btn:active:not(:disabled) { transform: scale(0.97); }
                .live-option-btn.correct { background: rgba(0,200,83,0.15) !important; border-color: var(--fds-green-pitch) !important; }
                .live-option-btn.wrong { background: rgba(239,68,68,0.15) !important; border-color: var(--fds-red-live) !important; }
                .live-option-btn.correct .feedback-icon { opacity: 1 !important; transform: scale(1) !important; color: var(--fds-green-pitch); }
                .live-option-btn.wrong .feedback-icon { opacity: 1 !important; transform: scale(1) !important; color: var(--fds-red-live); }
                .live-option-btn.correct .feedback-icon::after { content: '✓'; }
                .live-option-btn.wrong .feedback-icon::after { content: '✕'; }
            </style>
        `;

        // Trigger Audio Arrival
        setTimeout(() => {
            // Removed audio arrive
        }, 80);

        this._startTimer();
        this._bindEvents(q);
        
        // Release touch lock at exactly 420ms
        setTimeout(() => {
            const grid = document.getElementById('live-answers-grid');
            if (grid) grid.style.pointerEvents = 'auto';
        }, 420);
    }

    public destroy(): void {
        this._isDestroyed = true;
        this._stopTimer();
        this._client.disconnect();
    }

    private _startTimer(): void {
        this._stopTimer();
        this._timeLeftSec = 10; // 10s for live match

        const timerBar = document.getElementById('live-timer-bar');

        this._timerInterval = setInterval(() => {
            this._timeLeftSec--;
            if (timerBar) {
                const pct = (this._timeLeftSec / 10) * 100;
                timerBar.style.width = pct + '%';
                if (this._timeLeftSec <= 5) {
                    timerBar.style.backgroundColor = '#EF4444';
                    // Removed countdown warning
                }
            }

            if (this._timeLeftSec <= 0) {
                this._stopTimer();
                this._handleTimeOut();
            }
        }, 1000);
    }

    private _stopTimer(): void {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    private _bindEvents(q: ExtendedQuestionData): void {
        const options = document.querySelectorAll('.live-option-btn');
        options.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                this._stopTimer();
                
                const buttons = document.querySelectorAll('.live-option-btn');
                buttons.forEach(b => (b as HTMLButtonElement).disabled = true);
                
                await this._audioManager.playQuizAnswerSelected();
                if (this._isDestroyed) return;

                const chosenIdx = parseInt(target.getAttribute('data-index') || '0');
                this._onOptionSelected(chosenIdx, target, q);
            });
        });

        const exitBtn = document.getElementById('live-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this._audioManager.playClick();
                this._client.disconnect();
                this._stopTimer();
                this._onComplete();
            });
        }
    }

    private async _onOptionSelected(chosenIndex: number, targetBtn: HTMLButtonElement, q: ExtendedQuestionData): Promise<void> {
        const isCorrect = chosenIndex === q.correctIndex;
        const buttons = document.querySelectorAll('.live-option-btn');
        
        const responseTimeMs = (10 - this._timeLeftSec) * 1000;
        this._answers.push({
            questionId: q.id,
            selectedIndex: chosenIndex,
            responseTimeMs
        });

        const isFinalQuestion = this._currentIndex === this._questions.length - 1;
        let audioPromise = Promise.resolve();

        if (isCorrect) {
            targetBtn.classList.add('correct');
            audioPromise = this._audioManager.playQuizCorrectAnswer();
            
            // Time-based scoring: 100 base + up to 50 speed bonus
            const speedBonus = Math.floor((this._timeLeftSec / 10) * 50);
            const scoreEarned = 100 + speedBonus;
            this._myScore += scoreEarned;
            
            const myScoreEl = document.getElementById('my-score');
            if (myScoreEl) myScoreEl.innerText = String(this._myScore);
            this._showFeedbackOverlay(true);
        } else {
            targetBtn.classList.add('wrong');
            if (q.correctIndex !== undefined) {
                const correctBtn = buttons[q.correctIndex] as HTMLButtonElement;
                if (correctBtn) {
                    correctBtn.classList.add('correct');
                }
            }
            audioPromise = this._audioManager.playQuizWrongAnswer();
            this._showFeedbackOverlay(false);
        }

        // Send live WebSocket broadcast
        const myUserId = this._saveManager.cloudUserId || 'local-user';
        this._client.sendAnswer(myUserId, this._currentIndex, isCorrect, this._myScore);

        await audioPromise;
        if (this._isDestroyed) return;

        if (isFinalQuestion) {
            await this._audioManager.playQuizWhistle();
            if (this._isDestroyed) return;
        }

        this._hideFeedbackOverlay();
        this._currentIndex++;
        this.render();
    }

    private _showFeedbackOverlay(isGoal: boolean): void {
        const overlay = document.getElementById('live-feedback-overlay');
        const icon = document.getElementById('live-feedback-icon');
        const text = document.getElementById('live-feedback-text');
        if (overlay && icon && text) {
            overlay.style.borderColor = isGoal ? 'var(--tv-pitch-green)' : '#EF4444';
            overlay.style.boxShadow = isGoal ? '0 10px 40px rgba(0,200,83,0.3)' : '0 10px 40px rgba(239,68,68,0.3)';
            overlay.style.color = isGoal ? 'var(--tv-pitch-green)' : '#EF4444';
            
            icon.innerText = isGoal ? '⚽' : '🧤';
            text.innerText = isGoal 
                ? (i18n.currentLocale === 'am' ? 'ግብ!!!!!' : (i18n.currentLocale === 'om' ? 'GALCHII!!!!!' : 'GOAL!!!!!'))
                : (i18n.currentLocale === 'am' ? 'ግብ ተከለከለ!' : (i18n.currentLocale === 'om' ? 'GALCHII QABAME!' : 'GOAL SAVED!'));
            
            overlay.style.opacity = '1';
            overlay.style.transform = 'translateX(-50%) scale(1)';
        }
    }

    private _hideFeedbackOverlay(): void {
        const overlay = document.getElementById('live-feedback-overlay');
        if (overlay) {
            overlay.style.pointerEvents = 'none';
            overlay.style.opacity = '0';
            overlay.style.transform = 'translateX(-50%) scale(0.9)';
        }
    }

    private _handleTimeOut(): void {
        const q = this._questions[this._currentIndex];
        this._answers.push({
            questionId: q.id,
            selectedIndex: -1,
            responseTimeMs: 10000
        });
        const myUserId = this._saveManager.cloudUserId || 'local-user';
        this._client.sendAnswer(myUserId, this._currentIndex, false, this._myScore);
        this._audioManager.playQuizWhistle();
        
        const buttons = document.querySelectorAll('.live-option-btn');
        if (q.correctIndex !== undefined) {
            const correctBtn = buttons[q.correctIndex] as HTMLButtonElement;
            if (correctBtn) {
                correctBtn.classList.add('correct');
            }
        }

        const isFinalQuestion = this._currentIndex === this._questions.length - 1;
        const delay = isFinalQuestion ? 400 : 1200;

        setTimeout(() => {
            this._currentIndex++;
            this.render();
        }, delay);
    }

    private _showFinalResults(): void {
        if (!this._hasPlayedFullTimeWhistle) {
            this._hasPlayedFullTimeWhistle = true;
            this._audioManager.playQuizWhistle();
        }

        const root = this._uiManager.container;
        const myElo = this._saveManager.profile.eloRating || 0;
        const isWinner = this._myScore > this._opponentScore;
        const isDraw = this._myScore === this._opponentScore;

        const eloResult = ELORatingSystem.calculateNewRatings(
            myElo,
            this._opponent.elo_rating,
            isWinner ? 1 : isDraw ? 0.5 : 0
        );

        this._saveManager.profile.eloRating = eloResult.winnerNewElo;
        this._saveManager.addCoins(isWinner ? 300 : 100);

        // Submit match result to backend
        this._submitToBackend();

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; display: flex; align-items: center; justify-content: center; padding: 20px;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                <div class="glass-card" style="
                    width: 100%;
                    max-width: 480px;
                    padding: 40px 24px;
                    text-align: center;
                    border-color: ${isWinner ? 'var(--tv-gold-primary)' : (isDraw ? '#60A5FA' : '#EF4444')};
                ">
                    <div style="font-size: 64px; margin-bottom: 16px;">
                        ${isWinner ? '🏆' : isDraw ? '🤝' : '🧤'}
                    </div>
                    <div style="font-size: 32px; font-weight: 900; color: ${isWinner ? 'var(--tv-gold-primary)' : (isDraw ? '#60A5FA' : '#EF4444')}; margin-bottom: 8px;">
                        ${isWinner ? (i18n.currentLocale === 'am' ? 'ድል' : (i18n.currentLocale === 'om' ? 'INJIFANNOO' : 'VICTORY')) : (isDraw ? (i18n.currentLocale === 'am' ? 'አቻ' : (i18n.currentLocale === 'om' ? 'QIXAA' : 'DRAW')) : (i18n.currentLocale === 'am' ? 'ሽነፋ' : (i18n.currentLocale === 'om' ? "MO'AMUU" : 'DEFEAT')))}
                    </div>
                    <div style="font-size: var(--fds-font-md); font-weight: 700; color: var(--fds-text-dim); margin-bottom: 32px;">
                        ${i18n.currentLocale === 'am' ? 'የመጨረሻ ውጤት' : (i18n.currentLocale === 'om' ? 'FIIXAAN GA\'II' : 'FINAL SCORE')}: ${this._myScore} - ${this._opponentScore}
                    </div>

                    <div style="display: flex; gap: 16px; margin-bottom: 32px;">
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px;">
                            <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); margin-bottom: 4px;">${i18n.currentLocale === 'am' ? 'ደረጃ' : (i18n.currentLocale === 'om' ? 'SADARKAA' : 'RATING')}</div>
                            <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-blue-accent);">
                                ${eloResult.winnerNewElo} <span style="font-size: var(--fds-font-xs);">(${eloResult.winnerEloChange >= 0 ? '+' : ''}${eloResult.winnerEloChange})</span>
                            </div>
                        </div>
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px;">
                            <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); margin-bottom: 4px;">${i18n.currentLocale === 'am' ? 'ሳንቲሞች' : (i18n.currentLocale === 'om' ? 'SANTIMA' : 'COINS')}</div>
                            <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--tv-gold-primary);">
                                +${isWinner ? 300 : 100}
                            </div>
                        </div>
                    </div>

                    ${DesignSystem.Button({ id: 'live-finish-btn', text: i18n.currentLocale === 'am' ? 'ወደ ሊግ ማዕከል ተመለስ' : (i18n.currentLocale === 'om' ? 'GARA WALTOMMII LIIGII DEEBI\'I' : 'RETURN TO LEAGUE HUB'), variant: 'primary', fullWidth: true })}
                </div>
            </div>
            <style>
                #live-finish-btn:active { transform: scale(0.96); }
            </style>
        `;

        root.querySelector('#live-finish-btn')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._onComplete();
        });
    }

    private async _submitToBackend(): Promise<void> {
        try {
            const { MatchSubmissionService } = await import('../../networking/api/MatchSubmissionService');
            await MatchSubmissionService.getInstance().submitMatch({
                matchType: 'live_1v1',
                answers: this._answers
            });
        } catch(e) {
            console.warn('[LiveMatchScreen] Failed to submit live match result', e);
        }
    }
}
