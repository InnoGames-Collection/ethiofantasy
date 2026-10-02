import { FastifyInstance } from 'fastify';
import { DailyChallengeEngine } from '../services/dailyChallengeEngine.js';

export async function dailyChallengeRoutes(fastify: FastifyInstance) {
  /**
   * 1. Check Daily Challenge Status & Once-per-day restriction
   */
  fastify.get('/status', async (req, reply) => {
    const query = (req.query || {}) as { msisdn?: string };
    const msisdn = query.msisdn || '251965112122';

    const check = await DailyChallengeEngine.checkEligibility(msisdn);
    return reply.send({
      success: true,
      eligible: check.eligible,
      canAttempt: check.eligible,
      reason: check.reason,
      state: check.state,
    });
  });

  /**
   * 2. Start or Resume Daily Challenge Session (Strictly 1 attempt per day per MSISDN in EAT)
   */
  fastify.post('/start', async (req, reply) => {
    const body = (req.body || {}) as { msisdn?: string };
    if (!body.msisdn) {
      return reply.status(400).send({ success: false, error: 'MSISDN is required' });
    }

    const result = await DailyChallengeEngine.startSession(body.msisdn);
    if (!result.success) {
      return reply.status(403).send(result);
    }

    return reply.send(result);
  });

  /**
   * 3. Authoritative Answer Validation & Scoring (10s countdown, 1 base + speed points)
   */
  fastify.post('/submit-answer', async (req, reply) => {
    const payload = (req.body || {}) as {
      msisdn?: string;
      rawMsisdn?: string;
      attemptId: string;
      questionId: string;
      questionStartTimestamp: string | number;
      answerTimestamp: string | number;
      selectedOptionIndex: number | null;
    };

    const msisdn = payload.msisdn || payload.rawMsisdn;
    if (!msisdn || !payload.attemptId || !payload.questionId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required parameters: msisdn, attemptId, questionId',
      });
    }

    const result = await DailyChallengeEngine.recordAnswer({
      rawMsisdn: msisdn,
      attemptId: payload.attemptId,
      questionId: payload.questionId,
      questionStartTimestamp: payload.questionStartTimestamp,
      answerTimestamp: payload.answerTimestamp,
      selectedOptionIndex: payload.selectedOptionIndex !== undefined ? payload.selectedOptionIndex : null,
    });

    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.send(result);
  });

  /**
   * 4. Finalize Daily Challenge Attempt and Update 7-Day Competition Total
   */
  fastify.post('/complete', async (req, reply) => {
    const body = (req.body || {}) as { msisdn?: string; rawMsisdn?: string; attemptId: string };
    const msisdn = body.msisdn || body.rawMsisdn;

    if (!msisdn || !body.attemptId) {
      return reply.status(400).send({ success: false, error: 'msisdn and attemptId are required' });
    }

    const result = await DailyChallengeEngine.completeAttempt(msisdn, body.attemptId);
    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.send(result);
  });
}
