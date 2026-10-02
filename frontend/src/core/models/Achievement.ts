export type AchievementCategory = 
    | 'progress' 
    | 'daily_streak' 
    | 'quiz' 
    | 'rewards' 
    | 'seasonal' 
    | 'community';

export interface RewardEligibility {
    isEligible: boolean;
    rewardType?: 'airtime' | 'data' | 'telebirr' | 'vip' | 'prize';
    rewardAmount?: string;
    redeemed?: boolean;
}

export interface Achievement {
    id: string;
    categoryId: AchievementCategory;
    titleEn: string;
    titleAm: string;
    titleOm: string;
    descriptionEn: string;
    descriptionAm: string;
    descriptionOm: string;
    icon: string;
    isUnlocked: boolean;
    progress: number;
    maxProgress: number;
    xpReward: number;
    dateUnlocked?: string;
    rewardEligibility?: RewardEligibility;
}
