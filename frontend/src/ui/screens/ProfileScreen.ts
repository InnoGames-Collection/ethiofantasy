import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { ProgressionManager } from '../../core/managers/ProgressionManager';
import { DesignSystem } from '../theme/DesignSystem';
import { PullToRefresh } from '../components/PullToRefresh';
import { i18n } from '../../localization/i18n';
import { MessageCenterService } from '../../networking/services/MessageCenterService';
import { LeaderboardService } from '../../core/leaderboard/LeaderboardService';
import { EthioProfileUI } from '../components/EthioProfileUI';
import { AuthManager } from '../../core/auth/AuthManager';
import { ProfileIcons } from '../components/ProfileIcons';


export interface ProfileCallbacks {
    onStatistics: () => void;
    onAchievements: () => void;
    onLeaderboard: () => void;
    onSubscription: () => void;
    onMessages: () => void;
    onSettings: () => void;
    onHelp: () => void;
    onAbout: () => void;
    onPrivacy: () => void;
    onTerms: () => void;
    onAwards: () => void;
    onInvite: () => void;
    onIdentity: () => void;
    onFaq: () => void;
}

export class ProfileScreen {
    private _uiManager: UIManager;
    private _saveManager: SaveManager;
    private _audioManager: AudioManager;
    private _callbacks: ProfileCallbacks;
    private _unsubscribeBadge: (() => void) | null = null;

    constructor(
        uiManager: UIManager,
        saveManager: SaveManager,
        audioManager: AudioManager,
        callbacks: ProfileCallbacks
    ) {
        this._uiManager = uiManager;
        this._saveManager = saveManager;
        this._audioManager = audioManager;
        this._callbacks = callbacks;

        this._unsubscribeBadge = MessageCenterService.getInstance().subscribeToBadgeUpdates(() => {
            const badgeEl = document.getElementById('profile-msg-badge');
            if (badgeEl) {
                const count = MessageCenterService.getInstance().getTotalUnreadCount();
                if (count > 0) {
                    badgeEl.innerText = count > 99 ? '99+' : count.toString();
                    badgeEl.style.display = 'inline-block';
                } else {
                    badgeEl.style.display = 'none';
                }
            }
        });
    }

    public destroy(): void {
        if (this._unsubscribeBadge) this._unsubscribeBadge();
    }

    public render(): void {
        const root = this._uiManager.container;
        root.innerHTML = DesignSystem.SkeletonProfile();
        
        setTimeout(() => {
            this._renderActual();
        }, 300);
    }

