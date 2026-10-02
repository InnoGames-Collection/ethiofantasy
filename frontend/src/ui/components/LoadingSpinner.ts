export interface FootballFact {
    type: 'DID_YOU_KNOW' | 'FOOTBALL_FACT' | 'TACTICAL_TIP';
    icon: string;
    text: string;
}

export class LoadingSpinner {
    private static FACTS: FootballFact[] = [
        {
            type: 'DID_YOU_KNOW',
            icon: '🇪🇹',
            text: 'Did You Know? Ethiopia was one of the founding members of the Confederation of African Football (CAF) in 1957!'
        },
        {
            type: 'FOOTBALL_FACT',
            icon: '🏆',
            text: 'Football Fact: Ethiopia won the Africa Cup of Nations (AFCON) in 1962, defeating Egypt 4-2 in the final in Addis Ababa!'
        },
        {
            type: 'TACTICAL_TIP',
            icon: '⏱️',
            text: 'Tactical Tip: Answering a question in less than 3 seconds awards a speed bonus and max combo XP!'
        },
        {
            type: 'DID_YOU_KNOW',
            icon: '⚽',
            text: 'Did You Know? Saint George SC, founded in 1935, is the oldest active football club in Ethiopia.'
        },
        {
            type: 'FOOTBALL_FACT',
            icon: '⭐',
            text: 'Football Fact: Mengistu Worku scored two goals in the 1962 AFCON final to seal Ethiopia’s championship victory!'
        },
        {
            type: 'TACTICAL_TIP',
            icon: '🔥',
            text: 'Tactical Tip: Maintain a 7-day streak to unlock 2.5x XP multipliers and division promotion badges!'
        },
        {
            type: 'DID_YOU_KNOW',
            icon: '🌍',
            text: 'Did You Know? The Ethiopian Premier League was officially established in 1997.'
        }
    ];

    public static render(message: string = 'PREPARING MATCHDAY TELEMETRY...'): string {
        const fact = LoadingSpinner.FACTS[Math.floor(Math.random() * LoadingSpinner.FACTS.length)];
        const title = fact.type === 'DID_YOU_KNOW' ? 'DID YOU KNOW?' : fact.type === 'TACTICAL_TIP' ? 'TIP OF THE DAY' : 'FOOTBALL FACT';

        return `
            <div class="smooth-fade-in" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 36px 24px;
                color: white;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                text-align: center;
                max-width: 460px;
                margin: 0 auto;
            ">
                <!-- Competition Logos Banner -->
                <div style="font-size: 26px; display: flex; gap: 14px; margin-bottom: 20px; opacity: 0.9;">
                    <span>🏆</span> <span>🇪🇹</span> <span>🌍</span> <span>🦁</span> <span>⭐</span>
                </div>

                <!-- Animated Spinning Football Loader -->
                <div class="tv-spinner-ball" style="font-size: 52px; margin-bottom: 18px;">⚽</div>

                <!-- Loading Message & Stadium Light Pulse -->
                <div style="
                    font-size: 13px;
                    font-weight: 900;
                    color: var(--tv-gold-primary, #FFD54F);
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    margin-bottom: 24px;
                    font-family: 'JetBrains Mono', monospace;
                ">
                    ${message}
                </div>

                <!-- Random Football Fact / Tip of the Day Card -->
                <div class="glass-card" style="
                    padding: 18px 22px;
                    background: rgba(2, 6, 23, 0.85);
                    border: 1px solid rgba(255, 213, 79, 0.3);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                    text-align: left;
                ">
                    <div style="
                        font-size: 11px;
                        font-weight: 900;
                        color: #60A5FA;
                        letter-spacing: 1.5px;
                        margin-bottom: 6px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <span>${fact.icon}</span> ${title}
                    </div>
                    <div style="font-size: 13px; color: #F8FAFC; line-height: 1.5; font-weight: 600;">
                        "${fact.text}"
                    </div>
                </div>
            </div>

            <style>
                .smooth-fade-in {
                    animation: tvFadeIn 0.35s ease-out forwards;
                }
                @keyframes tvFadeIn {
                    0% { opacity: 0; transform: scale(0.96); }
                    100% { opacity: 1; transform: scale(1); }
                }

                .tv-spinner-ball {
                    animation: spinTvBall 1.1s infinite linear;
                    filter: drop-shadow(0 0 16px rgba(255, 213, 79, 0.6));
                }
                @keyframes spinTvBall {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.12); }
                    100% { transform: rotate(360deg) scale(1); }
                }
            </style>
        `;
    }

    public static showOverlay(container: HTMLElement, message: string = 'PREPARING MATCHDAY TELEMETRY...'): () => void {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(2, 6, 23, 0.9)';
        overlay.style.backdropFilter = 'blur(16px)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.innerHTML = LoadingSpinner.render(message);

        container.appendChild(overlay);

        return () => {
            overlay.style.transition = 'opacity 0.25s ease';
            overlay.style.pointerEvents = 'none';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 250);
        };
    }
}
