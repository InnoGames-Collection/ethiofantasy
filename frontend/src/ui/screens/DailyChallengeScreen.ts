import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { DailyChallengeManager, DailyChallengeInfo } from '../../core/competition/DailyChallengeManager';
import { DesignSystem } from '../theme/DesignSystem';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';
import { i18n } from '../../localization/i18n';

export class DailyChallengeScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onStartChallenge: (info: DailyChallengeInfo) => void;
    private _onClose: () => void;
    private _challengeInfo: DailyChallengeInfo | null = null;
    private _timerInterval: any = null;
    private _resetHandler: (() => void) | null = null;

    constructor(
        uiManager: UIManager,
        audioManager: AudioManager,
        onStartChallenge: (info: DailyChallengeInfo) => void,
        onClose: () => void
    ) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onStartChallenge = onStartChallenge;
        this._onClose = onClose;
    }

    public async render(): Promise<void> {
        const root = this._uiManager.container;
        this._challengeInfo = await DailyChallengeManager.getInstance().getTodayChallenge();
        
        const isCompleted = this._challengeInfo?.completed ?? false;
        // Static history of challenges
        const historyList = [
            { 
                date: i18n.currentLocale === 'am' ? 'ጁላይ 21, 2026' : (i18n.currentLocale === 'om' ? 'Adoolessa 21, 2026' : 'July 21, 2026'), 
                title: i18n.currentLocale === 'am' ? 'የካፍ ቻምፒየንስ ሊግ ጥያቄዎች' : (i18n.currentLocale === 'om' ? 'Qorannoo Liigii Chaampiyoonaa CAF' : 'CAF Champions League Trivia'), 
                score: i18n.currentLocale === 'am' ? '9/10 ግቦች' : (i18n.currentLocale === 'om' ? '9/10 Galchii' : '9/10 Goals'), 
                status: i18n.currentLocale === 'am' ? 'ተጠናቋል' : (i18n.currentLocale === 'om' ? 'Xumurame' : 'Completed'), 
                badge: '🌍' 
            },
            { 
                date: i18n.currentLocale === 'am' ? 'ጁላይ 20, 2026' : (i18n.currentLocale === 'om' ? 'Adoolessa 20, 2026' : 'July 20, 2026'), 
                title: i18n.currentLocale === 'am' ? 'የዓለም ዋንጫ ጀግኖች' : (i18n.currentLocale === 'om' ? 'Seenaa Waancaa Addunyaa' : 'World Cup Legends'), 
                score: i18n.currentLocale === 'am' ? '10/10 ግቦች' : (i18n.currentLocale === 'om' ? '10/10 Galchii' : '10/10 Goals'), 
                status: i18n.currentLocale === 'am' ? 'ተጠናቋል' : (i18n.currentLocale === 'om' ? 'Xumurame' : 'Completed'), 
                badge: '🏆' 
            },
            { 
                date: i18n.currentLocale === 'am' ? 'ጁላይ 19, 2026' : (i18n.currentLocale === 'om' ? 'Adoolessa 19, 2026' : 'July 19, 2026'), 
                title: i18n.currentLocale === 'am' ? 'የእንግሊዝ ፕሪሚየር ሊግ ዝውውሮች' : (i18n.currentLocale === 'om' ? 'Jijjiarraa Liigii Piriimiyara Ingilizi' : 'English Premier League Transfers'), 
                score: i18n.currentLocale === 'am' ? '7/10 ግቦች' : (i18n.currentLocale === 'om' ? '7/10 Galchii' : '7/10 Goals'), 
                status: i18n.currentLocale === 'am' ? 'ተጠናቋል' : (i18n.currentLocale === 'om' ? 'Xumurame' : 'Completed'), 
                badge: '💰' 
            }
        ];

        const historyHtml = historyList.map(h => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: var(--fds-font-lg);">${h.badge}</span>
                    <div>
                        <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--fds-text-main);">${h.title}</div>
                        <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); margin-top: 2px;">${h.date}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--tv-pitch-green);">${h.score}</div>
                    <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); font-weight: 700; text-transform: uppercase; margin-top: 2px;">${h.status}</div>
                </div>
            </div>
        `).join('');

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                
                <!-- Top App Bar -->
                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'የዕለቱ ፈተና' : (i18n.currentLocale === 'om' ? 'QORMAATA GUYYAA' : 'DAILY CHALLENGE'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 16px 16px 120px 16px;">
                    
                    <!-- Today's Match Card -->
                    <div class="glass-card" style="
                        border-color: ${isCompleted ? 'var(--tv-pitch-green)' : 'var(--tv-gold-primary)'}; 
                        background: linear-gradient(135deg, ${isCompleted ? 'rgba(0,200,83,0.1)' : 'rgba(255,213,79,0.1)'} 0%, rgba(7,27,45,0.92) 100%); 
                        padding: 24px; 
                        text-align: center;
                        margin-bottom: 24px;
                        position: relative;
                        border-radius: 16px;
                    ">
                        <!-- Completed Badge -->
                        <div style="
                            position: absolute;
                            top: 16px; right: 16px;
                            font-size: var(--fds-font-xs);
                            font-weight: 900;
                            letter-spacing: 0.5px;
                            padding: 4px 10px;
                            border-radius: 12px;
                            background: ${isCompleted ? 'rgba(0,200,83,0.2)' : 'rgba(255,213,79,0.2)'};
                            color: ${isCompleted ? 'var(--tv-pitch-green)' : 'var(--tv-gold-primary)'};
                            border: 1px solid ${isCompleted ? 'var(--tv-pitch-green)' : 'var(--tv-gold-primary)'};
                        ">
                            ${isCompleted ? `🟢 ${i18n.currentLocale === 'am' ? 'ተጠናቋል' : (i18n.currentLocale === 'om' ? 'XUMURAME' : 'COMPLETED')}` : `🔴 ${i18n.currentLocale === 'am' ? 'በመጠባበቅ ላይ' : (i18n.currentLocale === 'om' ? 'HAFFE' : 'PENDING')}`}
                        </div>

                        <div style="font-size: 48px; margin-bottom: 12px; margin-top: 12px;">⚽</div>
                        <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${i18n.currentLocale === 'am' ? 'የዛሬው የጨዋታ ርዕስ' : (i18n.currentLocale === 'om' ? 'Mata Duree Tapha Har\'aa' : "Today's Match Topic")}</div>
                        <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-text-main); margin-bottom: 12px; line-height: 1.4;">
                            ${i18n.currentLocale === 'am' ? (this._challengeInfo?.themeAm || this._challengeInfo?.themeEn || 'የኢትዮጵያ ፕሪሚየር ሊግ ዴርቢ') : (i18n.currentLocale === 'om' ? (this._challengeInfo?.themeOm || this._challengeInfo?.themeEn || 'Derby Liigii Piriimiyara Itoophiyaa') : (this._challengeInfo?.themeEn || 'Ethiopian Premier League Derby'))}
                        </div>

                        <!-- Difficulty & Reward Grid -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div>
                                <div style="font-size: 9px; color: var(--fds-text-dim); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? 'ከባድነት' : (i18n.currentLocale === 'om' ? 'Ulfaatina' : 'Difficulty')}</div>
                                <div style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--tv-gold-primary); margin-top: 4px;">⭐⭐⭐ (${i18n.currentLocale === 'am' ? 'መካከለኛ' : (i18n.currentLocale === 'om' ? 'Giddu-galeessa' : 'Medium')})</div>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.08);">
                                <div style="font-size: 9px; color: var(--fds-text-dim); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? 'ሽልማት' : (i18n.currentLocale === 'om' ? 'Badhaasa' : 'Reward')}</div>
                                <div style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--fds-blue-accent); margin-top: 4px;">+500 XP (${i18n.currentLocale === 'am' ? '1.5x ጭማሪ' : (i18n.currentLocale === 'om' ? '1.5x Daballii' : '1.5x Boost')})</div>
                            </div>
                        </div>

                        <!-- Countdown Timer -->
                        <div style="margin-bottom: 24px;">
                            <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${i18n.currentLocale === 'am' ? 'ቀሪ ጊዜ' : (i18n.currentLocale === 'om' ? 'Yeroo Haffe' : 'Time Remaining')}</div>
                            <div id="countdown-timer" style="font-size: 18px; font-weight: 900; color: var(--fds-text-main); font-family: var(--tv-mono); letter-spacing: 1px;">--h --m --s</div>
                        </div>

                        <!-- Play Button -->
                        ${isCompleted 
                            ? `${DesignSystem.Button({ text: i18n.currentLocale === 'am' ? 'የዛሬው ጨዋታ ተጠናቋል' : (i18n.currentLocale === 'om' ? 'TAPHI HAR\'AA XUMURAMEERA' : 'MATCH COMPLETED FOR TODAY'), disabled: true, fullWidth: true, className: 'dc-completed-btn' })}`
                            : `${DesignSystem.Button({ id: 'btn-start-challenge', text: i18n.currentLocale === 'am' ? 'የዕለቱን ፈተና ጀምር' : (i18n.currentLocale === 'om' ? 'QORMAATA GUYYAA EGGI' : 'START DAILY CHALLENGE'), variant: 'primary', fullWidth: true })}`
                        }
                    </div>

                    <!-- History Section -->
                    <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 4px;">⏱️ ${i18n.currentLocale === 'am' ? 'የጨዋታ ታሪክ' : (i18n.currentLocale === 'om' ? 'Seenaa Taphaa' : 'Match History')}</div>
                    <div class="glass-card" style="border-radius: 12px; padding: 12px; border-color: rgba(255,255,255,0.08);">
                        ${historyHtml}
                    </div>

                </div>
            </div>
            <style>
                .dc-completed-btn {
                    background: rgba(255,255,255,0.05) !important;
                    color: var(--fds-text-dim) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    cursor: not-allowed !important;
                }
            </style>
        `;

        this._bindEvents();
        this._startCountdownTimer();

        if (!this._resetHandler) {
            this._resetHandler = () => {
                this.render();
            };
            window.addEventListener('ethio:dailyReset', this._resetHandler);
        }
    }

    private _startCountdownTimer(): void {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
        }

        const updateTimer = () => {
            const el = document.getElementById('countdown-timer');
            if (el) {
                const now = new Date();
                const midnight = new Date();
                midnight.setHours(24, 0, 0, 0);
                const diffMs = midnight.getTime() - now.getTime();
                
                if (diffMs <= 0) {
                    el.innerText = '00h 00m 00s';
                    clearInterval(this._timerInterval);
                    this._timerInterval = null;
                    window.dispatchEvent(new Event('ethio:dailyReset'));
                    return;
                }

                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

                const hh = String(hours).padStart(2, '0');
                const mm = String(mins).padStart(2, '0');
                const ss = String(secs).padStart(2, '0');

                el.innerText = `${hh}h ${mm}m ${ss}s`;
            }
        };

        updateTimer();
        this._timerInterval = setInterval(updateTimer, 1000);
    }

    private _bindEvents(): void {
        document.getElementById('btn-start-challenge')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (this._challengeInfo) {
                if (this._timerInterval) {
                    clearInterval(this._timerInterval);
                }
                this._onStartChallenge(this._challengeInfo);
            }
        });

        EthioFantasyAppBar.bind(this._uiManager.container, () => {
            this._audioManager.playClick();
            if (this._timerInterval) {
                clearInterval(this._timerInterval);
            }
            this._onClose();
        });
    }

    public destroy(): void {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
        if (this._resetHandler) {
            window.removeEventListener('ethio:dailyReset', this._resetHandler);
            this._resetHandler = null;
        }
    }
}
