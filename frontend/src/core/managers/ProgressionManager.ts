export type FootballRank = 'Bronze' | 'Silver' | 'Gold' | 'Elite' | 'Legend' | 'Hall of Fame';

export type PlayerDivisionName = 'Division 5 (Regional)' | 'Division 4 (National 2)' | 'Division 3 (National 1)' | 'Division 2 (Premier League)' | 'Division 1 (CAF Champions)' | 'Premier Division (World Legends)';

export interface RankInfo {
    name: FootballRank;
    minXp: number;
    badgeClass: string;
    icon: string;
}

export interface DivisionInfo {
    name: PlayerDivisionName;
    tier: number;
    minXp: number;
    badge: string;
    color: string;
    weeklyPromotionZone: string;
}

export class ProgressionManager {
    public static RANKS: RankInfo[] = [
        { name: 'Bronze', minXp: 0, badgeClass: 'rank-bronze', icon: '🥉' },
        { name: 'Silver', minXp: 500, badgeClass: 'rank-silver', icon: '🥈' },
        { name: 'Gold', minXp: 1500, badgeClass: 'rank-gold', icon: '🥇' },
        { name: 'Elite', minXp: 3500, badgeClass: 'rank-elite', icon: '💎' },
        { name: 'Legend', minXp: 7500, badgeClass: 'rank-legend', icon: '🔥' },
        { name: 'Hall of Fame', minXp: 15000, badgeClass: 'rank-hall-of-fame', icon: '👑' }
    ];

    public static DIVISIONS: DivisionInfo[] = [
        { name: 'Division 5 (Regional)', tier: 5, minXp: 0, badge: '⚽', color: '#94A3B8', weeklyPromotionZone: 'Top 30% Promoted to Div 4' },
        { name: 'Division 4 (National 2)', tier: 4, minXp: 1000, badge: '🛡️', color: '#34D399', weeklyPromotionZone: 'Top 25% Promoted to Div 3' },
        { name: 'Division 3 (National 1)', tier: 3, minXp: 2500, badge: '🥈', color: '#60A5FA', weeklyPromotionZone: 'Top 20% Promoted to Div 2' },
        { name: 'Division 2 (Premier League)', tier: 2, minXp: 5000, badge: '🥇', color: '#F59E0B', weeklyPromotionZone: 'Top 15% Promoted to Div 1' },
        { name: 'Division 1 (CAF Champions)', tier: 1, minXp: 10000, badge: '💎', color: '#C084FC', weeklyPromotionZone: 'Top 10% Promoted to Premier' },
        { name: 'Premier Division (World Legends)', tier: 0, minXp: 20000, badge: '👑', color: '#FFD54F', weeklyPromotionZone: 'Pinnacle Division - World Top 100' }
    ];

    public static getRank(xp: number): RankInfo {
        for (let i = ProgressionManager.RANKS.length - 1; i >= 0; i--) {
            if (xp >= ProgressionManager.RANKS[i].minXp) {
                return ProgressionManager.RANKS[i];
            }
        }
        return ProgressionManager.RANKS[0];
    }

    public static getDivision(xp: number): DivisionInfo {
        for (let i = ProgressionManager.DIVISIONS.length - 1; i >= 0; i--) {
            if (xp >= ProgressionManager.DIVISIONS[i].minXp) {
                return ProgressionManager.DIVISIONS[i];
            }
        }
        return ProgressionManager.DIVISIONS[0];
    }

    public static getLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number; progressPercent: number } {
        const xpPerLevel = 250;
        const level = Math.floor(xp / xpPerLevel) + 1;
        const currentXp = xp % xpPerLevel;
        const progressPercent = Math.min(Math.floor((currentXp / xpPerLevel) * 100), 100);

        return {
            level,
            currentXp,
            nextLevelXp: xpPerLevel,
            progressPercent
        };
    }

    public static getSeasonPassInfo(xp: number): {
        seasonLevel: number;
        seasonXp: number;
        nextSeasonLevelXp: number;
        progressPercent: number;
        unlockedRewards: string[];
    } {
        const seasonXpPerLevel = 500;
        const seasonLevel = Math.min(Math.floor(xp / seasonXpPerLevel) + 1, 50);
        const seasonXp = xp % seasonXpPerLevel;
        const progressPercent = Math.min(Math.floor((seasonXp / seasonXpPerLevel) * 100), 100);

        const rewards: string[] = [];
        if (seasonLevel >= 5) rewards.push('🎖️ Season 1 Starter Badge');
        if (seasonLevel >= 10) rewards.push('🔥 2x XP Multiplier Pass');
        if (seasonLevel >= 25) rewards.push('💎 Ethiopian Premier Veteran Crest');
        if (seasonLevel >= 50) rewards.push('👑 Hall of Fame Champion Crown');

        return {
            seasonLevel,
            seasonXp,
            nextSeasonLevelXp: seasonXpPerLevel,
            progressPercent,
            unlockedRewards: rewards
        };
    }
}
