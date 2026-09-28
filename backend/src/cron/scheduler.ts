import cron from 'node-cron';
import { pool } from '../config/database.js';

export function startCronJobs() {
  console.log('[EthioFantasy Cron] Initializing schedulers...');

  // Weekly competition rollover: Runs every Monday at 00:00:00 East Africa Time
  cron.schedule('0 0 * * 1', async () => {
    console.log('[EthioFantasy Cron] Settling weekly 7-day competition cycle...');
    try {
      // Find active cycle
      const activeRes = await pool.query(
        `SELECT * FROM weekly_competitions WHERE status = 'ACTIVE' LIMIT 1`
      );

      if (activeRes.rows.length > 0) {
        const current = activeRes.rows[0];
        // Mark finalized
        await pool.query(
          `UPDATE weekly_competitions SET status = 'FINALIZED' WHERE competition_id = $1`,
          [current.competition_id]
        );

        // Create next cycle
        const nextCycle = current.cycle_number + 1;
        await pool.query(
          `INSERT INTO weekly_competitions (competition_id, cycle_number, start_date, end_date, status, prize_pool_etb)
           VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'ACTIVE', 50000)`,
          [`comp_cycle_2026_w${nextCycle}`, nextCycle]
        );

        console.log(`[EthioFantasy Cron] Finalized cycle ${current.cycle_number}, activated cycle ${nextCycle}`);
      }
    } catch (err) {
      console.error('[EthioFantasy Cron] Error during competition rollover:', err);
    }
  });
}
