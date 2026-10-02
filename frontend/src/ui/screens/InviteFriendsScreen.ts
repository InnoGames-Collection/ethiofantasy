import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';
import { Toast } from '../components/Toast';

export class InviteFriendsScreen {
    private _uiManager: UIManager;
    private _saveManager: SaveManager;
    private _audioManager: AudioManager;
    private _onBack: () => void;
    private _referralCode: string;
    private _referralLink: string;

    constructor(uiManager: UIManager, saveManager: SaveManager, audioManager: AudioManager, onBack: () => void) {
        this._uiManager = uiManager;
        this._saveManager = saveManager;
        this._audioManager = audioManager;
        this._onBack = onBack;
        
        this._referralCode = this._saveManager.profile.phone || 'GUEST';
        this._referralLink = `https://ethiofantasy.com/join?ref=${this._referralCode}`;
    }

    public destroy(): void {
    }

    public render(): void {
        const root = this._uiManager.container;

        const copyIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'ጓደኞችን ይጋብዙ' : (i18n.currentLocale === 'om' ? 'HIRIYOOTA AFFEERI' : 'INVITE FRIENDS'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    
                    <!-- HERO -->
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 64px; margin-bottom: 16px; filter: drop-shadow(0 4px 12px rgba(255,213,79,0.3));">👥</div>
                        <h1 style="font-size: 24px; font-weight: 900; color: white; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">${i18n.currentLocale === 'am' ? 'ጓደኞችን ይጋብዙ' : (i18n.currentLocale === 'om' ? 'Hiriyoota Affeeri' : 'Invite Friends')}</h1>
                        <p style="font-size: 15px; color: var(--fds-text-dim); line-height: 1.5; font-weight: 600;">${i18n.currentLocale === 'am' ? 'ጓደኞችዎን ወደ ውድድሩ ያምጡ።' : (i18n.currentLocale === 'om' ? 'Hiriyoota keessan dorgommiitti fidaa.' : 'Bring your friends into the competition.')}</p>
                    </div>

                    <!-- REFERRAL INFO -->
                    <div class="glass-card" style="margin-bottom: 24px; border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.08); background: rgba(7, 27, 45, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-size: 12px; color: var(--tv-gold-primary); margin-bottom: 8px; font-weight: 800; text-transform: uppercase;">${i18n.currentLocale === 'am' ? 'የግብዣ ኮድ' : (i18n.currentLocale === 'om' ? 'Koodii Affeerichaa' : 'REFERRAL CODE')}</label>
                            <div style="display: flex; gap: 12px;">
                                <div style="flex: 1; padding: 14px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: white; font-size: 16px; font-family: monospace; letter-spacing: 1px;">
                                    ${this._referralCode}
                                </div>
                                <div class="btn-copy" data-type="code" style="padding: 0 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
                                    ${copyIcon}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: var(--tv-gold-primary); margin-bottom: 8px; font-weight: 800; text-transform: uppercase;">${i18n.currentLocale === 'am' ? 'የግብዣ ሊንክ' : (i18n.currentLocale === 'om' ? 'Liinkii Affeerichaa' : 'REFERRAL LINK')}</label>
                            <div style="display: flex; gap: 12px;">
                                <div style="flex: 1; padding: 14px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: var(--fds-text-dim); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${this._referralLink}
                                </div>
                                <div class="btn-copy" data-type="link" style="padding: 0 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
                                    ${copyIcon}
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- CTA -->
                    <div id="btn-share" style="background: linear-gradient(135deg, var(--fds-green-pitch) 0%, var(--fds-green-dark) 100%); padding: 16px; text-align: center; border-radius: 12px; font-weight: 900; font-size: 16px; color: white; letter-spacing: 0.5px; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 200, 83, 0.3); margin-bottom: 24px;">
                        ${i18n.currentLocale === 'am' ? 'ጓደኞችን ይጋብዙ' : (i18n.currentLocale === 'om' ? 'HIRIYOOTA AFFEERI' : 'INVITE FRIENDS')}
                    </div>

                    <!-- STATUS / EMPTY STATE -->
                    <div style="text-align: center; padding: 24px 16px;">
                        <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;">📉</div>
                        <div style="font-size: 15px; font-weight: 800; color: white; margin-bottom: 4px;">${i18n.currentLocale === 'am' ? 'ምንም ጓደኞች ገና አልተጋበዙም' : (i18n.currentLocale === 'om' ? 'Hiriyoonni hin affeeramne' : 'No Referrals Yet')}</div>
                        <div style="font-size: 13px; color: var(--fds-text-dim);">${i18n.currentLocale === 'am' ? 'ጓደኞችን ይጋብዙ እና እዚህ የእርስዎን ሁኔታ ይከታተሉ።' : (i18n.currentLocale === 'om' ? 'Hiriyoota affeeri asitti hordofi.' : 'Invite friends to track your referral status here.')}</div>
                    </div>

                </div>
            </div>
            <style>
                .btn-copy:active, #btn-share:active { transform: scale(0.98); opacity: 0.9; }
            </style>
        `;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onBack();
        });

        const copyBtns = root.querySelectorAll('.btn-copy');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._audioManager.playClick();
                const type = (e.currentTarget as HTMLElement).getAttribute('data-type');
                const textToCopy = type === 'code' ? this._referralCode : this._referralLink;
                navigator.clipboard.writeText(textToCopy);
                Toast.show(i18n.currentLocale === 'am' ? 'ተቀድቷል ✅' : (i18n.currentLocale === 'om' ? 'WARAABAMEERA ✅' : 'COPIED ✅'), 'success');
            });
        });

        document.getElementById('btn-share')?.addEventListener('click', async () => {
            this._audioManager.playClick();
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: i18n.currentLocale === 'am' ? 'ኢትዮ ፋንታሲን ይጫወቱ' : (i18n.currentLocale === 'om' ? 'Ethio Fantasy Taphadhu' : 'Play EthioFantasy'),
                        text: i18n.currentLocale === 'am' ? `በኢትዮ ፋንታሲ ላይ ተቀላቀሉኝ! የኔን ኮድ ይጠቀሙ፡ ${this._referralCode}` : (i18n.currentLocale === 'om' ? `Ethio Fantasy irratti na waliin taphadhu! Koodii koo: ${this._referralCode}` : `Join me on EthioFantasy! Use my code: ${this._referralCode}`),
                        url: this._referralLink
                    });
                } catch (err) {
                    console.log('Share error:', err);
                }
            } else {
                navigator.clipboard.writeText(this._referralLink);
                Toast.show(i18n.currentLocale === 'am' ? 'ሊንክ ተቀድቷል ✅' : (i18n.currentLocale === 'om' ? 'LIINKIIN WARAABAMEERA ✅' : 'LINK COPIED ✅'), 'success');
            }
        });
    }
}
