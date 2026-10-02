import { SaveManager } from '../../core/managers/SaveManager';

export class ReturningPlayerModal {
    public static checkAndShow(saveManager: SaveManager): void {
        const lastLoginKey = 'ETHIO_FOOTBALL_LAST_LOGIN';
        const todayStr = new Date().toISOString().split('T')[0];
        const lastLogin = localStorage.getItem(lastLoginKey);

        if (lastLogin === todayStr) {
            // Already logged in today
            return;
        }

        localStorage.setItem(lastLoginKey, todayStr);
        const profile = saveManager.profile;
        const streak = (profile.streakCount || 0) + 1;
        saveManager.updateStreak(streak);

        const xpReward = 100 + streak * 25;
        saveManager.addXp(xpReward);

        // Intentionally omitting UI rendering to ensure a deterministic startup flow.
        // No promotional or retention popup will block the Home screen.
    }
}
