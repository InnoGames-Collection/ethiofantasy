import { describe, it, expect } from 'vitest';
import { ProgressionManager } from '../../core/managers/ProgressionManager';

describe('ProgressionManager', () => {
    it('should assign Bronze rank for 0 XP', () => {
        const rank = ProgressionManager.getRank(0);
        expect(rank.name).toBe('Bronze');
    });

    it('should assign Legend rank for high XP', () => {
        const rank = ProgressionManager.getRank(10000);
        expect(rank.name).toBe('Legend');
    });

    it('should calculate level progression correctly', () => {
        const lvlInfo = ProgressionManager.getLevel(350);
        expect(lvlInfo.level).toBeGreaterThan(1);
    });
});
