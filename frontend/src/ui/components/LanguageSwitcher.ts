import { i18n } from '../../localization/i18n';
import { AudioManager } from '../../core/managers/AudioManager';
import type { Locale } from '../../networking/supabase/types';

export class LanguageSwitcher {
    private _audioManager: AudioManager;
    private _onChange: () => void;

    constructor(audioManager: AudioManager, onChange: () => void) {
        this._audioManager = audioManager;
        this._onChange = onChange;
    }

    public render(): string {
        const current = i18n.currentLocale;
        return `
            <div style="
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                padding: 4px 6px;
                backdrop-filter: blur(8px);
            ">
                <button class="lang-btn ${current === 'en' ? 'active-lang' : ''}" data-lang="en">🇬🇧 EN</button>
                <button class="lang-btn ${current === 'am' ? 'active-lang' : ''}" data-lang="am">🇪🇹 አማ</button>
                <button class="lang-btn ${current === 'om' ? 'active-lang' : ''}" data-lang="om">🇪🇹 OR</button>
            </div>

            <style>
                .lang-btn {
                    background: transparent;
                    border: none;
                    color: #94A3B8;
                    font-size: 11px;
                    font-weight: bold;
                    padding: 4px 8px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .lang-btn.active-lang {
                    background: var(--gold-gradient, #FFD54F);
                    color: #0F172A;
                    font-weight: 900;
                }
            </style>
        `;
    }

    public bindEvents(container: HTMLElement): void {
        container.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._audioManager.playClick();
                const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang') as Locale;
                if (lang && lang !== i18n.currentLocale) {
                    i18n.setLocale(lang);
                    this._onChange();
                }
            });
        });
    }
}
