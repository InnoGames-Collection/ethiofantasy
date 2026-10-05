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
import { playerRoutes } from './routes/player.routes.js';
import { questionsRoutes } from './routes/questions.routes.js';
import { matchRoutes } from './routes/match.routes.js';
import { startCronJobs } from './cron/scheduler.js';

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  trustProxy: true,
});

async function main() {
  // 1. Security Headers & Strict CORS Whitelist
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    frameguard: { action: 'deny' },
    noSniff: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  });

  const allowedOriginsList = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile app, curl, server-to-server)
      if (!origin) {
        cb(null, true);
        return;
      }

      const isAllowed =
        allowedOriginsList.includes(origin) ||
        origin.endsWith('.innopulseplatform.com') ||
        (env.NODE_ENV !== 'production' &&
          (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')));

      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error(`CORS Error: Origin ${origin} not permitted`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 2. Global Rate Limiter
  fastify.addHook('preHandler', rateLimiter);

  // 3. Healthcheck Probes
  fastify.get('/health', async () => ({ status: 'healthy', service: 'ethiofantasy-api', timestamp: new Date().toISOString() }));
  fastify.get('/api/v1/health', async () => ({ status: 'healthy', platform: 'EthioFantasy', version: '1.0.0' }));

  // Liveness Probe: Quick validation that Node event loop is responsive
  fastify.get('/healthz/live', async (_req, reply) => {
    return reply.status(200).send({ status: 'LIVE', timestamp: new Date().toISOString() });
  });

  // Readiness Probe: Validates both PostgreSQL and Valkey / Redis are healthy
  fastify.get('/healthz/ready', async (_req, reply) => {
    let dbStatus = 'FAIL';
    let cacheStatus = 'FAIL';

    try {
      const dbTest = await pool.query('SELECT 1 as alive');
      if (dbTest.rows[0]?.alive === 1) dbStatus = 'OK';
    } catch (err: any) {
      fastify.log.error({ err }, 'Readiness probe DB check failed');
    }

    try {
      const redisPong = await cache.ping();
      if (redisPong === 'PONG') cacheStatus = 'OK';
    } catch (err: any) {
      fastify.log.warn({ err }, 'Readiness probe Cache check failed');
    }

    const isHealthy = dbStatus === 'OK' && cacheStatus === 'OK';
    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'READY' : 'DEGRADED',
      checks: { database: dbStatus, redis: cacheStatus },
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // 4. API Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(quizRoutes, { prefix: '/api/quiz' });
  await fastify.register(dailyChallengeRoutes, { prefix: '/api/daily-challenge' });
  await fastify.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
  await fastify.register(playerRoutes, { prefix: '/api/player' });
  await fastify.register(questionsRoutes, { prefix: '/api/questions' });
  await fastify.register(matchRoutes, { prefix: '/api/match' });
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
