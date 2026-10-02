import { UIManager } from '../../core/managers/UIManager';
import { AudioManager } from '../../core/managers/AudioManager';
import { GameModes } from '../components/GameModeGraphics';
import { EthioFantasyAppBar } from '../components/EthioFantasyAppBar';

export interface PlayScreenCallbacks {
    onCasualPlay: (category?: string) => void;
}

export class PlayScreen {
    private _uiManager: UIManager;
    private _audioManager: AudioManager;
    private _callbacks: PlayScreenCallbacks;

    constructor(
        uiManager: UIManager,
        audioManager: AudioManager,
        callbacks: PlayScreenCallbacks
    ) {
        this._uiManager = uiManager;
        this._audioManager = audioManager;
        this._callbacks = callbacks;
    }

    public render(): void {
        const root = this._uiManager.container;
        
        root.innerHTML = `
            <div class="stadium-container ethio-bg-main" style="pointer-events: auto;">
                <!-- Layers -->
                <div class="ethio-layer ethio-layer-pitch"></div>
                <div class="ethio-layer ethio-layer-overlay"></div>
                <div class="ethio-layer ethio-layer-lights"></div>
                
                ${EthioFantasyAppBar.render('PLAY', '', false)}

                <style>
                    .ethio-play-card {
                        background: rgba(7, 27, 45, 0.85); /* #071B2D 85% */
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 22px;
                        padding: 24px 12px 20px 12px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 60px var(--cat-base);
                        transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease;
                        cursor: pointer;
                        min-height: 160px;
                    }
                    /* Subtle stadium-light reflection */
                    .ethio-play-card::before {
                        content: '';
                        position: absolute;
                        top: 0; left: -50%; width: 50%; height: 100%;
                        background: linear-gradient(to right, transparent, rgba(255,255,255,0.03), transparent);
                        transform: skewX(-20deg);
                        pointer-events: none;
                    }
                    .ethio-play-card:active {
                        transform: scale(0.97);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 0 20px var(--cat-base);
                    }
                    
                    .category-icon-wrapper {
                        width: 64px;
                        height: 64px;
                        margin-bottom: 16px;
                        filter: drop-shadow(0 8px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 16px var(--cat-glow));
                        transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
                        z-index: 2;
                    }
                    
                    .category-title {
                        font-size: 16px;
                        font-weight: 800;
                        color: white;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        text-align: center;
                        width: 100%;
                        padding: 0 4px;
                        line-height: 1.2;
                        z-index: 2;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    }
                    
                    .category-accent-line {
                        position: absolute;
                        bottom: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 40px;
                        height: 4px;
                        background: #00C853; /* Primary EthioFantasy accent */
                        border-radius: 4px 4px 0 0;
                        box-shadow: 0 -2px 8px var(--cat-glow), 0 0 6px rgba(0, 200, 83, 0.6);
                    }
                </style>
                <div style="max-width: 960px; margin: 0 auto; padding: 24px 16px 100px 16px;">
                    
                    <h2 style="font-size: var(--fds-font-xl); font-weight: 900; margin-bottom: 24px; text-transform: uppercase; color: white; letter-spacing: 0.5px;">Game Modes</h2>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        
                        <!-- 15 CATEGORIES -->
                        ${GameModes.map((cat, i) => `
                        <div class="fade-in-up category-btn ethio-play-card" data-category="${cat.id}" style="animation-delay: ${i * 30}ms; --cat-accent: ${cat.accent}; --cat-glow: ${cat.glowColor}; --cat-base: ${cat.baseColor};">
                            <div class="category-icon-wrapper" style="width: 100%; height: 120px; overflow: hidden; border-radius: 12px; margin-bottom: 12px;">
                                <img src="/assets/images/modes/${cat.id}.jpg" alt="${cat.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/images/modes/world-cup.jpg';" />
                            </div>
                            <div class="category-title">${cat.name}</div>
                            <div class="category-accent-line"></div>
                        </div>
                        `).join('')}

                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    private _bindEvents(): void {
        const root = this._uiManager.container;
        
        const categoryBtns = root.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const category = target.getAttribute('data-category') || 'random';
                
                // Ripple effect
                const rect = target.getBoundingClientRect();
                const mouseEvent = e as MouseEvent;
                const ripple = document.createElement('div');
                const diameter = Math.max(target.clientWidth, target.clientHeight);
                const radius = diameter / 2;
                let x = mouseEvent.clientX - rect.left - radius;
                let y = mouseEvent.clientY - rect.top - radius;
                ripple.style.width = ripple.style.height = `${diameter}px`;
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.classList.add('ripple');
                target.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);

                this._audioManager.playClick();
                this._callbacks.onCasualPlay(category);
            });
        });
    }

    public destroy(): void {}
}
