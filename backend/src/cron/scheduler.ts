import cron from 'node-cron';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';

export function startCronJobs() {
  console.log('[EthioFantasy Cron] Initializing schedulers with distributed coordination...');

  // Weekly competition rollover: Runs every Monday at 00:00:00 East Africa Time
  cron.schedule('0 0 * * 1', async () => {
    console.log('[EthioFantasy Cron] Settling weekly 7-day competition cycle...');
    const lockKey = 'lock:cron:weekly_rollover';
    let hasLock = false;

    try {
      // 1. Attempt to acquire Redis distributed lock for 60 seconds
      const acquired = await cache.set(lockKey, '1', 'PX', 60000, 'NX');
      hasLock = Boolean(acquired);
    } catch (err) {
      console.warn('[Cron] Redis lock check failed, falling back to PostgreSQL advisory lock');
    }

    const client = await pool.connect();
    try {
      // 2. PostgreSQL Advisory Lock as secondary safeguard
      const advisoryLockRes = await client.query(`SELECT pg_try_advisory_lock(74152026) as acquired`);
      const pgLockAcquired = Boolean(advisoryLockRes.rows[0]?.acquired);

      if (!hasLock && !pgLockAcquired) {
        console.log('[EthioFantasy Cron] Another replica is currently handling the competition rollover. Skipping.');
        return;
      }

      await client.query('BEGIN');

      // Find active cycle
      const activeRes = await client.query(
        `SELECT * FROM weekly_competitions WHERE status = 'ACTIVE' LIMIT 1 FOR UPDATE`
      );

      if (activeRes.rows.length > 0) {
        const current = activeRes.rows[0];

        // Mark finalized
        await client.query(
          `UPDATE weekly_competitions SET status = 'FINALIZED' WHERE competition_id = $1`,
          [current.competition_id]
        );

        // Create next cycle
        const nextCycle = current.cycle_number + 1;
        await client.query(
          `INSERT INTO weekly_competitions (competition_id, cycle_number, start_date, end_date, status, prize_pool_etb)
           VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'ACTIVE', 50000.00)`,
          [`comp_cycle_2026_w${nextCycle}`, nextCycle]
        );

        await client.query('COMMIT');
        console.log(`[EthioFantasy Cron] Finalized cycle ${current.cycle_number}, activated cycle ${nextCycle}`);

        // Invalidate cached leaderboard
        try {
          await cache.del('leaderboard:active_cycle:top10');
        } catch (e) {}
      } else {
        await client.query('ROLLBACK');
      }

      await client.query(`SELECT pg_advisory_unlock(74152026)`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[EthioFantasy Cron] Error during competition rollover:', err);
    } finally {
      client.release();
    }
  });
}
