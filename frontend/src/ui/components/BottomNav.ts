import { i18n } from '../../localization/i18n';

export type TabId = 'home' | 'play' | 'standings' | 'profile';

export interface TabConfig {
    id: TabId;
    label: string;
    icon: string;
}

import { ProfileIcons } from './ProfileIcons';

export class BottomNav {
    private static _activeTab: TabId = 'home';
    private static _lastCallback: ((tabId: TabId) => void) | null = null;

    private static TABS: TabConfig[] = [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'play', label: 'Play', icon: '🎮' },
        { id: 'standings', label: 'Leaderboard', icon: '🏆' },
        { id: 'profile', label: 'Profile', icon: ProfileIcons.identity }
    ];

    private static LABELS: Record<string, Record<string, string>> = {
        home: { en: 'Home', am: 'መነሻ', om: 'Mula\'a' },
        play: { en: 'Play', am: 'ተጫወት', om: 'Tapha' },
        standings: { en: 'Leaderboard', am: 'ደረጃዎች', om: 'Sadarkaa' },
        profile: { en: 'Profile', am: 'መገለጫ', om: 'Profile' }
    };

    public static get activeTab(): TabId {
        return BottomNav._activeTab;
    }

    public static setActiveTab(tabId: TabId): void {
        BottomNav._activeTab = tabId;
        BottomNav.updateTabHighlights();
    }

    public static refresh(): void {
        if (BottomNav._lastCallback) {
            BottomNav.render(BottomNav._lastCallback);
        }
    }

    public static render(onTabChange: (tabId: TabId) => void): void {
        BottomNav._lastCallback = onTabChange;
        let navContainer = document.getElementById('fds-bottom-nav');
        if (!navContainer) {
            navContainer = document.createElement('div');
            navContainer.id = 'fds-bottom-nav';
            navContainer.style.position = 'fixed';
            navContainer.style.bottom = '0';
            navContainer.style.left = '0';
            navContainer.style.width = '100%';
            // Use safe-area insets for modern edge-to-edge mobile devices
            navContainer.style.paddingBottom = 'env(safe-area-inset-bottom, 16px)';
            // Core height + safe area
            navContainer.style.height = 'calc(64px + env(safe-area-inset-bottom, 16px))';
            navContainer.style.background = 'rgba(2, 6, 23, 0.96)';
            navContainer.style.borderTop = '2px solid var(--fds-gold-primary, #FFD54F)';
            navContainer.style.boxShadow = '0 -8px 32px rgba(0, 0, 0, 0.85)';
            navContainer.style.backdropFilter = 'blur(16px)';
            navContainer.style.zIndex = '9000';
            navContainer.style.display = 'flex';
            navContainer.style.justifyContent = 'space-around';
            navContainer.style.alignItems = 'center';
            navContainer.style.pointerEvents = 'auto';
            document.body.appendChild(navContainer);
        }

        const locale = i18n.currentLocale;

        navContainer.innerHTML = BottomNav.TABS.map(t => {
            const isActive = t.id === BottomNav._activeTab;
            const tabLabel = BottomNav.LABELS[t.id][locale] || t.label;
            return `
                <button class="nav-tab-item ${isActive ? 'nav-tab-active' : ''}" data-tab-id="${t.id}" style="
                    background: none;
                    border: none;
                    color: ${isActive ? 'var(--fds-gold-primary, #FFD54F)' : '#94A3B8'};
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    padding: var(--fds-space-8) var(--fds-space-12);
                    flex: 1;
                    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
                    min-height: 48px; /* Strict 48px touch target */
                    outline: none;
                    transform: ${isActive ? 'scale(1.1)' : 'scale(1)'};
                    filter: ${isActive ? 'drop-shadow(0 2px 8px rgba(255,213,79,0.4))' : 'none'};
                ">
                    <div style="position: relative; display: inline-block;">
                        <span style="font-size: 22px; margin-bottom: 2px; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;">${t.icon}</span>
                        <div id="nav-badge-${t.id}" style="
                            display: none;
                            position: absolute;
                            top: -4px; right: -8px;
                            background: var(--tv-pitch-green, #00C853);
                            color: white; font-size: 10px; font-weight: 900;
                            border-radius: 10px; padding: 2px 6px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                        "></div>
                    </div>
                    <span class="tab-text" style="
                        font-size: var(--fds-font-xs);
                        font-weight: ${isActive ? '800' : '600'};
                        letter-spacing: 0.5px;
                        font-family: var(--fds-font-body);
                    ">${tabLabel}</span>
                </button>
            `;
        }).join('');

        // Bind click listeners
        const buttons = navContainer.querySelectorAll('.nav-tab-item');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const tabId = target.getAttribute('data-tab-id') as TabId;
                
                // Light tap haptic feedback respecting mute setting
                if (localStorage.getItem('ETHIO_FOOTBALL_MUTED') !== 'true') {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        try { navigator.vibrate(10); } catch(e) {}
                    }
                }
                
                // Intercept tab changes if a match is active
                if (typeof (window as any).ethioOnBackPress === 'function') {
                    if ((window as any).ethioOnBackPress()) {
                        return; // The match screen handled the intercept (e.g. showed a Leave confirmation)
                    }
                }

                if (tabId) {
                    if (tabId !== BottomNav._activeTab) {
                        BottomNav.setActiveTab(tabId);
                    }
                    onTabChange(tabId);
                }
            });
        });
    }

    private static updateTabHighlights(): void {
        const navContainer = document.getElementById('fds-bottom-nav');
        if (!navContainer) return;

        const buttons = navContainer.querySelectorAll('.nav-tab-item');
        buttons.forEach(btn => {
            const tabId = btn.getAttribute('data-tab-id');
            const isActive = tabId === BottomNav._activeTab;
            const element = btn as HTMLElement;
            element.style.color = isActive ? 'var(--fds-gold-primary, #FFD54F)' : '#94A3B8';
            element.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
            element.style.filter = isActive ? 'drop-shadow(0 2px 8px rgba(255,213,79,0.4))' : 'none';
            const labelSpan = element.querySelector('.tab-text') as HTMLElement;
            if (labelSpan) {
                labelSpan.style.fontWeight = isActive ? '800' : '600';
            }
        });
    }

    public static setBadge(tabId: TabId, count: number): void {
        const badge = document.getElementById(`nav-badge-${tabId}`);
        if (badge) {
            if (count > 0) {
                badge.innerText = count > 99 ? '99+' : count.toString();
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    public static hide(): void {
        const navContainer = document.getElementById('fds-bottom-nav');
        if (navContainer) {
            navContainer.style.display = 'none';
        }
    }

    public static show(): void {
        const navContainer = document.getElementById('fds-bottom-nav');
        if (navContainer) {
            navContainer.style.display = 'flex';
        }
    }
}
