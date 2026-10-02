export class LoaderHelper {
    /**
     * Generate HTML for a shimmer skeleton loading screen.
     */
    public static getSkeletonHtml(type: 'home' | 'profile' | 'leaderboard' | 'league' | 'quiz'): string {
        const skeletonBox = (width: string, height: string, margin: string = '0 0 12px 0') => `
            <div class="skeleton-box" style="width: ${width}; height: ${height}; margin: ${margin};"></div>
        `;

        switch (type) {
            case 'home':
                return `
                    <div class="stadium-container" style="pointer-events: none; padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            ${skeletonBox('50px', '50px', '0')}
                            ${skeletonBox('120px', '28px', '0')}
                            ${skeletonBox('50px', '50px', '0')}
                        </div>
                        ${skeletonBox('100%', '80px', '0 0 24px 0')}
                        ${skeletonBox('60%', '20px', '0 0 16px 0')}
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                            ${skeletonBox('100%', '90px', '0')}
                            ${skeletonBox('100%', '90px', '0')}
                        </div>
                        ${skeletonBox('40%', '20px', '0 0 16px 0')}
                        ${skeletonBox('100%', '120px', '0')}
                    </div>
                `;

            case 'profile':
                return `
                    <div class="stadium-container" style="pointer-events: none; padding: 20px; text-align: center;">
                        <div style="margin: 20px auto 16px auto; display: flex; justify-content: center;">
                            <div class="skeleton-box" style="width: 90px; height: 90px; border-radius: 50%;"></div>
                        </div>
                        ${skeletonBox('160px', '24px', '0 auto 8px auto')}
                        ${skeletonBox('120px', '16px', '0 auto 24px auto')}
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                            ${skeletonBox('100%', '50px', '0')}
                            ${skeletonBox('100%', '50px', '0')}
                            ${skeletonBox('100%', '50px', '0')}
                        </div>
                        <div style="max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px;">
                            ${skeletonBox('100%', '54px', '0')}
                            ${skeletonBox('100%', '54px', '0')}
                            ${skeletonBox('100%', '54px', '0')}
                        </div>
                    </div>
                `;

            case 'leaderboard':
                return `
                    <div class="stadium-container" style="pointer-events: none; padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            ${skeletonBox('140px', '32px', '0')}
                            ${skeletonBox('40px', '40px', '0')}
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
                            ${skeletonBox('100%', '40px', '0')}
                            ${skeletonBox('100%', '40px', '0')}
                            ${skeletonBox('100%', '40px', '0')}
                            ${skeletonBox('100%', '40px', '0')}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${skeletonBox('100%', '64px', '0')}
                            ${skeletonBox('100%', '64px', '0')}
                            ${skeletonBox('100%', '64px', '0')}
                            ${skeletonBox('100%', '64px', '0')}
                            ${skeletonBox('100%', '64px', '0')}
                        </div>
                    </div>
                `;

            case 'league':
                return `
                    <div class="stadium-container" style="pointer-events: none; padding: 20px;">
                        ${skeletonBox('200px', '28px', '0 0 20px 0')}
                        <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow: hidden;">
                            ${skeletonBox('70px', '36px', '0')}
                            ${skeletonBox('90px', '36px', '0')}
                            ${skeletonBox('90px', '36px', '0')}
                            ${skeletonBox('80px', '36px', '0')}
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                            ${skeletonBox('100%', '160px', '0')}
                            ${skeletonBox('100%', '160px', '0')}
                        </div>
                    </div>
                `;

            case 'quiz':
                return `
                    <div class="stadium-container" style="pointer-events: none; display: flex; flex-direction: column; padding: 20px; box-sizing: border-box; height: 100vh;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; width: 100%;">
                            ${skeletonBox('60px', '24px', '0')}
                            <div class="skeleton-box" style="width: 44px; height: 44px; border-radius: 50%;"></div>
                            ${skeletonBox('65px', '24px', '0')}
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                            ${skeletonBox('85%', '32px', '0 0 12px 0')}
                            ${skeletonBox('60%', '24px', '0 0 36px 0')}
                            <div style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
                                ${skeletonBox('100%', '54px', '0')}
                                ${skeletonBox('100%', '54px', '0')}
                                ${skeletonBox('100%', '54px', '0')}
                                ${skeletonBox('100%', '54px', '0')}
                            </div>
                        </div>
                    </div>
                `;
        }
    }

    /**
     * Generate HTML for a beautiful empty state configuration.
     */
    public static getEmptyStateHtml(
        type: 'notifications' | 'tournament' | 'messages' | 'history' | 'rewards' | 'leaderboard' | 'search',
        message: string,
        btnText: string,
        onActionId: string
    ): string {
        let icon = '⚽';
        let title = 'Empty State';
        
        switch (type) {
            case 'notifications':
                icon = '🔔';
                title = 'No Notifications';
                break;
            case 'tournament':
                icon = '🏆';
                title = 'No Active Leagues';
                break;
            case 'messages':
                icon = '💬';
                title = 'No Messages';
                break;
            case 'history':
                icon = '📜';
                title = 'No History';
                message = 'Your completed matches will appear here.';
                break;
            case 'rewards':
                icon = '🎁';
                title = 'No Rewards Unlocked';
                message = 'Keep playing to unlock your first reward or achievement.';
                break;
            case 'leaderboard':
                icon = '📈';
                title = 'No Rankings Available';
                message = 'Complete today\'s challenge to receive your daily ranking.';
                break;
            case 'search':
                icon = '🔍';
                title = 'No Search Results';
                break;
        }

        return `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 24px;
                text-align: center;
                max-width: 360px;
                margin: 60px auto;
                box-sizing: border-box;
            ">
                <div style="
                    font-size: 56px; 
                    margin-bottom: 16px;
                    filter: drop-shadow(0 4px 12px rgba(255,255,255,0.05));
                ">${icon}</div>
                <h3 style="font-size: 18px; font-weight: 800; color: white; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">${title}</h3>
                <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin: 0 0 24px 0;">${message}</p>
                <button id="${onActionId}" style="
                    padding: 12px 24px;
                    background: var(--tv-pitch-green);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 800;
                    font-size: 13px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,200,83,0.25);
                    transition: transform 0.1s;
                    text-transform: uppercase;
                ">${btnText}</button>
            </div>
            <style>
                #${onActionId}:active { transform: scale(0.97); }
            </style>
        `;
    }
}
