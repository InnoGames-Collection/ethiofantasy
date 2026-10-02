import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { i18n } from '../../localization/i18n';

import { NotificationService } from '../../networking/services/NotificationService';
import type { NotificationRow } from '../../networking/supabase/types';
import { PullToRefresh } from '../components/PullToRefresh';
import { DesignSystem } from '../theme/DesignSystem';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export class NotificationScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _onBack: () => void;
    private _activeTab: string = 'all';
    private _notifications: NotificationRow[] = [];
    private _unsubscribeRealtime: (() => void) | null = null;

    constructor(uiManager: UIManager, audioManager: AudioManager, onBack: () => void) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._onBack = onBack;
        
        // Listen for new notifications
        this._unsubscribeRealtime = NotificationService.getInstance().subscribeToNewNotifications((newNotif) => {
            this._notifications.unshift(newNotif);
            this.render();
        });

        this._loadNotifications();
    }

    private async _loadNotifications(): Promise<void> {
        const notifService = NotificationService.getInstance();
        this._notifications = await notifService.getNotifications();
        this.render();
    }

    public render(): void {
        const root = this._uiManager.container;
        const locale = i18n.currentLocale;

        // Filter notifications based on active tab
        const filtered = this._notifications.filter(item => {
            if (this._activeTab === 'all') return true;
            if (this._activeTab === 'unread') return !item.read;
            return item.category === this._activeTab;
        });

        // Tabs Config
        const tabs = [
            { id: 'all', label: { en: 'All', am: 'ሁሉም', om: 'Hunda' } },
            { id: 'unread', label: { en: 'Unread', am: 'ያልተነበቡ', om: 'Kan Hin Dubbifamne' } },
            { id: 'daily', label: { en: 'Daily', am: 'የዕለት', om: 'Guyyaa' } },
            { id: 'tournament', label: { en: 'League', am: 'ሊግ', om: 'Liigii' } },
            { id: 'rewards', label: { en: 'Rewards', am: 'ሽልማቶች', om: 'Badhaasa' } },
            { id: 'announcements', label: { en: 'System', am: 'ስርዓት', om: 'Sirna' } },
            { id: 'subscription', label: { en: 'Billing', am: 'ክፍያ', om: 'Kaffaltii' } }
        ];

        const tabsHtml = tabs.map(tab => {
            const isActive = tab.id === this._activeTab;
            const count = tab.id === 'unread' 
                ? this._notifications.filter(n => !n.read).length 
                : (tab.id === 'all' ? this._notifications.length : this._notifications.filter(n => n.category === tab.id).length);

            return `
                <button class="notif-tab ${isActive ? 'active-notif-tab' : ''}" data-tab-id="${tab.id}" style="
                    flex: 0 0 auto;
                    padding: 8px 14px;
                    border-radius: 20px;
                    border: 1px solid ${isActive ? 'var(--tv-gold-primary)' : 'rgba(255,255,255,0.08)'};
                    background: ${isActive ? 'rgba(255, 213, 79, 0.12)' : 'rgba(7, 27, 45, 0.6)'};
                    color: ${isActive ? 'var(--tv-gold-primary)' : '#94A3B8'};
                    font-size: var(--fds-font-sm);
                    font-weight: 700;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                ">
                    ${tab.label[locale] || tab.label['en']} (${count})
                </button>
            `;
        }).join('');

        const notificationsListHtml = filtered.length > 0 ? filtered.map(item => {
            const categoryIcons: Record<string, string> = {
                daily: '📅',
                tournament: '🏆',
                rewards: '🎁',
                announcements: '📢',
                system: '⚙️',
                subscription: '💳'
            };
            const icon = categoryIcons[item.category] || '🔔';

            const title = locale === 'am' && item.title_am ? item.title_am : (locale === 'om' && item.title_om ? item.title_om : item.title_en);
            const desc = locale === 'am' && item.body_am ? item.body_am : (locale === 'om' && item.body_om ? item.body_om : item.body_en);
            const timeString = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="glass-card notif-item ${item.read ? 'notif-read' : 'notif-unread'}" data-notif-id="${item.id}" style="
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border-radius: 14px;
                    cursor: pointer;
                    position: relative;
                    transition: transform 0.2s, background-color 0.2s;
                    border-color: ${item.read ? 'rgba(255,255,255,0.05)' : 'rgba(255, 213, 79, 0.3)'};
                    background: ${item.read ? 'rgba(7, 27, 45, 0.6)' : 'rgba(255, 213, 79, 0.03)'};
                ">
                    <!-- Status Indicator Dot -->
                    ${!item.read ? `
                        <div style="
                            position: absolute;
                            top: 16px;
                            right: 16px;
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background-color: var(--tv-pitch-green);
                            box-shadow: 0 0 8px var(--tv-pitch-glow);
                        "></div>
                    ` : ''}

                    <!-- Category Icon -->
                    <div style="
                        width: 44px;
                        height: 44px;
                        border-radius: 10px;
                        background: rgba(255,255,255,0.05);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: var(--fds-font-lg);
                        flex-shrink: 0;
                    ">${icon}</div>

                    <!-- Texts -->
                    <div style="flex: 1; padding-right: 12px;">
                        <div style="
                            font-size: var(--fds-font-md); 
                            font-weight: 800; 
                            color: ${item.read ? '#CBD5E1' : '#FFFFFF'};
                            margin-bottom: 4px;
                        ">${title}</div>
                        <div style="
                            font-size: var(--fds-font-sm); 
                            color: var(--fds-text-dim); 
                            line-height: 1.4;
                            margin-bottom: 6px;
                        ">${desc}</div>
                        <div style="
                            font-size: var(--fds-font-xs); 
                            color: var(--fds-text-dim); 
                            font-weight: 600;
                        ">⏱️ ${timeString}</div>
                    </div>
                </div>
            `;
        }).join('') : DesignSystem.EmptyState('📭', 'No Notifications');

        const hasUnread = this._notifications.some(n => !n.read);

        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">

                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>

                
                <!-- App Bar -->
                ${EthioFantasyAppBar.render(
                    locale === 'am' ? 'ማሳወቂያዎች' : (locale === 'om' ? 'BEEKSIISAA' : 'NOTIFICATIONS'),
                    hasUnread ? `
                        <button id="btn-mark-read" style="
                            background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15);
                            color: var(--fds-text-main);
                            font-size: var(--fds-font-xs);
                            font-weight: 800;
                            padding: 6px 12px;
                            border-radius: 12px;
                            cursor: pointer;
                        ">
                            ${locale === 'am' ? 'ሁሉንም አንብብ' : (locale === 'om' ? 'Hunda Dubbisi' : 'MARK ALL READ')}
                        </button>
                    ` : ''
                )}

                <!-- Scrolling Section -->
                <div style="max-width: 600px; margin: 0 auto; padding: 16px 16px 120px 16px;">
                    
                    <!-- Search Input -->
                    <input type="text" id="notif-search-input" placeholder="🔍 Search notifications..." style="
                        width: 100%; 
                        padding: 10px 14px; 
                        background: rgba(0,0,0,0.2); 
                        border: 1px solid rgba(255,255,255,0.1); 
                        border-radius: 8px; 
                        color: var(--fds-text-main); 
                        font-size: var(--fds-font-sm); 
                        margin-bottom: 16px; 
                        box-sizing: border-box;
                    ">
                    
                    <!-- Horizontal Category Filter Slider -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 16px; scrollbar-width: none; -ms-overflow-style: none;">
                        ${tabsHtml}
                    </div>

                    <!-- Notifications List -->
                    <div id="notifications-list">
                        ${notificationsListHtml}
                    </div>
                </div>
            </div>
            <style>
                .notif-tab::-webkit-scrollbar { display: none; }
                .notif-item:active { transform: scale(0.98); }
            </style>
        `;

        this._bindEvents();
    }

    private _filterNotifications(query: string): void {
        const locale = i18n.currentLocale;
        
        let filtered = this._notifications.filter(item => {
            if (this._activeTab === 'all') return true;
            if (this._activeTab === 'unread') return !item.read;
            return item.category === this._activeTab;
        });

        if (query.trim()) {
            const q = query.toLowerCase();
            filtered = filtered.filter(item => 
                (item.title_en && item.title_en.toLowerCase().includes(q)) || 
                (item.title_am && item.title_am.toLowerCase().includes(q)) ||
                (item.title_om && item.title_om.toLowerCase().includes(q)) ||
                (item.body_en && item.body_en.toLowerCase().includes(q)) ||
                (item.body_am && item.body_am.toLowerCase().includes(q)) ||
                (item.body_om && item.body_om.toLowerCase().includes(q))
            );
        }

        const container = document.getElementById('notifications-list');
        if (container) {
            container.innerHTML = filtered.length > 0 ? filtered.map(item => {
                const categoryIcons: Record<string, string> = {
                    daily: '📅',
                    tournament: '🏆',
                    rewards: '🎁',
                    announcements: '📢',
                    system: '⚙️',
                    subscription: '💳'
                };
                const icon = categoryIcons[item.category] || '🔔';

                const title = locale === 'am' && item.title_am ? item.title_am : (locale === 'om' && item.title_om ? item.title_om : item.title_en);
                const desc = locale === 'am' && item.body_am ? item.body_am : (locale === 'om' && item.body_om ? item.body_om : item.body_en);
                const timeString = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="glass-card notif-item ${item.read ? 'notif-read' : 'notif-unread'}" data-notif-id="${item.id}" style="
                        display: flex;
                        gap: 16px;
                        padding: 16px;
                        margin-bottom: 12px;
                        border-radius: 14px;
                        cursor: pointer;
                        position: relative;
                        transition: transform 0.2s, background-color 0.2s;
                        border-color: ${item.read ? 'rgba(255,255,255,0.05)' : 'rgba(255, 213, 79, 0.3)'};
                        background: ${item.read ? 'rgba(7, 27, 45, 0.6)' : 'rgba(255, 213, 79, 0.03)'};
                    ">
                        <!-- Status Indicator Dot -->
                        ${!item.read ? `
                            <div style="
                                position: absolute;
                                top: 16px;
                                right: 16px;
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                background-color: var(--tv-pitch-green);
                                box-shadow: 0 0 8px var(--tv-pitch-glow);
                            "></div>
                        ` : ''}

                        <!-- Category Icon -->
                        <div style="
                            width: 44px;
                            height: 44px;
                            border-radius: 10px;
                            background: rgba(255,255,255,0.05);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: var(--fds-font-lg);
                            flex-shrink: 0;
                        ">${icon}</div>

                        <!-- Texts -->
                        <div style="flex: 1; padding-right: 12px;">
                            <div style="
                                font-size: var(--fds-font-md); 
                                font-weight: 800; 
                                color: ${item.read ? '#CBD5E1' : '#FFFFFF'};
                                margin-bottom: 4px;
                            ">${title}</div>
                            <div style="
                                font-size: var(--fds-font-sm); 
                                color: var(--fds-text-dim); 
                                line-height: 1.4;
                                margin-bottom: 6px;
                            ">${desc}</div>
                            <div style="
                                font-size: var(--fds-font-xs); 
                                color: var(--fds-text-dim); 
                                font-weight: 600;
                            ">⏱️ ${timeString}</div>
                        </div>
                    </div>
                `;
            }).join('') : DesignSystem.EmptyState('📭', 'No Notifications');

            // Re-bind click handlers
            const items = container.querySelectorAll('.notif-item');
            items.forEach(item => {
                item.addEventListener('click', async (e) => {
                    const target = e.currentTarget as HTMLElement;
                    const notifId = target.getAttribute('data-notif-id');
                    if (notifId) {
                        this._audioManager.playClick();
                        await NotificationService.getInstance().markAsRead(notifId);
                        await this._loadNotifications();
                    }
                });
            });

            // Bind Clear search btn
            document.getElementById('btn-empty-clear-notif')?.addEventListener('click', () => {
                this._audioManager.playClick();
                const input = document.getElementById('notif-search-input') as HTMLInputElement;
                if (input) {
                    input.value = '';
                    this._filterNotifications('');
                }
            });
        }
    }

    private _bindEvents(): void {
        EthioFantasyAppBar.bind(this._uiManager.container, () => {
            this._audioManager.playClick();
            if (this._unsubscribeRealtime) {
                this._unsubscribeRealtime();
            }
            this._onBack();
        });

        // Search input event
        const searchInput = document.getElementById('notif-search-input') as HTMLInputElement;
        searchInput?.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value;
            this._filterNotifications(query);
        });

        document.getElementById('btn-mark-read')?.addEventListener('click', async () => {
            this._audioManager.playClick();
            await NotificationService.getInstance().markAllAsRead();
            await this._loadNotifications();
        });

        // Tab Filter switching
        const tabButtons = this._uiManager.container.querySelectorAll('.notif-tab');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const tabId = target.getAttribute('data-tab-id');
                if (tabId) {
                    this._audioManager.playClick();
                    this._activeTab = tabId;
                    this.render();
                }
            });
        });

        // Click Notification to Toggle Read status
        const items = this._uiManager.container.querySelectorAll('.notif-item');
        items.forEach(item => {
            item.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLElement;
                const notifId = target.getAttribute('data-notif-id');
                if (notifId) {
                    this._audioManager.playClick();
                    await NotificationService.getInstance().markAsRead(notifId);
                    await this._loadNotifications();
                }
            });
        });

        document.getElementById('btn-empty-home')?.addEventListener('click', () => {
            this._audioManager.playClick();
            if (this._unsubscribeRealtime) {
                this._unsubscribeRealtime();
            }
            this._onBack();
        });

        // Pull to refresh
        const container = this._uiManager.container.querySelector('.stadium-container') as HTMLElement;
        if (container) {
            PullToRefresh.attach(container, async () => {
                this._audioManager.playClick();
                await this._loadNotifications();
            });
        }
    }
}
