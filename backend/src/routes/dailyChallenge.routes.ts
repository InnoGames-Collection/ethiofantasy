import { FastifyInstance } from 'fastify';
import { DailyChallengeEngine } from '../services/dailyChallengeEngine.js';

export async function dailyChallengeRoutes(fastify: FastifyInstance) {
  /**
   * Check status and 1-attempt-per-day eligibility
   */
  fastify.get('/status', async (req, reply) => {
    const query = req.query as { msisdn?: string; date?: string };
    const date = query.date || new Date().toISOString().split('T')[0];
    const msisdn = query.msisdn || '251911000000';

    const check = await DailyChallengeEngine.checkEligibility(msisdn, date);
    return reply.send({
      date,
      canAttempt: check.canAttempt,
      reason: check.reason,
      attempt: check.attempt,
    });
  });

  /**
   * Start a daily challenge run
   */
  fastify.post('/start', async (req, reply) => {
    const { msisdn, date } = req.body as { msisdn: string; date?: string };
    const challengeDate = date || new Date().toISOString().split('T')[0];

    const check = await DailyChallengeEngine.checkEligibility(msisdn, challengeDate);
    if (!check.canAttempt) {
      return reply.status(403).send({ error: check.reason || 'Cannot attempt challenge today' });
    }

    const { attemptId, challengeId } = await DailyChallengeEngine.startAttempt(msisdn, challengeDate);
    return reply.send({
      success: true,
      attemptId,
      challengeId,
      challengeDate,
    });
  });

  /**
   * Complete challenge and record score + response time
   */
  fastify.post('/complete', async (req, reply) => {
    const { attemptId, score, totalResponseTimeMs } = req.body as {
      attemptId: string;
      score: number;
      totalResponseTimeMs: number;
    };

    if (!attemptId) {
      return reply.status(400).send({ error: 'attemptId is required' });
    }

    await DailyChallengeEngine.completeAttempt(attemptId, score, totalResponseTimeMs);
    return reply.send({ success: true });
  });
}
