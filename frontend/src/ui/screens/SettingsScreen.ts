import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { AuthManager } from '../../core/auth/AuthManager';
import { BottomNav } from '../components/BottomNav';
import { ProfileService } from '../../networking/services/ProfileService';
import { FAQService } from '../../networking/services/FAQService';
import { Toast } from '../components/Toast';
import { SupportService } from '../../networking/services/SupportService';

import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';
import { LogoutDialog } from '../components/LogoutDialog';


export interface AppSettings {
    soundEffects: boolean;
    notifications: {
        dailyChallenge: boolean;
        tournament: boolean;
        rewards: boolean;
        announcements: boolean;
        subscription: boolean;
        system: boolean;
    };
}

export class SettingsScreen {
    private _uiManager: UIManager;
    private _saveManager: SaveManager;
    private _audioManager: AudioManager;
    private _onBack: () => void;
    private _subScreen: 'main' | 'profile' | 'language' | 'notifications' | 'sound' | 'help' | 'terms' | 'privacy' | 'about' = 'main';
    private _defaultSubScreen: 'main' | 'profile' | 'language' | 'notifications' | 'sound' | 'help' | 'terms' | 'privacy' | 'about' = 'main';
    private _settings!: AppSettings;
    private _helpCategory: string | null = null;
    private _showContactSupportForm: boolean = false;
    private _faqsCache: { q: string; a: string }[] = [];

    constructor(uiManager: UIManager, saveManager: SaveManager, audioManager: AudioManager, onBack: () => void, defaultSubScreen: 'main' | 'profile' | 'language' | 'notifications' | 'sound' | 'help' | 'terms' | 'privacy' | 'about' = 'main') {
        this._uiManager = uiManager;
        this._saveManager = saveManager;
        this._audioManager = audioManager;
        this._onBack = onBack;
        this._subScreen = defaultSubScreen;
        this._defaultSubScreen = defaultSubScreen;
        
        (window as any).ethioOnBackPress = () => {
            if (this._subScreen !== this._defaultSubScreen || this._helpCategory || this._showContactSupportForm) {
                this._audioManager.playClick();
                this._goBack();
                return true;
            }
            return false;
        };
        
        // Initialize default settings first to avoid synchronous undefined accesses
        this._settings = this._getDefaultSettings();
        
        // Asynchronously load settings from cloud/local storage
        this._loadSettings();
    }

    private async _loadSettings(): Promise<void> {
        // Load local fallback first
        const saved = localStorage.getItem('ETHIO_FOOTBALL_SETTINGS_V2');
        if (saved) {
            try {
                this._settings = JSON.parse(saved);
            } catch (e) {
                this._settings = this._getDefaultSettings();
            }
        } else {
            this._settings = this._getDefaultSettings();
        }

        const isMuted = localStorage.getItem('ETHIO_FOOTBALL_MUTED') === 'true';
        this._settings.soundEffects = !isMuted;

        // Try loading from Supabase Preferences if online
        const pref = await ProfileService.getInstance().getPreferences();
        if (pref) {
            this._settings.soundEffects = pref.sound_enabled;
            this._settings.notifications = {
                dailyChallenge: pref.notif_daily,
                tournament: pref.notif_tournament,
                rewards: pref.notif_rewards,
                announcements: pref.notif_announcements,
                subscription: pref.notif_subscription,
                system: pref.notif_system
            };
            
            // Sync audio manager mute state
            if (pref.sound_enabled && this._audioManager.isMuted) {
                this._audioManager.toggleMute();
            } else if (!pref.sound_enabled && !this._audioManager.isMuted) {
                this._audioManager.toggleMute();
            }
        }
        
        this.render();
    }

    public destroy(): void {
        (window as any).ethioOnBackPress = null;
    }

    private _getDefaultSettings(): AppSettings {
        return {
            soundEffects: true,
            notifications: {
                dailyChallenge: true,
                tournament: true,
                rewards: true,
                announcements: true,
                subscription: true,
                system: true
            }
        };
    }

    private async _saveSettings(): Promise<void> {
        localStorage.setItem('ETHIO_FOOTBALL_SETTINGS_V2', JSON.stringify(this._settings));
        localStorage.setItem('ETHIO_FOOTBALL_MUTED', String(!this._settings.soundEffects));
        
        if (this._settings.soundEffects && this._audioManager.isMuted) {
            this._audioManager.toggleMute();
        } else if (!this._settings.soundEffects && !this._audioManager.isMuted) {
            this._audioManager.toggleMute();
        }

        // Persist to Supabase if online
        await ProfileService.getInstance().updatePreferences({
            sound_enabled: this._settings.soundEffects,
            notif_daily: this._settings.notifications.dailyChallenge,
            notif_tournament: this._settings.notifications.tournament,
            notif_rewards: this._settings.notifications.rewards,
            notif_announcements: this._settings.notifications.announcements,
            notif_subscription: this._settings.notifications.subscription,
            notif_system: this._settings.notifications.system
        });
    }

    public render(): void {
        const root = this._uiManager.container;

        if (this._subScreen === 'main') {
            this._renderMainScreen(root);
        } else if (this._subScreen === 'profile') {
            this._renderProfileScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        } else if (this._subScreen === 'language') {
            this._renderLanguageScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        } else if (this._subScreen === 'notifications') {
            this._renderNotificationsScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        } else if (this._subScreen === 'sound') {
            this._renderSoundScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        } else if (this._subScreen === 'help') {
            this._renderHelpScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        } else if (this._subScreen === 'terms') {
            this._renderTermsScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        } else if (this._subScreen === 'privacy') {
            this._renderPrivacyScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        } else if (this._subScreen === 'about') {
            this._renderAboutScreen(root, (title: string) => EthioFantasyAppBar.render(title));
        }
    }

