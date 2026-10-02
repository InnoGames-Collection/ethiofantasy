import type { TournamentRow } from '../../networking/supabase/types';

export class TournamentManager {
    private static _instance: TournamentManager | null = null;
    private _tournaments: TournamentRow[] = [
        {
            id: 'trn_weekly_50k',
            name_en: 'Weekly 50,000 ETB Championship',
            name_am: 'የሳምንቱ 50,000 ብር ሻምፒዮና',
            name_om: 'Shaampiyoonaa Torbee Birrii 50,000',
            competition_id: 'walia-ibex',
            max_players: 64,
            bracket_size: 64,
            status: 'registration',
            prize_coins: 50000,
            starts_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        }
    ];

    public static getInstance(): TournamentManager {
        if (!TournamentManager._instance) {
            TournamentManager._instance = new TournamentManager();
        }
        return TournamentManager._instance;
    }

    public async getUpcomingTournaments(): Promise<TournamentRow[]> {
        return this._tournaments;
    }

    public async joinTournament(tournamentId: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: `Joined tournament ${tournamentId}` };
    }

    public async registerForTournament(tournamentId: string, _userId?: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: `Registered for tournament ${tournamentId}` };
    }
}
