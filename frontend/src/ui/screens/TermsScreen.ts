import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export class TermsScreen {
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

        const body = i18n.currentLocale === 'am' ? `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">1. መግቢያ እና የኢትዮፋንታሲ ስምምነት</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">ለኢትዮ ቴሌኮም ደንበኞች ወደተዘጋጀው የኢትዮ ፋንታሲ የእግር ኳስ ጥያቄ ሊግ እንኳን በደህና መጡ። ይህንን ተጨማሪ እሴት አገልግሎት (VAS) በመጠቀም፣ ከኢትዮፋንታሲ እና ከኢትዮ ቴሌኮም ጋር ውል ይገባሉ።</p>
                
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">2. የምዝገባ ዕቅድ እና ክፍያ</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">ለፕሪሚየም አገልግሎት ዕለታዊ ክፍያ 2 ብር ሲሆን፤ መሰረታዊ አገልግሎት ዕለታዊ ክፍያ 1 ብር ነው። የምዝገባ ክፍያው ከኢትዮ ቴሌኮም የሞባይል ሂሳብዎ ላይ በቀጥታ ተቀናሽ ይደረጋል።</p>
                
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">3. የጨዋታ እና የደረጃ ሰሌዳ ታማኝነት</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">ጥያቄዎችን በተሰጠው የጊዜ ገደብ ውስጥ መመለስ ይኖርብዎታል። በጨዋታ ላይ ማጭበርበር ወይም ያልተፈቀዱ ቦቶችን መጠቀም መለያዎ በቋሚነት እንዲታገድ ያደርጋል።</p>
                
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">4. ሽልማቶች እና የገንዘብ ሽልማት ስርጭት</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 0;">በዕለታዊ ተግዳሮቶች፣ ውድድሮች እና ጨዋታዎች የተገኙ የሽልማት ነጥቦች (XP እና ሳንቲሞች) የተለየ ካልተገለጸ በስተቀር እውነተኛ የገንዘብ ዋጋ የላቸውም። ኦፊሴላዊ የሳምንታዊ ደረጃ ሰሌዳ የገንዘብ ሽልማቶች በቀጥታ ወደ ተመዝጋቢው የተረጋገጠ የኢትዮ ቴሌኮም ሞባይል ሂሳብ ገቢ ይደረጋሉ።</p>
            </div>
        ` : (i18n.currentLocale === 'om' ? `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">1. Seensa & Waliigaltee EthioFantasy</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">Gara EthioFantasy, dorgommii gaaffii kubbaa miilaa Itiyo Telekoom fayyadamtootaaf qophaa'eetti baga nagaan dhuftan.</p>
                
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">2. Kaffaltii</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">Kaffaltiin Premium guyyaatti qarshii 2 yommuu ta'u, kaffaltiin Basic guyyaatti qarshii 1 dha. Kaffaltiin kun herrega bilbila keessanii irraa hir'ifama.</p>

                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">3. Tapha & Sadarkaa</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">Gaaffiiwwan yeroo kenname keessatti deebisuu qabdu. Mala dogoggoraa fayyadamuun akaauntii keessan cufsiisa.</p>

                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">4. Badhaasa Qarshii</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 0;">Badhaasni torban amanamummaadhaan herrega bilbila keessan irratti kaffalama.</p>
            </div>
        ` : `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">1. Introduction & Agreement</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">Welcome to EthioFantasy, the premium Football Quiz League developed for Ethio Telecom customers. By accessing this Value Added Service (VAS), you enter into a binding agreement with EthioFantasy and Ethio Telecom.</p>
                
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">2. Subscription Plans & Billing</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">Subscribing to Premium grants unlimited gameplay access, full league entry, and entry into weekly cash pools. Premium subscription billing is 2 Birr/day. Basic subscription is billed at 1 Birr/day. Daily subscription fees are automatically deducted from your Ethio Telecom airtime balance.</p>
                
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">3. Gameplay & Leaderboard Integrity</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 24px;">The Football Quiz League requires participants to answer themed questions within the allocated time (30 seconds for Solo, 20 seconds for Live 1v1). Score progression and ELO points are recorded in real-time. Cheating, abusing system vulnerabilities, or using bots is strictly prohibited and results in immediate account termination.</p>
                
                <h2 style="color: white; font-size: 16px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">4. Rewards & Prize Distribution</h2>
                <p style="color: var(--fds-text-dim); margin-top: 0; margin-bottom: 0;">Reward points (XP and coins) gained in Daily Challenges, Tournaments, and matches do not have real cash value unless specified. Official weekly leaderboard cash prizes are credited directly to the subscriber's verified Ethio Telecom mobile account balance. Decision of the EthioFantasy administration on rank calculations is final.</p>
            </div>
        `);

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto; overflow-y: auto;">
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${EthioFantasyAppBar.render(i18n.currentLocale === 'am' ? 'ውሎች እና ሁኔታዎች' : (i18n.currentLocale === 'om' ? 'WALIIGALTEE' : 'TERMS & CONDITIONS'))}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    <div style="margin-bottom: 24px; padding-left: 12px; border-left: 4px solid var(--tv-gold-primary);">
                        <div style="font-size: 18px; font-weight: 900; color: white; margin-bottom: 4px; letter-spacing: 0.5px;">LEGAL AGREEMENT</div>
                        <div style="font-size: 14px; color: var(--fds-text-dim);">Please read these terms carefully</div>
                    </div>

                    <div class="ethio-profile-card" style="padding: 24px;">
                        ${body}
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
