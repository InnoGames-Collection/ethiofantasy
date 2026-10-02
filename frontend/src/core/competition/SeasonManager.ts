import type { SeasonRow } from '../../networking/supabase/types';

export class SeasonManager {
    private static _instance: SeasonManager | null = null;
    private _activeSeasons: Map<string, SeasonRow> = new Map();

    public static getInstance(): SeasonManager {
        if (!SeasonManager._instance) {
            SeasonManager._instance = new SeasonManager();
        }
        return SeasonManager._instance;
    }

    public async fetchActiveSeasons(): Promise<SeasonRow[]> {
        return Array.from(this._activeSeasons.values());
    }

    public getActiveSeasonForCompetition(competitionId: string): SeasonRow | null {
        return this._activeSeasons.get(competitionId) || null;
    }
}
