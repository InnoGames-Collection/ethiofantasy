import { describe, it, expect } from 'vitest';
import { ELORatingSystem } from '../../networking/multiplayer/ELORatingSystem';

describe('ELORatingSystem', () => {
    it('should calculate expected win probability equal for equal ELO ratings', () => {
        const expected = ELORatingSystem.calculateExpectedScore(1200, 1200);
        expect(expected).toBeCloseTo(0.5);
    });

    it('should give higher expected win probability to higher ELO player', () => {
        const expectedHigh = ELORatingSystem.calculateExpectedScore(1600, 1200);
        expect(expectedHigh).toBeGreaterThan(0.8);
    });

    it('should update ratings correctly when lower player defeats higher player', () => {
        const result = ELORatingSystem.calculateNewRatings(1200, 1600, 1);
        expect(result.winnerEloChange).toBeGreaterThan(25);
        expect(result.winnerNewElo).toBe(1200 + result.winnerEloChange);
    });
});
