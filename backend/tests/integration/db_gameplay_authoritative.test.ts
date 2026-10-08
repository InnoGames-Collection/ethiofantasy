import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { pool } from '../../src/config/database.js';
import { quizRoutes } from '../../src/routes/quiz.routes.js';
import { dailyChallengeRoutes } from '../../src/routes/dailyChallenge.routes.js';
import { AuthoritativeGameEngine } from '../../src/services/authoritativeGameEngine.js';
import { DailyChallengeEngine } from '../../src/services/dailyChallengeEngine.js';
import { getEatDateString } from '../../src/utils/time.js';

test('Integration: Multi-Account Isolation & PostgreSQL Progress', async () => {
  const fastify = Fastify();
  await fastify.register(quizRoutes, { prefix: '/api/quiz' });

  const msisdnA = '251911000000';
  const msisdnB = '251911000001';

  // Clean up test records
  await pool.query('DELETE FROM player_progress WHERE player_msisdn IN ($1, $2)', [msisdnA, msisdnB]);
  await pool.query('DELETE FROM players WHERE msisdn IN ($1, $2)', [msisdnA, msisdnB]);

  // Ensure test players exist in players table
  await pool.query('INSERT INTO players (msisdn, masked_msisdn) VALUES ($1, $2) ON CONFLICT DO NOTHING', [msisdnA, '251*****000']);
  await pool.query('INSERT INTO players (msisdn, masked_msisdn) VALUES ($1, $2) ON CONFLICT DO NOTHING', [msisdnB, '251*****001']);

  // 1. Initial state for msisdnA: Only level 1 unlocked
  const resA1 = await fastify.inject({
    method: 'GET',
    url: `/api/quiz/progress?msisdn=${msisdnA}`,
  });
  const dataA1 = JSON.parse(resA1.payload);
  assert.equal(dataA1.success, true);
  assert.deepEqual(dataA1.progress.unlockedLevelIds, [1]);
  assert.equal(dataA1.progress.score, 0);

  // 2. Player A completes Level 1 with 3 stars and 10 points
  const submitA = await fastify.inject({
    method: 'POST',
    url: '/api/quiz/submit-level',
    payload: {
      msisdn: msisdnA,
      levelId: 1,
      stars: 3,
      score: 10,
      percentage: 100,
    },
  });
  const dataSubmitA = JSON.parse(submitA.payload);
  assert.equal(dataSubmitA.success, true);
  assert.deepEqual(dataSubmitA.progress.unlockedLevelIds, [1, 2], 'Level 2 must be unlocked for Player A');
  assert.deepEqual(dataSubmitA.progress.completedLevelIds, [1]);
  assert.equal(dataSubmitA.progress.score, 10);
  assert.equal(dataSubmitA.progress.stars, 3);

  // 3. Player B logs in (new account): Must start at Level 1, score 0, stars 0
  const resB = await fastify.inject({
    method: 'GET',
    url: `/api/quiz/progress?msisdn=${msisdnB}`,
  });
  const dataB = JSON.parse(resB.payload);
  assert.equal(dataB.success, true);
  assert.deepEqual(dataB.progress.unlockedLevelIds, [1], 'Player B must ONLY have Level 1 unlocked!');
  assert.deepEqual(dataB.progress.completedLevelIds, [], 'Player B must have 0 completed levels');
  assert.equal(dataB.progress.score, 0, 'Player B must have 0 score');
  assert.equal(dataB.progress.stars, 0, 'Player B must have 0 stars');

  // 4. Player A checks progress again: Level 2 remains unlocked for Player A
  const resA2 = await fastify.inject({
    method: 'GET',
    url: `/api/quiz/progress?msisdn=${msisdnA}`,
  });
  const dataA2 = JSON.parse(resA2.payload);
  assert.deepEqual(dataA2.progress.unlockedLevelIds, [1, 2], 'Player A must still have Level 1 and 2 unlocked');

  // Clean up
  await pool.query('DELETE FROM player_progress WHERE player_msisdn IN ($1, $2)', [msisdnA, msisdnB]);
  await pool.query('DELETE FROM players WHERE msisdn IN ($1, $2)', [msisdnA, msisdnB]);
});

test('Integration: Dynamic Level Questions from PostgreSQL', async () => {
  const fastify = Fastify();
  await fastify.register(quizRoutes, { prefix: '/api/quiz' });

  const res = await fastify.inject({
    method: 'GET',
    url: '/api/quiz/level/1/questions',
  });

  const data = JSON.parse(res.payload);
  assert.equal(data.success, true);
  assert.equal(data.levelId, 1);
  assert.equal(data.questions.length, 10, 'Must return exactly 10 questions for Level 1');

  for (const q of data.questions) {
    assert.equal(typeof q.questionText, 'string');
    assert.equal(q.options.length, 4, 'Each question must have 4 options');
    assert.equal(typeof q.correctAnswerIndex, 'number', 'correctAnswerIndex must be a number');
    assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3, 'correctAnswerIndex must be between 0 and 3');
  }
});