    private _renderActual(): void {
        const root = this._uiManager.container;
        const profile = this._saveManager.profile;
        const division = ProgressionManager.getDivision(profile.xp);



        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; overflow-y: auto; padding-bottom: 120px;">
                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>
                
                <!-- TOP HEADER -->
                <div style="
                    background: linear-gradient(180deg, rgba(0,200,83,0.2) 0%, rgba(7,27,45,0) 100%);
                    padding: 32px 16px 16px 16px;
                    text-align: center;
                ">
                    <div style="
                        width: 80px; height: 80px; 
                        border-radius: 50%; 
                        background: var(--tv-gold-primary); 
                        display: flex; align-items: center; justify-content: center; 
                        font-size: 40px; 
                        margin: 0 auto 16px auto;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                        border: 3px solid white;
                    ">👤</div>
                    <div style="font-size: var(--fds-font-lg); font-weight: 900; color: var(--fds-text-main); margin-bottom: 4px;">
                        ${profile.username}
                    </div>
                    <div style="font-size: var(--fds-font-sm); font-weight: 700; color: rgba(255,255,255,0.7); margin-bottom: 16px; font-family: var(--tv-mono);">
                        ${profile.phone ? this._maskPhone(profile.phone) : 'GUEST_PLAYER'}
                    </div>
                </div>

                <!-- PLAYER PERFORMANCE -->
                <div class="ethio-profile-card" style="
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    padding: 16px 0;
                    margin: 0 16px 24px 16px;
                    text-align: center;
                ">
                    <div>
                        <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? 'ሊግ' : (i18n.currentLocale === 'om' ? 'LIIGII' : 'LEAGUE')}</div>
                        <div style="font-size: var(--fds-font-sm); font-weight: 900; color: ${division.color};">${division.name}</div>
                    </div>
                    <div style="border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);">
                        <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--fds-text-dim); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? 'ደረጃ' : (i18n.currentLocale === 'om' ? 'SADARKAA' : 'RANK')}</div>
                        <div id="profile-daily-rank" style="font-size: var(--fds-font-sm); font-weight: 900; color: var(--fds-text-main);">--</div>
                    </div>
                    <div>
                        <div style="font-size: var(--fds-font-xs); font-weight: 800; color: var(--tv-gold-primary); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? 'ነጥቦች' : (i18n.currentLocale === 'om' ? 'QABXII' : 'POINTS')}</div>
                        <div style="font-size: var(--fds-font-lg); font-weight: 900; color: #FFD54F; text-shadow: 0 0 12px rgba(255, 213, 79, 0.4);">${profile.xp} XP</div>
                    </div>
                </div>

                <!-- PROFILE ACTIONS -->
                <div style="max-width: 600px; margin: 0 auto; padding: 0 16px;">
                    
                    ${EthioProfileUI.renderCard(`
                        ${EthioProfileUI.renderNavRow(ProfileIcons.statistics, i18n.currentLocale === 'am' ? 'ስታቲስቲክስ' : 'Statistics', 'stats')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.achievements, i18n.currentLocale === 'am' ? 'ስኬቶች' : 'Achievements', 'achievements')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.awards, i18n.currentLocale === 'am' ? 'የእኔ ሽልማቶች' : 'My Awards', 'awards')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.leaderboard, i18n.currentLocale === 'am' ? 'የመሪዎች ሰሌዳ' : 'Leaderboard', 'leaderboard', '', true, '', true)}
                    `, 'PERFORMANCE')}

                    ${EthioProfileUI.renderCard(`
                        ${EthioProfileUI.renderNavRow(ProfileIcons.identity, i18n.currentLocale === 'am' ? 'ማንነት' : 'Identity', 'identity')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.invite, i18n.currentLocale === 'am' ? 'ጓደኞችን ይጋብዙ' : 'Invite Friends', 'invite')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.messages, i18n.currentLocale === 'am' ? 'መልዕክቶች' : 'Messages', 'messages', '', true, 'profile-msg-badge', true)}
                    `, 'ACCOUNT')}

                    ${EthioProfileUI.renderCard(`
                        ${EthioProfileUI.renderNavRow(ProfileIcons.subscription, i18n.currentLocale === 'am' ? 'ምዝገባ' : 'Subscription', 'subscription')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.settings, i18n.currentLocale === 'am' ? 'ቅንብሮች' : 'Settings', 'settings')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.help, i18n.currentLocale === 'am' ? 'እገዛ እና ድጋፍ' : 'Help & Support', 'help', '', true, '', true)}
                    `, 'SERVICE')}

                    ${EthioProfileUI.renderCard(`
                        ${EthioProfileUI.renderNavRow(ProfileIcons.about, i18n.currentLocale === 'am' ? 'ስለ እኛ' : 'About', 'about')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.faq, i18n.currentLocale === 'am' ? 'አዘውትረው የሚጠየቁ ጥያቄዎች' : 'FAQ', 'faq')}
                        ${EthioProfileUI.renderNavRow(ProfileIcons.terms, i18n.currentLocale === 'am' ? 'ደንቦች እና ሁኔታዎች' : 'Terms & Conditions', 'terms', '', true, '', true)}
                    `, 'INFORMATION')}
                    
                    ${EthioProfileUI.renderCard(`
                        ${EthioProfileUI.renderNavRow(ProfileIcons.logout, i18n.currentLocale === 'am' ? 'ውጣ' : 'Log Out', 'logout', '', false, '', true)}
                    `, 'SESSION')}

                </div>
            </div>

            <!-- Profile Interactive Modals Container -->
            <div id="profile-action-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; pointer-events: auto;">
                <div class="glass-card" style="width: 100%; max-width: 400px; padding: 24px; border-color: var(--tv-gold-primary); text-align: center; background: var(--ethio-deep-navy); position: relative;">
                    <button id="btn-close-prof-modal" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: var(--fds-text-dim); font-size: var(--fds-font-md); cursor: pointer;">✖</button>
                    <div id="prof-modal-content" style="max-height: 70vh; overflow-y: auto;" class="hide-scrollbar"></div>
                </div>
            </div>

            <style>
                .list-tile:active { background: rgba(255,255,255,0.08); }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            </style>
        `;

        this._bindEvents();

        // Initial badge sync
        const count = MessageCenterService.getInstance().getTotalUnreadCount();
        const badgeEl = document.getElementById('profile-msg-badge');
        if (badgeEl) {
            if (count > 0) {
                badgeEl.innerText = count > 99 ? '99+' : count.toString();
                badgeEl.style.display = 'inline-block';
            } else {
                badgeEl.style.display = 'none';
            }
        }

        // Fetch daily rank from server asynchronously
        LeaderboardService.getInstance().getMyDailyStats().then(stats => {
            const rankEl = document.getElementById('profile-daily-rank');
            if (rankEl) rankEl.textContent = stats ? `#${stats.rank}` : 'Unranked';
        }).catch(() => {
            const rankEl = document.getElementById('profile-daily-rank');
            if (rankEl) rankEl.textContent = 'Unranked';
        });
    }

    private _bindEvents(): void {
        const root = this._uiManager.container;
        const modal = document.getElementById('profile-action-modal');
        const modalContent = document.getElementById('prof-modal-content');
        const closeModal = document.getElementById('btn-close-prof-modal');

        const showModal = (html: string) => {
            if (modal && modalContent) {
                modalContent.innerHTML = html;
                modal.style.display = 'flex';
            }
        };

        closeModal?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (modal) modal.style.display = 'none';
        });

        const tiles = root.querySelectorAll('.profile-menu-tile');
        tiles.forEach(tile => {
            tile.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const action = target.getAttribute('data-action');
                if (!action) return;

                this._audioManager.playClick();

                switch (action) {
                    case 'stats':
                        this._callbacks.onStatistics();
                        break;
                    case 'leaderboard':
                        this._callbacks.onLeaderboard();
                        break;
                    case 'subscription':
                        this._callbacks.onSubscription();
                        break;
                    case 'messages':
                        this._callbacks.onMessages();
                        break;
                    case 'settings':
                        this._callbacks.onSettings();
                        break;
                    case 'help':
                        this._callbacks.onHelp();
                        break;
                    case 'about':
                        this._callbacks.onAbout();
                        break;
                    case 'privacy':
                        this._callbacks.onPrivacy();
                        break;
                    case 'terms':
                        this._callbacks.onTerms();
                        break;
                    
                    case 'invite':
                        this._callbacks.onInvite();
                        break;

                    case 'achievements':
                        this._callbacks.onAchievements();
                        break;

                    case 'awards':
                        this._callbacks.onAwards();
                        break;

                    case 'identity':
                        this._callbacks.onIdentity();
                        break;

                    case 'faq':
                        this._callbacks.onFaq();
                        break;

                    case 'logout':
                        showModal(`
                            <div style="font-size: 40px; margin-bottom: 12px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🚪</div>
                            <div style="font-size: 18px; font-weight: 900; color: var(--fds-red-live); margin-bottom: 8px;">Log Out?</div>
                            <div style="font-size: 15px; color: var(--fds-text-muted); margin-bottom: 24px; line-height: 1.5;">Are you sure you want to log out of EthioFantasy?</div>
                            <div style="display: flex; gap: 12px; margin-top: 16px;">
                                <div id="btn-cancel-logout" style="flex: 1; padding: 14px; text-align: center; background: rgba(255,255,255,0.1); border-radius: 12px; font-weight: 800; cursor: pointer;">Cancel</div>
                                <div id="btn-confirm-logout" style="flex: 1; padding: 14px; text-align: center; background: var(--fds-red-live); border-radius: 12px; font-weight: 800; cursor: pointer; color: white;">Log Out</div>
                            </div>
                        `);

                        document.getElementById('btn-cancel-logout')?.addEventListener('click', () => {
                            this._audioManager.playClick();
                            if (modal) modal.style.display = 'none';
                        });

                        document.getElementById('btn-confirm-logout')?.addEventListener('click', async (e) => {
                            const btn = e.currentTarget as HTMLElement;
                            if (btn.style.opacity === '0.5') return; // disabled state
                            
                            this._audioManager.playClick();
                            btn.style.opacity = '0.5';
                            btn.style.pointerEvents = 'none';
                            btn.innerHTML = 'Logging out...';
                            
                            try {
                                await AuthManager.getInstance().signOut();
                                localStorage.removeItem('ETHIO_FOOTBALL_AUTH_V2');
                                localStorage.removeItem('ETHIO_FOOTBALL_SAVE_V1');
                                // Using replace to clear history stack on Android so Back doesn't reopen profile
                                window.location.replace(window.location.origin + window.location.pathname);
                            } catch (err) {
                                console.error('Logout error:', err);
                                showModal(`
                                    <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
                                    <div style="font-size: 18px; font-weight: 900; color: var(--fds-red-live); margin-bottom: 8px;">Error</div>
                                    <div style="font-size: 15px; color: var(--fds-text-muted); margin-bottom: 24px;">Unable to log out. Please try again.</div>
                                    <div style="display: flex; gap: 12px;">
                                        <div id="btn-cancel-error" style="flex: 1; padding: 14px; text-align: center; background: rgba(255,255,255,0.1); border-radius: 12px; font-weight: 800; cursor: pointer;">Cancel</div>
                                        <div id="btn-retry-logout" style="flex: 1; padding: 14px; text-align: center; background: var(--tv-gold-primary); border-radius: 12px; font-weight: 800; cursor: pointer; color: white;">Retry</div>
                                    </div>
                                `);
                                
                                document.getElementById('btn-cancel-error')?.addEventListener('click', () => {
                                    this._audioManager.playClick();
                                    if (modal) modal.style.display = 'none';
                                });
                                
                                document.getElementById('btn-retry-logout')?.addEventListener('click', () => {
                                    this._audioManager.playClick();
                                    const logoutTile = root.querySelector('[data-action="logout"]') as HTMLElement;
                                    if (logoutTile) logoutTile.click();
                                });
                            }
                        });
                        break;
                }
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
        if (!clean.startsWith('251')) {
            clean = '251' + clean.replace(/^0+/, '');
        }
        return clean.substring(0, 4) + '****' + clean.substring(clean.length - 2);
    }
}
