import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

import { VASService } from '../../networking/vas/VASService';

export class SubscriptionScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onClose: () => void;
    private _statusMessage: string = '';
    private _isSubscribing: boolean = false;
    private _isCheckingStatus: boolean = false;

    constructor(uiManager: UIManager, audioManager: AudioManager, onClose: () => void) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onClose = onClose;
        
        // Listen for window focus to check status when returning from SMS app
        window.addEventListener('focus', this._handleFocus);
    }

    private _handleFocus = () => {
        if (this._isSubscribing && !this._isCheckingStatus) {
            this._checkSubscriptionStatus();
        }
    };

    public destroy() {
        window.removeEventListener('focus', this._handleFocus);
    }

    private async _checkSubscriptionStatus() {
        this._isCheckingStatus = true;
        this._statusMessage = 'Checking subscription status...';
        this.render();

        try {
            const isSub = await VASService.getInstance().checkActiveSubscription();
            if (isSub) {
                this._statusMessage = 'Subscription active! Full access unlocked.';
                import('../../core/auth/AuthManager').then(m => m.AuthManager.getInstance().refreshProfile());
            } else {
                this._statusMessage = 'Complete the SMS subscription to activate EthioFantasy.';
            }
        } catch (e) {
            this._statusMessage = 'Could not verify subscription. Please try again.';
        } finally {
            this._isCheckingStatus = false;
            this._isSubscribing = false;
            this.render();
        }
    }

    public render(): void {
        const root = this._uiManager.container;

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; overflow-y: auto; padding-bottom: 80px;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                <div class="floodlight floodlight-left"></div>
                <div class="floodlight floodlight-right"></div>

                <div style="max-width: 600px; margin: 0 auto; position: relative; z-index: 10;">
                    <!-- Header -->
                    ${EthioFantasyAppBar.render('Subscription')}

                    <div style="padding: 24px 16px;">
                        ${this._statusMessage ? `
                            <div style="
                                background: rgba(7, 27, 45, 0.85);
                                backdrop-filter: blur(12px);
                                -webkit-backdrop-filter: blur(12px);
                                border: 1px solid rgba(255,255,255,0.1);
                                color: white;
                                padding: 16px;
                                border-radius: 12px;
                                margin-bottom: 24px;
                                font-weight: 700;
                                font-size: 14px;
                                text-align: center;
                                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                                animation: fade-in 0.3s ease-out;
                            ">${this._statusMessage}</div>
                        ` : ''}

                        <!-- ONLY ONE TIER: DAILY PASS -->
                        <div class="glass-card" style="
                            padding: 32px 24px; 
                            text-align: center; 
                            border-radius: 24px;
                            background: rgba(7, 27, 45, 0.85);
                            backdrop-filter: blur(12px);
                            -webkit-backdrop-filter: blur(12px);
                            border: 1px solid var(--tv-pitch-green);
                            box-shadow: 0 16px 48px rgba(0, 200, 83, 0.15), inset 0 1px 1px rgba(255,255,255,0.1);
                        ">
                            <div style="font-size: 48px; margin-bottom: 12px; filter: drop-shadow(0 4px 12px rgba(0,200,83,0.4));">⚡</div>
                            <h3 style="margin: 0; color: white; font-size: 24px; font-weight: 900; letter-spacing: 1px;">ETHIOFANTASY DAILY</h3>
                            <div style="font-size: 32px; font-weight: 900; color: var(--tv-pitch-green); margin: 16px 0 24px 0;">2 Birr <span style="font-size: 16px; color: var(--fds-text-dim);">/ Day</span></div>
                            
                            <ul style="text-align: left; font-size: 15px; color: var(--fds-text-muted); padding-left: 0; margin-bottom: 32px; line-height: 2; list-style-type: none; font-weight: 600;">
                                <li style="display: flex; align-items: center; gap: 12px;"><span style="color: var(--tv-pitch-green); font-size: 18px;">✓</span> Unlimited solo matches</li>
                                <li style="display: flex; align-items: center; gap: 12px;"><span style="color: var(--tv-pitch-green); font-size: 18px;">✓</span> Live 1v1 multiplayer</li>
                                <li style="display: flex; align-items: center; gap: 12px;"><span style="color: var(--tv-pitch-green); font-size: 18px;">✓</span> All 15 competitions</li>
                                <li style="display: flex; align-items: center; gap: 12px;"><span style="color: var(--tv-pitch-green); font-size: 18px;">✓</span> Daily streak bonuses</li>
                                <li style="display: flex; align-items: center; gap: 12px;"><span style="color: var(--tv-pitch-green); font-size: 18px;">✓</span> Win real prizes</li>
                            </ul>

                            <button id="btn-subscribe" class="ethio-profile-btn" style="
                                width: 100%;
                                background: linear-gradient(135deg, var(--fds-green-pitch) 0%, var(--fds-green-dark) 100%);
                                color: white;
                                font-size: 16px;
                                font-weight: 900;
                                border: none;
                                padding: 18px 24px;
                                border-radius: 16px;
                                box-shadow: 0 8px 24px rgba(0, 200, 83, 0.4), inset 0 2px 4px rgba(255,255,255,0.2);
                                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                ${this._isCheckingStatus ? 'opacity: 0.7; pointer-events: none;' : ''}
                            ">
                                ${this._isCheckingStatus ? 'PROCESSING...' : 'SUBSCRIBE — 2 BIRR/DAY'}
                            </button>
                        </div>
                        
                        <!-- Fallback SMS UI (Hidden by Default) -->
                        <div id="sms-fallback-ui" style="display: none; margin-top: 24px; padding: 24px; background: rgba(0,0,0,0.5); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.2); text-align: center;">
                            <div style="font-size: 14px; color: var(--fds-text-dim); margin-bottom: 16px;">If your messaging app didn't open automatically:</div>
                            <div style="font-size: 18px; font-weight: 900; color: white; margin-bottom: 8px;">Send SMS to 9401</div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--tv-pitch-green); margin-bottom: 20px;">Message: OK</div>
                            <div style="display: flex; gap: 12px; justify-content: center;">
                                <button id="btn-copy-num" class="ethio-profile-btn ethio-profile-btn-secondary" style="flex: 1; padding: 12px; font-size: 13px;">Copy Number</button>
                                <button id="btn-copy-msg" class="ethio-profile-btn ethio-profile-btn-secondary" style="flex: 1; padding: 12px; font-size: 13px;">Copy Message</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <style>
                #btn-subscribe:active {
                    transform: scale(0.97);
                    box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4);
                }
            </style>
        `;

        this._bindEvents();
    }

    private _bindEvents(): void {
        const root = this._uiManager.container;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this.destroy();
            this._onClose();
        });

        const subscribeBtn = root.querySelector('#btn-subscribe');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => {
                if (this._isCheckingStatus) return;
                
                this._audioManager.playClick();
                this._isSubscribing = true;
                this._statusMessage = 'Opening Messages app...';
                this.render();

                // 1. Show processing state briefly before redirect
                setTimeout(() => {
                    const smsLink = 'sms:9401?body=OK';
                    const a = document.createElement('a');
                    a.href = smsLink;
                    
                    // Try to open SMS link
                    try {
                        // Standard click
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        // Show fallback after a delay in case it fails silently (web/desktop)
                        setTimeout(() => {
                            const fallback = document.getElementById('sms-fallback-ui');
                            if (fallback) fallback.style.display = 'block';
                            this._statusMessage = 'Complete the SMS subscription to activate EthioFantasy.';
                            const txt = root.querySelector('.status-msg-text');
                            if (txt) txt.textContent = this._statusMessage;
                        }, 1500);

                    } catch (e) {
                        const fallback = document.getElementById('sms-fallback-ui');
                        if (fallback) fallback.style.display = 'block';
                    }
                }, 500);
            });
        }

        root.querySelector('#btn-copy-num')?.addEventListener('click', () => {
            this._audioManager.playClick();
            navigator.clipboard.writeText('9401');
            this._statusMessage = 'Number copied to clipboard.';
            this.render();
        });

        root.querySelector('#btn-copy-msg')?.addEventListener('click', () => {
            this._audioManager.playClick();
            navigator.clipboard.writeText('OK');
            this._statusMessage = 'Message copied to clipboard.';
            this.render();
        });
    }
}
