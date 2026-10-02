export interface ELOUpdateResult {
    winnerNewElo: number;
    loserNewElo: number;
    winnerEloChange: number;
    loserEloChange: number;
}

export class ELORatingSystem {
    private static DEFAULT_K_FACTOR = 32;

    /**
     * Calculate expected win probability for player A vs player B.
     */
    public static calculateExpectedScore(ratingA: number, ratingB: number): number {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }

    /**
     * Calculate new ELO ratings after a match result.
     * @param ratingA Current rating of Player A
     * @param ratingB Current rating of Player B
     * @param scoreA Actual outcome for A (1 = Win, 0.5 = Draw, 0 = Loss)
     * @param kFactor K-factor constant (default 32)
     */
    public static calculateNewRatings(
        ratingA: number,
        ratingB: number,
        scoreA: number,
        kFactor: number = ELORatingSystem.DEFAULT_K_FACTOR
    ): ELOUpdateResult {
        const expectedA = ELORatingSystem.calculateExpectedScore(ratingA, ratingB);
        const expectedB = 1 - expectedA;
        const scoreB = 1 - scoreA;

        const changeA = Math.round(kFactor * (scoreA - expectedA));
        const changeB = Math.round(kFactor * (scoreB - expectedB));

        // Rating floor: minimum 100 ELO
        const winnerNewElo = Math.max(100, ratingA + changeA);
        const loserNewElo = Math.max(100, ratingB + changeB);

        return {
            winnerNewElo,
            loserNewElo,
            winnerEloChange: changeA,
            loserEloChange: changeB
        };
    }
}
