import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { SaveManager } from '../../core/managers/SaveManager';
import { ProgressionManager } from '../../core/managers/ProgressionManager';
import { LeaderboardService } from '../../core/leaderboard/LeaderboardService';
import { PullToRefresh } from '../components/PullToRefresh';
import { DesignSystem } from '../theme/DesignSystem';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export class LeaderboardScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _saveManager: SaveManager;
    private _onClose: () => void;
    private _activeTab: 'daily' | 'weekly' | 'monthly' = 'daily';
    private _previousRank: number | '--' | null = null;

    constructor(uiManager: UIManager, saveManager: SaveManager, audioManager: AudioManager, onClose: () => void) {
        this._uiManager = uiManager;
        this._saveManager = saveManager;
        this._audioManager = audioManager;
        this._onClose = onClose;
    }

    public async render(): Promise<void> {
        const root = this._uiManager.container;
        root.innerHTML = DesignSystem.LoadingState(i18n.currentLocale === 'am' ? 'ደረጃዎችን በማስገባት ላይ...' : (i18n.currentLocale === 'om' ? "Sadarkaa fe'aa jira..." : 'Loading rankings...'));
        
        const profile = this._saveManager.profile;
        const division = ProgressionManager.getDivision(profile.xp);

        // Fetch ranking data dynamically from LeaderboardService
        let rawEntries: any[] = [];
        if (this._activeTab === 'daily') {
            rawEntries = await LeaderboardService.getInstance().getLeaderboard(undefined, 'daily');
        } else {
            const TournamentService = (await import('../../core/competition/TournamentService')).TournamentService;
            const tourneyEntries = await TournamentService.getInstance().getLeaderboard(this._activeTab);
            rawEntries = tourneyEntries.map(e => ({
                userId: e.userId,
                username: e.username,
                score: e.score,
                matchesPlayed: e.matchesPlayed
            }));
        }

        const processedEntries = rawEntries.map((entry: any) => {
            const isMe = entry.username === profile.username;
            
            const isPhone = /^\\+?[0-9]{9,}$/.test((entry.username || '').replace(/[^0-9+]/g, ''));
            const displayName = isPhone ? this._maskPhone(entry.username) : (entry.username || (i18n.currentLocale === 'am' ? 'ያልታወቀ' : (i18n.currentLocale === 'om' ? 'Namummaa Hin Beekamne' : 'Anonymous')));
            
            // score = total match points (from game_sessions); eloRating = matchmaking ranking
            const score = entry.score || 0;
            const eloRating = entry.eloRating || 0;
            const entryDiv = ProgressionManager.getDivision(score);

            return {
                msisdn: displayName,
                score,
                eloRating,
                points: score,
                league: entryDiv.name,
                isMe
            };
        });

        // Sort entries by score descending
        processedEntries.sort((a: any, b: any) => b.score - a.score);

        const firstPlace = processedEntries[0];
        const secondPlace = processedEntries[1];
        const thirdPlace = processedEntries[2];

        const remainingEntries = processedEntries.slice(3);

        // Tab style helper
        const tabStyle = (tabId: typeof this._activeTab) => {
            const active = this._activeTab === tabId;
            return `
                flex: 1;
                padding: 10px 4px;
                border-radius: 8px;
                border: 1px solid ${active ? '#FFD54F' : 'rgba(255,255,255,0.1)'};
                background: ${active ? 'rgba(255,213,79,0.15)' : 'linear-gradient(135deg, rgba(7, 27, 45, 0.8) 0%, rgba(7, 27, 45, 0.6) 100%)'};
                color: ${active ? '#FFD54F' : '#94A3B8'};
                font-weight: 800;
                font-size: var(--fds-font-xs);
                cursor: pointer;
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
        };

        const myIndex = processedEntries.findIndex((e: any) => e.isMe);
        const myRank = myIndex !== -1 ? myIndex + 1 : '--';
        
        let rankDiffHtml = '';
        if (this._previousRank !== null && myRank !== '--' && this._previousRank !== '--') {
            const diff = (this._previousRank as number) - (myRank as number);
            if (diff > 0) {
                rankDiffHtml = `<span class="rank-diff-anim rank-diff-up">▲ +${diff} Positions</span>`;
            } else if (diff < 0) {
                rankDiffHtml = `<span class="rank-diff-anim rank-diff-down">▼ ${diff} Positions</span>`;
            }
        }
        this._previousRank = myRank;

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; padding-bottom: 60px; overflow-y: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                
                <!-- STADIUM LIGHT BEAMS -->
                <div class="stadium-beam stadium-beam-left"></div>
                <div class="stadium-beam stadium-beam-right"></div>

                <!-- TOP BAR -->
                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'ደረጃ' : (i18n.currentLocale === 'om' ? 'SADARKAA' : 'RANK'), '', false)}

                <div style="max-width: 900px; margin: 0 auto; padding: 16px;">
                    
                    <!-- PERIOD TABS -->
                    <div style="display: flex; gap: 8px; margin-bottom: 20px;" class="fade-in-up">
                        <button class="lb-tab-btn" data-tab="daily" style="${tabStyle('daily')}">${i18n.currentLocale === 'am' ? 'ዕለታዊ' : (i18n.currentLocale === 'om' ? 'GUYYAA' : 'DAILY')}</button>
                        <button class="lb-tab-btn" data-tab="weekly" style="${tabStyle('weekly')}">${i18n.currentLocale === 'am' ? 'ሳምንታዊ' : (i18n.currentLocale === 'om' ? 'TORBEE' : 'WEEKLY')}</button>
                        <button class="lb-tab-btn" data-tab="monthly" style="${tabStyle('monthly')}">${i18n.currentLocale === 'am' ? 'ወርሃዊ' : (i18n.currentLocale === 'om' ? "JI'A" : 'MONTHLY')}</button>
                    </div>

                    <!-- 1. PODIUM CARDS (TOP 3 CHAMPIONS) -->
                    ${processedEntries.length === 0 ? DesignSystem.EmptyState('🏆', i18n.currentLocale === 'am' ? 'እስካሁን የተሰለፈ ተጫዋች የለም።' : (i18n.currentLocale === 'om' ? 'Hamma ammaatti taphataan sadarkaa qabate hin jiru.' : 'No players ranked yet.')) : `
                    <div style="display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 12px; align-items: end; margin-bottom: 24px; text-align: center;" class="fade-in-up">
                        
                        <!-- 2ND PLACE PODIUM (SILVER) -->
                        ${secondPlace ? `
                        <div class="ethio-profile-card" style="padding: 16px 8px; border-color: #C0C0C0;">
                            <div style="font-size: var(--fds-font-xl); margin-bottom: 4px;">🥈</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 900; color: #E2E8F0; text-transform: uppercase;">${i18n.currentLocale === 'am' ? '2ኛ' : (i18n.currentLocale === 'om' ? '2FFAA' : '2ND')}</div>
                            <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--fds-text-main); margin-top: 4px;">${secondPlace.msisdn}</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 900; color: var(--fds-blue-accent); margin-top: 2px;">${secondPlace.score} PTS</div>
                            <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); margin-top: 2px;">${secondPlace.points} XP</div>
                        </div>
                        ` : `<div style="visibility: hidden;"></div>`}

                        <!-- 1ST PLACE PODIUM (GOLD CHAMPION) -->
                        ${firstPlace ? `
                        <div class="ethio-profile-card" style="padding: 20px 8px; border-color: #FFD54F; box-shadow: 0 10px 30px rgba(255, 213, 79, 0.3); transform: translateY(-8px);">
                            <div style="font-size: 36px; margin-bottom: 4px; filter: drop-shadow(0 0 10px rgba(255,213,79,0.6));">🥇</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 900; color: #FFD54F; text-transform: uppercase; letter-spacing: 1px;">${i18n.currentLocale === 'am' ? 'ሻምፒዮን' : (i18n.currentLocale === 'om' ? 'CHAAMPIYOONA' : 'CHAMPION')}</div>
                            <div style="font-size: var(--fds-font-sm); font-weight: 900; color: white; margin-top: 4px;">${firstPlace.msisdn}</div>
                            <div style="font-size: var(--fds-font-sm); font-weight: 900; color: #FFD54F; margin-top: 2px;">${firstPlace.score} PTS</div>
                            <div style="font-size: var(--fds-font-xs); color: #FEF08A; margin-top: 2px;">🏆 ${firstPlace.points} XP</div>
                        </div>
                        ` : `<div style="visibility: hidden;"></div>`}

                        <!-- 3RD PLACE PODIUM (BRONZE) -->
                        ${thirdPlace ? `
                        <div class="ethio-profile-card" style="padding: 16px 8px; border-color: #CD7F32;">
                            <div style="font-size: var(--fds-font-xl); margin-bottom: 4px;">🥉</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 900; color: #FDBA74; text-transform: uppercase;">${i18n.currentLocale === 'am' ? '3ኛ' : (i18n.currentLocale === 'om' ? '3FFAA' : '3RD')}</div>
                            <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--fds-text-main); margin-top: 4px;">${thirdPlace.msisdn}</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 900; color: #CD7F32; margin-top: 2px;">${thirdPlace.score} PTS</div>
                            <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); margin-top: 2px;">${thirdPlace.points} XP</div>
                        </div>
                        ` : `<div style="visibility: hidden;"></div>`}
                    </div>
                    `}

                    <!-- 2. CURRENT USER STATS BANNER -->
                    <div class="ethio-profile-card fade-in-up" style="padding: 14px 16px; border-color: #00C853; box-shadow: 0 0 20px rgba(0, 200, 83, 0.15); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">⚽</span>
                            <div>
                                <div style="font-size: var(--fds-font-xs); color: #00C853; font-weight: 800; text-transform: uppercase;">${i18n.currentLocale === 'am' ? 'የእርስዎ የደረጃ ቦታ' : (i18n.currentLocale === 'om' ? 'SADARKAA KEE' : 'YOUR RANK POSITION')}</div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    ${myRank === '--' ? `
                                        <div style="font-size: var(--fds-font-xs); color: rgba(255,255,255,0.7); font-weight: 500; margin-top: 2px;">
                                            Play matches to earn points and secure your rank.
                                        </div>
                                    ` : `
                                        <div style="font-size: var(--fds-font-md); font-weight: 900; color: white;">
                                            ${i18n.currentLocale === 'am' ? `#${myRank} በ ${division.name} ሊግ` : (i18n.currentLocale === 'om' ? `#${myRank} Liigii ${division.name} Keessatti` : `#${myRank} In ${division.name} League`)}
                                        </div>
                                    `}
                                    ${rankDiffHtml}
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: var(--fds-font-sm); font-weight: 900; color: #FFD54F;">${profile.xp || 0} PTS</div>
                            <div style="font-size: var(--fds-font-xs); color: var(--fds-text-muted);">${profile.totalMatches || 0} Matches</div>
                        </div>
                    </div>

                    <!-- 3. REMAINING RANKINGS LIST (4TH+) -->
                    <div style="display: flex; flex-direction: column; gap: 8px;" class="fade-in-up">
                        ${remainingEntries.map((entry: any, idx: number) => {
                            const rank = idx + 4;
                            const isMe = entry.isMe;
                            return `
                                <div class="ethio-profile-card interactive" style="
                                    display: flex; 
                                    justify-content: space-between; 
                                    align-items: center; 
                                    padding: 12px 16px; 
                                    border-color: ${isMe ? '#00C853' : 'rgba(255,255,255,0.08)'}; 
                                ">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--fds-text-dim); min-width: 24px;">#${rank}</span>
                                        <div>
                                            <div style="font-size: var(--fds-font-sm); font-weight: 900; color: ${isMe ? '#00C853' : 'white'};">
                                                ${entry.msisdn} ${isMe ? `<span style="background: #00C853; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 900; margin-left: 6px;">${i18n.currentLocale === 'am' ? 'እርስዎ' : (i18n.currentLocale === 'om' ? 'ATI' : 'YOU')}</span>` : ''}
                                            </div>
                                            <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim);">${i18n.currentLocale === 'am' ? `${entry.league} ሊግ` : (i18n.currentLocale === 'om' ? `Liigii ${entry.league}` : `${entry.league} League`)}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: var(--fds-font-sm); font-weight: 900; color: #FFD54F;">${entry.score} PTS</div>
                                        <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim);">${entry.points} XP</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    private _bindEvents(): void {
        const root = this._uiManager.container;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onClose();
        });

        root.querySelectorAll('.lb-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._audioManager.playClick();
                const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
                this._activeTab = tab;
                this.render();
            });
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

    private _maskPhone(phone: string): string {
        let clean = phone.replace(/[^0-9]/g, '');
        if (phone.startsWith('+')) {
            clean = phone.substring(1);
        } else {
            clean = phone;
        }
        if (clean.startsWith('251')) {
            clean = '251' + clean.replace(/^0+/, '');
        }
        return clean.substring(0, 4) + '****' + clean.substring(clean.length - 2);
    }
}
