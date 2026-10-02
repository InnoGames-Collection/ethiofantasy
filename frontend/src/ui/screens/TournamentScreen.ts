import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { DesignSystem } from '../theme/DesignSystem';
import { i18n } from '../../localization/i18n';
import { TournamentService, TournamentLeaderboardEntry } from '../../core/competition/TournamentService';
import { DailyChallengeManager } from '../../core/competition/DailyChallengeManager';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export class TournamentScreen {
    private _currentTab: 'weekly' | 'monthly' | 'yearly' = 'weekly';
    private _leaderboardData: TournamentLeaderboardEntry[] = [];
    private _nextChallengeTime: number = 0;
    private _countdownInterval: any;
    private _isChallengeAvailable: boolean = false;

    constructor(
        private _uiManager: UIManager,
        private _audioManager: AudioManager,
        private _onPlay: () => void,
        private _onBack: () => void
    ) {}

    public async render(): Promise<void> {
        const root = this._uiManager.container;
        
        // Fetch challenge info to know if we can play
        const challengeInfo = await DailyChallengeManager.getInstance().getTodayChallenge();
        this._isChallengeAvailable = !challengeInfo.completed && challengeInfo.questions.length > 0;
        
        // Calculate time to next midnight UTC
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setUTCHours(24, 0, 0, 0);
        this._nextChallengeTime = nextMidnight.getTime();

        this._loadLeaderboardData();

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="display: flex; flex-direction: column;">
                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'ውድድሮች' : (i18n.currentLocale === 'om' ? 'DOORGOMMII' : 'TOURNAMENTS'))}

                <!-- Next Challenge Countdown -->
                <div style="padding: 24px 20px; text-align: center; background: linear-gradient(180deg, rgba(234,179,8,0.1) 0%, transparent 100%);">
                    <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--fds-text-dim); text-transform: uppercase; margin-bottom: 8px;">
                        ${this._isChallengeAvailable 
                            ? (i18n.currentLocale === 'am' ? 'የዕለቱ ውድድር ክፍት ነው' : 'DAILY TOURNAMENT OPEN') 
                            : (i18n.currentLocale === 'am' ? 'ቀጣዩ ውድድር የሚከፈተው' : 'NEXT TOURNAMENT UNLOCKS IN')}
                    </div>
                    ${this._isChallengeAvailable ? `
                        ${DesignSystem.Button({ id: 'tourney-play-btn', text: i18n.currentLocale === 'am' ? 'አሁን ተጫወት' : 'PLAY NOW', variant: 'primary' })}
                    ` : `
                        <div id="tourney-countdown" style="font-family: var(--tv-mono); font-size: 36px; font-weight: 900; color: var(--fds-text-main); letter-spacing: 2px;">
                            --:--:--
                        </div>
                    `}
                </div>

                <!-- Tabs -->
                <div style="display: flex; padding: 0 20px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    ${['weekly', 'monthly', 'yearly'].map(tab => `
                        <button class="tourney-tab" data-tab="${tab}" style="
                            flex: 1;
                            padding: 12px 0;
                            background: transparent;
                            border: none;
                            color: ${this._currentTab === tab ? 'var(--tv-gold-primary)' : 'var(--fds-text-dim)'};
                            border-bottom: 2px solid ${this._currentTab === tab ? 'var(--tv-gold-primary)' : 'transparent'};
                            font-size: var(--fds-font-sm);
                            font-weight: ${this._currentTab === tab ? '800' : '600'};
                            text-transform: uppercase;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                            ${this._getTabLabel(tab)}
                        </button>
                    `).join('')}
                </div>

                <!-- Leaderboard List -->
                <div id="tourney-list-container" style="flex: 1; overflow-y: auto; padding: 0 20px 40px;">
                    <div style="text-align: center; padding: 40px; color: var(--fds-text-dim);">
                        Loading...
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
        this._startCountdown();
    }

    private _getTabLabel(tab: string): string {
        if (i18n.currentLocale === 'am') {
            return tab === 'weekly' ? 'ሳምንታዊ' : (tab === 'monthly' ? 'ወርሃዊ' : 'ዓመታዊ');
        } else if (i18n.currentLocale === 'om') {
            return tab === 'weekly' ? 'TORBEE' : (tab === 'monthly' ? 'JIA' : 'WAGGA');
        }
        return tab.toUpperCase();
    }

    private async _loadLeaderboardData(): Promise<void> {
        const container = document.getElementById('tourney-list-container');
        if (!container) return;

        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--fds-text-dim);">Loading...</div>`;

        this._leaderboardData = await TournamentService.getInstance().getLeaderboard(this._currentTab);
        
        if (this._leaderboardData.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;">🏆</div>
                    <div style="font-size: var(--fds-font-md); font-weight: 700; color: var(--fds-text-dim);">
                        ${i18n.currentLocale === 'am' ? 'እስካሁን ምንም ውጤት የለም' : 'No results yet.'}
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this._leaderboardData.map((entry, idx) => `
            <div style="
                display: flex; align-items: center; padding: 16px; 
                background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
                border-radius: 12px; margin-bottom: 12px;
            ">
                <div style="
                    width: 32px; font-size: 20px; font-weight: 900; 
                    color: ${idx === 0 ? 'var(--tv-gold-primary)' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : 'var(--fds-text-dim)'};
                ">
                    #${idx + 1}
                </div>
                <div style="flex: 1; padding: 0 12px;">
                    <div style="font-size: var(--fds-font-md); font-weight: 800; color: var(--fds-text-main); margin-bottom: 4px;">
                        ${entry.username}
                    </div>
                    <div style="font-size: var(--fds-font-xs); font-weight: 600; color: var(--fds-text-dim);">
                        ${entry.matchesPlayed} Matches
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--tv-pitch-green);">
                        ${entry.score.toLocaleString()}
                    </div>
                    <div style="font-size: var(--fds-font-xs); font-weight: 600; color: var(--fds-text-dim);">
                        PTS
                    </div>
                </div>
            </div>
        `).join('');
    }

    private _startCountdown(): void {
        this._stopCountdown();
        if (this._isChallengeAvailable) return;

        const el = document.getElementById('tourney-countdown');
        if (!el) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = this._nextChallengeTime - now;

            if (distance < 0) {
                this._stopCountdown();
                this.render(); // Reload to show play button
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            el.innerHTML = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        updateTimer();
        this._countdownInterval = setInterval(updateTimer, 1000);
    }

    private _stopCountdown(): void {
        if (this._countdownInterval) {
            clearInterval(this._countdownInterval);
        }
    }

    private _bindEvents(): void {
        EthioFantasyAppBar.bind(this._uiManager.container, () => {
            this._audioManager.playClick();
            this._stopCountdown();
            this._onBack();
        });

        document.getElementById('tourney-play-btn')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._stopCountdown();
            this._onPlay();
        });

        const tabs = document.querySelectorAll('.tourney-tab');
        tabs.forEach(t => {
            t.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const tab = target.getAttribute('data-tab') as any;
                if (tab !== this._currentTab) {
                    this._audioManager.playClick();
                    this._currentTab = tab;
                    // Re-render UI
                    tabs.forEach(btn => {
                        (btn as HTMLElement).style.color = 'var(--fds-text-dim)';
                        (btn as HTMLElement).style.borderBottomColor = 'transparent';
                        (btn as HTMLElement).style.fontWeight = '600';
                    });
                    target.style.color = 'var(--tv-gold-primary)';
                    target.style.borderBottomColor = 'var(--tv-gold-primary)';
                    target.style.fontWeight = '800';
                    
                    this._loadLeaderboardData();
                }
            });
        });
    }
}
