import { Achievement } from '../../core/models/Achievement';

export class AchievementsService {
    private static _instance: AchievementsService;

    private constructor() {}

    public static getInstance(): AchievementsService {
        if (!this._instance) {
            this._instance = new AchievementsService();
        }
        return this._instance;
    }

    /**
     * Fetch all achievements.
     * In the future, this will connect to the backend (Firestore / API).
     */
    public async getAchievements(): Promise<Achievement[]> {
        // Mock data to simulate API response for the new Premium AAA achievements
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    // --- Progress Achievements ---
                    {
                        id: 'prog_1',
                        categoryId: 'progress',
                        titleEn: 'Rookie', titleAm: 'ጀማሪ', titleOm: 'Jalqabaa',
                        descriptionEn: 'Reach level 5.', descriptionAm: 'ደረጃ 5 ይድረሱ።', descriptionOm: 'Sadarkaa 5 gahi.',
                        icon: '⭐',
                        isUnlocked: true,
                        progress: 5, maxProgress: 5,
                        xpReward: 500,
                        dateUnlocked: new Date().toISOString()
                    },
                    {
                        id: 'prog_2',
                        categoryId: 'progress',
                        titleEn: 'Rising Star', titleAm: 'አዲስ ኮከብ', titleOm: 'Urjii Ba\'u',
                        descriptionEn: 'Reach level 15.', descriptionAm: 'ደረጃ 15 ይድረሱ።', descriptionOm: 'Sadarkaa 15 gahi.',
                        icon: '🌟',
                        isUnlocked: false,
                        progress: 12, maxProgress: 15,
                        xpReward: 1500
                    },
                    {
                        id: 'prog_3',
                        categoryId: 'progress',
                        titleEn: 'Champion', titleAm: 'ሻምፒዮን', titleOm: 'Shaampiyoonaa',
                        descriptionEn: 'Reach level 30.', descriptionAm: 'ደረጃ 30 ይድረሱ።', descriptionOm: 'Sadarkaa 30 gahi.',
                        icon: '🏆',
                        isUnlocked: false,
                        progress: 12, maxProgress: 30,
                        xpReward: 3000
                    },
                    {
                        id: 'prog_4',
                        categoryId: 'progress',
                        titleEn: 'Legend', titleAm: 'አፈ ታሪክ', titleOm: 'Leegandii',
                        descriptionEn: 'Reach level 50.', descriptionAm: 'ደረጃ 50 ይድረሱ።', descriptionOm: 'Sadarkaa 50 gahi.',
                        icon: '👑',
                        isUnlocked: false,
                        progress: 12, maxProgress: 50,
                        xpReward: 5000
                    },
                    
                    // --- Daily Streak ---
                    {
                        id: 'streak_1',
                        categoryId: 'daily_streak',
                        titleEn: '3 Days Streak', titleAm: 'የ3 ቀናት ተከታታይ', titleOm: 'Walitti Fufiinsa Guyyaa 3',
                        descriptionEn: 'Play for 3 consecutive days.', descriptionAm: 'ለ3 ተከታታይ ቀናት ይጫወቱ።', descriptionOm: 'Guyyaa 3 walitti fufee taphadhu.',
                        icon: '🔥',
                        isUnlocked: true,
                        progress: 3, maxProgress: 3,
                        xpReward: 300,
                        dateUnlocked: new Date().toISOString()
                    },
                    {
                        id: 'streak_2',
                        categoryId: 'daily_streak',
                        titleEn: '7 Days Streak', titleAm: 'የ7 ቀናት ተከታታይ', titleOm: 'Walitti Fufiinsa Guyyaa 7',
                        descriptionEn: 'Play for a full week.', descriptionAm: 'ለሙሉ ሳምንት ይጫወቱ።', descriptionOm: 'Torban tokko guutuu taphadhu.',
                        icon: '📅',
                        isUnlocked: false,
                        progress: 4, maxProgress: 7,
                        xpReward: 1000
                    },
                    
                    // --- Quiz Achievements ---
                    {
                        id: 'quiz_1',
                        categoryId: 'quiz',
                        titleEn: 'First Correct Answer', titleAm: 'የመጀመሪያ ትክክለኛ መልስ', titleOm: 'Deebii Sirrii Jalqabaa',
                        descriptionEn: 'Answer your first question correctly.', descriptionAm: 'የመጀመሪያ ጥያቄዎን በትክክል ይመልሱ።', descriptionOm: 'Gaaffii jalqabaa sirriitti deebisi.',
                        icon: '✅',
                        isUnlocked: true,
                        progress: 1, maxProgress: 1,
                        xpReward: 100,
                        dateUnlocked: new Date().toISOString()
                    },
                    {
                        id: 'quiz_2',
                        categoryId: 'quiz',
                        titleEn: 'Perfect Round', titleAm: 'ፍጹም ዙር', titleOm: 'Marsaa Guutuu',
                        descriptionEn: 'Answer all 10 questions correctly in a match.', descriptionAm: 'በአንድ ጨዋታ ሁሉንም 10 ጥያቄዎች በትክክል ይመልሱ።', descriptionOm: 'Tapha tokko keessatti gaaffilee hunda sirriitti deebisi.',
                        icon: '🎯',
                        isUnlocked: false,
                        progress: 0, maxProgress: 1,
                        xpReward: 2000
                    },

                    // --- Rewards (Ethio Telecom) ---
                    {
                        id: 'rew_1',
                        categoryId: 'rewards',
                        titleEn: 'Airtime Reward', titleAm: 'የአየር ሰዓት ሽልማት', titleOm: 'Badhaasa Qilleensaa',
                        descriptionEn: 'Win a weekly tournament to earn 50 ETB airtime.', descriptionAm: '50 ብር የአየር ሰዓት ለማግኘት ሳምንታዊ ውድድር ያሸንፉ።', descriptionOm: 'Qilleensa ETB 50 argachuuf tapha torbee mo\'adhu.',
                        icon: '📱',
                        isUnlocked: false,
                        progress: 0, maxProgress: 1,
                        xpReward: 0,
                        rewardEligibility: { isEligible: true, rewardType: 'airtime', rewardAmount: '50 ETB', redeemed: false }
                    },
                    {
                        id: 'rew_2',
                        categoryId: 'rewards',
                        titleEn: 'Data Package Reward', titleAm: 'የዳታ ጥቅል ሽልማት', titleOm: 'Badhaasa Daataa',
                        descriptionEn: 'Reach Champion rank to unlock a 1GB Data Package.', descriptionAm: 'የ1GB ዳታ ጥቅል ለመክፈት የሻምፒዮን ደረጃ ይድረሱ።', descriptionOm: 'Daataa 1GB banuuf sadarkaa shaampiyoonaa gahi.',
                        icon: '🌐',
                        isUnlocked: false,
                        progress: 0, maxProgress: 1,
                        xpReward: 0,
                        rewardEligibility: { isEligible: true, rewardType: 'data', rewardAmount: '1GB', redeemed: false }
                    },
                    {
                        id: 'rew_3',
                        categoryId: 'rewards',
                        titleEn: 'Telebirr Prize', titleAm: 'የቴሌብር ሽልማት', titleOm: 'Badhaasa Telebirr',
                        descriptionEn: 'Monthly Champion gets a 500 ETB Telebirr deposit.', descriptionAm: 'የወሩ ሻምፒዮን 500 ብር የቴሌብር ተቀማጭ ያገኛል።', descriptionOm: 'Shaampiyooniin ji\'aa Telebirr ETB 500 argata.',
                        icon: '💳',
                        isUnlocked: false,
                        progress: 0, maxProgress: 1,
                        xpReward: 0,
                        rewardEligibility: { isEligible: false, rewardType: 'telebirr', rewardAmount: '500 ETB' }
                    },

                    // --- Seasonal Events ---
                    {
                        id: 'seas_1',
                        categoryId: 'seasonal',
                        titleEn: 'Ethiopian Premier League', titleAm: 'የኢትዮጵያ ፕሪሚየር ሊግ', titleOm: 'Piriimiyeer Liigii Itoophiyaa',
                        descriptionEn: 'Play 5 matches during the EPL special week.', descriptionAm: 'በኢትዮጵያ ፕሪሚየር ሊግ ልዩ ሳምንት 5 ጨዋታዎችን ይጫወቱ።', descriptionOm: 'Torbee EPL keessatti taphoota 5 taphadhu.',
                        icon: '⚽',
                        isUnlocked: true,
                        progress: 5, maxProgress: 5,
                        xpReward: 1000,
                        dateUnlocked: new Date().toISOString()
                    },

                    // --- Community ---
                    {
                        id: 'com_1',
                        categoryId: 'community',
                        titleEn: 'Invite Friends', titleAm: 'ጓደኞችን ይጋብዙ', titleOm: 'Hiriyoota Affeeri',
                        descriptionEn: 'Successfully invite 3 friends to the game.', descriptionAm: '3 ጓደኞችን በተሳካ ሁኔታ ወደ ጨዋታው ይጋብዙ።', descriptionOm: 'Hiriyoota 3 gara taphaatti affeeri.',
                        icon: '🤝',
                        isUnlocked: false,
                        progress: 1, maxProgress: 3,
                        xpReward: 1500
                    }
                ]);
            }, 600); // Network delay simulation
        });
    }
}
