import { FastifyInstance } from 'fastify';
import { LeaderboardService } from '../services/leaderboardService.js';

export async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/weekly', async (req, reply) => {
    const { msisdn } = req.query as { msisdn?: string };
    const data = await LeaderboardService.getWeeklyLeaderboard(msisdn);
    return reply.send(data);
  });
}
