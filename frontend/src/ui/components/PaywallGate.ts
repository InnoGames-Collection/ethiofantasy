import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { SubscriptionManager } from '../../networking/vas/SubscriptionManager';
import type { SubscriptionTier } from '../../networking/supabase/types';

export class PaywallGate {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onUpgrade: () => void;
    private _onClose: () => void;

    constructor(
        uiManager: UIManager,
        audioManager: AudioManager,
        onUpgrade: () => void,
        onClose: () => void
    ) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onUpgrade = onUpgrade;
        this._onClose = onClose;
    }

    public checkAccess(requiredTier: SubscriptionTier): boolean {
        return SubscriptionManager.getInstance().isFeatureUnlocked(requiredTier);
    }

    public renderGate(featureName: string): void {
        const root = this._uiManager.container;

        root.innerHTML = `
            <div class="stadium-container" style="pointer-events: auto; overflow-y: auto; padding: 40px 20px;">
                    <div style="
                        position: relative;
                        background: rgba(7, 27, 45, 0.95);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        padding: 32px 24px;
                        text-align: center;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    ">
                        <button id="pw-close-btn" style="position: absolute; right: 16px; top: 16px; background: none; border: none; color: var(--fds-text-main); font-weight: bold; cursor: pointer; font-size: 24px;">✕</button>
                        <div style="font-size: 54px; margin-bottom: 12px;">🔒</div>
                        <span style="font-size: 11px; font-weight: 800; color: #FFD54F; letter-spacing: 2px;">
                            VIP FEATURE GATE
                        </span>
                        <h2 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 900; color: white;">
                            UNLOCK ${featureName.toUpperCase()}
                        </h2>
                        <p style="color: #94A3B8; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
                            Subscribe to Ethio Telecom VAS Daily or VIP Monthly pass to unlock unlimited access, live 1v1 matches, and exclusive tournaments.
                        </p>

                        <button id="pw-upgrade-btn" class="broadcast-btn broadcast-btn-gold" style="width: 100%; font-size: 16px; margin-bottom: 12px;">
                            👑 UPGRADE LEAGUE PASS
                        </button>
                    </div>
                </div>
            </div>
        `;

        root.querySelector('#pw-upgrade-btn')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._onUpgrade();
        });

        root.querySelector('#pw-close-btn')?.addEventListener('click', () => {
            this._audioManager.playClick();
            this._onClose();
        });
    }
}
