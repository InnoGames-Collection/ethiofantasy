import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { AuthManager } from '../../core/auth/AuthManager';
import { i18n } from '../../localization/i18n';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export class AuthScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _authManager: AuthManager;
    private _onSuccess: () => void;
    private _phoneStep: 'INPUT_PHONE' | 'INPUT_OTP' = 'INPUT_PHONE';
    private _pendingPhone: string = '';
    private _statusMessage: string = '';
    private _devOtpCode: string = '';
    private _showSettings: boolean = false;
    private _settingsTab: 'main' | 'language' | 'tc' | 'faq' = 'main';
    private _faqExpandedIndex: number = -1;
    private _bannerInterval: any = null;
    private _currentBanner: number = 1;

    constructor(
        uiManager: UIManager,
        audioManager: AudioManager,
        authManager: AuthManager,
        onSuccess: () => void
    ) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._authManager = authManager;
        this._onSuccess = onSuccess;

        (window as any).ethioOnBackPress = () => {
            if (this._showSettings) {
                if (this._settingsTab !== 'main') {
                    this._settingsTab = 'main';
                } else {
                    this._showSettings = false;
                }
                this.render();
                return true;
            }
            return false;
        };
    }

    private _renderSettingsContent(): string {
        if (this._settingsTab === 'main') {
            return `
                <div class="settings-tile" data-tab="language" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; background: rgba(255,255,255,0.05); border-radius: 12px 12px 0 0;">
                    <div style="font-weight: 700; font-size: 16px;">${i18n.currentLocale === 'am' ? 'ቋንቋ' : i18n.currentLocale === 'om' ? 'Afaan' : 'Language'}</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #94A3B8;">${i18n.currentLocale === 'am' ? 'አማርኛ' : i18n.currentLocale === 'om' ? 'Afan Oromo' : 'English'}</span>
                        <span>❯</span>
                    </div>
                </div>
                <div class="settings-tile sound-toggle" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; background: rgba(255,255,255,0.05);">
                    <div style="font-weight: 700; font-size: 16px;">${i18n.currentLocale === 'am' ? 'የድምፅ ውጤቶች' : i18n.currentLocale === 'om' ? 'Sagalee' : 'Sound Effects'}</div>
                    <div style="color: ${!this._audioManager.isMuted ? '#4ADE80' : '#F87171'}; font-weight: 700;">${!this._audioManager.isMuted ? 'ON' : 'OFF'}</div>
                </div>
                <div class="settings-tile" data-tab="tc" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; background: rgba(255,255,255,0.05);">
                    <div style="font-weight: 700; font-size: 16px;">${i18n.currentLocale === 'am' ? 'ውሎች እና ሁኔታዎች' : i18n.currentLocale === 'om' ? 'Waliigaltee & Haalawwan' : 'Terms & Conditions'}</div>
                    <span>❯</span>
                </div>
                <div class="settings-tile" data-tab="faq" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; cursor: pointer; background: rgba(255,255,255,0.05); border-radius: 0 0 12px 12px;">
                    <div style="font-weight: 700; font-size: 16px;">FAQ</div>
                    <span>❯</span>
                </div>
            `;
        } else if (this._settingsTab === 'language') {
            return `
                <div class="settings-tile lang-item" data-lang="en" style="padding: 16px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between;">
                    <span>English</span>
                    ${i18n.currentLocale === 'en' ? '<span>✓</span>' : ''}
                </div>
                <div class="settings-tile lang-item" data-lang="am" style="padding: 16px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; display: flex; justify-content: space-between;">
                    <span>አማርኛ (Amharic)</span>
                    ${i18n.currentLocale === 'am' ? '<span>✓</span>' : ''}
                </div>
                <div class="settings-tile lang-item" data-lang="om" style="padding: 16px; background: rgba(255,255,255,0.05); cursor: pointer; border-radius: 0 0 12px 12px; display: flex; justify-content: space-between;">
                    <span>Afan Oromo</span>
                    ${i18n.currentLocale === 'om' ? '<span>✓</span>' : ''}
                </div>
            `;
        } else if (this._settingsTab === 'tc') {
            return `
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
                    <h2 style="margin-top: 0; font-size: 20px;">Terms & Conditions</h2>
                    <p style="color: #CBD5E1; line-height: 1.6;">Welcome to EthioFantasy. By logging in, you agree to our Terms & Conditions. You must be 18 years or older and an active subscriber to participate. Your data is handled securely and in compliance with local regulations. Subscription fees are deducted automatically from your airtime.</p>
                </div>
            `;
        } else if (this._settingsTab === 'faq') {
            const faqs = [
                { q: "How do I play?", a: "Answer questions quickly to score goals. Each fast correct answer increases your chance to win!" },
                { q: "Is it free?", a: "There is a daily subscription fee for premium access. It will be deducted from your airtime balance." },
                { q: "How are prizes awarded?", a: "Prizes are distributed based on weekly leaderboard standings and sent directly to your mobile account." },
                { q: "How do I unsubscribe?", a: "You can unsubscribe anytime by sending 'STOP' to 8282 or visiting your profile settings." }
            ];
            return faqs.map((f, i) => `
                <div class="faq-item" data-idx="${i}" style="background: rgba(255,255,255,0.05); margin-bottom: 10px; border-radius: 12px; overflow: hidden; cursor: pointer;">
                    <div style="padding: 16px; font-weight: bold; border-bottom: ${this._faqExpandedIndex === i ? '1px solid rgba(255,255,255,0.1)' : 'none'}; display: flex; justify-content: space-between;">
                        <span>${f.q}</span>
                        <span style="color: #F59E0B;">${this._faqExpandedIndex === i ? '−' : '+'}</span>
                    </div>
                    ${this._faqExpandedIndex === i ? `<div style="padding: 16px; color: #CBD5E1; line-height: 1.5;">${f.a}</div>` : ''}
                </div>
            `).join('');
        }
        return '';
    }

    public render(): void {
        const root = this._uiManager.container;
        const isOtpStep = this._phoneStep === 'INPUT_OTP';

        // Show the pending phone exactly as they typed it before or the normalised form without the '+'.
        const defaultVal = this._pendingPhone ? this._pendingPhone.replace('+', '') : '';

        root.innerHTML = `
            <div style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background-color: #020617;
                background-image: 
                    radial-gradient(circle at center, rgba(7, 27, 45, 0.8) 0%, rgba(2, 6, 23, 0.98) 100%),
                    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255, 255, 255, 0.02) 40px, rgba(255, 255, 255, 0.02) 80px);
                display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                font-family: system-ui, -apple-system, sans-serif; pointer-events: auto; padding: max(16px, env(safe-area-inset-top)) 16px 16px 16px; box-sizing: border-box; overflow-y: auto; overflow-x: hidden;
            ">
                <!-- Top-Right Settings -->
                <div style="width: 100%; max-width: 400px; display: flex; justify-content: flex-end; margin-bottom: 16px; flex-shrink: 0;">
                    <button id="auth-settings-btn" style="background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 40px; height: 40px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                        <span style="font-size: 20px; line-height: 1;">⚙️</span>
                    </button>
                </div>

                <!-- 10-Banner Carousel -->
                <div id="auth-banner-container" style="width: 100%; max-width: 400px; flex-shrink: 0; position: relative; height: clamp(110px, 22vh, 160px); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3); background: #0F172A; touch-action: pan-y pinch-zoom; cursor: grab;">
                    <img id="auth-banner-bg" src="/assets/banners/${this._currentBanner}.png" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 1; transition: opacity 0.8s ease-in-out;" draggable="false" />
                    <img id="auth-banner-fg" src="/assets/banners/${this._currentBanner === 10 ? 1 : this._currentBanner + 1}.png" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.8s ease-in-out;" draggable="false" />
                </div>
                
                <!-- Pagination Dots -->
                <div id="auth-banner-dots" style="display: flex; gap: 6px; margin-top: 12px; margin-bottom: clamp(12px, 2.5vh, 20px);">
                    ${Array.from({ length: 10 }).map((_, i) => `
                        <div style="width: 6px; height: 6px; border-radius: 50%; background: ${this._currentBanner === i + 1 ? '#00C853' : 'rgba(255,255,255,0.2)'}; transition: background 0.3s ease;"></div>
                    `).join('')}
                </div>
                
                ${this._showSettings ? `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0F172A; z-index: 1000; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden;">
                    ${EthioFantasyAppBar.render(
                        this._settingsTab === 'main' ? (i18n.currentLocale === 'am' ? 'ቅንብሮች' : i18n.currentLocale === 'om' ? 'Qindaa\'inoota' : 'Settings') : 
                        this._settingsTab === 'language' ? (i18n.currentLocale === 'am' ? 'ቋንቋ ይምረጡ' : i18n.currentLocale === 'om' ? 'Afaan Filadhu' : 'Select Language') : 
                        this._settingsTab === 'tc' ? 'Terms & Conditions' : 'FAQ'
                    )}
                    <div style="padding: 20px; color: white; flex: 1; max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                        ${this._renderSettingsContent()}
                    </div>
                </div>
                ` : ''}

                <!-- Compact Sign In Card -->
                <div style="
                    background: #071B2D; border-radius: 24px; padding: 24px 16px;
                    width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                    text-align: center; margin-bottom: 24px; flex-shrink: 0;
                ">
                    <h1 style="font-size: 20px; font-weight: 800; color: white; margin: 0 0 16px 0;">
                        ${i18n.currentLocale === 'am' ? 'ይግቡ' : (i18n.currentLocale === 'om' ? 'Seenaa' : 'Sign In')}
                    </h1>

                    ${this._statusMessage ? `
                        <div style="color: #EF4444; font-size: 13px; margin-bottom: 12px; text-align: left;">
                            ${this._statusMessage}
                        </div>
                    ` : ''}

                    ${this._devOtpCode ? `
                        <div style="
                            background: rgba(22, 163, 74, 0.1); border: 1px solid #16A34A; border-radius: 12px;
                            padding: 10px 14px; margin-bottom: 12px; text-align: left;
                        ">
                            <div style="font-size: 11px; font-weight: 700; color: #4ADE80; text-transform: uppercase; margin-bottom: 4px;">
                                🔑 Your OTP Code (Dev Mode)
                            </div>
                            <div style="font-size: 22px; font-weight: 900; color: white; letter-spacing: 4px;">
                                ${this._devOtpCode}
                            </div>
                        </div>
                    ` : ''}

                    <div style="text-align: left; margin-bottom: 16px;">
                        <input type="tel" id="phone-input" placeholder="2519XXXXXXXX / 2518XXXXXXXX" value="${defaultVal}" ${isOtpStep ? 'disabled' : ''} style="
                            width: 100%; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;
                            padding: 0 16px; height: 56px; color: #0F172A; font-size: 16px; outline: none; box-sizing: border-box;
                            opacity: ${isOtpStep ? '0.6' : '1'}; transition: border-color 0.2s;
                        " onfocus="this.style.borderColor='#00C853'" onblur="this.style.borderColor='#E2E8F0'" />
                    </div>

                    <div style="display: flex; align-items: stretch; margin-bottom: 16px; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF; height: 56px; opacity: ${isOtpStep ? '1' : '0.6'}; transition: border-color 0.2s;" id="otp-container">
                        <input type="text" id="otp-input" maxlength="6"
                            placeholder="${i18n.currentLocale === 'am' ? 'የ 6-አሃዝ ኮድ' : (i18n.currentLocale === 'om' ? 'Koodii dijiitii 6' : '6-digit code')}"
                            ${isOtpStep ? '' : 'disabled'}
                            style="
                            flex: 1; background: transparent; border: none; padding: 0 16px;
                            color: #0F172A; font-size: 16px; outline: none; width: 100%;
                            letter-spacing: 2px; font-weight: 700; height: 100%;
                        " onfocus="document.getElementById('otp-container').style.borderColor='#00C853'" onblur="document.getElementById('otp-container').style.borderColor='#E2E8F0'" />
                        <button id="send-otp-btn" style="
                            background: transparent; color: #00C853; border: none; padding: 0 16px; border-left: 1px solid #E2E8F0;
                            font-size: 14px; font-weight: 800; cursor: ${isOtpStep ? 'default' : 'pointer'}; outline: none;
                            opacity: ${isOtpStep ? '0.7' : '1'}; white-space: nowrap; height: 100%;
                        " ${isOtpStep ? 'disabled' : ''}>
                            ${i18n.currentLocale === 'am' ? 'ኮድ ያግኙ' : (i18n.currentLocale === 'om' ? 'Koodii fudhadhu' : 'Get code')}
                        </button>
                    </div>

                    <div id="sign-in-container" style="margin-bottom: 0;">
                        <button id="verify-otp-btn" disabled style="
                            width: 100%; background: #00C853; color: white; border: none; border-radius: 12px;
                            height: 56px; font-size: 16px; font-weight: 800; cursor: not-allowed; opacity: 0.5; transition: opacity 0.2s;
                        ">${i18n.currentLocale === 'am' ? 'ይግቡ' : (i18n.currentLocale === 'om' ? 'Seenaa' : 'Sign In')}</button>
                    </div>
                    
                    ${isOtpStep ? `
                    <div style="margin-top: 16px; display: flex; justify-content: center;">
                        <button id="change-phone-btn" style="background: none; border: none; color: #FFD54F; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0;">
                            ${i18n.currentLocale === 'am' ? 'ቁጥር ይቀይሩ' : (i18n.currentLocale === 'om' ? 'Lakkoofsa jijjiiri' : 'Change number')}
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- Registration & Subscribe -->
                <div style="width: 100%; max-width: 400px; text-align: center; margin-bottom: 12px;">
                    <span style="color: #64748B; font-size: 14px; font-weight: 600;">Don't Have an Account?</span>
                    <span id="btn-register-here" style="color: #00C853; font-size: 14px; font-weight: 800; cursor: pointer; margin-left: 4px;">Register Here</span>
                </div>

                <button id="auth-subscribe-btn" style="
                    background: rgba(7, 27, 45, 0.6); color: #00C853;
                    border: 2px solid #00C853; border-radius: 12px; height: 56px; font-size: 16px;
                    font-weight: 800; width: 100%; max-width: 400px; cursor: pointer;
                    flex-shrink: 0; margin-bottom: clamp(16px, 4vh, 40px); transition: background 0.2s;
                " onmouseover="this.style.background='rgba(0,200,83,0.1)'" onmouseout="this.style.background='rgba(7, 27, 45, 0.6)'">
                    ${i18n.currentLocale === 'am' ? 'ሰብስክራይብ' : (i18n.currentLocale === 'om' ? 'Galmoofadhu' : 'Subscribe')}
                </button>
            </div>
        `;

        this._bindEvents();
    }

    private _bindEvents(): void {
        const root = this._uiManager.container;
        const bannerContainer = root.querySelector('#auth-banner-container');
        if (bannerContainer) {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            const changeBanner = (direction: 1 | -1) => {
                this._currentBanner += direction;
                if (this._currentBanner > 10) this._currentBanner = 1;
                if (this._currentBanner < 1) this._currentBanner = 10;
                this.render(); // This will naturally redraw and reset the interval.
            };

            const handleStart = (x: number) => {
                startX = x;
                isDragging = true;
            };

            const handleMove = (x: number) => {
                if (!isDragging) return;
                currentX = x;
            };

            const handleEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                const diff = startX - currentX;
                if (Math.abs(diff) > 50 && currentX !== 0) { // minimum swipe distance
                    changeBanner(diff > 0 ? 1 : -1);
                }
                currentX = 0;
            };

            bannerContainer.addEventListener('touchstart', (e: any) => handleStart(e.touches[0].clientX));
            bannerContainer.addEventListener('touchmove', (e: any) => handleMove(e.touches[0].clientX));
            bannerContainer.addEventListener('touchend', handleEnd);
            bannerContainer.addEventListener('mousedown', (e: any) => handleStart(e.clientX));
            bannerContainer.addEventListener('mousemove', (e: any) => handleMove(e.clientX));
            bannerContainer.addEventListener('mouseup', handleEnd);
            bannerContainer.addEventListener('mouseleave', handleEnd);
        }

        if (this._bannerInterval) {
            clearInterval(this._bannerInterval);
            this._bannerInterval = null;
        }

        if (!this._showSettings) {
            this._bannerInterval = setInterval(() => {
                const bgImg = root.querySelector('#auth-banner-bg') as HTMLImageElement;
                const fgImg = root.querySelector('#auth-banner-fg') as HTMLImageElement;
                
                if (bgImg && fgImg) {
                    fgImg.style.opacity = '1';
                    
                    setTimeout(() => {
                        if (!bgImg || !fgImg) return;
                        bgImg.src = fgImg.src;
                        fgImg.style.transition = 'none';
                        fgImg.style.opacity = '0';
                        
                        this._currentBanner = this._currentBanner >= 10 ? 1 : this._currentBanner + 1;
                        const nextNextBanner = this._currentBanner >= 10 ? 1 : this._currentBanner + 1;
                        fgImg.src = `/assets/banners/${nextNextBanner}.png`;
                        
                        // Update dots visually without full re-render
                        const dots = root.querySelectorAll('#auth-banner-dots > div');
                        dots.forEach((dot, i) => {
                            (dot as HTMLElement).style.background = this._currentBanner === i + 1 ? '#00C853' : 'rgba(255,255,255,0.2)';
                        });
                        
                        void fgImg.offsetWidth; // force reflow
                        fgImg.style.transition = 'opacity 0.8s ease-in-out';
                    }, 800);
                }
            }, 4000);
        }

        root.querySelector('#phone-input')?.addEventListener('input', (e: Event) => {
            const input = e.target as HTMLInputElement;
            // Let the user type numbers and optionally a + sign at the beginning.
            input.value = input.value.replace(/[^0-9+]/g, '');
            if (input.value.indexOf('+') > 0) {
                input.value = input.value.replace(/\+/g, '');
            }
        });

        root.querySelector('#otp-input')?.addEventListener('input', (e: Event) => {
            const input = e.target as HTMLInputElement;
            const btn = root.querySelector('#verify-otp-btn') as HTMLButtonElement;
            if (btn) {
                if (input.value.trim().length === 6) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                }
            }
        });

        const sendOtpBtn = root.querySelector('#send-otp-btn');
        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', async () => {
                this._audioManager.playClick();
                const phoneInput = root.querySelector('#phone-input') as HTMLInputElement;
                const rawNum = phoneInput?.value.trim() || '';

                if (!rawNum) {
                    this._statusMessage = i18n.currentLocale === 'am'
                        ? 'እባክዎን ትክክለኛ የስልክ ቁጥር ያስገቡ።'
                        : (i18n.currentLocale === 'om'
                            ? 'Maaloo lakkoofsa bilbilaa sirrii ta\'e galchaa.'
                            : 'Please enter a valid phone number.');
                    this.render();
                    return;
                }

                // Use the shared normalise method to produce E.164.
                const fullPhone = AuthManager.normalisePhone(rawNum);
                this._pendingPhone = fullPhone;
                this._devOtpCode = '';
                this._statusMessage = i18n.currentLocale === 'am'
                    ? 'የኦቲፒ መልዕክት በመላክ ላይ...'
                    : (i18n.currentLocale === 'om' ? 'OTP SMS ergaa jira...' : 'Sending OTP...');
                this.render();

                const res = await this._authManager.signInWithPhone(fullPhone);
                if (res.success) {
                    this._phoneStep = 'INPUT_OTP';
                    this._statusMessage = '';
                    if (res.demoOtp || this._authManager.devOtpCode) {
                        this._devOtpCode = res.demoOtp || this._authManager.devOtpCode;
                        this._fetchDevOtp(fullPhone);
                    }
                } else {
                    this._statusMessage = res.error || (i18n.currentLocale === 'am'
                        ? 'ኮድ መላክ አልተቻለም።'
                        : (i18n.currentLocale === 'om' ? 'OTP erguun hin danda\'amne.' : 'Failed to send OTP.'));
                }
                this.render();
            });
        }

        const verifyOtpBtn = root.querySelector('#verify-otp-btn');
        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', async () => {
                this._audioManager.playClick();
                const otpInput = root.querySelector('#otp-input') as HTMLInputElement;
                const token = otpInput?.value.trim() || '';

                if (token.length !== 6) {
                    this._statusMessage = i18n.currentLocale === 'am'
                        ? 'እባክዎን የ 6-አሃዝ ማረጋገጫ ኮድ ያስገቡ።'
                        : (i18n.currentLocale === 'om'
                            ? 'Maaloo koodii mirkaneessaa dijiitii 6 galchaa.'
                            : 'Please enter a 6-digit verification code.');
                    this.render();
                    return;
                }

                this._statusMessage = i18n.currentLocale === 'am'
                    ? 'ኮድ በመፈተሽ ላይ...'
                    : (i18n.currentLocale === 'om' ? 'Koodii mirkaneessaa jira...' : 'Verifying code...');
                this.render();

                const res = await this._authManager.verifyOtp(this._pendingPhone, token);
                if (res.success) {
                    this._onSuccess();
                } else {
                    this._statusMessage = res.error || (i18n.currentLocale === 'am'
                        ? 'የተሳሳተ የማረጋገጫ ኮድ።'
                        : (i18n.currentLocale === 'om'
                            ? 'Koodii mirkaneessaa dogoggoraa.'
                            : 'Invalid verification code.'));
                    this.render();
                }
            });
        }

        const changePhoneBtn = root.querySelector('#change-phone-btn');
        if (changePhoneBtn) {
            changePhoneBtn.addEventListener('click', () => {
                this._audioManager.playClick();
                this._phoneStep = 'INPUT_PHONE';
                this._statusMessage = '';
                this._devOtpCode = '';
                this.render();
            });
        }

        const settingsBtn = root.querySelector('#auth-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this._audioManager.playClick();
                this._showSettings = true;
                this._settingsTab = 'main';
                this.render();
            });
        }

        const settingsBackBtn = root.querySelector('.app-bar-back-btn');
        if (settingsBackBtn) {
            settingsBackBtn.addEventListener('click', () => {
                this._audioManager.playClick();
                if (this._settingsTab !== 'main') {
                    this._settingsTab = 'main';
                    this.render();
                } else {
                    this._showSettings = false;
                    this.render();
                }
            });
        }

        root.querySelectorAll('.settings-tile[data-tab]').forEach(el => {
            el.addEventListener('click', (e) => {
                this._audioManager.playClick();
                this._settingsTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
                this.render();
            });
        });

        root.querySelector('.sound-toggle')?.addEventListener('click', () => {
            this._audioManager.toggleMute();
            this._audioManager.playClick();
            
            const isMuted = this._audioManager.isMuted;
            localStorage.setItem('ETHIO_FOOTBALL_MUTED', String(isMuted));
            
            const saved = localStorage.getItem('ETHIO_FOOTBALL_SETTINGS_V2');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    parsed.soundEffects = !isMuted;
                    localStorage.setItem('ETHIO_FOOTBALL_SETTINGS_V2', JSON.stringify(parsed));
                } catch(e) {}
            }
            this.render();
        });

        root.querySelectorAll('.lang-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang') as 'en' | 'am' | 'om';
                i18n.setLocale(lang);
                this._audioManager.playClick();
                this._settingsTab = 'main';
                this.render();
            });
        });

        root.querySelectorAll('.faq-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '-1', 10);
                this._faqExpandedIndex = this._faqExpandedIndex === idx ? -1 : idx;
                this._audioManager.playClick();
                this.render();
            });
        });

        const subscribeBtn = root.querySelector('#auth-subscribe-btn');
        const registerBtn = root.querySelector('#btn-register-here');
        const handleSubscribe = () => {
            this._audioManager.playClick();
            window.location.href = 'sms:9401?body=OK';
        };

        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', handleSubscribe);
        }
        if (registerBtn) {
            registerBtn.addEventListener('click', handleSubscribe);
        }
    }

    /**
     * Poll the dev_otps table for a code and show it on screen.
     * Only works when an OTP echo hook is configured in Supabase.
     * In production this table will be empty or not exist — fails silently.
     */
    private async _fetchDevOtp(_phone: string): Promise<void> {
        if (this._devOtpCode) {
            this.render();
            const otpInput = this._uiManager.container.querySelector('#otp-input') as HTMLInputElement;
            if (otpInput) {
                otpInput.value = this._devOtpCode;
                otpInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }
}
