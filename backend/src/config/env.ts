import { cleanEnv, str, port, num } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3402 }),
  ADMIN_PORT: port({ default: 3403 }),
  HOST: str({ default: '0.0.0.0' }),
  DOMAIN: str({ default: 'innopulseplatform.com' }),

  // PostgreSQL
  DATABASE_URL: str({ default: 'postgresql://postgres:postgres@localhost:5432/ethiofantasy' }),
  DB_MAX_CONNECTIONS: num({ default: 20 }),

  // Valkey / Redis
  VALKEY_URL: str({ default: 'redis://localhost:6379' }),

  // Security & Secrets
  JWT_SECRET: str({ default: 'ethiofantasy-telecom-jwt-secret-key-prod-2026' }),
  JWT_ACCESS_EXPIRES_IN: str({ default: '24h' }),
  CRON_SECRET: str({ default: 'ethiofantasy-cron-secret-2026' }),

  // Telecom SP Gateway (SDP)
  SP_GATEWAY_URL: str({ default: 'http://168.119.53.26:8484' }),
  SP_API_KEY: str({ default: 'ethiofantasy-sp-api-key-2026' }),
  SP_WEBHOOK_SECRET: str({ default: 'ethiofantasy-hmac-webhook-secret-2026' }),
  SP_SERVICE_ID: str({ default: '4' }),
  SHORTCODE: str({ default: '900' }),

  // CORS
  ALLOWED_ORIGINS: str({ default: 'http://localhost:3400,http://localhost:3403,https://ethiofantasy.innopulseplatform.com,https://ethiofantasy-admin.innopulseplatform.com' })
});
