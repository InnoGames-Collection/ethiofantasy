import { DesignSystem } from "../theme/DesignSystem";
import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { MatchStats } from '../../core/quiz/QuizEngine';
import { Toast } from '../components/Toast';
import { RollingCounter } from '../components/RollingCounter';
import { i18n } from '../../localization/i18n';
import { ProgressionManager } from '../../core/managers/ProgressionManager';
import { ConfettiCanvas } from '../components/ConfettiCanvas';

export class MatchStatsScreen {
    private _uiManager: UIManager;
    private _saveManager: SaveManager;
    private _audioManager: AudioManager;
    private _stats: MatchStats;
    private _gameId: string;
    private _finalScore: number;
    private _hasAnimated: boolean = false;
    private _onContinue: () => void;

    constructor(
        uiManager: UIManager,
        saveManager: SaveManager,
        audioManager: AudioManager,
        stats: MatchStats,
        finalScore: number,
        gameId: string,
        onContinue: () => void
    ) {
        this._uiManager = uiManager;
        this._saveManager = saveManager;
        this._audioManager = audioManager;
        this._stats = stats;
        this._finalScore = finalScore;
        this._gameId = gameId;
        this._onContinue = onContinue;

        this._saveManager.updateHighScore(this._gameId, this._finalScore);
    }

    public render(): void {
        const root = this._uiManager.container;
        const correct = this._stats.goals;
        const wrong = this._stats.incorrectAnswers;

        root.innerHTML = `
            <div class="stadium-container" style="display: flex; align-items: center; justify-content: center; height: 100vh;">
                <div style="color: var(--fds-text-main); font-weight: bold;">${i18n.currentLocale === 'am' ? 'ሽልማቶችን በመጫን ላይ...' : (i18n.currentLocale === 'om' ? 'Badhaasa Fe\'aa Jira...' : 'Loading Rewards...')}</div>
            </div>
        `;

        this._submitAndRender(root, correct, wrong);
    }

