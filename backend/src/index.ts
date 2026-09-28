import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import { cache } from './config/cache.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authRoutes } from './routes/auth.routes.js';
import { quizRoutes } from './routes/quiz.routes.js';
import { dailyChallengeRoutes } from './routes/dailyChallenge.routes.js';
import { leaderboardRoutes } from './routes/leaderboard.routes.js';
import { webhookRoutes } from './routes/webhook.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { startCronJobs } from './cron/scheduler.js';

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  trustProxy: true,
});

async function main() {
  // 1. Security Headers & CORS
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow local development, telecom webviews, and production domain
      if (
        !origin ||
        origin.includes('innopulseplatform.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // 2. Global Rate Limiter
  fastify.addHook('preHandler', rateLimiter);

  // 3. Healthcheck Probes
  fastify.get('/health', async () => ({ status: 'healthy', service: 'ethiofantasy-api', timestamp: new Date().toISOString() }));
  fastify.get('/api/v1/health', async () => ({ status: 'healthy', platform: 'EthioFantasy', version: '1.0.0' }));

  // 4. API Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(quizRoutes, { prefix: '/api/quiz' });
  await fastify.register(dailyChallengeRoutes, { prefix: '/api/daily-challenge' });
  await fastify.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
  await fastify.register(adminRoutes, { prefix: '/api' });

  // 5. Background Schedulers
  startCronJobs();

  // 6. Listen
  try {
    const address = await fastify.listen({ port: env.PORT, host: env.HOST });
    fastify.log.info(`🚀 EthioFantasy API Server running at ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful Shutdown
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await fastify.close();
      await cache.quit();
      await pool.end();
      fastify.log.info('Closed DB and Cache connections cleanly.');
    } catch (err) {
      fastify.log.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
  });
});

main();
