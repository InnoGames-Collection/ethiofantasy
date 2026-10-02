import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { AwardsService, AwardRecord } from '../../networking/services/AwardsService';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';
import { DesignSystem } from '../theme/DesignSystem';
import { AuthManager } from '../../core/auth/AuthManager';

type AwardTab = 'daily' | 'weekly' | 'monthly';

export class AwardsScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onBack: () => void;
    private _activeTab: AwardTab = 'daily';
    private _awards: AwardRecord[] = [];
    private _loading: boolean = true;
    private _error: string | null = null;

    constructor(uiManager: UIManager, audioManager: AudioManager, onBack: () => void) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onBack = onBack;
        this._loadAwards();
    }

    private async _loadAwards(): Promise<void> {
        this._loading = true;
        this._error = null;
        this.render();

        try {
            this._awards = await AwardsService.getInstance().getAwards(this._activeTab);
        } catch (e) {
            this._error = 'Failed to load awards. Please try again.';
        } finally {
            this._loading = false;
            this.render();
        }
    }

    public render(): void {
        const root = this._uiManager.container;

        const tabStyle = (tab: AwardTab) => {
            const isActive = this._activeTab === tab;
            if (isActive) {
                return `
                    flex: 1;
                    background: linear-gradient(135deg, var(--fds-green-pitch) 0%, var(--fds-green-dark) 100%);
                    border: 1px solid rgba(74, 222, 128, 0.4);
                    color: white;
                    font-weight: 900;
                    padding: 12px 0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                    text-transform: uppercase;
                    box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4);
                `;
            } else {
                return `
                    flex: 1;
                    background: rgba(7, 27, 45, 0.7);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: var(--fds-text-dim);
                    font-weight: 700;
                    padding: 12px 0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                    text-transform: uppercase;
                `;
            }
        };

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; min-height: 100vh; overflow-y: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                <div style="max-width: 800px; margin: 0 auto; position: relative; z-index: 10; padding-bottom: 120px;">
                    <!-- App Bar -->
                    ${EthioFantasyAppBar.render('My Awards')}

                    <div style="padding: 0 16px;">
                        
                        <!-- Internal Tabs -->
                        <div style="display: flex; gap: 8px; margin-bottom: 24px;">
                            <button class="award-tab" data-tab="daily" style="${tabStyle('daily')}">Daily</button>
                            <button class="award-tab" data-tab="weekly" style="${tabStyle('weekly')}">Weekly</button>
                            <button class="award-tab" data-tab="monthly" style="${tabStyle('monthly')}">Monthly</button>
                        </div>

                        <div id="awards-content-area">
                            ${this._renderContent()}
                        </div>

                    </div>
                </div>
            </div>
            <style>
                .award-tab:active { transform: scale(0.96); }
            </style>
        `;

        this._bindEvents();
    }

    private _renderContent(): string {
        if (this._loading) {
            return DesignSystem.LoadingState('Loading awards...');
        }

        if (this._error) {
            return `
                <div style="text-align: center; padding: 40px 16px;">
                    ${DesignSystem.ErrorState('btn-retry-awards')}
                    <div style="font-size: var(--fds-font-sm); color: var(--fds-text-dim); margin-top: 12px;">${this._error}</div>
                </div>
            `;
        }

        // Filter for ONLY the current user's awards
        const currentPhone = AuthManager.getInstance().currentUser?.phone || '';
        const userAwards = this._awards.filter(a => a.userMsisdn === currentPhone);
        
        if (userAwards.length === 0) {
            return `
                <div style="text-align: center; padding: 60px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="font-size: 80px; margin-bottom: 24px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));">🏆</div>
                    <div style="font-size: 20px; font-weight: 900; color: white; margin-bottom: 12px;">No tournament awards yet</div>
                    <div style="color: var(--fds-text-dim); font-size: 14px; margin-bottom: 32px; max-width: 280px; line-height: 1.5;">Compete in tournaments to earn rewards.</div>
                    <button class="ethio-profile-btn ethio-profile-btn-secondary" style="max-width: 240px;" id="btn-view-tournaments">VIEW TOURNAMENTS</button>
                </div>
            `;
        }

        let html = `<div style="display: flex; flex-direction: column; gap: 16px;" class="fade-in-up">`;
        userAwards.forEach(award => {
            html += this._renderAwardCard(award);
        });
        html += `</div>`;

        return html;
    }

    private _renderAwardCard(award: AwardRecord): string {
        let badge = '';
        if (award.rank === 1) badge = '🥇 1st Place';
        else if (award.rank === 2) badge = '🥈 2nd Place';
        else if (award.rank === 3) badge = '🥉 3rd Place';
        else badge = `🏅 ${award.rank}th Place`;

        const dateStr = new Date(award.tournamentEndDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Mock status since backend model doesn't have it, but standardizing as Paid based on requirements
        const status = 'Paid';

        return `
            <div class="glass-card" style="
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(7, 27, 45, 0.7);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-radius: 16px;
                position: relative;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 15px; font-weight: 800; color: white;">
                        ${this._capitalize(award.tournamentType)} Tournament
                    </div>
                    <div style="background: rgba(0, 200, 83, 0.2); color: #4ADE80; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;">
                        ${status}
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--fds-text-dim);">Position</span>
                        <span style="font-size: 14px; font-weight: 800; color: var(--fds-text-main);">${badge}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--fds-text-dim);">Award Amount</span>
                        <span style="font-size: 15px; font-weight: 900; color: var(--tv-gold-primary);">${award.prizeAmount.toLocaleString()} ${award.currency}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--fds-text-dim);">Date</span>
                        <span style="font-size: 14px; font-weight: 800; color: var(--fds-text-main);">${dateStr}</span>
                    </div>
                </div>
            </div>
        `;
    }

    private _capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private _bindEvents(): void {
        const root = this._uiManager.container;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onBack();
        });

        root.querySelectorAll('.award-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as AwardTab;
                if (tab && tab !== this._activeTab) {
                    this._audioManager.playClick();
                    this._activeTab = tab;
                    this._loadAwards();
                }
            });
        });

        root.querySelector('#btn-view-tournaments')?.addEventListener('click', () => {
            this._audioManager.playClick();
            // Fallback: Just pop the screen if no router callback exists for Tournaments
            this._onBack();
        });

        root.querySelector('#btn-retry-awards')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._loadAwards();
        });
    }
}