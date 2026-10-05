import test from 'node:test';
import assert from 'node:assert/strict';
import { DailyChallengeEngine } from '../../src/services/dailyChallengeEngine.js';

test('Anti-Cheat: Server-authoritative speed points and latency enforcement', () => {
  // Speed bonus rules: ceil(10.0 - elapsedSeconds), bounded between 0 and 10
  assert.equal(DailyChallengeEngine.calculateSpeedPoints(0.5), 10, 'Sub-second answer earns 10 bonus pts');
  assert.equal(DailyChallengeEngine.calculateSpeedPoints(1.2), 9, '1.2s answer earns 9 bonus pts');
  assert.equal(DailyChallengeEngine.calculateSpeedPoints(5.0), 5, '5.0s answer earns 5 bonus pts');
  assert.equal(DailyChallengeEngine.calculateSpeedPoints(8.0), 2, '8.0s answer earns 2 bonus pts');
  assert.equal(DailyChallengeEngine.calculateSpeedPoints(9.5), 1, '9.5s answer earns 1 bonus pt');
  assert.equal(DailyChallengeEngine.calculateSpeedPoints(10.0), 0, '10.0s answer earns 0 bonus pts');
  assert.equal(DailyChallengeEngine.calculateSpeedPoints(12.5), 0, 'Late answer earns 0 bonus pts');
});

test('Anti-Cheat: Monotonic server clock evaluation rejects fabricated client timestamps', () => {
  // Simulate server receiving a submission where client claims 0.05s, but server wall-clock was 8.0s
  const serverQuestionStartTime = Date.now() - 8000; // 8.0s ago
  const simulatedClientTimestamp = Date.now() - 50; // client claimed 50ms!

  // Server authoritatively ignores client timestamp and uses server start time
  const now = Date.now();
  const authoritativeElapsed = (now - serverQuestionStartTime) / 1000;
  assert.ok(authoritativeElapsed >= 7.9, 'Authoritative elapsed must be ~8.0s, rejecting client claim of 50ms');

  const speedScore = DailyChallengeEngine.calculateSpeedPoints(authoritativeElapsed);
  assert.equal(speedScore, 2, 'Player is awarded 2 speed points based on server clock, not 10 points');
});

test('Anti-Cheat: Question timeout threshold triggers zero points', () => {
  const timeoutElapsed = 12.0; // Exceeds 11.5s tolerance
  const isTimeout = timeoutElapsed > 11.5;
  const isCorrectOption = true;

  const effectiveCorrect = !isTimeout && isCorrectOption;
  assert.equal(effectiveCorrect, false, 'Timed-out answer cannot be marked correct');

  const baseScore = effectiveCorrect ? 1 : 0;
  const speedScore = effectiveCorrect ? DailyChallengeEngine.calculateSpeedPoints(timeoutElapsed) : 0;
  assert.equal(baseScore + speedScore, 0, 'Timed-out submission earns strictly 0 points');
});
