import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { ProgressionManager } from '../../core/managers/ProgressionManager';
import { LeaderboardService } from '../../core/leaderboard/LeaderboardService';
import { i18n } from '../../localization/i18n';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export class IdentityScreen {
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

    public destroy(): void {
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
        if (clean.length < 9) return clean;
        return clean.substring(0, 4) + '*****' + clean.substring(clean.length - 2);
    }

    public async render(): Promise<void> {
        const root = this._uiManager.container;
        const profile = this._saveManager.profile;
        const division = ProgressionManager.getDivision(profile.xp);
        
        let rank = 'Unranked';
        try {
            const stats = await LeaderboardService.getInstance().getMyDailyStats();
            if (stats) rank = `#${stats.rank}`;
        } catch (e) {
            console.error('Failed to get rank:', e);
        }

        const username = profile.username || `Player_${Math.floor(Math.random() * 0xffffffff).toString(16)}`;
        const phone = profile.phone ? this._maskPhone(profile.phone) : 'Guest';

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'መለያ' : (i18n.currentLocale === 'om' ? 'EENYUMMAA' : 'IDENTITY'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    
                    <!-- PLAYER IDENTITY CARD -->
                    <div class="glass-card" style="margin-bottom: 24px; border-radius: 16px; padding: 32px 24px; text-align: center; border: 1px solid rgba(255,255,255,0.08); background: rgba(7, 27, 45, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                        
                        <div style="
                            width: 100px; height: 100px; 
                            border-radius: 50%; 
                            background: linear-gradient(135deg, var(--tv-gold-primary), #B8860B);
                            display: flex; align-items: center; justify-content: center; 
                            font-size: 50px; 
                            margin: 0 auto 16px auto;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                            border: 4px solid rgba(255,255,255,0.2);
                        ">
                            👤
                        </div>
                        
                        <div style="font-size: 24px; font-weight: 900; color: white; margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                            ${username}
                        </div>
                        
                        <div style="display: inline-block; padding: 6px 16px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; color: var(--fds-text-dim); font-size: 16px; font-family: monospace; letter-spacing: 1px;">
                            ${phone}
                        </div>

                    </div>

                    <!-- PLAYER STATUS -->
                    <div style="font-size: 14px; font-weight: 800; color: var(--tv-gold-primary); margin-bottom: 12px; text-transform: uppercase; padding-left: 8px;">
                        ${i18n.currentLocale === 'am' ? 'የተጫዋች ሁኔታ' : (i18n.currentLocale === 'om' ? 'SADARKAA TAPHATAA' : 'PLAYER STATUS')}
                    </div>

                    <div class="glass-card" style="margin-bottom: 24px; border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.08); background: rgba(7, 27, 45, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 14px; color: var(--fds-text-dim);">${i18n.currentLocale === 'am' ? 'ሊግ' : (i18n.currentLocale === 'om' ? 'Liigii' : 'League')}</div>
                            <div style="font-size: 16px; font-weight: 800; color: white;">${division.name}</div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 14px; color: var(--fds-text-dim);">${i18n.currentLocale === 'am' ? 'ደረጃ' : (i18n.currentLocale === 'om' ? 'Sadarkaa' : 'Rank')}</div>
                            <div style="font-size: 16px; font-weight: 800; color: var(--tv-gold-primary);">${rank}</div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 14px; color: var(--fds-text-dim);">${i18n.currentLocale === 'am' ? 'ነጥብ' : (i18n.currentLocale === 'om' ? 'Qabxii' : 'Rank Point')}</div>
                            <div style="font-size: 16px; font-weight: 800; color: var(--tv-pitch-green);">${profile.xp.toLocaleString()} XP</div>
                        </div>

                    </div>

                    <!-- SECURITY NOTICE -->
                    <div style="text-align: center; padding: 16px; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                        <div style="font-size: 20px; margin-bottom: 8px; opacity: 0.7;">🔒</div>
                        <div style="font-size: 13px; color: var(--fds-text-dim); font-weight: 600; line-height: 1.5;">
                            ${i18n.currentLocale === 'am' ? 'የእርስዎ ማንነት የተጠበቀ እና ሊስተካከል የማይችል ነው። የሞባይል ስልክ ቁጥርዎ በደህንነት ምክንያት ሙሉ በሙሉ አይታይም።' : (i18n.currentLocale === 'om' ? 'Eenyummaan keessan eegamaa fi sirreeffamuu hin danda\'u.' : 'Your identity profile is secured and read-only. Sensitive information like your full mobile number is masked.')}
                        </div>
                    </div>

                </div>
            </div>
        `;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onBack();
        });
    }
}