    private async _submitAndRender(root: HTMLElement, correct: number, wrong: number): Promise<void> {
        let earnedXp = this._stats.xpEarned;
        let earnedCoins = this._stats.coinsEarned;

        // Apply to local save to keep UI updated
        this._saveManager.addXp(earnedXp);
        this._saveManager.addCoins(earnedCoins);
        // Increment match counters — synced to Supabase immediately
        const won = this._stats.accuracy >= 50;
        this._saveManager.incrementMatchStats(won);

        
        if (this._stats.accuracy >= 50) {
            this._audioManager.playQuizCorrectAnswer();
        } else {
            this._audioManager.playQuizWrongAnswer();
        }

        root.innerHTML = `
            <div class="stadium-container ethio-bg-result" style="pointer-events: auto; display: flex; align-items: center; justify-content: center; padding: 16px 16px 80px 16px; box-sizing: border-box; height: 100vh; overflow: hidden; position: relative;">
                
                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                <!-- Main Result Card -->
                <div class="glass-card result-card-anim" style="
                    position: relative;
                    z-index: 10;
                    width: 100%; 
                    max-width: 380px; 
                    padding: 32px 24px; 
                    border-color: var(--tv-gold-primary); 
                    background: linear-gradient(135deg, rgba(255,213,79,0.1) 0%, rgba(7,27,45,0.95) 100%);
                    box-shadow: 0 24px 60px rgba(0,0,0,0.6), inset 0 0 32px rgba(255,213,79,0.05);
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                ">
                    <!-- Header -->
                    <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--tv-gold-primary); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
                        ${i18n.currentLocale === 'am' ? 'ጨዋታው ተጠናቋል' : (i18n.currentLocale === 'om' ? 'Tapha Xumurame' : 'Match Complete')}
                    </div>
                    
                    <!-- Sub-header Message -->
                    <div id="match-message" style="font-size: 24px; font-weight: 900; color: var(--fds-text-main); margin-bottom: 24px; letter-spacing: 1px; text-transform: uppercase;">
                        ${this._stats.accuracy >= 50 
                            ? (i18n.currentLocale === 'am' ? 'በጣም ጥሩ' : (i18n.currentLocale === 'om' ? 'Baay\'ee Gaarii' : 'Excellent'))
                            : (i18n.currentLocale === 'am' ? 'ጥሩ ተጫውተዋል' : (i18n.currentLocale === 'om' ? 'Gaarii Taphatte' : 'Well Played'))}
                    </div>

                    <!-- Final Score (LARGE) -->
                    <div style="margin-bottom: 24px; position: relative;">
                        <div style="font-size: var(--fds-font-xs); font-weight: 800; color: #F472B6; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                            ${i18n.currentLocale === 'am' ? 'አጠቃላይ እይታ' : (i18n.currentLocale === 'om' ? 'Waliigala' : 'Overview')}
                        </div>
                        <div style="font-size: 56px; font-weight: 900; color: var(--tv-gold-primary); text-shadow: 0 4px 16px rgba(255,213,79,0.4); line-height: 1;">
                            <span id="final-score-rolling">${this._hasAnimated ? this._finalScore : '0'}</span>
                        </div>
                    </div>
                    
                    <!-- PREMIUM XP PROGRESS BAR -->
                    <div style="width: 100%; margin-bottom: 32px; background: rgba(0,0,0,0.4); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div id="level-display-left" style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--fds-text-main); font-family: var(--fds-font-mono);">
                                Lvl --
                            </div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 800; color: #4ADE80; text-transform: uppercase;">
                                +<span id="xp-gained-rolling">${this._hasAnimated ? earnedXp : '0'}</span> XP
                            </div>
                            <div id="level-display-right" style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--fds-text-dim); font-family: var(--fds-font-mono);">
                                Lvl --
                            </div>
                        </div>
                        
                        <!-- The Bar -->
                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; position: relative;">
                            <div id="xp-progress-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #4ADE80); border-radius: 8px; transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                        </div>
                        
                        <div id="level-up-toast" style="display: none; font-size: var(--fds-font-sm); font-weight: 900; color: var(--tv-gold-primary); margin-top: 12px; animation: bounce-in 0.5s;">
                            🎉 LEVEL UP! 🎉
                        </div>
                    </div>

                    <!-- Match Summary (MEDIUM) -->
                    <div style="width: 100%; display: flex; justify-content: center; gap: 16px; margin-bottom: 32px;">
                        <div style="text-align: center;">
                            <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-green-pitch);">${correct}</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); text-transform: uppercase;">
                                ${i18n.currentLocale === 'am' ? 'ትክክል' : (i18n.currentLocale === 'om' ? 'Sirrii' : 'Correct')}
                            </div>
                        </div>
                        <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                        <div style="text-align: center;">
                            <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-red-live);">${wrong}</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); text-transform: uppercase;">
                                ${i18n.currentLocale === 'am' ? 'የተሳሳተ' : (i18n.currentLocale === 'om' ? 'Dogoggora' : 'Wrong')}
                            </div>
                        </div>
                        <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                        <div style="text-align: center;">
                            <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-blue-accent);">${this._stats.accuracy}%</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); text-transform: uppercase;">
                                ${i18n.currentLocale === 'am' ? 'ትክክለኛነት' : (i18n.currentLocale === 'om' ? 'Sirriantummaa' : 'Accuracy')}
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons (SMALL) -->
                    <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="grid-column: span 2;">
                            ${DesignSystem.Button({ id: 'btn-play-again', text: i18n.currentLocale === 'am' ? 'ድጋሚ ተጫወት' : (i18n.currentLocale === 'om' ? 'Ammas Taphadhu' : 'Play Again'), variant: 'primary', fullWidth: true, icon: '🔄' })}
                        </div>
                        
                        <div>
                            ${DesignSystem.Button({ id: 'btn-review-game', text: i18n.currentLocale === 'am' ? 'ከልስ' : (i18n.currentLocale === 'om' ? 'Irra Deebi\'i' : 'Review'), variant: 'secondary', fullWidth: true, icon: '🔍' })}
                        </div>

                        <div>
                            ${DesignSystem.Button({ id: 'btn-leaderboard', text: i18n.currentLocale === 'am' ? 'ደረጃ' : (i18n.currentLocale === 'om' ? 'Sadarkaa' : 'Rank'), variant: 'secondary', fullWidth: true, icon: '📊' })}
                        </div>

                        <div style="grid-column: span 2;">
                            ${DesignSystem.Button({ id: 'btn-home', text: i18n.currentLocale === 'am' ? 'መነሻ' : (i18n.currentLocale === 'om' ? 'Manattii' : 'Home'), variant: 'secondary', fullWidth: true, icon: '🏠' })}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Scrollable Full-Screen Review Modal -->
            <div id="review-modal" style="
                display: none; 
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(7,27,45,0.98); 
                z-index: 10000; 
                flex-direction: column;
                pointer-events: auto;
                box-sizing: border-box;
            ">
                <!-- Modal Top Bar -->
                <div class="tv-broadcast-header" style="border-bottom: 1px solid rgba(255,255,255,0.1); justify-content: center; padding: 12px 16px; flex-shrink: 0; position: relative;">
                    <div style="font-weight: 900; font-size: var(--fds-font-md); letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? 'ጨዋታውን ይከልሱ' : (i18n.currentLocale === 'om' ? 'TAPHA IRRA DEEBI\'I' : 'REVIEW GAME')}</div>
                    <button id="btn-close-review" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--fds-text-main); font-weight: bold; cursor: pointer; font-size: 20px;">✕</button>
                </div>

                <!-- Scrollable Container -->
                <div style="flex: 1; overflow-y: auto; padding: 16px 16px 80px 16px;" id="review-questions-container" class="hide-scrollbar"></div>
            </div>
            
            <style>
                .result-card-anim {
                    animation: scaleUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                    transform: scale(0.9);
                }
                @keyframes scaleUpFade {
                    0% { opacity: 0; transform: scale(0.9) translateY(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                button:active { transform: scale(0.96) !important; }
                .review-action-btn:active { background: rgba(255,255,255,0.1) !important; }
                @keyframes bounce-in {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
            </style>
        `;

        this._bindEvents();

        // Animate main score
        const scoreEl = document.getElementById('final-score-rolling');
        if (scoreEl) {
            if (!this._hasAnimated) {
                RollingCounter.animate(scoreEl, 0, this._finalScore, 800);
            }
        }

        // Animate XP and Levels
        const oldXp = Math.max(0, this._saveManager.profile.xp - earnedXp);
        const newXp = this._saveManager.profile.xp;
        
        const oldLevelInfo = ProgressionManager.getLevel(oldXp);
        const newLevelInfo = ProgressionManager.getLevel(newXp);
        
        const xpGainedEl = document.getElementById('xp-gained-rolling');
        if (xpGainedEl) {
            if (!this._hasAnimated) {
                RollingCounter.animate(xpGainedEl, 0, earnedXp, 800);
            }
        }

        this._hasAnimated = true;

        const leftLvl = document.getElementById('level-display-left');
        const rightLvl = document.getElementById('level-display-right');
        const barFill = document.getElementById('xp-progress-fill');
        
        if (leftLvl) leftLvl.innerText = `Lvl ${oldLevelInfo.level}`;
        if (rightLvl) rightLvl.innerText = `Lvl ${oldLevelInfo.level + 1}`;
        
        if (barFill) {
            // Set initial state
            barFill.style.width = `${oldLevelInfo.progressPercent}%`;
            
            // Trigger animation after slight delay
            setTimeout(() => {
                if (newLevelInfo.level > oldLevelInfo.level) {
                    // Level UP!
                    barFill.style.width = '100%';
                    setTimeout(() => {
                        barFill.style.transition = 'none';
                        barFill.style.width = '0%';
                        if (leftLvl) leftLvl.innerText = `Lvl ${newLevelInfo.level}`;
                        if (rightLvl) rightLvl.innerText = `Lvl ${newLevelInfo.level + 1}`;
                        
                        // Small delay before filling up remaining new level XP
                        setTimeout(() => {
                            barFill.style.transition = 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                            barFill.style.width = `${newLevelInfo.progressPercent}%`;
                        }, 50);

                        // Show Level Up Celebration
                        this._audioManager.playQuizCorrectAnswer(); // Play again for level up
                        ConfettiCanvas.burst(window.innerWidth / 2, window.innerHeight / 2, 100);
                        const toast = document.getElementById('level-up-toast');
                        if (toast) toast.style.display = 'block';
                    }, 1500); // Time to fill first bar
                } else {
                    // Normal XP gain
                    barFill.style.width = `${newLevelInfo.progressPercent}%`;
                }
            }, 500);
        }
    }

