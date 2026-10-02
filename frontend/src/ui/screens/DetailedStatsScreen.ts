import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';

import { DesignSystem } from '../theme/DesignSystem';
import { GameSessionService } from '../../networking/services/GameSessionService';
import { PullToRefresh } from '../components/PullToRefresh';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';
import { EthioProfileUI } from '../components/EthioProfileUI';


export class DetailedStatsScreen {
    private _uiManager: UIManager;
    private _saveManager: SaveManager;
    private _audioManager: AudioManager;
    private _onBack: () => void;

    constructor(uiManager: UIManager, saveManager: SaveManager, audioManager: AudioManager, onBack: () => void) {
        this._uiManager = uiManager;
        this._saveManager = saveManager;
        this._audioManager = audioManager;
        this._onBack = onBack;
    }

    public async render(): Promise<void> {
        const root = this._uiManager.container;
        root.innerHTML = DesignSystem.LoadingState('Loading stats...');

        const profile = this._saveManager.profile;

        // Fetch history for detailed stats
        const sessionHistory = await GameSessionService.getInstance().getHistory(50);
        
        // Stats calculations
        let totalGames = profile.totalMatches || 0;
        let totalWins = profile.totalWins || 0;
        let winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
        
        let avgTimeMs = 0;
        let totalAccuracy = winRate;
        let totalCorrect = 0;
        let totalWrong = 0;
        let totalSkipped = 0;

        if (sessionHistory.length > 0) {
            let sumAccuracy = 0;
            let sumTime = 0;
            let sumCorrect = 0;
            let sumWrong = 0;
            let sumTotalQ = 0;

            sessionHistory.forEach(s => {
                sumAccuracy += Number(s.accuracy) || 0;
                sumTime += Number(s.avg_response_time) || 0;
                sumCorrect += Number(s.correct_count) || 0;
                sumTotalQ += Number(s.total_questions) || 10;
                sumWrong += (Number(s.total_questions) || 10) - (Number(s.correct_count) || 0);
            });

            totalAccuracy = Math.round(sumAccuracy / sessionHistory.length);
            avgTimeMs = (sumTime / sessionHistory.length) * 1000;
            
            // Re-calculate totals based on ratio from history applied to total games
            const ratioCorrect = sumCorrect / sumTotalQ;
            const ratioWrong = sumWrong / sumTotalQ;
            
            totalCorrect = Math.round(totalGames * 10 * ratioCorrect);
            totalWrong = Math.round(totalGames * 10 * ratioWrong);
        }

        const avgTimeStr = avgTimeMs > 0 ? (avgTimeMs / 1000).toFixed(1) + 's' : '--';
        const points = profile.xp;
        const highestScore = profile.highScores['football-quiz'] || 0;

        const barChart = (label: string, percentage: number, color: string) => `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <div style="font-size: var(--fds-font-xs); font-weight: 700; color: var(--fds-text-dim); text-transform: uppercase;">${label}</div>
                    <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-main);">${percentage}%</div>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.4); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 4px; box-shadow: 0 0 8px ${color}; transition: width 1s ease-out;"></div>
                </div>
            </div>
        `;

        const row = (label: string, value: string) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 14px; font-weight: 600; color: var(--fds-text-dim);">${label}</div>
                <div style="font-size: 15px; font-weight: 800; color: var(--fds-text-main);">${value}</div>
            </div>
        `;

        const renderStatGroup = (title: string, rowsHtml: string) => {
            return EthioProfileUI.renderCard(
                `<div style="display: flex; flex-direction: column;">${rowsHtml}</div>`,
                title
            );
        };

        const renderChartGroup = (title: string, chartsHtml: string) => {
            return EthioProfileUI.renderCard(
                `<div style="padding: 20px 16px 8px 16px;">${chartsHtml}</div>`,
                title
            );
        };

        let visualAnalyticsHtml = '';
        if (totalGames > 0) {
            visualAnalyticsHtml = renderChartGroup('VISUAL ANALYTICS', `
                ${barChart('Win Rate', winRate, 'var(--fds-gold-primary)')}
                ${barChart('Overall Accuracy', totalAccuracy, 'var(--fds-green-pitch)')}
            `);
        } else {
            visualAnalyticsHtml = renderChartGroup('VISUAL ANALYTICS', `
                <div style="text-align: center; padding: 24px 0; color: var(--fds-text-dim);">
                    <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;">📉</div>
                    <div style="font-size: 14px; font-weight: 600;">No match data available yet</div>
                    <div style="font-size: 12px; margin-top: 4px;">Play your first match to see analytics.</div>
                </div>
            `);
        }

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; overflow-y: auto; padding-bottom: 120px;">
                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                <!-- App Bar -->
                ${EthioFantasyAppBar.render('Statistics')}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
                    
                    ${renderStatGroup('OVERVIEW', `
                        ${row('Games Played', String(totalGames))}
                        ${row('Matches Won', String(totalWins))}
                        ${row('Accuracy', `${totalAccuracy}%`)}
                        <div style="border-bottom: none;">${row('Points / Rank Point', `${points} XP`)}</div>
                    `)}

                    ${renderStatGroup('PERFORMANCE', `
                        ${row('Highest Score', highestScore.toLocaleString())}
                        ${row('Average Response Time', avgTimeStr)}
                        ${row('Correct Answers', String(totalCorrect))}
                        ${row('Wrong Answers', String(totalWrong))}
                        <div style="border-bottom: none;">${row('Skipped Questions', String(totalSkipped))}</div>
                    `)}

                    ${visualAnalyticsHtml}

                </div>
            </div>
        `;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onBack();
        });

        // Pull to refresh
        const container = root.querySelector('.stadium-container') as HTMLElement;
        if (container) {
            PullToRefresh.attach(container, async () => {
                this._audioManager.playClick();
                await this.render();
            });
        }
    }
}
