import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../../../db/migrations');
  console.log(`[Migrations] Scanning ${migrationsDir}...`);

  if (!fs.existsSync(migrationsDir)) {
    console.error(`[Migrations] Directory ${migrationsDir} not found.`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`[Migrations] Applying ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log(`[Migrations] Successfully applied ${file}`);
    } catch (err: any) {
      console.error(`[Migrations] Error applying ${file}:`, err.message);
      // If error is about already existing objects or already applied, log and proceed
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.warn(`[Migrations] Skipping already applied entities in ${file}`);
      } else {
        throw err;
      }
    } finally {
      client.release();
    }
  }

  console.log('[Migrations] All migrations completed successfully.');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('[Migrations] Migration failed:', err);
  process.exit(1);
});
