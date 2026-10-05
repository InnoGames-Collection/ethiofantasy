import { FastifyInstance } from 'fastify';
import { DailyChallengeEngine } from '../services/dailyChallengeEngine.js';
import { AuthoritativeGameEngine } from '../services/authoritativeGameEngine.js';

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
   * Sanitizes all questions by stripping answer keys (correct_index / correctAnswerIndex / explanation).
   */
  fastify.post('/start', async (req, reply) => {
    const body = (req.body || {}) as { msisdn?: string };
    if (!body.msisdn) {
      return reply.status(400).send({ success: false, error: 'MSISDN is required' });
    }

    const result = await AuthoritativeGameEngine.startDailySession(body.msisdn);
    if (!result.success) {
      return reply.status(403).send(result);
    }

    return reply.send(result);
  });

  /**
   * 3. Authoritative Answer Validation & Scoring (10s countdown, 1 base + speed points)
   * Calculates latency from server wall-clock timer, rejecting forged client timestamps.
   */
  fastify.post('/submit-answer', async (req, reply) => {
    const payload = (req.body || {}) as {
      msisdn?: string;
      rawMsisdn?: string;
      sessionId?: string;
      attemptId?: string;
      questionId: string;
      selectedOptionIndex?: number | null;
      selectedIndex?: number | null;
    };

    const msisdn = payload.msisdn || payload.rawMsisdn;
    if (!msisdn || !payload.questionId) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required parameters: msisdn, questionId',
      });
    }

    const selectedIdx = payload.selectedOptionIndex !== undefined 
      ? payload.selectedOptionIndex 
      : (payload.selectedIndex !== undefined ? payload.selectedIndex : null);

    const result = await AuthoritativeGameEngine.submitAnswer({
      msisdn,
      sessionId: payload.sessionId,
      attemptId: payload.attemptId,
      questionId: payload.questionId,
      selectedIndex: selectedIdx,
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
