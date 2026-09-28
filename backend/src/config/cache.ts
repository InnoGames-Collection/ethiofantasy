import { Redis } from 'ioredis';
import { env } from './env.js';

export const cache = new Redis(env.VALKEY_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
  lazyConnect: true,
});

cache.on('error', (err) => {
  console.warn('[Valkey Warning] Cache connection failed, falling back gracefully:', err.message);
});
