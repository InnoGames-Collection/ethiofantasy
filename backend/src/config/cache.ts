import { Redis } from 'ioredis';
import { env } from './env.js';

export const cache = new Redis(env.VALKEY_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 500,
  retryStrategy(times) {
    if (times > 2) return null;
    return 1000;
  },
  lazyConnect: true,
});

cache.on('error', (err) => {
  console.warn('[Valkey Warning] Cache connection failed, falling back gracefully:', err.message);
});
