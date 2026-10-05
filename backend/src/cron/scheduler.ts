import cron from 'node-cron';
import { CompetitionLifecycleService } from '../services/competitionLifecycleService.js';

export function startCronJobs() {
  console.log('[EthioFantasy Cron] Initializing EAT schedulers (Africa/Addis_Ababa, UTC+3)...');

  // Run immediate startup synchronization
  CompetitionLifecycleService.syncDailyChallengesStatus()
    .then(() => console.log('[EthioFantasy Cron] Daily challenge status synchronized with EAT calendar.'))
    .catch((err) => console.error('[EthioFantasy Cron] Initial daily sync failed:', err));

  CompetitionLifecycleService.syncWeeklyCompetitionStatus()
    .then(() => console.log('[EthioFantasy Cron] Weekly competition cycles synchronized with EAT calendar.'))
    .catch((err) => console.error('[EthioFantasy Cron] Initial weekly sync failed:', err));

  // 1. Daily Challenge Rollover:
  // Closes today's challenge window at 23:59:50 EAT and ensures tomorrow's challenge is ready
  cron.schedule(
    '59 23 * * *',
    async () => {
      console.log('[EthioFantasy Cron] Daily challenge cutoff reached (23:59 EAT). Closing active window...');
      try {
        await CompetitionLifecycleService.syncDailyChallengesStatus();
      } catch (err) {
        console.error('[EthioFantasy Cron] Error during daily challenge cutoff sync:', err);
      }
    },
    { timezone: 'Africa/Addis_Ababa' }
  );

  cron.schedule(
    '1 0 * * *',
    async () => {
      console.log('[EthioFantasy Cron] New daily challenge window opening (00:01 EAT). Ensuring seed questions...');
      try {
        await CompetitionLifecycleService.syncDailyChallengesStatus();
      } catch (err) {
        console.error('[EthioFantasy Cron] Error during new day initialization:', err);
      }
    },
    { timezone: 'Africa/Addis_Ababa' }
  );

  // 2. Weekly Competition Rollover:
  // Sunday 23:59:50 EAT: Closes 7-day tournament, calculates ACID deterministic leaderboard, awards prizes
  cron.schedule(
    '59 23 * * 0',
    async () => {
      console.log('[EthioFantasy Cron] Sunday 23:59 EAT reached. Settling 7-day championship tournament...');
      try {
        await CompetitionLifecycleService.syncWeeklyCompetitionStatus();
      } catch (err) {
        console.error('[EthioFantasy Cron] Error during Sunday tournament settlement:', err);
      }
    },
    { timezone: 'Africa/Addis_Ababa' }
  );

  // Monday 00:00:00 EAT: Activates new ISO week tournament cycle
  cron.schedule(
    '0 0 * * 1',
    async () => {
      console.log('[EthioFantasy Cron] Monday 00:00 EAT reached. Activating new weekly ISO tournament cycle...');
      try {
        await CompetitionLifecycleService.syncWeeklyCompetitionStatus();
      } catch (err) {
        console.error('[EthioFantasy Cron] Error activating Monday tournament cycle:', err);
      }
    },
    { timezone: 'Africa/Addis_Ababa' }
  );
}
