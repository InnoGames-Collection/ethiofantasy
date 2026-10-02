

export interface GameModeBannerProps {
    bgId?: string;
    iconId?: string;
    titleId?: string;
    difficultyId?: string;
    rewardId?: string;
    bannerUrl: string;
    icon: string;
    title: string;
    difficulty?: string;
    reward?: string;
    buttonId: string;
    buttonText: string;
    showCloseButton?: boolean;
}

export class GameModeBanner {
    public static render(props: GameModeBannerProps): string {
        return `
            <div class="glass-card fade-in-up" style="
                border: 2px solid rgba(0, 200, 83, 0.3); 
                padding: 0;
                text-align: center;
                border-radius: 20px;
                margin-bottom: 24px;
                box-shadow: 0 12px 40px rgba(0,0,0,0.5);
                position: relative;
                overflow: hidden;
                width: 100%;
                box-sizing: border-box;
            ">
                <!-- Dynamic Background Asset -->
                <div ${props.bgId ? `id="${props.bgId}"` : ''} style="
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(to bottom, rgba(7,27,45,0.1) 0%, rgba(7,27,45,0.4) 100%), url('${props.bannerUrl}') center/cover no-repeat;
                    opacity: 1;
                    z-index: 0;
                "></div>
                
                ${props.showCloseButton ? `
                <button id="match-exit-btn" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: #071B2D;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1);
                    color: white;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 20;
                    transition: transform 0.2s;
                ">
                    <span style="display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 2px;">✕</span>
                </button>
                ` : ''}

                <!-- Content Container -->
                <div style="position: relative; z-index: 1; padding: 32px 20px 24px 20px; height: 100%;">
                    <!-- Icon -->
                    <div ${props.iconId ? `id="${props.iconId}"` : ''} style="font-size: 64px; margin-bottom: 16px; filter: drop-shadow(0 4px 16px rgba(0,200,83,0.5)); transform: scale(1.05);">${props.icon}</div>
                    
                    <!-- Title -->
                    <div ${props.titleId ? `id="${props.titleId}"` : ''} style="font-size: 24px; font-weight: 900; color: white; text-shadow: 0 2px 8px rgba(0,0,0,0.8); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">
                        ${props.title}
                    </div>
                    
                    ${props.difficulty || props.reward ? `
                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 24px;">
                        ${props.difficulty ? `<span ${props.difficultyId ? `id="${props.difficultyId}"` : ''} style="background: rgba(0,0,0,0.6); padding: 6px 14px; border-radius: 20px; font-size: var(--fds-font-xs); font-weight: 800; color: #FCD34D; border: 1px solid rgba(252, 211, 77, 0.3); backdrop-filter: blur(4px);">🛡 ${props.difficulty}</span>` : ''}
                        ${props.reward ? `<span ${props.rewardId ? `id="${props.rewardId}"` : ''} style="background: rgba(0,0,0,0.6); padding: 6px 14px; border-radius: 20px; font-size: var(--fds-font-xs); font-weight: 800; color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.3); backdrop-filter: blur(4px);">🎁 ${props.reward}</span>` : ''}
                    </div>
                    ` : ''}
                    
                    <button id="${props.buttonId}" class="ethio-btn ethio-btn-primary btn-kickoff-action" style="width: 100%; box-shadow: 0 8px 24px rgba(0,200,83,0.4); font-size: var(--fds-font-md); padding: 16px; border-radius: 14px;">
                        ${props.buttonText} ⚽
                    </button>
                </div>
            </div>
        `;
    }
}