test('Integration: Daily Challenge Session Holding & Resume in PostgreSQL', async () => {
  const fastify = Fastify();
  await fastify.register(dailyChallengeRoutes, { prefix: '/api/daily-challenge' });

  const msisdn = '251911999999';
  const today = getEatDateString();

  // Clean up previous attempts for test number
  await pool.query('DELETE FROM player_quiz_sessions WHERE player_msisdn = $1', [msisdn]);
  await pool.query('DELETE FROM daily_attempts WHERE player_msisdn = $1', [msisdn]);
  await pool.query('DELETE FROM players WHERE msisdn = $1', [msisdn]);

  // Ensure test player exists
  await pool.query('INSERT INTO players (msisdn, masked_msisdn) VALUES ($1, $2) ON CONFLICT DO NOTHING', [msisdn, '251*****999']);
  // Ensure subscription for test msisdn in test table
  await pool.query(
    `INSERT INTO test_subscriber_otps (msisdn, default_otp, name, tier)
     VALUES ($1, '123456', 'QA Test', 'CHAMPION')
     ON CONFLICT (msisdn) DO NOTHING`,
    [msisdn]
  );

  // 1. Start fresh daily session
  const startRes1 = await fastify.inject({
    method: 'POST',
    url: '/api/daily-challenge/start',
    payload: { msisdn },
  });

  const startData1 = JSON.parse(startRes1.payload);
  assert.equal(startData1.success, true);
  assert.equal(startData1.currentIndex, 0, 'New session must start at question index 0');
  assert.equal(startData1.questions.length, 10, 'Must provide 10 daily challenge questions');
  assert.deepEqual(startData1.sessionAnswers, []);

  const firstQuestionId = startData1.questions[0].id;

  // 2. Submit answer to question 0
  const submitRes = await fastify.inject({
    method: 'POST',
    url: '/api/daily-challenge/submit-answer',
    payload: {
      msisdn,
      sessionId: startData1.sessionId,
      attemptId: startData1.attemptId,
      questionId: firstQuestionId,
      selectedOptionIndex: 0,
    },
  });

  const submitData = JSON.parse(submitRes.payload);
  assert.equal(submitData.success, true);
  assert.equal(submitData.nextQuestionIndex, 1, 'Next question index must advance to 1');
  assert.equal(submitData.answers.length, 1, 'Answers array must contain 1 answered question');

  // 3. User exits and returns: Check status
  const statusRes = await fastify.inject({
    method: 'GET',
    url: `/api/daily-challenge/status?msisdn=${msisdn}`,
  });
  const statusData = JSON.parse(statusRes.payload);
  assert.equal(statusData.success, true);
  assert.equal(statusData.state.hasActiveSession, true, 'Must indicate active session in progress');
  assert.equal(statusData.state.activeQuestionIndex, 1, 'Active question index must be 1');

  // 4. Start again (Resume): Must NOT restart from question 0! Must resume at index 1
  const startRes2 = await fastify.inject({
    method: 'POST',
    url: '/api/daily-challenge/start',
    payload: { msisdn },
  });

  const startData2 = JSON.parse(startRes2.payload);
  assert.equal(startData2.success, true);
  assert.equal(startData2.currentIndex, 1, 'Resumed session must hold progress and be at index 1');
  assert.equal(startData2.sessionAnswers.length, 1, 'Must hold 1 answered question');
  assert.equal(startData2.sessionId, startData1.sessionId, 'Session ID must remain identical');

  // 5. Test Review endpoint directly from PostgreSQL
  const reviewRes = await fastify.inject({
    method: 'GET',
    url: `/api/daily-challenge/review?msisdn=${msisdn}&date=${today}`,
  });

  const reviewData = JSON.parse(reviewRes.payload);
  assert.equal(reviewData.success, true);
  assert.equal(reviewData.results.length, 1, 'Review must return the answered question from PostgreSQL');
  assert.equal(reviewData.results[0].questionNumber, 1);

  // Clean up
  await pool.query('DELETE FROM player_quiz_sessions WHERE player_msisdn = $1', [msisdn]);
  await pool.query('DELETE FROM daily_attempts WHERE player_msisdn = $1', [msisdn]);
  await pool.query('DELETE FROM test_subscriber_otps WHERE msisdn = $1', [msisdn]);
  await pool.query('DELETE FROM players WHERE msisdn = $1', [msisdn]);
});

after(async () => {
  await pool.end();
});
