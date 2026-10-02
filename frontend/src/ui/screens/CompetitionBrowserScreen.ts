import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { CompetitionRegistry, Competition } from '../../core/quiz/CompetitionRegistry';
import { DesignSystem } from '../theme/DesignSystem';
import { PullToRefresh } from '../components/PullToRefresh';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export class CompetitionBrowserScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onSelectCompetition: (comp: Competition) => void;
    private _onClose: () => void;
    private _activeTab: string = 'live';

    constructor(
        uiManager: UIManager,
        audioManager: AudioManager,
        onSelectCompetition: (comp: Competition) => void,
        onClose: () => void
    ) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onSelectCompetition = onSelectCompetition;
        this._onClose = onClose;
    }

    public render(): void {
        const root = this._uiManager.container;
        root.innerHTML = DesignSystem.LoadingState('Loading competitions...');
        
        setTimeout(() => {
            this._renderActual();
        }, 300);
    }

    private _renderActual(): void {
        const root = this._uiManager.container;

        const tabs = [
            { id: 'live', title: 'Live' },
            { id: 'upcoming', title: 'Upcoming' },
            { id: 'completed', title: 'Completed' },
            { id: 'history', title: 'History' }
        ];

        const tabsHtml = tabs.map(tab => `
            <button class="league-tab ${this._activeTab === tab.id ? 'active-league-tab' : ''}" data-tab="${tab.id}" style="
                flex: 1;
                background: none;
                border: none;
                border-bottom: 2px solid ${this._activeTab === tab.id ? 'var(--tv-pitch-green)' : 'transparent'};
                color: ${this._activeTab === tab.id ? 'white' : '#94A3B8'};
                font-weight: ${this._activeTab === tab.id ? '900' : '700'};
                padding: 12px 0;
                cursor: pointer;
                transition: all 0.2s;
            ">${tab.title}</button>
        `).join('');

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                
                ${EthioFantasyAppBar.render('LEAGUE', '', false)}

                <div style="max-width: 960px; margin: 0 auto; padding: 16px 0 100px 0;">
                    
                    <!-- Internal Tabs -->
                    <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; padding: 0 16px;">
                        ${tabsHtml}
                    </div>

                    <div style="padding: 0 16px;" id="league-content-area">
                        ${this._renderActiveTabContent()}
                    </div>

                </div>
            </div>
            <style>
                .league-tab:hover { color: var(--fds-text-main); }
                .active-league-tab { color: var(--tv-pitch-green); }
            </style>
        `;

        this._bindEvents();
    }

    private _renderActiveTabContent(): string {
        const comps = CompetitionRegistry.getAll().filter(c => c.status === this._activeTab);

        if (comps.length > 0) {
            return `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${comps.map((comp, idx) => `
                        <div class="glass-card" style="padding: 20px; border-color: ${idx === 0 ? 'var(--tv-pitch-green)' : 'rgba(255,255,255,0.1)'};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                <div>
                                    <div style="font-size: var(--fds-font-xs); font-weight: 800; color: ${idx === 0 ? 'var(--tv-pitch-green)' : '#94A3B8'}; margin-bottom: 4px;">${comp.status === 'live' ? 'LIVE NOW' : 'UPCOMING'}</div>
                                    <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-text-main);">${comp.name}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: var(--fds-font-xs); font-weight: 800; color: #F472B6; margin-bottom: 4px;">${comp.status === 'live' ? 'ENDS IN' : 'STARTS IN'}</div>
                                    <div style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--fds-text-main);">${this._formatTimeLeft(comp.status === 'live' ? comp.end_time : comp.start_time)}</div>
                                </div>
                            </div>

                                <div>
                                    <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); font-weight: 700;">PLAYERS</div>
                                    <div style="font-size: var(--fds-font-md); font-weight: 900; color: var(--fds-text-main);">${(comp.participants || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); font-weight: 700;">PRIZE</div>
                                    <div style="font-size: var(--fds-font-md); font-weight: 900; color: var(--tv-gold-primary);">${(comp.prize_pool || 0).toLocaleString()} XP</div>
                                </div>
                            </div>
                            
                            ${idx === 0 ? `
                            <div style="margin-bottom: 24px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-main);">PROGRESS</div>
                                    <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--tv-pitch-green);">Ready</div>
                                </div>
                                ${DesignSystem.ProgressBar(0, 'var(--tv-pitch-green)')}
                            </div>
                            ` : ''}

                            ${DesignSystem.Button({ id: `btn-join-league-${comp.id}`, text: idx === 0 ? 'CONTINUE LEAGUE' : 'JOIN LEAGUE', variant: idx === 0 ? 'primary' : 'secondary', fullWidth: true })}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            return DesignSystem.EmptyState('📅', 'No Matches');
        }
    }

    private _formatTimeLeft(dateString?: string): string {
        if (!dateString) return 'TBA';
        const target = new Date(dateString).getTime();
        const now = new Date().getTime();
        const diff = target - now;
        
        if (diff <= 0) return 'SOON';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m`;
    }

    private _bindEvents(): void {
        EthioFantasyAppBar.bind(this._uiManager.container, () => {
            this._audioManager.playClick();
            this._onClose();
        });

        document.querySelectorAll('.league-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const tabId = target.getAttribute('data-tab');
                if (tabId && tabId !== this._activeTab) {
                    this._audioManager.playClick();
                    this._activeTab = tabId;
                    this.render();
                }
            });
        });

        const comps = CompetitionRegistry.getAll().filter(c => c.status === this._activeTab);
        comps.forEach(comp => {
            document.getElementById(`btn-join-league-${comp.id}`)?.addEventListener('click', () => {
                this._audioManager.playClick();
                this._onSelectCompetition(comp);
            });
        });

        // Pull to refresh
        const container = this._uiManager.container.querySelector('.stadium-container') as HTMLElement;
        if (container) {
            PullToRefresh.attach(container, async () => {
                this._audioManager.playClick();
                await new Promise(res => setTimeout(res, 500));
                this.render();
            });
        }
    }
}