    private _bindEvents(): void {
        const winAny = window as any;
        
        document.getElementById('btn-home')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (winAny.ethioForceHome) {
                winAny.ethioForceHome();
            } else {
                if (winAny.ethioCloseGame) winAny.ethioCloseGame();
                if (winAny.ethioReloadHome) winAny.ethioReloadHome();
            }
        });
        
        document.getElementById('btn-play-again')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (winAny.ethioCloseGame) winAny.ethioCloseGame();
            if (winAny.ethioPlayAgain) {
                winAny.ethioPlayAgain(this._gameId);
            } else {
                this._onContinue();
            }
        });
        
        document.getElementById('btn-leaderboard')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (winAny.ethioCloseGame) winAny.ethioCloseGame();
            if (winAny.ethioNavigateToTab) {
                winAny.ethioNavigateToTab('rankings');
            } else {
                this._onContinue();
            }
        });

        // Review Game popup triggers
        const reviewModal = document.getElementById('review-modal');
        const container = document.getElementById('review-questions-container');

        document.getElementById('btn-review-game')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (reviewModal && container) {
                this._renderReviewQuestions(container);
                reviewModal.style.display = 'flex';
            }
        });

        document.getElementById('btn-close-review')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (reviewModal) {
                reviewModal.style.display = 'none';
            }
        });
    }

    private _renderReviewQuestions(container: HTMLElement): void {
        const reviewData = (window as any).ethioReviewData || { questions: [], choices: [] };
        const questions = reviewData.questions || [];
        const choices = reviewData.choices || [];

        if (questions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px; color: var(--fds-text-dim);">
                    ${i18n.currentLocale === 'am' ? 'የሚከለሱ ጥያቄዎች የሉም።' : (i18n.currentLocale === 'om' ? 'Gaaffiin irra deebi\'amu hin jiru.' : 'No questions to review.')}
                </div>
            `;
            return;
        }

        container.innerHTML = questions.map((q: any, idx: number) => {
            const chosenIdx = choices[idx] !== undefined ? choices[idx] : -1;
            const isCorrect = chosenIdx === q.correctIndex;
            
            let badgeHtml = '';
            let chosenColor = '';
            if (chosenIdx === -1) {
                chosenColor = '#F97316'; // Orange
                badgeHtml = `<span style="font-size: var(--fds-font-xs); font-weight: 900; color: ${chosenColor}; background: rgba(249,115,22,0.15); padding: 2px 8px; border-radius: 4px;">
                    ${i18n.currentLocale === 'am' ? '⏱ ጊዜ አልቋል' : (i18n.currentLocale === 'om' ? '⏱ Yeroon Dhumate' : '⏱ Timeout')}
                </span>`;
            } else if (isCorrect) {
                chosenColor = '#00C853'; // Green
                badgeHtml = `<span style="font-size: var(--fds-font-xs); font-weight: 900; color: ${chosenColor}; background: rgba(0,200,83,0.15); padding: 2px 8px; border-radius: 4px;">
                    ${i18n.currentLocale === 'am' ? '✓ ትክክል' : (i18n.currentLocale === 'om' ? '✓ Sirrii' : '✓ Correct')}
                </span>`;
            } else {
                chosenColor = '#EF4444'; // Red
                badgeHtml = `<span style="font-size: var(--fds-font-xs); font-weight: 900; color: ${chosenColor}; background: rgba(239,68,68,0.15); padding: 2px 8px; border-radius: 4px;">
                    ${i18n.currentLocale === 'am' ? '✗ የተሳሳተ' : (i18n.currentLocale === 'om' ? '✗ Dogoggora' : '✗ Wrong')}
                </span>`;
            }


            const optionsHtml = q.options.map((opt: string, optIdx: number) => {
                const isThisCorrect = optIdx === q.correctIndex;
                const isThisSelected = optIdx === chosenIdx;
                
                let bgColor = 'rgba(0,0,0,0.3)';
                let borderColor = 'rgba(255,255,255,0.06)';
                let iconHtml = '';
                let labelHtml = '';

                if (isThisCorrect && isThisSelected) {
                    bgColor = 'rgba(0,200,83,0.15)';
                    borderColor = '#00C853';
                    iconHtml = '<span style="color: #00C853; font-weight: bold; margin-right: 8px;">✓</span>';
                    labelHtml = `<div style="background: rgba(0,200,83,0.2); color: #4ADE80; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Your Answer</div>`;
                } else if (isThisCorrect) {
                    bgColor = 'rgba(0,200,83,0.15)';
                    borderColor = '#00C853';
                    iconHtml = '<span style="color: #00C853; font-weight: bold; margin-right: 8px;">✓</span>';
                    labelHtml = `<div style="background: rgba(0,200,83,0.2); color: #4ADE80; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Correct Answer</div>`;
                } else if (isThisSelected) {
                    bgColor = 'rgba(239,68,68,0.15)';
                    borderColor = '#EF4444';
                    iconHtml = '<span style="color: #EF4444; font-weight: bold; margin-right: 8px;">✗</span>';
                    labelHtml = `<div style="background: rgba(239,68,68,0.2); color: #F87171; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Your Answer</div>`;
                }

                const prefix = String.fromCharCode(65 + optIdx) + '.';
                
                return `
                    <div style="background: ${bgColor}; border: 1px solid ${borderColor}; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; font-size: var(--fds-font-sm); font-weight: 700; color: var(--fds-text-main);">
                                ${iconHtml}
                                <span style="color: var(--fds-gold-primary); margin-right: 8px;">${prefix}</span> 
                                ${opt}
                            </div>
                            ${labelHtml}
                        </div>
                    </div>
                `;
            }).join('');

            let explanationHtml = '';
            if (q.explanation) {
                explanationHtml = `
                    <div style="background: rgba(7,27,45,0.6); border: 1px solid rgba(56,189,248,0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                        <div style="color: #38BDF8; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">💡 ${i18n.currentLocale === 'am' ? 'ይህ ለምን ትክክል ነው' : (i18n.currentLocale === 'om' ? 'Maaliif Sirrii Dha' : 'Why this is correct')}</div>
                        <div style="font-size: var(--fds-font-xs); color: var(--fds-text-main); line-height: 1.4;">${q.explanation}</div>
                    </div>
                `;
            }

            let factHtml = '';
            if (q.fact) {
                factHtml = `
                    <div style="background: rgba(7,27,45,0.6); border: 1px solid rgba(192,132,252,0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                        <div style="color: #C084FC; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">🧠 ${i18n.currentLocale === 'am' ? 'ያውቁ ኖሯል?' : (i18n.currentLocale === 'om' ? 'Beektuu Laata?' : 'Did You Know?')}</div>
                        <div style="font-size: var(--fds-font-xs); color: var(--fds-text-main); line-height: 1.4;">${q.fact}</div>
                    </div>
                `;
            }

            let tipHtml = '';
            if (q.learningTip) {
                tipHtml = `
                    <div style="background: rgba(7,27,45,0.6); border: 1px solid rgba(250,204,21,0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                        <div style="color: #FACC15; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">🎯 ${i18n.currentLocale === 'am' ? 'የመማሪያ ጠቃሚ ምክር' : (i18n.currentLocale === 'om' ? 'Gorsa Barumsaa' : 'Learning Tip')}</div>
                        <div style="font-size: var(--fds-font-xs); color: var(--fds-text-main); line-height: 1.4;">${q.learningTip}</div>
                    </div>
                `;
            }

            return `
                <div class="glass-card" style="border-radius: 12px; padding: 16px; margin-bottom: 16px; border-color: ${chosenColor}; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); text-transform: uppercase;">
                            ${i18n.currentLocale === 'am' ? `ጥያቄ ${idx + 1}` : (i18n.currentLocale === 'om' ? `Gaaffii ${idx + 1}` : `Question ${idx + 1}`)}
                        </span>
                        ${badgeHtml}
                    </div>

                    <div style="font-size: var(--fds-font-md); font-weight: 800; color: var(--fds-text-main); margin-bottom: 12px; line-height: 1.4;">${q.prompt}</div>

                    
                    <div style="margin-bottom: 12px;">
                        ${optionsHtml}
                    </div>
                    
                    ${explanationHtml}
                    ${factHtml}
                    ${tipHtml}

                    <!-- In-App Interactions Row (REQ 14) -->
                    <div style="display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                        <button class="review-action-btn btn-review-like" data-q-idx="${idx}" style="flex: 1; padding: 10px 4px; background: transparent; border: none; color: var(--fds-text-dim); font-size: var(--fds-font-xs); font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: transform 0.15s, color 0.15s;">
                            <span class="heart-icon" style="font-size: var(--fds-font-md); transition: transform 0.2s;">❤️</span> <span class="like-label">${i18n.currentLocale === 'am' ? 'ውደድ' : (i18n.currentLocale === 'om' ? 'Jaalladhu' : 'Like')}</span>
                        </button>
                        <button class="review-action-btn btn-review-comment" data-q-idx="${idx}" style="flex: 1; padding: 10px 4px; background: transparent; border: none; color: var(--fds-text-dim); font-size: var(--fds-font-xs); font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: transform 0.15s, color 0.15s;">
                            <span style="font-size: var(--fds-font-md);">💬</span> ${i18n.currentLocale === 'am' ? 'አስተያየት' : (i18n.currentLocale === 'om' ? 'Yaada' : 'Comment')}
                        </button>
                        <button class="review-action-btn btn-review-share" data-q-idx="${idx}" style="flex: 1; padding: 10px 4px; background: transparent; border: none; color: var(--fds-text-dim); font-size: var(--fds-font-xs); font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: transform 0.15s, color 0.15s;">
                            <span style="font-size: var(--fds-font-md);">⚽</span> ${i18n.currentLocale === 'am' ? 'ጋብዝ' : (i18n.currentLocale === 'om' ? 'Affeeri' : 'Invite')}
                        </button>
                    </div>

                    <!-- Comment Container (Hidden by default, expands on comment click) -->
                    <div class="comment-box-drawer" id="comment-drawer-${idx}" style="display: none; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
                        <div class="comment-list" id="comment-list-${idx}" style="max-height: 120px; overflow-y: auto; margin-bottom: 8px; font-size: var(--fds-font-xs); color: var(--fds-text-muted); display: flex; flex-direction: column; gap: 6px;">
                            <div style="background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 6px;">
                                <strong style="color: var(--fds-gold-primary);">Abebe M.:</strong> ${i18n.currentLocale === 'am' ? 'በጣም ጥሩ ጥያቄ! እውቀቴን በእውነት ፈትኖታል።' : (i18n.currentLocale === 'om' ? 'Gaaffii baay\'ee gaarii! Beekuumsakoo dhugumaan qoreera.' : 'Great question! Really challenged my knowledge.')} <span style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); float: right;">2m ago</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <input type="text" id="comment-input-${idx}" placeholder="${i18n.currentLocale === 'am' ? 'አስተያየት ይፃፉ...' : (i18n.currentLocale === 'om' ? 'Yaada barreessi...' : 'Write a comment...')}" style="flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px 10px; color: var(--fds-text-main); font-size: var(--fds-font-xs);" />
                            <button class="btn-send-comment" data-q-idx="${idx}" style="background: var(--tv-pitch-green); border: none; color: var(--fds-text-main); padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: var(--fds-font-xs); cursor: pointer;">${i18n.currentLocale === 'am' ? 'ለጥፍ' : (i18n.currentLocale === 'om' ? 'Maxxansi' : 'Post')}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Bind interactive events for review action buttons
        const cards = container.querySelectorAll('.glass-card');
        cards.forEach((card, idx) => {
            // REQ 14: LIKE FUNCTIONALITY
            const likeBtn = card.querySelector('.btn-review-like') as HTMLButtonElement;
            likeBtn?.addEventListener('click', () => {
                this._audioManager.playClick();
                const labelSpan = likeBtn.querySelector('.like-label') as HTMLElement;
                const heartIcon = likeBtn.querySelector('.heart-icon') as HTMLElement;

                if (likeBtn.classList.contains('liked')) {
                    likeBtn.classList.remove('liked');
                    likeBtn.style.color = '#94A3B8';
                    labelSpan.innerText = i18n.currentLocale === 'am' ? 'ውደድ' : (i18n.currentLocale === 'om' ? 'Jaalladhu' : 'Like');
                } else {
                    likeBtn.classList.add('liked');
                    likeBtn.style.color = '#EF4444';
                    labelSpan.innerText = i18n.currentLocale === 'am' ? 'ተወዷል' : (i18n.currentLocale === 'om' ? 'Jaallatameera' : 'Liked');
                    if (heartIcon) {
                        heartIcon.style.transform = 'scale(1.3)';
                        setTimeout(() => heartIcon.style.transform = 'scale(1)', 200);
                    }
                }
            });

            // REQ 14: COMMENT FUNCTIONALITY
            const commentBtn = card.querySelector('.btn-review-comment') as HTMLButtonElement;
            const drawer = card.querySelector(`#comment-drawer-${idx}`) as HTMLElement;
            const input = card.querySelector(`#comment-input-${idx}`) as HTMLInputElement;
            const sendBtn = card.querySelector('.btn-send-comment') as HTMLButtonElement;
            const list = card.querySelector(`#comment-list-${idx}`) as HTMLElement;

            commentBtn?.addEventListener('click', () => {
                this._audioManager.playClick();
                if (drawer) {
                    drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
                    if (drawer.style.display === 'block') input?.focus();
                }
            });

            sendBtn?.addEventListener('click', () => {
                this._audioManager.playClick();
                const text = input?.value.trim();
                if (!text) {
                    Toast.show(i18n.currentLocale === 'am' ? 'አስተያየት ባዶ ሊሆን አይችልም።' : (i18n.currentLocale === 'om' ? 'Yaadni duwwaa ta\'uu hin danda\'u.' : 'Comment cannot be empty.'), 'info');
                    return;
                }
                const newComment = document.createElement('div');
                newComment.style.cssText = 'background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 6px;';
                const userTag = i18n.currentLocale === 'am' ? 'እርስዎ:' : (i18n.currentLocale === 'om' ? 'Isin:' : 'You:');
                const nowTag = i18n.currentLocale === 'am' ? 'አሁን' : (i18n.currentLocale === 'om' ? 'Amma' : 'Just now');
                newComment.innerHTML = `<strong style="color: #4ADE80;">${userTag}</strong> ${text} <span style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); float: right;">${nowTag}</span>`;
                list.appendChild(newComment);
                input.value = '';
                list.scrollTop = list.scrollHeight;
                Toast.show(i18n.currentLocale === 'am' ? 'አስተያየት ተለጥፏል!' : (i18n.currentLocale === 'om' ? 'Yaadni maxxanfameera!' : 'Comment posted!'), 'success');
            });

            // REQ 14: SHARE / FOOTBALL INVITATION
            const shareBtn = card.querySelector('.btn-review-share') as HTMLButtonElement;
            shareBtn?.addEventListener('click', async () => {
                this._audioManager.playClick();
                const shareText = i18n.currentLocale === 'am'
                    ? `⚽ በኢትዮ ቴሌኮም የእግር ኳስ ውድድር ላይ እየተወዳደርኩ ነው!\nየ ${this._finalScore} ነጥቤን ማሸነፍ ትችላለህ?\nአሁኑኑ ውድድሩን ተቀላቀል እና ተፎካከረኝ!`
                    : (i18n.currentLocale === 'om'
                        ? `⚽ Dorgoommii Kubbaa Miilaa Itooyyo Telekoom irratti dorgomaan jira!\nQabxii koo ${this._finalScore} mo'achuu dandeessa?\nAmma dorgommiitti makamii na qori!`
                        : `⚽ I'm competing in the Ethio Telecom Football Tournament!\nCan you beat my score of ${this._finalScore} PTS?\nJoin the competition and challenge me now!`);
                
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Ethio Telecom Football League',
                            text: shareText,
                            url: window.location.href
                        });
                    } catch (e) {}
                } else {
                    await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
                    Toast.show(
                        i18n.currentLocale === 'am'
                            ? 'የእግር ኳስ መጋበዣ ሊንክ ወደ ቅሊፕቦርድ ተገልብጧል! ለመፎካከር ለጓደኞችዎ ያጋሩ።'
                            : (i18n.currentLocale === 'om'
                                ? 'Geessituun affeerraa kubbaa miilaa kooppii ta\'eera! Hiriyoota keetiif qooduun isaan qori.'
                                : 'Football invitation link copied to clipboard! Share with friends to challenge them.'),
                        'success'
                    );
                }
            });
        });
    }
}

