import { describe, it, expect, beforeEach } from 'vitest';
import { QuizEngine } from '../../core/quiz/QuizEngine';

describe('QuizEngine', () => {
    let engine: QuizEngine;

    beforeEach(() => {
        engine = new QuizEngine();
    });

    it('should initialize with 0 stats', () => {
        const stats = engine.calculateFinalStats();
        expect(stats.goals).toBe(0);
        expect(stats.accuracy).toBe(0);
    });

    it('should record correct answers and calculate combo coins', () => {
        engine.recordAnswer(true, 2.5);
        engine.recordAnswer(true, 1.8);
        const stats = engine.calculateFinalStats();

        expect(stats.goals).toBe(2);
        expect(stats.correctAnswers).toBe(2);
        expect(stats.accuracy).toBe(100);
        expect(stats.maxCombo).toBe(2);
        expect(stats.coinsEarned).toBe(300); // 2*100 + 2*50
    });

    it('should reset combo on incorrect answer', () => {
        engine.recordAnswer(true, 3.0);
        engine.recordAnswer(false, 4.0);
        const stats = engine.calculateFinalStats();

        expect(stats.goals).toBe(1);
        expect(stats.correctAnswers).toBe(1);
        expect(stats.incorrectAnswers).toBe(1);
        expect(stats.accuracy).toBe(50);
        expect(stats.maxCombo).toBe(1);
    });
});
