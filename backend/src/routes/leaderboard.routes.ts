import { FastifyInstance } from 'fastify';
import { LeaderboardService } from '../services/leaderboardService.js';

export async function leaderboardRoutes(fastify: FastifyInstance) {
  /**
   * Public 7-Day Competition Leaderboard (deterministic 5-tier tie-breaker with Redis caching)
   */
  fastify.get('/', async (req, reply) => {
    const { msisdn } = (req.query || {}) as { msisdn?: string };
    const result = await LeaderboardService.getTournamentLeaderboard(msisdn);
    return reply.send(result);
  });

  fastify.get('/weekly', async (req, reply) => {
    const { msisdn } = (req.query || {}) as { msisdn?: string };
    const result = await LeaderboardService.getTournamentLeaderboard(msisdn);
    return reply.send(result);
  });
}
