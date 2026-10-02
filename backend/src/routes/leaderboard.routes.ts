import { FastifyInstance } from 'fastify';
import { DailyChallengeEngine } from '../services/dailyChallengeEngine.js';

export async function leaderboardRoutes(fastify: FastifyInstance) {
  /**
   * Public 7-Day Competition Leaderboard (deterministic 5-tier tie-breaker)
   */
  fastify.get('/', async (req, reply) => {
    const { msisdn } = (req.query || {}) as { msisdn?: string };
    const result = await DailyChallengeEngine.getLeaderboard(msisdn);
    return reply.send(result);
  });

  fastify.get('/weekly', async (req, reply) => {
    const { msisdn } = (req.query || {}) as { msisdn?: string };
    const result = await DailyChallengeEngine.getLeaderboard(msisdn);
    return reply.send(result);
  });
}