    private _renderMainScreen(root: HTMLElement): void {
        const listTile = (icon: string, title: string, subtitle: string, rightContent: string, id: string) => `
            <div id="${id}" class="settings-tile" style="
                display: flex; align-items: center; justify-content: space-between; 
                padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;
                transition: background-color 0.2s;
            ">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 24px; width: 28px; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${icon}</span>
                    <div>
                        <div style="font-size: 15px; font-weight: 800; color: white; letter-spacing: 0.3px;">${title}</div>
                        ${subtitle ? `<div style="font-size: 13px; color: var(--fds-text-dim); margin-top: 2px; font-weight: 600;">${subtitle}</div>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    ${rightContent}
                </div>
            </div>
        `;

        const chevron = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;

        const renderToggle = (checked: boolean) => `
            <label class="switch-container" style="pointer-events: none;">
                <input type="checkbox" class="switch-input" ${checked ? 'checked' : ''}>
                <span class="switch-slider"></span>
            </label>
        `;

        const currentLangLabel = i18n.currentLocale === 'am' ? 'አማርኛ' : (i18n.currentLocale === 'om' ? 'Afan Oromo' : 'English');

        const areNotificationsEnabled = Object.values(this._settings.notifications).some(v => v);

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'ቅንብሮች' : (i18n.currentLocale === 'om' ? 'QINDAA\'INOOTA' : 'Settings'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    
                    <!-- Account Group -->
                    <div style="font-size: 12px; font-weight: 900; color: var(--tv-gold-primary); margin-bottom: 8px; margin-left: 20px; text-transform: uppercase; letter-spacing: 1px;">${i18n.currentLocale === 'am' ? 'መለያ እና መገለጫ' : (i18n.currentLocale === 'om' ? 'HERREGA & PROFILE' : 'ACCOUNT & PROFILE')}</div>
                    <div class="glass-card" style="margin-bottom: 24px; border-radius: 16px; padding: 0; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(7, 27, 45, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                        ${listTile('🌍', i18n.currentLocale === 'am' ? 'ቋንቋ' : (i18n.currentLocale === 'om' ? 'Afaan' : 'Language'), currentLangLabel, chevron, 'tile-language')}
                        ${listTile('🔔', i18n.currentLocale === 'am' ? 'ማሳወቂያዎች' : (i18n.currentLocale === 'om' ? 'Beeksisa' : 'Notifications'), '', renderToggle(areNotificationsEnabled), 'tile-notifications')}
                        <div style="border-bottom: none;">
                            ${listTile('🔊', i18n.currentLocale === 'am' ? 'የድምፅ ውጤቶች' : (i18n.currentLocale === 'om' ? 'Sagalee' : 'Sound Effects'), this._settings.soundEffects ? (i18n.currentLocale === 'am' ? 'የበራ' : (i18n.currentLocale === 'om' ? 'Kan Baname' : 'Enabled')) : (i18n.currentLocale === 'am' ? 'የጠፋ' : (i18n.currentLocale === 'om' ? 'Kan Cufame' : 'Muted')), renderToggle(this._settings.soundEffects), 'tile-sound')}
                        </div>
                    </div>

                    <!-- Legal Group -->
                    <div style="font-size: 12px; font-weight: 900; color: var(--tv-gold-primary); margin-bottom: 8px; margin-left: 20px; text-transform: uppercase; letter-spacing: 1px;">${i18n.currentLocale === 'am' ? 'እገዛ እና ህጋዊ' : (i18n.currentLocale === 'om' ? 'GARGAARSA & SEERA' : 'SUPPORT & LEGAL')}</div>
                    <div class="glass-card" style="margin-bottom: 32px; border-radius: 16px; padding: 0; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(7, 27, 45, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                        ${listTile('❓', i18n.currentLocale === 'am' ? 'እገዛ እና ድጋፍ' : (i18n.currentLocale === 'om' ? 'Gargaarsa & Deeggarsa' : 'Help & Support'), '', chevron, 'tile-help')}
                        ${listTile('📜', i18n.currentLocale === 'am' ? 'ውሎች እና ሁኔታዎች' : (i18n.currentLocale === 'om' ? 'Waliigaltee & Haalawwan' : 'Terms & Conditions'), '', chevron, 'tile-terms')}
                        <div style="border-bottom: none;">
                            ${listTile('🔒', i18n.currentLocale === 'am' ? 'የግላዊነት ፖሊሲ' : (i18n.currentLocale === 'om' ? 'Imaammata Dhuunfaa' : 'Privacy Policy'), '', chevron, 'tile-privacy')}
                        </div>
                    </div>

                    <!-- Logout -->
                    <div class="glass-card settings-tile" id="btn-logout" style="margin-bottom: 16px; border-radius: 16px; padding: 0; text-align: center; border: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); overflow: hidden; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.1);">
                        <div style="padding: 16px; font-size: 15px; font-weight: 900; color: #FCA5A5; cursor: pointer; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            ${i18n.currentLocale === 'am' ? 'ውጣ' : (i18n.currentLocale === 'om' ? 'BA\'I' : 'LOG OUT')}
                        </div>
                    </div>

                </div>
            </div>
            <style>
                .settings-tile:active { background: rgba(255,255,255,0.08) !important; }
                
                .switch-container {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .switch-input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .switch-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(255,255,255,0.15);
                    transition: .3s;
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .switch-slider:before {
                    position: absolute;
                    content: "";
                    height: 16px; width: 16px;
                    left: 3px; bottom: 3px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }
                .switch-input:checked + .switch-slider {
                    background: linear-gradient(135deg, var(--fds-green-pitch) 0%, var(--fds-green-dark) 100%);
                    border-color: var(--tv-pitch-green);
                }
                .switch-input:checked + .switch-slider:before {
                    transform: translateX(20px);
                }
            </style>
        `;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onBack();
        });

        const binds = [
            { id: 'tile-language', sub: 'language' },
            { id: 'tile-help', sub: 'help' },
            { id: 'tile-terms', sub: 'terms' },
            { id: 'tile-privacy', sub: 'privacy' }
        ];

        binds.forEach(b => {
            document.getElementById(b.id)?.addEventListener('click', () => {
                this._audioManager.playClick();
                this._subScreen = b.sub as any;
                this.render();
            });
        });

        document.getElementById('tile-notifications')?.addEventListener('click', () => {
            this._audioManager.playClick();
            const newVal = !Object.values(this._settings.notifications).some(v => v);
            Object.keys(this._settings.notifications).forEach(k => {
                this._settings.notifications[k as keyof AppSettings['notifications']] = newVal;
            });
            this._saveSettings();
            this.render();
        });

        document.getElementById('tile-sound')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._settings.soundEffects = !this._settings.soundEffects;
            this._saveSettings();
            this.render();
        });

        document.getElementById('btn-logout')?.addEventListener('click', async () => {
            this._audioManager.playClick();
            const shouldLogout = await LogoutDialog.show();
            if (shouldLogout) {
                await AuthManager.getInstance().signOut();
                window.location.reload();
            }
        });
    }

    private _renderProfileScreen(root: HTMLElement, header: Function): void {
        const profile = this._saveManager.profile;
        const maskedMsisdn = profile.phone ? this._maskPhone(profile.phone) : `${i18n.currentLocale === 'am' ? 'እንግዳ ተጫዋች' : (i18n.currentLocale === 'om' ? 'Taphataa Keessummaa' : 'Guest Player')}`;
        const regDate = 'July 22, 2026';
        const subStatus = profile.eloRating && profile.eloRating > 1400 
            ? (i18n.currentLocale === 'am' ? 'የበራ ፕሪሚየም' : (i18n.currentLocale === 'om' ? 'Premium Hojjetu' : 'Active Premium')) 
            : (i18n.currentLocale === 'am' ? 'የበራ መሰረታዊ' : (i18n.currentLocale === 'om' ? 'Basic Hojjetu' : 'Active Basic'));

        const row = (label: string, value: string) => `
            <div style="display: flex; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: var(--fds-font-sm); font-weight: 700; color: var(--fds-text-dim);">${label}</div>
                <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--fds-text-main);">${value}</div>
            </div>
        `;

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'የእኔ መገለጫ' : (i18n.currentLocale === 'om' ? 'PROFILE KOO' : 'MY PROFILE'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
                    <div class="glass-card" style="border-radius: 12px; padding: 0; overflow: hidden; border-color: rgba(255,255,255,0.08);">
                        ${row(i18n.currentLocale === 'am' ? 'የስልክ ቁጥር (MSISDN)' : (i18n.currentLocale === 'om' ? 'Lakkoofsa MSISDN' : 'Masked MSISDN'), maskedMsisdn)}
                        ${row(i18n.currentLocale === 'am' ? 'የምዝገባ ሁኔታ' : (i18n.currentLocale === 'om' ? 'Haala Kaffaltii' : 'Subscription Status'), subStatus)}
                        <div style="border-bottom: none;">
                            ${row(i18n.currentLocale === 'am' ? 'የተመዘገቡበት ቀን' : (i18n.currentLocale === 'om' ? 'Guyyaa Galmee' : 'Registration Date'), regDate)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._bindSubScreenBack(root);
    }

    private _renderLanguageScreen(root: HTMLElement, header: Function): void {
        const langRow = (code: 'en' | 'am' | 'om', name: string) => {
            const isSelected = i18n.currentLocale === code;
            return `
                <div class="settings-tile lang-item" data-lang="${code}" style="
                    display: flex; align-items: center; justify-content: space-between; 
                    padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;
                ">
                    <div style="font-size: var(--fds-font-md); font-weight: 700; color: var(--fds-text-main);">${name}</div>
                    <div style="
                        width: 20px; height: 20px; border-radius: 50%; 
                        border: 2px solid ${isSelected ? 'var(--tv-gold-primary)' : 'rgba(255,255,255,0.3)'};
                        display: flex; align-items: center; justify-content: center;
                    ">
                        ${isSelected ? `<div style="width: 10px; height: 10px; border-radius: 50%; background: var(--tv-gold-primary);"></div>` : ''}
                    </div>
                </div>
            `;
        };

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'ቋንቋ ይምረጡ' : (i18n.currentLocale === 'om' ? 'AFAAN FILADHU' : 'SELECT LANGUAGE'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
                    <div class="glass-card" style="border-radius: 12px; padding: 0; overflow: hidden; border-color: rgba(255,255,255,0.08);">
                        ${langRow('en', 'English')}
                        ${langRow('am', 'አማርኛ (Amharic)')}
                        <div style="border-bottom: none;">
                            ${langRow('om', 'Afan Oromo')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._bindSubScreenBack(root);

        const items = root.querySelectorAll('.lang-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const lang = target.getAttribute('data-lang') as 'en' | 'am' | 'om';
                if (lang) {
                    this._audioManager.playClick();
                    i18n.setLocale(lang);
                    BottomNav.refresh();
                    this.render();
                }
            });
        });
    }

    private _renderNotificationsScreen(root: HTMLElement, header: Function): void {
        const notifRow = (key: keyof AppSettings['notifications'], label: string) => {
            const enabled = this._settings.notifications[key];
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: var(--fds-font-md); font-weight: 700; color: var(--fds-text-main);">${label}</div>
                    <label class="switch-container">
                        <input type="checkbox" class="switch-input notif-toggle" data-key="${key}" ${enabled ? 'checked' : ''}>
                        <span class="switch-slider"></span>
                    </label>
                </div>
            `;
        };

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'ማሳወቂያዎች' : (i18n.currentLocale === 'om' ? 'BEEKSIISAA' : 'NOTIFICATIONS'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
                    <div class="glass-card" style="border-radius: 12px; padding: 0; overflow: hidden; border-color: rgba(255,255,255,0.08);">
                        ${notifRow('dailyChallenge', i18n.currentLocale === 'am' ? 'የዕለት ተግዳሮቶች' : (i18n.currentLocale === 'om' ? 'Qormaata Guyyaa' : 'Daily Challenge'))}
                        ${notifRow('tournament', i18n.currentLocale === 'am' ? 'የሊግ ውድድር ዜናዎች' : (i18n.currentLocale === 'om' ? 'Dorgommiiwwan Liigii' : 'Tournament Updates'))}
                        ${notifRow('rewards', i18n.currentLocale === 'am' ? 'ሽልማቶች እና ጉርሻዎች' : (i18n.currentLocale === 'om' ? 'Badhaasa & Bonus' : 'Rewards & Bonuses'))}
                        ${notifRow('announcements', i18n.currentLocale === 'am' ? 'ማስታወቂያዎች' : (i18n.currentLocale === 'om' ? 'Beeksisa Sirnaa' : 'Announcements'))}
                        ${notifRow('subscription', i18n.currentLocale === 'am' ? 'የምዝገባ ማሳወቂያዎች' : (i18n.currentLocale === 'om' ? 'Kaffaltii Addaa' : 'Subscription Alerts'))}
                        <div style="border-bottom: none;">
                            ${notifRow('system', i18n.currentLocale === 'am' ? 'የስርዓት ማንቂያዎች' : (i18n.currentLocale === 'om' ? 'Gargaarsa Sirnaa' : 'System Alerts'))}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .switch-container {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .switch-input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .switch-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(255,255,255,0.15);
                    transition: .3s;
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .switch-slider:before {
                    position: absolute;
                    content: "";
                    height: 16px; width: 16px;
                    left: 3px; bottom: 3px;
                    background-color: var(--fds-text-main);
                    transition: .3s;
                    border-radius: 50%;
                }
                .switch-input:checked + .switch-slider {
                    background-color: var(--tv-pitch-green);
                }
                .switch-input:checked + .switch-slider:before {
                    transform: translateX(20px);
                }
            </style>
        `;

        this._bindSubScreenBack(root);

        const toggles = root.querySelectorAll('.notif-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this._audioManager.playClick();
                const target = e.currentTarget as HTMLInputElement;
                const key = target.getAttribute('data-key') as keyof AppSettings['notifications'];
                if (key) {
                    this._settings.notifications[key] = target.checked;
                    this._saveSettings();
                }
            });
        });
    }

    private _renderSoundScreen(root: HTMLElement, header: Function): void {
        const soundRow = (value: boolean, label: string) => {
            const isSelected = this._settings.soundEffects === value;
            return `
                <div class="settings-tile sound-item" data-val="${value}" style="
                    display: flex; align-items: center; justify-content: space-between; 
                    padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;
                ">
                    <div style="font-size: var(--fds-font-md); font-weight: 700; color: var(--fds-text-main);">${label}</div>
                    <div style="
                        width: 20px; height: 20px; border-radius: 50%; 
                        border: 2px solid ${isSelected ? 'var(--tv-gold-primary)' : 'rgba(255,255,255,0.3)'};
                        display: flex; align-items: center; justify-content: center;
                    ">
                        ${isSelected ? `<div style="width: 10px; height: 10px; border-radius: 50%; background: var(--tv-gold-primary);"></div>` : ''}
                    </div>
                </div>
            `;
        };

        const enableLabel = i18n.currentLocale === 'am' ? 'ድምፅ አብራ' : (i18n.currentLocale === 'om' ? 'Bani' : 'Enable');
        const disableLabel = i18n.currentLocale === 'am' ? 'ድምፅ አጥፋ' : (i18n.currentLocale === 'om' ? 'Cufi' : 'Disable');

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'የድምፅ ውጤቶች' : (i18n.currentLocale === 'om' ? 'SAGAALE TAPHA' : 'SOUND EFFECTS'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
                    <div class="glass-card" style="border-radius: 12px; padding: 0; overflow: hidden; border-color: rgba(255,255,255,0.08);">
                        ${soundRow(true, enableLabel)}
                        <div style="border-bottom: none;">
                            ${soundRow(false, disableLabel)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._bindSubScreenBack(root);

        const items = root.querySelectorAll('.sound-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const val = target.getAttribute('data-val') === 'true';
                this._settings.soundEffects = val;
                this._saveSettings();
                this._audioManager.playClick();
                this.render();
            });
        });
    }

    private _renderHelpScreen(root: HTMLElement, header: Function): void {
        const chevron = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;

        const helpCategories: { id: string; name: string; desc: string; icon: string }[] = [
            { id: 'account', name: i18n.currentLocale === 'am' ? 'መለያ' : (i18n.currentLocale === 'om' ? 'Herrega' : 'Account'), desc: 'Account creation, recovery and security', icon: '👤' },
            { id: 'subscription', name: i18n.currentLocale === 'am' ? 'ምዝገባ' : (i18n.currentLocale === 'om' ? 'Kaffaltii' : 'Subscription'), desc: 'Premium access and daily billing', icon: '💳' },
            { id: 'unsubscription', name: i18n.currentLocale === 'am' ? 'ምዝገባ መሰረዝ' : (i18n.currentLocale === 'om' ? 'Haquu' : 'Unsubscription'), desc: 'How to opt out or cancel service', icon: '🛑' },
            { id: 'dailyChallenge', name: i18n.currentLocale === 'am' ? 'የዕለት ተግዳሮት' : (i18n.currentLocale === 'om' ? 'Qormaata Guyyaa' : 'Daily Challenge'), desc: 'Rules and bonuses for daily plays', icon: '📅' },
            { id: 'tournament', name: i18n.currentLocale === 'am' ? 'ውድድር' : (i18n.currentLocale === 'om' ? 'Dorgommii' : 'Tournament'), desc: 'Joining and competing in live events', icon: '🏆' },
            { id: 'rewards', name: i18n.currentLocale === 'am' ? 'ሽልማቶች' : (i18n.currentLocale === 'om' ? 'Badhaasa' : 'Rewards'), desc: 'Claiming cash prizes and coins', icon: '🎁' },
            { id: 'gameplay', name: i18n.currentLocale === 'am' ? 'የጨዋታ ሁኔታ' : (i18n.currentLocale === 'om' ? 'Tapha' : 'Gameplay'), desc: 'How to answer questions and score', icon: '⚽' },
            { id: 'leaderboard', name: i18n.currentLocale === 'am' ? 'ደረጃ ሰሌዳ' : (i18n.currentLocale === 'om' ? 'Sadarkaa' : 'Leaderboard'), desc: 'ELO rating and division climbing', icon: '📊' },
            { id: 'profile', name: i18n.currentLocale === 'am' ? 'መገለጫ' : (i18n.currentLocale === 'om' ? 'Profile' : 'Profile'), desc: 'Managing your player identity', icon: '👤' },
            { id: 'notifications', name: i18n.currentLocale === 'am' ? 'ማሳወቂያዎች' : (i18n.currentLocale === 'om' ? 'Beeksisa' : 'Notifications'), desc: 'SMS alerts and system updates', icon: '🔔' },
            { id: 'technicalIssues', name: i18n.currentLocale === 'am' ? 'ቴክኒካዊ ጉዳዮች' : (i18n.currentLocale === 'om' ? 'Rakkina Sirnaa' : 'Technical Issues'), desc: 'Report bugs or connection problems', icon: '🔧' }
        ];

        const HELP_FAQS: Record<string, { q: string; a: string }[]> = {
            account: [
                { q: 'How is my account created?', a: 'Your account is automatically created when you authenticate with your Ethio Telecom mobile phone number. There is no password required.' },
                { q: 'Can I delete my account?', a: 'To delete your account data, please contact Ethio Telecom customer service or submit a support ticket via the app.' }
            ],
            subscription: [
                { q: 'What is Premium Subscription?', a: 'Premium subscription gives you unlimited daily plays, full access to all leagues, and entry into the weekly cash prize draws for 2 Birr/day.' },
                { q: 'How do I pay for subscription?', a: 'Subscription fees are automatically deducted from your Ethio Telecom airtime balance daily.' }
            ],
            unsubscription: [
                { q: 'How do I unsubscribe?', a: 'You can cancel your active subscription anytime by going to Settings > Account > Profile and choosing Unsubscribe, or by sending "STOP" to the Ethio Telecom shortcode 8282.' }
            ],
            dailyChallenge: [
                { q: 'What is the Daily Challenge?', a: 'The Daily Challenge is a special daily set of 10 trivia questions on hot football topics. Completing it awards double reward coins and a 1.5x XP bonus!' },
                { q: 'How many times can I play the Daily Challenge?', a: 'You can play the Daily Challenge once per calendar day. It resets every night at midnight EAT.' }
            ],
            tournament: [
                { q: 'How do tournaments work?', a: 'Tournaments are knockout brackets held every weekend. Players register during the week and compete live in 1v1 match phases to progress.' },
                { q: 'What are the tournament entry requirements?', a: 'Premium subscribers can enter tournaments for free. Basic and free players must pay a 100 coin registration fee.' }
            ],
            rewards: [
                { q: 'What rewards can I win?', a: 'You can win in-game coins, profile XP, custom football badges, and real cash prizes credited directly to your Ethio Telecom mobile account balance.' },
                { q: 'When are weekly prizes distributed?', a: 'Weekly prizes are processed and sent every Monday at 10:00 AM EAT based on the final Sunday night division standings.' }
            ],
            gameplay: [
                { q: 'How do I play a match?', a: 'Read the question carefully and tap the correct option before the timer runs out. Fast answers score Goals, while incorrect ones are Saved by the goalkeeper!' },
                { q: 'How does the match timer work?', a: 'You have 30 seconds per question in Solo Matches, and 20 seconds in Live 1v1 Matches. Answering quicker increases your possession stat!' }
            ],
            leaderboard: [
                { q: 'How are leaderboard points calculated?', a: 'Leaderboard standings are based on ELO ratings. You win ELO points by defeating opponents in Live 1v1 Matches and scoring high accuracy in Solo Matches.' },
                { q: 'How often does the leaderboard reset?', a: 'Division leaderboards reset weekly on Sunday at midnight EAT, after which the top players are promoted and rewards are dispatched.' }
            ],
            profile: [
                { q: 'Why can\'t I edit my username?', a: 'To comply with Ethio Telecom VAS portal guidelines, player profiles are verified and tied securely to your MSISDN. Manually changing names is restricted.' }
            ],
            notifications: [
                { q: 'What notifications will I receive?', a: 'You will receive SMS alerts for tournament kick-offs, daily challenge reminders, and subscription renewals. You can toggle these settings anytime.' }
            ],
            technicalIssues: [
                { q: 'The app is freezing. What should I do?', a: 'Ensure you have a stable network connection (3G/4G/LTE/5G). Try refreshing the app page by swiping down, or clearing your mobile browser cache.' }
            ],
            privacy: [
                { q: 'How is my data used?', a: 'We collect your phone number and game statistics solely to manage your game state and calculate rankings. We never share your data with third parties.' }
            ],
            terms: [
                { q: 'Are there age restrictions?', a: 'Yes, you must be 18 years or older, or have parental consent, and be an active Ethio Telecom subscriber to compete for cash rewards.' }
            ]
        };

        if (this._showContactSupportForm) {
            root.innerHTML = `
                <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                    ${header(i18n.currentLocale === 'am' ? 'ቴክኒካዊ ጉዳዮች' : (i18n.currentLocale === 'om' ? 'RAKKINA SIRNAA' : 'TECHNICAL ISSUES'))}

                    <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
                        
                        <div class="glass-card" style="border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.08); background: rgba(7, 27, 45, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); text-align: left;" id="support-form-container">
                            <div style="font-size: 18px; font-weight: 900; color: white; margin-bottom: 8px; letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? '✉️ ሪፖርት ያድርጉ' : (i18n.currentLocale === 'om' ? '✉️ Gabaasi' : '✉️ Report an Issue')}</div>
                            <div style="font-size: 14px; color: var(--fds-text-dim); margin-bottom: 20px;">Contact support to resolve bugs, connection drops, or game errors.</div>

                            <div style="margin-bottom: 16px;">
                                <label style="display: block; font-size: 12px; color: var(--tv-gold-primary); margin-bottom: 8px; font-weight: 800; text-transform: uppercase;">${i18n.currentLocale === 'am' ? 'የጉዳዩ ዓይነት' : (i18n.currentLocale === 'om' ? 'GOSA RAKKINA' : 'PROBLEM CATEGORY')}</label>
                                <select id="support-category" style="width: 100%; padding: 12px 14px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: white; outline: none; font-size: 15px; appearance: none; -webkit-appearance: none;">
                                    <option value="Billing & Subscription">${i18n.currentLocale === 'am' ? 'ክፍያ እና ምዝገባ' : (i18n.currentLocale === 'om' ? 'Kaffaltii & Galmee' : 'Billing & Subscription')}</option>
                                    <option value="Technical Issues">${i18n.currentLocale === 'am' ? 'ቴክኒካዊ ጉዳዮች' : (i18n.currentLocale === 'om' ? 'Rakkina Sirnaa' : 'Technical Issues')}</option>
                                    <option value="Rewards & Points">${i18n.currentLocale === 'am' ? 'ሽልማቶች እና ነጥቦች' : (i18n.currentLocale === 'om' ? 'Badhaasa & Qabxii' : 'Rewards & Points')}</option>
                                    <option value="General Feedback">${i18n.currentLocale === 'am' ? 'አጠቃላይ አስተያየት' : (i18n.currentLocale === 'om' ? 'Yaada Waligalaa' : 'General Feedback')}</option>
                                </select>
                            </div>
                            
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; font-size: 12px; color: var(--tv-gold-primary); margin-bottom: 8px; font-weight: 800; text-transform: uppercase;">${i18n.currentLocale === 'am' ? 'መልእክት' : (i18n.currentLocale === 'om' ? 'ERGAA' : 'DESCRIPTION')}</label>
                                <textarea id="support-message" placeholder="${i18n.currentLocale === 'am' ? 'ችግርዎን እዚህ ይግለጹ...' : (i18n.currentLocale === 'om' ? 'Rakkina keessan asitti ibsaa...' : 'Provide details about the issue...')}" style="width: 100%; height: 100px; padding: 14px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: white; outline: none; resize: none; font-family: inherit; font-size: 15px; box-sizing: border-box;"></textarea>
                            </div>
                            
                            <div style="margin-bottom: 24px;">
                                <label style="display: block; font-size: 12px; color: var(--tv-gold-primary); margin-bottom: 8px; font-weight: 800; text-transform: uppercase;">OPTIONAL SCREENSHOT</label>
                                <div style="width: 100%; padding: 14px; background: rgba(0,0,0,0.3); border: 1px dashed rgba(255,255,255,0.2); border-radius: 12px; color: var(--fds-text-dim); text-align: center; font-size: 14px; cursor: pointer;">
                                    📷 Tap to upload screenshot
                                </div>
                            </div>
                            
                            <div id="btn-submit-support" style="background: linear-gradient(135deg, var(--fds-green-pitch) 0%, var(--fds-green-dark) 100%); padding: 14px; text-align: center; border-radius: 12px; font-weight: 900; color: white; letter-spacing: 0.5px; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 200, 83, 0.3);">
                                ${i18n.currentLocale === 'am' ? 'መልእክት ላክ' : (i18n.currentLocale === 'om' ? 'ERGAA ERGI' : 'SUBMIT SUPPORT TICKET')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this._bindSubScreenBack(root);
            document.getElementById('btn-back-help')?.addEventListener('click', () => {
                this._audioManager.playClick();
                this._showContactSupportForm = false;
                this.render();
            });

            document.getElementById('btn-submit-support')?.addEventListener('click', async () => {
                this._audioManager.playClick();
                const msg = (document.getElementById('support-message') as HTMLTextAreaElement)?.value.trim();
                const catSelect = document.getElementById('support-category') as HTMLSelectElement;
                const cat = catSelect ? catSelect.value : 'General Feedback';
                
                if (!msg) {
                    Toast.show(i18n.currentLocale === 'am' ? 'እባክዎን ከማስገባትዎ በፊት መልእክት ያስገቡ።' : (i18n.currentLocale === 'om' ? 'Maree ergamuu dura ergaa galchaa.' : 'Please enter a message before submitting.'), 'warning');
                    return;
                }
                const container = document.getElementById('support-form-container');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 16px; color: var(--fds-text-dim);">
                            ${i18n.currentLocale === 'am' ? 'ጥያቄዎ ወደ አገልጋይ በመላክ ላይ...' : (i18n.currentLocale === 'om' ? 'Ergaan gara serveritti ergamaa jira...' : 'Submitting ticket to server...')}
                        </div>
                    `;
                    const res = await SupportService.getInstance().createTicket(cat, msg);
                    const refId = res.success ? `EF-${res.ticketId.substring(0, 8).toUpperCase()}` : 'EF-' + Math.floor(100000 + Math.random() * 900000);
                    
                    container.innerHTML = `
                        <div style="text-align: center; padding: 16px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
                            <div style="font-size: var(--fds-font-md); font-weight: 800; color: var(--tv-pitch-green); margin-bottom: 4px;">${i18n.currentLocale === 'am' ? 'ጥያቄዎ ገብቷል' : (i18n.currentLocale === 'om' ? 'ERGAAN ERGAMEERA' : 'TICKET SUBMITTED')}</div>
                            <div style="font-size: var(--fds-font-sm); color: var(--fds-text-dim); margin-bottom: 12px;">${i18n.currentLocale === 'am' ? 'የድጋፍ ቡድናችን በቅርቡ በኤስኤምኤስ ምላሽ ይሰጣል።' : (i18n.currentLocale === 'om' ? 'Gareen deeggarsa keenyaa dhiyeenyatti SMSn deebii kenne.' : 'Our support team will respond via SMS shortly.')}</div>
                            <div style="font-size: var(--fds-font-xs); font-weight: 700; color: var(--fds-text-main); background: rgba(255,255,255,0.08); padding: 6px; border-radius: 6px; font-family: monospace; display: inline-block;">REF: ${refId}</div>
                        </div>
                    `;
                }
            });
            return;
        }

        if (this._helpCategory) {
            const activeFaqs = this._faqsCache.length > 0 ? this._faqsCache : (HELP_FAQS[this._helpCategory] || []);
            const faqHtml = activeFaqs.map((faq, idx) => `
                <div class="glass-card" style="border-radius: 12px; margin-bottom: 12px; border-color: rgba(255,255,255,0.08); overflow: hidden;">
                    <div class="faq-header" data-idx="${idx}" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; cursor: pointer; background: rgba(255,255,255,0.02);">
                        <div style="font-size: var(--fds-font-sm); font-weight: 800; color: var(--fds-text-main);">${faq.q}</div>
                        <span class="faq-icon" style="color: var(--tv-gold-primary); font-size: var(--fds-font-xs); transition: transform 0.2s;">➕</span>
                    </div>
                    <div class="faq-body" id="faq-body-${idx}" style="max-height: 0; overflow: hidden; transition: max-height 0.2s ease-out; background: rgba(0,0,0,0.2);">
                        <div style="padding: 16px; font-size: var(--fds-font-sm); color: var(--fds-text-muted); line-height: 1.5;">${faq.a}</div>
                    </div>
                </div>
            `).join('');

            const catItem = helpCategories.find(c => c.id === this._helpCategory);
            const categoryName = catItem ? catItem.name : this._helpCategory;

            const emptyState = `
                <div style="text-align: center; padding: 40px 16px;">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📋</div>
                    <div style="font-size: 16px; font-weight: 800; color: white; margin-bottom: 8px;">No FAQs Available</div>
                    <div style="font-size: 14px; color: var(--fds-text-dim);">There are no common questions listed for this category yet.</div>
                </div>
            `;

            root.innerHTML = `
                <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                    ${header(`${categoryName.toUpperCase()}`)}

                    <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                        
                        <div style="margin-bottom: 24px; padding-left: 12px; border-left: 4px solid var(--tv-gold-primary);">
                            <div style="font-size: 18px; font-weight: 900; color: white; margin-bottom: 4px; letter-spacing: 0.5px;">Common Questions</div>
                            <div style="font-size: 14px; color: var(--fds-text-dim);">Solutions and relevant instructions</div>
                        </div>
                        
                        <!-- Search FAQs -->
                        <div style="position: relative; margin-bottom: 24px;">
                            <span style="position: absolute; left: 14px; top: 12px; opacity: 0.6;">🔍</span>
                            <input type="text" id="faq-search-input" placeholder="${i18n.currentLocale === 'am' ? 'ጥያቄዎችን ይፈልጉ...' : (i18n.currentLocale === 'om' ? 'Gaaffiiwwan Barbaadi...' : 'Search FAQs...')}" style="
                                width: 100%; 
                                padding: 12px 14px 12px 42px; 
                                background: rgba(0,0,0,0.4); 
                                border: 1px solid rgba(255,255,255,0.15); 
                                border-radius: 12px; 
                                color: white; 
                                font-size: 15px; 
                                box-sizing: border-box;
                                outline: none;
                            ">
                        </div>

                        <div id="faq-list-wrapper">
                            ${activeFaqs.length > 0 ? faqHtml : emptyState}
                        </div>
                    </div>
                </div>
            `;

            this._bindSubScreenBack(root);
            document.getElementById('btn-back-help')?.addEventListener('click', () => {
                this._audioManager.playClick();
                this._helpCategory = null;
                this._faqsCache = [];
                this.render();
            });

            // FAQ Search Input Event
            const faqSearch = document.getElementById('faq-search-input') as HTMLInputElement;
            faqSearch?.addEventListener('input', (e) => {
                const query = (e.target as HTMLInputElement).value.toLowerCase();
                const cards = root.querySelectorAll('#faq-list-wrapper > .glass-card');
                cards.forEach(card => {
                    const headerText = (card.querySelector('.faq-header > div')?.textContent || '').toLowerCase();
                    const bodyText = (card.querySelector('.faq-body > div')?.textContent || '').toLowerCase();
                    if (headerText.includes(query) || bodyText.includes(query)) {
                        (card as HTMLElement).style.display = 'block';
                    } else {
                        (card as HTMLElement).style.display = 'none';
                    }
                });
            });

            const faqHeaders = root.querySelectorAll('.faq-header');
            faqHeaders.forEach(h => {
                h.addEventListener('click', (e) => {
                    this._audioManager.playClick();
                    const target = e.currentTarget as HTMLElement;
                    const idx = target.getAttribute('data-idx');
                    const body = root.querySelector(`#faq-body-${idx}`) as HTMLElement;
                    const icon = target.querySelector('.faq-icon') as HTMLElement;
                    if (body && icon) {
                        if (body.style.maxHeight === '0px' || !body.style.maxHeight) {
                            body.style.maxHeight = body.scrollHeight + 'px';
                            icon.innerText = '➖';
                        } else {
                            body.style.maxHeight = '0px';
                            icon.innerText = '➕';
                        }
                    }
                });
            });
            return;
        }

        const categoriesHtml = helpCategories.map(c => `
            <div class="settings-tile help-category-tile" data-cat-id="${c.id}" style="
                display: flex; align-items: center; justify-content: space-between; 
                padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;
                transition: background-color 0.2s;
            ">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 24px; width: 28px; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${c.icon}</span>
                    <div>
                        <div style="font-size: 15px; font-weight: 800; color: white; letter-spacing: 0.3px;">${c.name}</div>
                        <div style="font-size: 13px; color: var(--fds-text-dim); margin-top: 2px; font-weight: 600;">${c.desc}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    ${chevron}
                </div>
            </div>
        `).join('');

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'እገዛ እና ድጋፍ' : (i18n.currentLocale === 'om' ? 'GARGAARSA' : 'HELP & SUPPORT'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    
                    <div class="glass-card" style="border-radius: 16px; padding: 0; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(7, 27, 45, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                        ${categoriesHtml}
                    </div>

                </div>
            </div>
        `;

        this._bindSubScreenBack(root);

        document.getElementById('btn-contact-support')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._showContactSupportForm = true;
            this.render();
        });

        const catTiles = root.querySelectorAll('.help-category-tile');
        catTiles.forEach(tile => {
            tile.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLElement;
                const catId = target.getAttribute('data-cat-id');
                if (catId) {
                    this._audioManager.playClick();
                    
                    if (catId === 'technicalIssues') {
                        this._showContactSupportForm = true;
                        this.render();
                        return;
                    }
                    
                    this._helpCategory = catId;
                    
                    // Show a quick loader while fetching
                    const wrapper = document.getElementById('faq-list-wrapper');
                    if (wrapper) wrapper.innerHTML = `<div style="padding: 20px; color: var(--fds-text-dim);">${i18n.currentLocale === 'am' ? 'ጥያቄዎች በመጫን ላይ...' : (i18n.currentLocale === 'om' ? 'Gaaffiiwwan fe\'amaa jiru...' : 'Loading FAQs...')}</div>`;
                    
                    const faqService = FAQService.getInstance();
                    const rawFaqs = await faqService.getFAQsByCategory(catId);
                    
                    this._faqsCache = rawFaqs.map(item => {
                        let q = item.question_en;
                        let a = item.answer_en;
                        if (i18n.currentLocale === 'am' && item.question_am && item.answer_am) {
                            q = item.question_am;
                            a = item.answer_am;
                        } else if (i18n.currentLocale === 'om' && item.question_om && item.answer_om) {
                            q = item.question_om;
                            a = item.answer_om;
                        }
                        return { q, a };
                    });
                    
                    this.render();
                }
            });
        });
    }

    private _renderTermsScreen(root: HTMLElement, header: Function): void {
        const body = i18n.currentLocale === 'am' ? `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 0;">1. መግቢያ እና የኢትዮፋንታሲ ስምምነት</h2>
                <p>ለኢትዮ ቴሌኮም ደንበኞች ወደተዘጋጀው የኢትዮ ፋንታሲ የእግር ኳስ ጥያቄ ሊግ እንኳን በደህና መጡ። ይህንን ተጨማሪ እሴት አገልግሎት (VAS) በመጠቀም፣ ከኢትዮፋንታሲ እና ከኢትዮ ቴሌኮም ጋር ውል ይገባሉ።</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">2. የምዝገባ ዕቅድ እና ክፍያ</h2>
                <p>ለፕሪሚየም አገልግሎት ዕለታዊ ክፍያ 2 ብር ሲሆን፤ መሰረታዊ አገልግሎት ዕለታዊ ክፍያ 1 ብር ነው። የምዝገባ ክፍያው ከኢትዮ ቴሌኮም የሞባይል ሂሳብዎ ላይ በቀጥታ ተቀናሽ ይደረጋል።</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">3. የጨዋታ እና የደረጃ ሰሌዳ ታማኝነት</h2>
                <p>ጥያቄዎችን በተሰጠው የጊዜ ገደብ ውስጥ መመለስ ይኖርብዎታል። በጨዋታ ላይ ማጭበርበር ወይም ያልተፈቀዱ ቦቶችን መጠቀም መለያዎ በቋሚነት እንዲታገድ ያደርጋል።</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">4. ሽልማቶች እና የገንዘብ ሽልማት ስርጭት</h2>
                <p>በዕለታዊ ተግዳሮቶች፣ ውድድሮች እና ጨዋታዎች የተገኙ የሽልማት ነጥቦች (XP እና ሳንቲሞች) የተለየ ካልተገለጸ በስተቀር እውነተኛ የገንዘብ ዋጋ የላቸውም። ኦፊሴላዊ የሳምንታዊ ደረጃ ሰሌዳ የገንዘብ ሽልማቶች በቀጥታ ወደ ተመዝጋቢው የተረጋገጠ የኢትዮ ቴሌኮም ሞባይል ሂሳብ ገቢ ይደረጋሉ።</p>
            </div>
        ` : (i18n.currentLocale === 'om' ? `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 0;">1. Seensa & Waliigaltee EthioFantasy</h2>
                <p>Gara EthioFantasy, dorgommii gaaffii kubbaa miilaa Itiyo Telekoom fayyadamtootaaf qophaa'eetti baga nagaan dhuftan.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">2. Kaffaltii</h2>
                <p>Kaffaltiin Premium guyyaatti qarshii 2 yommuu ta'u, kaffaltiin Basic guyyaatti qarshii 1 dha. Kaffaltiin kun herrega bilbila keessanii irraa hir'ifama.</p>

                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">3. Tapha & Sadarkaa</h2>
                <p>Gaaffiiwwan yeroo kenname keessatti deebisuu qabdu. Mala dogoggoraa fayyadamuun akaauntii keessan cufsiisa.</p>

                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">4. Badhaasa Qarshii</h2>
                <p>Badhaasni torban amanamummaadhaan herrega bilbila keessan irratti kaffalama.</p>
            </div>
        ` : `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 0;">1. Introduction & EthioFantasy Agreement</h2>
                <p>Welcome to EthioFantasy, the premium Football Quiz League developed for Ethio Telecom customers. By accessing this Value Added Service (VAS), you enter into a binding agreement with EthioFantasy and Ethio Telecom.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">2. Subscription Plans & Billing</h2>
                <p>Subscribing to Premium grants unlimited gameplay access, full league entry, and entry into weekly cash pools. Premium subscription billing is 2 Birr/day. Basic subscription is billed at 1 Birr/day. Daily subscription fees are automatically deducted from your Ethio Telecom airtime balance.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">3. Gameplay & Leaderboard Integrity</h2>
                <p>The Football Quiz League requires participants to answer themed questions within the allocated time (30 seconds for Solo, 20 seconds for Live 1v1). Score progression and ELO points are recorded in real-time. Cheating, abusing system vulnerabilities, or using bots is strictly prohibited and results in immediate account termination.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">4. Rewards & Cash Prize Distribution</h2>
                <p>Reward points (XP and coins) gained in Daily Challenges, Tournaments, and matches do not have real cash value unless specified. Official weekly leaderboard cash prizes are credited directly to the subscriber's verified Ethio Telecom mobile account balance. Decision of the EthioFantasy administration on rank calculations is final.</p>
            </div>
        `);

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'ውሎች እና ሁኔታዎች' : (i18n.currentLocale === 'om' ? 'WALIIGALTEE' : 'TERMS & CONDITIONS'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    <div class="glass-card" style="border-radius: 12px; padding: 20px; border-color: rgba(255,255,255,0.08); background: rgba(7,27,45,0.85); color: var(--fds-text-muted);">
                        ${body}
                    </div>
                </div>
            </div>
        `;

        this._bindSubScreenBack(root);
    }

    private _renderPrivacyScreen(root: HTMLElement, header: Function): void {
        const body = i18n.currentLocale === 'am' ? `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 0;">1. የምንሰበስበው መረጃ</h2>
                <p>ለጨዋታው አስተዳደር እንዲረዳን የተጠቃሚውን ስልክ ቁጥር (MSISDN)፣ የቋንቋ ምርጫ እና የጨዋታ ነጥቦችን እንሰበስባለን።</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">2. ከኢትዮ ቴሌኮም ጋር ያለው ትስስር</h2>
                <p>አፕሊኬሽኑ ከኢትዮ ቴሌኮም የቪኤኤስ (VAS) መተግበሪያ ጋር በቀጥታ የተገናኘ ሲሆን፣ ሳምንታዊ ሽልማቶችን ለማረጋገጥ ስልክዎን እንጠቀማለን።</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">3. የመረጃ ጥበቃ እና ደህንነት</h2>
                <p>የተጫዋች መረጃ እና የስልክ ቁጥር በከፍተኛ ደህንነት የተጠበቀ ነው። መረጃዎን ለሶስተኛ ወገን አናጋራም።</p>
            </div>
        ` : (i18n.currentLocale === 'om' ? `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 0;">1. Odeeffannoo Nyaatamu</h2>
                <p>Lakkoofsa bilbilaa fi qabxii tapha keessanii qofa sirnaa keenya keessatti kuusna.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">2. Waliin Hojii Itiyo Telekoom</h2>
                <p>Sirni keenya kallattiin Itiyo Telekoom VAS waliin kan walqabatu dha.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">3. Eegumsa Odeeffannoo</h2>
                <p>Odeeffannoon keessan oomisha qaama sadaffaatif hin kennamu.</p>
            </div>
        ` : `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 0;">1. Information We Collect</h2>
                <p>We collect subscriber MSISDN (mobile number), device IP address, locale preference, subscription state, and gameplay statistics (scores, response times, ELO ratings) to manage the EthioFantasy service.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">2. Integration with Ethio Telecom</h2>
                <p>Our application integrates directly with Ethio Telecom VAS Gateway APIs. Subscription status checks are executed on every login session to confirm billing and verify eligibility for weekly cash rewards.</p>
                
                <h2 style="color: var(--tv-gold-primary); font-size: 18px; margin-top: 20px;">3. Data Protection & Retainment</h2>
                <p>Player statistics and phone numbers are encrypted in transit and at rest. We store player data securely using cloud server clusters. We do not sell or share subscriber data with any third-party organizations.</p>
            </div>
        `);

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'የግላዊነት ፖሊሲ' : (i18n.currentLocale === 'om' ? 'IMAAMMATA DHUUNFAA' : 'PRIVACY POLICY'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    <div class="glass-card" style="border-radius: 12px; padding: 20px; border-color: rgba(255,255,255,0.08); background: rgba(7,27,45,0.85); color: var(--fds-text-muted);">
                        ${body}
                    </div>
                </div>
            </div>
        `;

        this._bindSubScreenBack(root);
    }

    private _renderAboutScreen(root: HTMLElement, header: Function): void {
        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${header(i18n.currentLocale === 'am' ? 'ስለ ኢትዮ ፋንታሲ' : (i18n.currentLocale === 'om' ? 'WAA\'EE ETHIO FANTASY' : 'ABOUT ETHIO FANTASY'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 16px;">⚽</div>
                    <div style="font-size: 24px; font-weight: 900; color: var(--fds-text-main); margin-bottom: 8px;">EthioFantasy</div>
                    <div style="font-size: var(--fds-font-sm); color: var(--tv-gold-primary); font-weight: 800; margin-bottom: 24px; letter-spacing: 1.5px; text-transform: uppercase;">Ethio Telecom VAS Integration</div>
                    
                    <div class="glass-card" style="border-radius: 12px; padding: 20px; border-color: rgba(255,255,255,0.08); text-align: left; font-size: var(--fds-font-sm); line-height: 1.6; color: var(--fds-text-muted); margin-bottom: 24px;">
                        <p style="margin-top: 0;"><strong>${i18n.currentLocale === 'am' ? 'የመተግበሪያ መግለጫ:' : (i18n.currentLocale === 'om' ? 'IBSA APPLIKAASHINII:' : 'Application Description:')}</strong><br>${i18n.currentLocale === 'am' ? 'ኢትዮፋንታሲ በኢትዮጵያ ውስጥ ላሉ የእግር ኳስ አፍቃሪዎች የተዘጋጀ ልዩ የእግር ኳስ ጥያቄዎች ሊግ ነው። ዕለታዊ የትሪቪያ ጨዋታዎችን ይጫወቱ፣ ሌሎች ተጫዋቾችን በቀጥታ 1v1 ይፈትኑ እና የገንዘብ ሽልማቶችን ለማሸነፍ በሊግ ደረጃዎች ይውጡ።' : (i18n.currentLocale === 'om' ? 'EthioFantasy dorgommii gaaffii kubbaa miilaa fayyadamtoota Itoophiyaatif qophaa\'ee dha. Tapha guyyaa taphadhaa, dorgomtoota kan biroo 1v1 irratti falmaa, badhaasa qarshii mo\'achuuf sadarkaa liigii kooraa.' : 'EthioFantasy is a premium Football Quiz League platform crafted specifically for football fans in Ethiopia. Play daily trivia matches, challenge other players in live 1v1 showdowns, and climb the league divisions to win cash prizes.')}</p>
                        
                        <p style="margin-bottom: 0;"><strong>${i18n.currentLocale === 'am' ? 'ዋና ዋና ባህሪያት:' : (i18n.currentLocale === 'om' ? 'AMALA GURGUDDOO:' : 'Key Features:')}</strong><br>
                        ${i18n.currentLocale === 'am' ? '• የዕለት ተግዳሮቶች ከነጥብ ማባዣዎች ጋር<br>• የቀጥታ 1v1 ጨዋታዎች<br>• የሳምንቱ መጨረሻ ውድድሮች<br>• የደረጃ እድገት እና የ ELO ሰሌዳ<br>• የተቀናጀ የኤስኤምኤስ ክፍያ ማረጋገጫ' : (i18n.currentLocale === 'om' ? '• Qormaata guyyaa qabxii baay\'isu waliin<br>• Tapha 1v1 kallattiin<br>• Dorgommii dhuma torbaniti<br>• Sadarkaa ELO fi guddina liigii<br>• Kaffaltii SMSn mirkanaa\'u' : '• Daily themed challenges with score multipliers<br>• Live 1v1 real-time matchmaking<br>• Interactive Weekend knockout tournaments<br>• Professional division promotions & ELO ranking leaderboard<br>• Integrated billing checking via SMS OTP')}</p>
                    </div>

                    <div class="glass-card" style="border-radius: 12px; padding: 16px; border-color: rgba(255,255,255,0.08); text-align: left; font-size: var(--fds-font-sm); color: var(--fds-text-muted); margin-bottom: 24px;">
                        <div><strong>${i18n.currentLocale === 'am' ? 'ስሪት:' : (i18n.currentLocale === 'om' ? 'Gosa:' : 'Version:')}</strong> 1.1.0</div>
                        <div style="margin-top: 6px;"><strong>${i18n.currentLocale === 'am' ? 'አልሚ:' : (i18n.currentLocale === 'om' ? 'Oomishaa:' : 'Developer:')}</strong> InnoGames VAS Team</div>
                        <div style="margin-top: 6px;"><strong>${i18n.currentLocale === 'am' ? 'የኢትዮ ቴሌኮም ትስስር:' : (i18n.currentLocale === 'om' ? 'Waliin Hojii Itiyo Telekoom:' : 'Ethio Telecom Integration:')}</strong> VAS Gateway API v3.2</div>
                        <div style="margin-top: 6px;"><strong>${i18n.currentLocale === 'am' ? 'ግንኙነት:' : (i18n.currentLocale === 'om' ? 'Qunnamtii:' : 'Contact:')}</strong> support@ethiofantasy.com</div>
                    </div>

                    <div style="font-size: var(--fds-font-xs); color: var(--fds-text-dim); font-weight: 700;">
                        ${i18n.currentLocale === 'am' ? '© 2026 ኢትዮ ቴሌኮም VAS። መብቱ በህግ የተጠበቀ ነው።' : (i18n.currentLocale === 'om' ? '© 2026 Itiyo Telekoom VAS. Mirgi Hunduu Seeraan Kan Eegame.' : '© 2026 Ethio Telecom VAS. All Rights Reserved.')}
                    </div>
                </div>
            </div>
        `;

        this._bindSubScreenBack(root);
    }

    private _goBack(): void {
        if (this._subScreen !== this._defaultSubScreen) {
            this._subScreen = this._defaultSubScreen;
        } else if (this._helpCategory !== null || this._showContactSupportForm) {
            // We just clear the deep states below, no need to call _onBack yet
        } else {
            this._onBack();
            return;
        }
        this._helpCategory = null;
        this._showContactSupportForm = false;
        this.render();
    }

    private _bindSubScreenBack(root: HTMLElement): void {
        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._goBack();
        });
    }

    private _maskPhone(phone: string): string {
        let clean = phone.replace(/[^0-9+]/g, '');
        if (clean.startsWith('+')) {
            clean = clean.substring(1);
        }
        if (clean.startsWith('251')) {
            clean = '251' + clean.replace(/^0+/, '');
        }
        return clean.substring(0, 4) + '****' + clean.substring(clean.length - 2);
    }
}
