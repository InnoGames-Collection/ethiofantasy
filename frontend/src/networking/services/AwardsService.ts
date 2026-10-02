import { ApiClient } from '../api/ApiClient';

export interface AwardRecord {
    awardId: string;
    tournamentId: string;
    tournamentType: 'daily' | 'weekly' | 'monthly';
    rank: number;
    userMsisdn: string;
    maskedMsisdn: string;
    prizeAmount: number;
    currency: string;
    tournamentStartDate: string;
    tournamentEndDate: string;
    awardDate: string;
    createdAt: string;
}

export class AwardsService {
    private static instance: AwardsService;
    private _apiClient: ApiClient;

    private constructor() {
        this._apiClient = ApiClient.getInstance();
    }

    public static getInstance(): AwardsService {
        if (!AwardsService.instance) {
            AwardsService.instance = new AwardsService();
        }
        return AwardsService.instance;
    }

    public async getAwards(type: 'daily' | 'weekly' | 'monthly'): Promise<AwardRecord[]> {
        try {
            const res = await this._apiClient.get('/leaderboard/weekly');
            if (res && res.top10 && Array.isArray(res.top10)) {
                return res.top10.slice(0, 3).map((item: any) => ({
                    awardId: `awd_${item.rank}_${type}`,
                    tournamentId: res.competition?.competition_id || `comp_${type}`,
                    tournamentType: type,
                    rank: item.rank,
                    userMsisdn: item.player_msisdn || '',
                    maskedMsisdn: item.masked_msisdn || '091*****212',
                    prizeAmount: item.prize_etb || this.calculatePrize(item.rank, type),
                    currency: 'ETB',
                    tournamentStartDate: res.competition?.start_date || '',
                    tournamentEndDate: res.competition?.end_date || '',
                    awardDate: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }));
            }
        } catch (e) {
            console.warn('[AwardsService] Failed to fetch awards from backend, using fallback:', e);
        }

        const fallbacks = [
            { rank: 1, msisdn: '091*****910', prize: 20000 },
            { rank: 2, msisdn: '092*****344', prize: 12000 },
            { rank: 3, msisdn: '093*****122', prize: 5000 }
        ];

        return fallbacks.map(f => ({
            awardId: `awd_${f.rank}_fallback`,
            tournamentId: `trn_${type}`,
            tournamentType: type,
            rank: f.rank,
            userMsisdn: f.msisdn,
            maskedMsisdn: f.msisdn,
            prizeAmount: f.prize,
            currency: 'ETB',
            tournamentStartDate: '',
            tournamentEndDate: '',
            awardDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }));
    }

    private calculatePrize(rank: number, type: 'daily' | 'weekly' | 'monthly'): number {
        if (type === 'weekly') {
            if (rank === 1) return 20000;
            if (rank === 2) return 12000;
            if (rank === 3) return 5000;
            return 1000;
        }
        return rank === 1 ? 5000 : (rank === 2 ? 3000 : 1000);
    }
}
