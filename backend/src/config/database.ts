import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Ensure PostgreSQL DATE (OID 1082) is returned as raw YYYY-MM-DD string without timezone distortion
pg.types.setTypeParser(1082, (val: string) => val);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_MAX_CONNECTIONS,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', (client) => {
  client.query("SET timezone = 'Africa/Addis_Ababa'");
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Error] Unexpected client error:', err);
});

