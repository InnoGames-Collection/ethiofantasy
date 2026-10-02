import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';
import { MessageCenterService, MessageCenterItem } from '../../networking/services/MessageCenterService';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';


export type MessageTab = 'all' | 'unread' | 'global' | 'direct' | 'system';

export class MessageCenterScreen {
    private _currentTab: MessageTab = 'all';
    private _messages: MessageCenterItem[] = [];
    private _isOpeningMessage: boolean = false;
    private _isLayoutRendered: boolean = false;
    private _currentRequestId: number = 0;

    constructor(
        private _uiManager: UIManager,
        private _audioManager: AudioManager,
        private _onBack: () => void
    ) {}

    public async render(): Promise<void> {
        if (!this._isLayoutRendered) {
            this._renderLayout();
            this._bindEvents();
            this._isLayoutRendered = true;
        } else {
            this._updateTabUI();
        }

        await this._updateContent();
    }

    private _renderLayout(): void {
        const root = this._uiManager.container;
        const locale = i18n.currentLocale;
        
        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="display: flex; flex-direction: column; height: 100vh; overflow: hidden; position: relative;">
                
                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>
                
                <!-- App Bar -->
                ${EthioFantasyAppBar.render(
                    locale === 'am' ? 'መልዕክቶች' : (locale === 'om' ? 'ERGAWWAAN' : 'Messages')
                )}

                <!-- Main Content Wrapper -->
                <div style="flex: 1; display: flex; flex-direction: column; max-width: 600px; margin: 0 auto; width: 100%; position: relative; z-index: 10; padding-top: 16px;">
                    
                    <!-- Search Input -->
                    <div style="padding: 0 16px; margin-bottom: 12px;">
                        <input type="text" id="mc-search-input" placeholder="🔍 Search messages..." style="
                            width: 100%; 
                            padding: 12px 16px; 
                            border-radius: 12px; 
                            border: 1px solid rgba(255,255,255,0.1); 
                            background: rgba(7, 27, 45, 0.7); 
                            color: white; 
                            font-size: var(--fds-font-sm);
                            box-sizing: border-box;
                        ">
                    </div>

                    <!-- Tabs -->
                    <div id="mc-tab-bar" style="display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 12px 16px; margin-bottom: 4px;" class="hide-scrollbar">
                        <!-- Tabs injected here -->
                    </div>

                    <!-- Message List -->
                    <div id="mc-list-container" style="flex: 1; overflow-y: auto; padding: 0 16px 120px 16px;" class="hide-scrollbar">
                        <!-- Messages injected here -->
                    </div>
                </div>
            </div>
        `;
        
        EthioFantasyAppBar.bind(root, () => {
            this._audioManager.playClick();
            this._onBack();
        });
        
        this._updateTabUI();
    }

    private _updateTabUI(): void {
        const locale = i18n.currentLocale;
        const tabs: { id: MessageTab, label: { en: string, am: string, om: string } }[] = [
            { id: 'all', label: { en: 'All', am: 'ሁሉም', om: 'Hunda' } },
            { id: 'unread', label: { en: 'Unread', am: 'ያልተነበቡ', om: 'Kan Hin Dubbifamne' } },
            { id: 'global', label: { en: 'Announcements', am: 'ማስታወቂያዎች', om: 'Beeksisa' } },
            { id: 'direct', label: { en: 'Inbox', am: 'የገቢ መልዕክቶች', om: 'Ergaa' } },
            { id: 'system', label: { en: 'Support', am: 'ድጋፍ', om: 'Gargaarsa' } }
        ];

        const tabBar = document.getElementById('mc-tab-bar');
        if (!tabBar) return;

        tabBar.innerHTML = tabs.map(tab => {
            const isActive = tab.id === this._currentTab;
            const count = (tab.id === 'unread' || tab.id === 'direct' || tab.id === 'global' || tab.id === 'all') 
                ? MessageCenterService.getInstance().getTotalUnreadCount() 
                : 0; 
            const showBadge = (tab.id === 'unread' || tab.id === 'direct') && count > 0;
            
            if (isActive) {
                return `
                    <button class="mc-pill-tab ${isActive ? 'active-mc-tab' : ''}" data-tab-id="${tab.id}" style="
                        flex: 0 0 auto;
                        padding: 8px 16px;
                        border-radius: 12px;
                        border: 1px solid rgba(74, 222, 128, 0.4);
                        background: linear-gradient(135deg, var(--fds-green-pitch) 0%, var(--fds-green-dark) 100%);
                        color: white;
                        font-size: var(--fds-font-sm);
                        font-weight: 900;
                        cursor: pointer;
                        white-space: nowrap;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4);
                    ">
                        ${tab.label[locale] || tab.label['en']}
                        ${showBadge ? `<span style="background: white; color: var(--fds-green-dark); font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 10px;">${count > 99 ? '99+' : count}</span>` : ''}
                    </button>
                `;
            } else {
                return `
                    <button class="mc-pill-tab" data-tab-id="${tab.id}" style="
                        flex: 0 0 auto;
                        padding: 8px 16px;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.08);
                        background: rgba(7, 27, 45, 0.7);
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        color: var(--fds-text-dim);
                        font-size: var(--fds-font-sm);
                        font-weight: 700;
                        cursor: pointer;
                        white-space: nowrap;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        ${tab.label[locale] || tab.label['en']}
                        ${showBadge ? `<span style="background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 10px;">${count > 99 ? '99+' : count}</span>` : ''}
                    </button>
                `;
            }
        }).join('');

        const tabBtns = tabBar.querySelectorAll('.mc-pill-tab');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._audioManager.playClick();
                const tabId = (e.currentTarget as HTMLElement).getAttribute('data-tab-id') as MessageTab;
                if (tabId && tabId !== this._currentTab) {
                    this._currentTab = tabId;
                    this._updateTabUI();
                    this._renderMessages();
                }
            });
        });
    }

    private _bindEvents(): void {
        const searchInput = document.getElementById('mc-search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this._renderMessages();
            });
        }
    }

    private async _updateContent(): Promise<void> {
        const requestId = ++this._currentRequestId;
        
        const container = document.getElementById('mc-list-container');
        if (container) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="height: 80px; background: rgba(255,255,255,0.05); border-radius: 12px; animation: shimmer 1.5s infinite linear;"></div>
                    <div style="height: 80px; background: rgba(255,255,255,0.05); border-radius: 12px; animation: shimmer 1.5s infinite linear;"></div>
                    <div style="height: 80px; background: rgba(255,255,255,0.05); border-radius: 12px; animation: shimmer 1.5s infinite linear;"></div>
                </div>
            `;
        }

        try {
            const svc = MessageCenterService.getInstance();
            this._messages = await svc.getAllMessages();
        } catch (e) {
            console.error('Failed to fetch messages', e);
            if (this._currentRequestId === requestId && container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px 16px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                        <div style="font-size: 16px; font-weight: 800; color: white; margin-bottom: 8px;">Unable to load messages.</div>
                        <button id="mc-btn-retry" class="ethio-profile-btn ethio-profile-btn-primary" style="max-width: 160px;">Retry</button>
                    </div>
                `;
                document.getElementById('mc-btn-retry')?.addEventListener('click', () => {
                    this._audioManager.playClick();
                    this._updateContent();
                });
            }
            return;
        }

        if (this._currentRequestId !== requestId) return;

        this._updateTabUI(); 
        this._renderMessages();
    }

    private _renderMessages(): void {
        const container = document.getElementById('mc-list-container');
        if (!container) return;

        const searchInput = document.getElementById('mc-search-input') as HTMLInputElement;
        const query = searchInput ? searchInput.value.toLowerCase() : '';

        let filtered = this._messages.filter(m => {
            if (this._currentTab === 'all') return true;
            if (this._currentTab === 'unread') return !m.read;
            return m.category === this._currentTab;
        });

        if (query) {
            filtered = filtered.filter(m => 
                m.title.toLowerCase().includes(query) || 
                m.content.toLowerCase().includes(query)
            );
        }

        if (filtered.length === 0) {
            if (query) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 16px; display: flex; flex-direction: column; align-items: center;">
                        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">🔍</div>
                        <div style="font-size: 18px; font-weight: 900; color: white;">No messages match your search.</div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 16px; display: flex; flex-direction: column; align-items: center;">
                        <div style="font-size: 80px; margin-bottom: 24px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));">📬</div>
                        <div style="font-size: 20px; font-weight: 900; color: white; margin-bottom: 8px;">No messages found</div>
                        <div style="color: var(--fds-text-dim); font-size: 14px;">You have no messages in this category.</div>
                    </div>
                `;
            }
            return;
        }

        container.innerHTML = filtered.map(item => {
            const timeString = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const categoryIcons: Record<string, string> = {
                global: '📢',
                direct: '📩',
                system: '⚙️'
            };
            const icon = categoryIcons[item.category] || '✉️';

            return `
                <div class="glass-card mc-item" data-id="${item.id}" style="
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border-radius: 16px;
                    cursor: pointer;
                    position: relative;
                    transition: transform 0.2s, background-color 0.2s;
                    border: 1px solid ${item.read ? 'rgba(255,255,255,0.08)' : 'rgba(0, 200, 83, 0.4)'};
                    background: rgba(7, 27, 45, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: ${item.read ? 'none' : '0 4px 16px rgba(0, 200, 83, 0.1)'};
                    align-items: center;
                ">
                    <!-- Category Icon -->
                    <div style="
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        background: ${item.read ? 'rgba(255,255,255,0.05)' : 'rgba(0, 200, 83, 0.1)'};
                        border: 1px solid ${item.read ? 'rgba(255,255,255,0.1)' : 'rgba(0, 200, 83, 0.3)'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        flex-shrink: 0;
                        position: relative;
                    ">
                        ${icon}
                        ${!item.read ? `
                            <div style="
                                position: absolute;
                                top: -4px;
                                right: -4px;
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background-color: var(--tv-pitch-green);
                                border: 2px solid rgba(7, 27, 45, 1);
                                box-shadow: 0 0 8px var(--tv-pitch-glow);
                            "></div>
                        ` : ''}
                    </div>

                    <!-- Texts -->
                    <div style="flex: 1; padding-right: 8px; min-width: 0;">
                        <div style="
                            font-size: 15px; 
                            font-weight: 900; 
                            color: white;
                            margin-bottom: 4px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${item.title}</div>
                        <div style="
                            font-size: 13px; 
                            color: var(--fds-text-dim); 
                            line-height: 1.4;
                            margin-bottom: 6px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${item.content}</div>
                        <div style="
                            font-size: 11px; 
                            color: var(--fds-text-muted); 
                            font-weight: 700;
                            text-transform: uppercase;
                        ">${timeString}</div>
                    </div>

                    <!-- Chevron -->
                    <div style="color: rgba(255,255,255,0.2); flex-shrink: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </div>
            `;
        }).join('');

        const cards = container.querySelectorAll('.mc-item');
        cards.forEach(card => {
            card.addEventListener('click', async (e) => {
                if (this._isOpeningMessage) return;

                const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                if (id) {
                    this._isOpeningMessage = true;
                    this._audioManager.playClick();
                    try {
                        const msg = this._messages.find(m => m.id === id);
                        if (msg && !msg.read) {
                            await MessageCenterService.getInstance().markAsRead(id);
                            msg.read = true; 
                        }
                        this._showFullMessage(id);
                    } finally {
                        this._isOpeningMessage = false;
                    }
                }
            });
        });
    }

    private _showFullMessage(id: string): void {
        const msg = this._messages.find(m => m.id === id);
        if (!msg) return;

        const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = new Date(msg.createdAt).toLocaleDateString();

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
            z-index: 10000; display: flex; align-items: flex-end; justify-content: center;
            animation: fade-in 0.2s ease-out;
        `;
        
        overlay.innerHTML = `
            <div style="
                width: 100%; max-width: 600px; 
                background: rgba(7,27,45,0.95);
                backdrop-filter: blur(12px);
                border-radius: 24px 24px 0 0;
                border-top: 1px solid rgba(255,255,255,0.1);
                padding: 24px;
                box-sizing: border-box;
                animation: slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1);
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 -8px 32px rgba(0,0,0,0.5);
            ">
                <div style="width: 48px; height: 6px; background: rgba(255,255,255,0.15); border-radius: 3px; margin: 0 auto 24px auto;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div style="flex: 1; padding-right: 16px;">
                        <div style="font-size: 24px; font-weight: 900; color: white; margin-bottom: 8px; line-height: 1.2;">${msg.title}</div>
                        <div style="font-size: 12px; color: var(--tv-gold-primary); font-weight: 800; text-transform: uppercase;">
                            ${msg.category} • ${dateString} ${timeString}
                        </div>
                    </div>
                    <button id="btn-close-msg" style="
                        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); width: 36px; height: 36px;
                        border-radius: 18px; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
                    ">✕</button>
                </div>

                <div style="
                    flex: 1; overflow-y: auto; 
                    font-size: 15px; color: #CBD5E1; line-height: 1.6;
                    padding-right: 8px; margin-bottom: 24px;
                " class="hide-scrollbar">
                    ${msg.content.replace(/\n/g, '<br>')}
                </div>
            </div>
            <style>
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            </style>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#btn-close-msg')?.addEventListener('click', () => {
            this._audioManager.playClick();
            overlay.remove();
            this._renderMessages(); 
        });
    }
}
