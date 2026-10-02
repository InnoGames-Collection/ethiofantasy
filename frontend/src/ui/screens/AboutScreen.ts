import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';
import pkg from '../../../package.json';

export class AboutScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onBack: () => void;

    constructor(uiManager: UIManager, _saveManager: SaveManager, audioManager: AudioManager, onBack: () => void) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onBack = onBack;
    }

    public destroy(): void {
    }

    public render(): void {
        const root = this._uiManager.container;

        const aboutCards = [
            {
                title: i18n.currentLocale === 'am' ? 'ስለ ኢትዮ ፋንታሲ' : (i18n.currentLocale === 'om' ? 'Waa\'ee EthioFantasy' : 'About EthioFantasy'),
                content: i18n.currentLocale === 'am' ? 'ኢትዮፋንታሲ በኢትዮጵያ ውስጥ ላሉ የእግር ኳስ አፍቃሪዎች የተዘጋጀ ልዩ የእግር ኳስ ጥያቄዎች ሊግ ነው።' : (i18n.currentLocale === 'om' ? 'EthioFantasy dorgommii gaaffii kubbaa miilaa fayyadamtoota Itoophiyaatif qophaa\'ee dha.' : 'EthioFantasy is a premium Football Quiz League platform crafted specifically for football fans in Ethiopia.')
            },
            {
                title: i18n.currentLocale === 'am' ? 'እንዴት እንደሚሰራ' : (i18n.currentLocale === 'om' ? 'Akkamitti Hojjeta' : 'How It Works'),
                content: i18n.currentLocale === 'am' ? 'ዕለታዊ የትሪቪያ ጨዋታዎችን ይጫወቱ፣ ሌሎች ተጫዋቾችን በቀጥታ 1v1 ይፈትኑ እና በሊግ ደረጃዎች ይውጡ።' : (i18n.currentLocale === 'om' ? 'Tapha guyyaa taphadhaa, dorgomtoota kan biroo 1v1 irratti falmaa, sadarkaa liigii kooraa.' : 'Play daily trivia matches, challenge other players in live 1v1 showdowns, and climb the league divisions.')
            },
            {
                title: i18n.currentLocale === 'am' ? 'ጨዋታዎች እና ፈተናዎች' : (i18n.currentLocale === 'om' ? 'Taphawwanii fi Qormaata' : 'Games & Challenges'),
                content: i18n.currentLocale === 'am' ? 'የዕለት ተግዳሮቶች ከነጥብ ማባዣዎች ጋር እና የክህሎት ማረጋገጫ የሆኑ ጥያቄዎች።' : (i18n.currentLocale === 'om' ? 'Qormaata guyyaa qabxii baay\'isu waliin.' : 'Daily themed challenges with score multipliers and skill-based quizzes.')
            },
            {
                title: i18n.currentLocale === 'am' ? 'ውድድሮች' : (i18n.currentLocale === 'om' ? 'Dorgommii' : 'Tournaments'),
                content: i18n.currentLocale === 'am' ? 'የሳምንቱ መጨረሻ ውድድሮች እና የE-ስፖርት አይነት የማለፊያ ውድድሮች።' : (i18n.currentLocale === 'om' ? 'Dorgommii dhuma torbaniti.' : 'Interactive Weekend knockout tournaments with E-Sports style brackets.')
            },
            {
                title: i18n.currentLocale === 'am' ? 'ሽልማቶች' : (i18n.currentLocale === 'om' ? 'Badhaasa' : 'Rewards'),
                content: i18n.currentLocale === 'am' ? 'የገንዘብ ሽልማቶችን እና ልዩ ባጆችን በውድድሮች አሸንፈው ይውሰዱ።' : (i18n.currentLocale === 'om' ? 'Badhaasa qarshii mo\'achuuf sadarkaa liigii kooraa.' : 'Win real cash prizes, badges, and recognition on the Ethio Telecom VAS platform.')
            },
            {
                title: i18n.currentLocale === 'am' ? 'ድጋፍ' : (i18n.currentLocale === 'om' ? 'Deeggarsa' : 'Support'),
                content: 'support@ethiofantasy.com<br>Powered by InnoGames VAS Team'
            }
        ];

        const cardsHtml = aboutCards.map(card => `
            <div class="ethio-profile-card" style="padding: 20px; margin-bottom: 16px;">
                <div style="font-size: 16px; font-weight: 800; color: white; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${card.title}
                </div>
                <div style="font-size: 14px; color: var(--fds-text-dim); line-height: 1.6;">
                    ${card.content}
                </div>
            </div>
        `).join('');

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; overflow-y: auto;">
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'ስለ ኢትዮ ፋንታሲ' : (i18n.currentLocale === 'om' ? 'WAA\'EE ETHIO FANTASY' : 'ABOUT ETHIOFANTASY'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div style="font-size: 56px; margin-bottom: 12px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));">⚽</div>
                        <div style="font-size: 24px; font-weight: 900; color: white; letter-spacing: 1px;">ETHIOFANTASY</div>
                        <div style="font-size: 14px; font-weight: 700; color: var(--tv-gold-primary); letter-spacing: 2px; margin-top: 4px;">VAS INTEGRATION</div>
                    </div>

                    ${cardsHtml}

                    <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px dashed rgba(255,255,255,0.15);">
                        <div style="font-size: 16px; font-weight: 800; color: white; margin-bottom: 4px;">EthioFantasy</div>
                        <div style="font-size: 14px; font-weight: 700; color: var(--tv-gold-primary); margin-bottom: 12px;">Version ${pkg.version}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.4);">© ${new Date().getFullYear()} Ethio Telecom VAS. All Rights Reserved.</div>
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
