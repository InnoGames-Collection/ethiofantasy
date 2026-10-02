import { UIManager } from '../../core/managers/UIManager';
import { SaveManager } from '../../core/managers/SaveManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';
import { FAQService } from '../../networking/services/FAQService';

export class FAQScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onBack: () => void;
    private _activeCategory: string | null = null;
    private _faqsCache: { q: string; a: string }[] = [];

    constructor(uiManager: UIManager, _saveManager: SaveManager, audioManager: AudioManager, onBack: () => void) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onBack = onBack;
    }

    public destroy(): void {
    }

    public render(): void {
        const root = this._uiManager.container;
        const chevron = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;

        const categories = [
            { id: 'account', name: 'Account', icon: '👤' },
            { id: 'subscription', name: 'Subscription', icon: '💳' },
            { id: 'gameplay', name: 'Gameplay', icon: '⚽' },
            { id: 'dailyChallenge', name: 'Daily Challenge', icon: '📅' },
            { id: 'tournament', name: 'Tournament', icon: '🏆' },
            { id: 'rewards', name: 'Rewards', icon: '🎁' },
            { id: 'technicalIssues', name: 'Technical Issues', icon: '🔧' }
        ];

        // Static fallback FAQs matching approved content if backend fails
        const HELP_FAQS: Record<string, { q: string; a: string }[]> = {
            account: [
                { q: 'How is my account created?', a: 'Your account is automatically created when you authenticate with your Ethio Telecom mobile phone number. There is no password required.' },
                { q: 'Can I delete my account?', a: 'To delete your account data, please contact Ethio Telecom customer service or submit a support ticket via the app.' }
            ],
            subscription: [
                { q: 'What is Premium Subscription?', a: 'Premium subscription gives you unlimited daily plays, full access to all leagues, and entry into the weekly cash prize draws for 2 Birr/day.' },
                { q: 'How do I pay for subscription?', a: 'Subscription fees are automatically deducted from your Ethio Telecom airtime balance daily.' }
            ],
            gameplay: [
                { q: 'How do I play a match?', a: 'Read the question carefully and tap the correct option before the timer runs out. Fast answers score Goals, while incorrect ones are Saved by the goalkeeper!' },
                { q: 'How does the match timer work?', a: 'You have 30 seconds per question in Solo Matches, and 20 seconds in Live 1v1 Matches. Answering quicker increases your possession stat!' }
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
            technicalIssues: [
                { q: 'The app is freezing. What should I do?', a: 'Ensure you have a stable network connection (3G/4G/LTE/5G). Try refreshing the app page by swiping down, or clearing your mobile browser cache.' }
            ]
        };

        if (this._activeCategory) {
            const activeFaqs = this._faqsCache.length > 0 ? this._faqsCache : (HELP_FAQS[this._activeCategory] || []);
            
            const faqHtml = activeFaqs.map((faq, idx) => `
                <div class="ethio-profile-card faq-card interactive" style="margin-bottom: 12px;">
                    <div class="faq-header" data-idx="${idx}" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; cursor: pointer; background: rgba(255,255,255,0.02);">
                        <div style="font-size: 15px; font-weight: 800; color: white; letter-spacing: 0.2px; padding-right: 16px;">${faq.q}</div>
                        <span class="faq-icon" style="color: var(--tv-gold-primary); font-size: 18px; transition: transform 0.2s;">➕</span>
                    </div>
                    <div class="faq-body" id="faq-body-${idx}" style="max-height: 0; overflow: hidden; transition: max-height 0.25s ease-out; background: rgba(0,0,0,0.3);">
                        <div style="padding: 16px; font-size: 14px; color: var(--fds-text-dim); line-height: 1.6; font-weight: 600;">${faq.a}</div>
                    </div>
                </div>
            `).join('');

            const catItem = categories.find(c => c.id === this._activeCategory);
            const categoryName = catItem ? catItem.name : this._activeCategory;

            const emptyState = `
                <div style="text-align: center; padding: 40px 16px;">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📋</div>
                    <div style="font-size: 16px; font-weight: 800; color: white; margin-bottom: 8px;">No FAQs Available</div>
                    <div style="font-size: 14px; color: var(--fds-text-dim);">There are no questions listed for this category yet.</div>
                </div>
            `;

            root.innerHTML = `
                <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">
                    <div class="ethio-layer ethio-layer-pitch"></div>
                    <div class="ethio-layer ethio-layer-overlay"></div>
                    <div class="ethio-layer ethio-layer-lights"></div>

                    ${EthioFantasyAppBar.render('FAQ')}

                    <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                        
                        <div style="margin-bottom: 24px; padding-left: 12px; border-left: 4px solid var(--tv-gold-primary);">
                            <div style="font-size: 18px; font-weight: 900; color: white; margin-bottom: 4px; letter-spacing: 0.5px;">${categoryName.toUpperCase()}</div>
                            <div style="font-size: 14px; color: var(--fds-text-dim);">Find answers and solutions</div>
                        </div>

                        <!-- SEARCH -->
                        <div style="position: relative; margin-bottom: 24px;">
                            <span style="position: absolute; left: 14px; top: 12px; opacity: 0.6;">🔍</span>
                            <input type="text" id="faq-search-input" placeholder="Search questions..." style="
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

            EthioFantasyAppBar.bind(root, () => {
                this._audioManager.playClick();
                this._activeCategory = null;
                this._faqsCache = [];
                this.render();
            });

            // Search filtering
            const searchInput = document.getElementById('faq-search-input') as HTMLInputElement;
            searchInput?.addEventListener('input', (e) => {
                const query = (e.target as HTMLInputElement).value.toLowerCase();
                const cards = root.querySelectorAll('.faq-card');
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

            // Accordion interactions
            const faqHeaders = root.querySelectorAll('.faq-header');
            faqHeaders.forEach(h => {
                h.addEventListener('click', (e) => {
                    this._audioManager.playClick();
                    const target = e.currentTarget as HTMLElement;
                    const idx = target.getAttribute('data-idx');
                    const body = root.querySelector(`#faq-body-${idx}`) as HTMLElement;
                    const icon = target.querySelector('.faq-icon') as HTMLElement;
                    
                    if (body && icon) {
                        // Close others first (accordion behavior)
                        root.querySelectorAll('.faq-body').forEach(b => {
                            if (b !== body && (b as HTMLElement).style.maxHeight !== '0px') {
                                (b as HTMLElement).style.maxHeight = '0px';
                                const otherIdx = b.id.replace('faq-body-', '');
                                const otherIcon = root.querySelector(`.faq-header[data-idx="${otherIdx}"] .faq-icon`);
                                if (otherIcon) otherIcon.innerHTML = '➕';
                            }
                        });

                        if (body.style.maxHeight === '0px' || !body.style.maxHeight) {
                            body.style.maxHeight = body.scrollHeight + 'px';
                            icon.innerHTML = '➖';
                        } else {
                            body.style.maxHeight = '0px';
                            icon.innerHTML = '➕';
                        }
                    }
                });
            });

            return;
        }

        // Category Listing State
        const categoriesHtml = categories.map(c => `
            <div class="faq-category-tile" data-cat-id="${c.id}" style="
                display: flex; align-items: center; justify-content: space-between; 
                padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;
                transition: background-color 0.2s;
            ">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 24px; width: 28px; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${c.icon}</span>
                    <div style="font-size: 15px; font-weight: 800; color: white; letter-spacing: 0.3px;">${c.name}</div>
                </div>
                <div style="display: flex; align-items: center;">
                    ${chevron}
                </div>
            </div>
        `).join('');

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                ${EthioFantasyAppBar.render('FAQ')}

                <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px 120px 16px;">
                    
                    <div style="margin-bottom: 24px; padding-left: 12px; border-left: 4px solid var(--tv-gold-primary);">
                        <div style="font-size: 18px; font-weight: 900; color: white; margin-bottom: 4px; letter-spacing: 0.5px;">FAQ CATEGORIES</div>
                        <div style="font-size: 14px; color: var(--fds-text-dim);">Select a topic for help</div>
                    </div>

                    <div class="ethio-profile-card" style="padding: 0;">
                        ${categoriesHtml}
                    </div>

                </div>
            </div>
        `;

        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onBack();
        });

        const catTiles = root.querySelectorAll('.faq-category-tile');
        catTiles.forEach(tile => {
            tile.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLElement;
                const catId = target.getAttribute('data-cat-id');
                if (catId) {
                    this._audioManager.playClick();
                    this._activeCategory = catId;
                    this.render(); // immediately show empty state/loader
                    
                    try {
                        const faqService = FAQService.getInstance();
                        const rawFaqs = await faqService.getFAQsByCategory(catId);
                        if (rawFaqs && rawFaqs.length > 0) {
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
                        }
                    } catch (err) {
                        console.error('Failed to fetch FAQs:', err);
                    }
                    this.render(); // re-render with fetched FAQs
                }
            });
        });
    }
}
