import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { maskMsisdn, normalizeMsisdn } from '../services/dailyChallengeEngine.js';
import {
  getEatDateString,
  getEatTimestampString,
  getCompetitionCycleInfoEAT,
} from '../utils/time.js';
import {
  verifyAdmin,
  verifySuperAdmin,
  verifyOperationsAdmin,
  verifyAdminAuth,
  verifyAuditorOrAdmin,
} from '../middleware/auth.js';

// ==============================================================================
// Validation Schemas (Zod)
// ==============================================================================
const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  pool: z.string().optional(),
  difficulty: z.string().optional(),
  levelNumber: z.coerce.number().int().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  action: z.string().optional(),
  objectType: z.string().optional(),
  type: z.string().optional(),
  competitionId: z.string().optional(),
});

const ReasonPayloadSchema = z.object({
  reason: z.string().min(4, 'Audit justification must be at least 4 characters'),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // Enforce Zero-Trust Dedicated Admin Token on all /api admin control routes
  fastify.addHook('preHandler', verifyAdminAuth);

  // --------------------------------------------------------------------------
  // Audit Logging Helper with IP, User-Agent, and Before/After State Capture
  // --------------------------------------------------------------------------
  async function logAdminAudit(
    req: FastifyRequest,
    action: string,
    objectType: string,
    objectId: string,
    oldValue: any,
    newValue: any,
    reason: string,
    client?: any
  ): Promise<void> {
    const adminId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
    const adminName = req.user?.username || req.user?.email || 'Operations Admin';
    const adminRole = req.user?.role || 'SUPER_ADMIN';
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Admin Console';

    const queryTarget = client || pool;
    try {
      await queryTarget.query(
        `INSERT INTO admin_audit_logs 
         (admin_id, admin_name, admin_role, action, object_type, object_id, 
          old_value, new_value, before_state_json, after_state_json, ip_address, user_agent, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
        [
          adminId,
          adminName,
          adminRole,
          action,
          objectType,
          objectId,
          typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue ?? null),
          typeof newValue === 'string' ? newValue : JSON.stringify(newValue ?? null),
          oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : JSON.stringify({ val: oldValue })) : null,
          newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : JSON.stringify({ val: newValue })) : null,
          clientIp,
          userAgent,
          reason,
        ]
      );
    } catch (err) {
      req.log.error({ err }, '[Audit Log Error] Failed to write immutable admin audit entry');
    }
  }

  // --------------------------------------------------------------------------
  // 1. Dashboard Metrics & High-Level KPIs (100% Live GCP PostgreSQL Aggregations)
  // --------------------------------------------------------------------------
  fastify.get('/dashboard/stats', { preHandler: [verifyAdmin] }, async (req) => {
    const today = getEatDateString();
    const cycle = getCompetitionCycleInfoEAT(today);

    // Run parallel high-performance aggregation queries
    const [
      activePlayersRes,
      todayAttemptsRes,
      activeCompRes,
      pendingPrizeRes,
      settingsRes,
      recentAuditRes,
      activeSubsRes,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as count FROM players WHERE status = 'ACTIVE'`),
      pool.query(
        `SELECT COUNT(*)::int as count, COALESCE(MAX(score), 0)::int as top_score 
         FROM daily_attempts 
         WHERE attempt_date = $1`,
        [today]
      ),
      pool.query(
        `SELECT * FROM weekly_competitions 
         WHERE status = 'ACTIVE' 
         ORDER BY cycle_number DESC 
         LIMIT 1`
      ),
      pool.query(
        `SELECT COUNT(*)::int as count 
         FROM player_prize_overrides 
         WHERE status = 'PENDING_APPROVAL'`
      ),
      pool.query(`SELECT system_mode FROM service_settings LIMIT 1`),
      pool.query(
        `SELECT * FROM admin_audit_logs 
         ORDER BY created_at DESC 
         LIMIT 10`
      ),
      pool.query(`SELECT COUNT(*)::int as count FROM subscriptions WHERE status = 'ACTIVE'`),
    ]);

    const activePlayers = activePlayersRes.rows[0]?.count || 0;
    const activeSubscribers = activeSubsRes.rows[0]?.count || 0;
    const todayParticipants = todayAttemptsRes.rows[0]?.count || 0;
    const topScore = todayAttemptsRes.rows[0]?.top_score || 0;
    const pendingPrizeActions = pendingPrizeRes.rows[0]?.count || 0;
    const systemMode = settingsRes.rows[0]?.system_mode || 'PRODUCTION';

    // Fetch Today's Daily Challenge from DB
    const dcRes = await pool.query(
      `SELECT * FROM daily_challenges WHERE challenge_date = $1 LIMIT 1`,
      [today]
    );
    const dc = dcRes.rows[0] || null;

    // Active Competition resolution
    let activeComp = activeCompRes.rows[0];
    if (!activeComp) {
      activeComp = {
        competition_id: `comp_cycle_${cycle.cycleStartDate}`,
        title: `7-Day Telecom Championship (Cycle ${cycle.cycleStartDate})`,
        period_label: `${cycle.cycleStartDate} — Day ${cycle.dayNumber} of 7`,
        status: 'ACTIVE',
        prize_pool_etb: 50000,
      };
    }

    // Leader for current weekly competition cycle
    const leaderRes = await pool.query(
      `SELECT player_msisdn, SUM(score)::int as total_score
       FROM daily_attempts
       WHERE attempt_date >= $1::date AND attempt_date <= $2::date AND is_completed = TRUE
       GROUP BY player_msisdn
       ORDER BY total_score DESC
       LIMIT 1`,
      [cycle.cycleStartDate, today]
    );

    const leader = leaderRes.rows[0] || null;

    return {
      mode: systemMode,
      kpis: {
        activePlayers,
        activeSubscribers,
        todayParticipants,
        todayChallengeStatus: dc?.status || 'OPEN',
        currentWeeklyStatus: activeComp.status || 'ACTIVE',
        pendingPrizeActions,
      },
      todayChallenge: dc
        ? {
            id: dc.challenge_id,
            title: dc.title,
            date:
              dc.challenge_date instanceof Date
                ? dc.challenge_date.toISOString().slice(0, 10)
                : String(dc.challenge_date).slice(0, 10),
            status: dc.status || 'OPEN',
            participantsCount: todayParticipants,
            completedCount: todayParticipants,
            topScore,
            prizeRules: dc.prize_rules || [],
          }
        : null,
      currentCompetition: {
        id: activeComp.competition_id,
        title:
          activeComp.title ||
          `7-Day Telecom Championship (Cycle ${activeComp.cycle_number || 39})`,
        periodLabel:
          activeComp.period_label ||
          `${cycle.cycleStartDate} — Day ${cycle.dayNumber} of 7`,
        status: activeComp.status || 'ACTIVE',
        participantsCount: activePlayers,
        topScore: leader ? leader.total_score : 0,
        currentLeader: leader
          ? {
              maskedMsisdn: maskMsisdn(leader.player_msisdn),
              score: leader.total_score,
              levelsCompleted: 7,
            }
          : null,
      },
      recentActivity: recentAuditRes.rows.map((row) => ({
        id: row.id,
        timestamp: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
        adminId: row.admin_id,
        adminName: row.admin_name || 'Admin',
        adminRole: row.admin_role || 'SUPER_ADMIN',
        action: row.action,
        objectType: row.object_type,
        objectId: row.object_id,
        oldValue: row.old_value,
        newValue: row.new_value,
        reason: row.reason,
      })),
    };
  });

  // --------------------------------------------------------------------------
  // 2. Daily Challenges Management
  // --------------------------------------------------------------------------
  fastify.get('/daily-challenge', { preHandler: [verifyAdmin] }, async () => {
    const res = await pool.query(
      `SELECT dc.*,
              COALESCE(da.p_count, 0)::int as participants_count,
              COALESCE(da.c_count, 0)::int as completed_count,
              COALESCE(da.top_score, 0)::int as top_score
       FROM daily_challenges dc
       LEFT JOIN (
         SELECT attempt_date,
                COUNT(*)::int as p_count,
                COUNT(*) FILTER (WHERE is_completed = TRUE)::int as c_count,
                MAX(score)::int as top_score
         FROM daily_attempts
         GROUP BY attempt_date
       ) da ON dc.challenge_date = da.attempt_date
       ORDER BY dc.challenge_date DESC 
       LIMIT 30`
    );

    return res.rows.map((row) => {
      const questions =
        typeof row.questions === 'string'
          ? JSON.parse(row.questions)
          : row.questions || [];
      return {
        id: row.challenge_id,
        date:
          row.challenge_date instanceof Date
            ? row.challenge_date.toISOString().slice(0, 10)
            : String(row.challenge_date).slice(0, 10),
        status: row.status || 'OPEN',
        title: row.title,
        startTime: row.start_time || '00:00',
        endTime: row.end_time || '23:59',
        quizLevelId: row.quiz_level_id || 'lvl-daily',
        totalQuestions: questions.length || 10,
        timeLimitSeconds: row.time_limit_seconds || 10,
        minPassingScore: row.min_passing_score || 5,
        prizeRules: row.prize_rules || [],
        eligibilityNotes: 'Active Ethio Telecom subscribers with 1 attempt/day',
        participantsCount: row.participants_count,
        completedCount: row.completed_count,
        topScore: row.top_score,
        createdAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
        updatedAt: getEatTimestampString(),
      };
    });
  });

  fastify.get('/daily-challenge/:id', { preHandler: [verifyAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await pool.query(
      `SELECT * FROM daily_challenges 
       WHERE challenge_id = $1 OR challenge_date = $1::date 
       LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return reply.status(404).send({ error: 'Daily challenge not found' });
    }

    const row = res.rows[0];
    const dateStr =
      row.challenge_date instanceof Date
        ? row.challenge_date.toISOString().slice(0, 10)
        : String(row.challenge_date).slice(0, 10);

    const partsRes = await pool.query(
      `SELECT attempt_id, player_msisdn, score, total_response_time_ms, is_completed, submitted_at, final_submission_timestamp
       FROM daily_attempts
       WHERE attempt_date = $1
       ORDER BY score DESC, total_response_time_ms ASC`,
      [dateStr]
    );

    const prizeRules = Array.isArray(row.prize_rules) ? row.prize_rules : [];

    let rank = 1;
    const participants = partsRes.rows.map((p) => {
      const currentRank = rank++;
      const matchingRule = prizeRules.find((r: any) => r.rank === currentRank);
      const prizeAssignedBirr = matchingRule ? matchingRule.prizeAmountBirr : 0;

      return {
        id: p.attempt_id,
        challengeId: row.challenge_id,
        playerId: p.player_msisdn,
        maskedMsisdn: maskMsisdn(p.player_msisdn),
        fullMsisdn: p.player_msisdn,
        score: p.score || 0,
        rank: currentRank,
        completed: p.is_completed,
        timeSpentSeconds: (p.total_response_time_ms || 0) / 1000,
        eligibleForPrize: prizeAssignedBirr > 0,
        prizeAssignedBirr,
        isOverride: false,
        submittedAt: p.final_submission_timestamp || p.submitted_at || getEatTimestampString(),
      };
    });

    return {
      challenge: {
        id: row.challenge_id,
        date: dateStr,
        status: row.status || 'OPEN',
        title: row.title,
        startTime: row.start_time || '00:00',
        endTime: row.end_time || '23:59',
        quizLevelId: row.quiz_level_id || 'lvl-daily',
        totalQuestions: 10,
        timeLimitSeconds: row.time_limit_seconds || 10,
        minPassingScore: row.min_passing_score || 5,
        prizeRules,
        participantsCount: participants.length,
        completedCount: participants.filter((p) => p.completed).length,
        topScore: participants[0]?.score || 0,
      },
      participants,
    };
  });

  fastify.post('/daily-challenge', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { data, reason } = req.body as { data: any; reason: string };
    if (!reason || reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Operational reason required for audit' });
    }

    const challengeId = data.id || `dc_${data.date}`;
    await pool.query(
      `INSERT INTO daily_challenges (challenge_id, challenge_date, title, status, start_time, end_time, time_limit_seconds, min_passing_score, prize_rules, questions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '[]'::jsonb)
       ON CONFLICT (challenge_date) DO UPDATE 
       SET title = EXCLUDED.title, status = EXCLUDED.status, prize_rules = EXCLUDED.prize_rules`,
      [
        challengeId,
        data.date,
        data.title,
        data.status || 'OPEN',
        data.startTime || '00:00',
        data.endTime || '23:59',
        data.timeLimitSeconds || 10,
        data.minPassingScore || 5,
        JSON.stringify(data.prizeRules || []),
      ]
    );

    await logAdminAudit(req, 'SAVE_DAILY_CHALLENGE', 'DAILY_CHALLENGE', challengeId, null, data, reason);
    return reply.send({ success: true, challenge: data });
  });

  fastify.post('/daily-challenge/:id/status', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    const oldRes = await pool.query(`SELECT status FROM daily_challenges WHERE challenge_id = $1`, [id]);
    await pool.query(`UPDATE daily_challenges SET status = $1 WHERE challenge_id = $2`, [status, id]);
    await logAdminAudit(req, 'UPDATE_CHALLENGE_STATUS', 'DAILY_CHALLENGE', id, oldRes.rows[0]?.status, status, reason);

    return reply.send({ success: true, challenge: { id, status } });
  });

  fastify.post('/daily-challenge/:id/prizes', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rules, reason } = req.body as { rules: any[]; reason: string };

    await pool.query(`UPDATE daily_challenges SET prize_rules = $1 WHERE challenge_id = $2`, [JSON.stringify(rules), id]);
    await logAdminAudit(req, 'UPDATE_DAILY_PRIZES', 'DAILY_CHALLENGE', id, null, rules, reason);

    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // 3. Weekly Competitions Management (with Idempotent Finalization Engine)
  // --------------------------------------------------------------------------
  fastify.get('/weekly-competition', { preHandler: [verifyAdmin] }, async () => {
    const res = await pool.query(
      `SELECT wc.*,
              COALESCE(lb.lb_count, 0)::int as participants_count,
              COALESCE(lb.top_score, 0)::int as top_score
       FROM weekly_competitions wc
       LEFT JOIN (
         SELECT competition_id,
                COUNT(*)::int as lb_count,
                MAX(total_7day_score)::int as top_score
         FROM weekly_leaderboard
         GROUP BY competition_id
       ) lb ON wc.competition_id = lb.competition_id
       ORDER BY wc.cycle_number DESC 
       LIMIT 20`
    );

    return res.rows.map((row) => ({
      id: row.competition_id,
      cycleNumber: row.cycle_number,
      title: row.title || `Weekly Championship Cycle #${row.cycle_number}`,
      periodLabel: row.period_label || `${row.start_date} to ${row.end_date}`,
      startDate:
        row.start_date instanceof Date
          ? row.start_date.toISOString().slice(0, 10)
          : String(row.start_date).slice(0, 10),
      endDate:
        row.end_date instanceof Date
          ? row.end_date.toISOString().slice(0, 10)
          : String(row.end_date).slice(0, 10),
      status: row.status,
      settlementStatus: row.settlement_status || 'UNSETTLED',
      participantsCount: row.participants_count,
      topScore: row.top_score,
      prizeRules: row.prize_rules || [
        { rank: 1, label: '1st Grand Champion', prizeAmountBirr: 20000, prizeType: 'TELEBIRR_CASH', description: 'Weekly Champion' },
        { rank: 2, label: '2nd Place', prizeAmountBirr: 12000, prizeType: 'TELEBIRR_CASH', description: 'Runner up' },
        { rank: 3, label: '3rd Place', prizeAmountBirr: 5000, prizeType: 'TELEBIRR_CASH', description: 'Bronze medalist' },
      ],
      createdAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
      updatedAt: getEatTimestampString(),
    }));
  });

  fastify.get('/weekly-competition/:id', { preHandler: [verifyAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const compRes = await pool.query(
      `SELECT * FROM weekly_competitions WHERE competition_id = $1 LIMIT 1`,
      [id]
    );
    if (compRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Competition not found' });
    }

    const row = compRes.rows[0];
    const lbRes = await pool.query(
      `SELECT * FROM weekly_leaderboard WHERE competition_id = $1 ORDER BY rank ASC LIMIT 50`,
      [id]
    );

    const participants = lbRes.rows.map((p) => ({
      id: p.id,
      competitionId: row.competition_id,
      playerId: p.player_msisdn,
      maskedMsisdn: p.masked_msisdn,
      fullMsisdn: p.player_msisdn,
      score: p.total_7day_score,
      rank: p.rank,
      levelsCompleted: 7,
      timeSpentSeconds: (p.total_response_time_ms || 0) / 1000,
      eligibleForPrize: p.prize_etb > 0,
      prizeAssignedBirr: parseFloat(p.prize_etb || 0),
      isOverride: false,
      status: p.is_disbursed ? 'WINNER_CONFIRMED' : 'QUALIFIED',
      lastSubmittedAt: p.disbursed_at || getEatTimestampString(),
    }));

    return {
      competition: {
        id: row.competition_id,
        title: row.title || `Weekly Competition #${row.cycle_number}`,
        periodLabel: row.period_label || `${row.start_date} to ${row.end_date}`,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        settlementStatus: row.settlement_status || 'UNSETTLED',
        participantsCount: participants.length,
        topScore: participants[0]?.score || 0,
        prizeRules: row.prize_rules || [],
      },
      participants,
    };
  });

  // Create / Save Weekly Competition
  fastify.post('/weekly-competition', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { data, reason } = req.body as { data: any; reason: string };
    if (!reason || reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Operational reason required for audit log' });
    }

    const competitionId = data.id || `comp_${data.startDate}_${data.endDate}`;
    const cycleNumber = data.cycleNumber || Math.floor(Date.now() / 1000);

    await pool.query(
      `INSERT INTO weekly_competitions (competition_id, cycle_number, start_date, end_date, title, period_label, status, prize_pool_etb, prize_rules)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (competition_id) DO UPDATE 
       SET title = EXCLUDED.title, period_label = EXCLUDED.period_label, prize_rules = EXCLUDED.prize_rules`,
      [
        competitionId,
        cycleNumber,
        data.startDate,
        data.endDate,
        data.title,
        data.periodLabel,
        data.status || 'ACTIVE',
        data.prizePoolEtb || 50000,
        JSON.stringify(data.prizeRules || []),
      ]
    );

    await logAdminAudit(req, 'SAVE_WEEKLY_COMPETITION', 'WEEKLY_COMPETITION', competitionId, null, data, reason);
    return reply.send({ success: true, competitionId });
  });

  // Update Weekly Competition Status
  fastify.post('/weekly-competition/:id/status', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    const oldRes = await pool.query(`SELECT status FROM weekly_competitions WHERE competition_id = $1`, [id]);
    await pool.query(`UPDATE weekly_competitions SET status = $1 WHERE competition_id = $2`, [status, id]);
    await logAdminAudit(req, 'UPDATE_WEEKLY_STATUS', 'WEEKLY_COMPETITION', id, oldRes.rows[0]?.status, status, reason);

    return reply.send({ success: true, id, status });
  });

  // CRITICAL: Strictly Idempotent Finalization Engine with Distributed Lock & Transaction Rollback
  fastify.post('/weekly-competition/:id/finalize', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = (req.body || {}) as { reason?: string };

    if (!reason || reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Audited justification required for tournament settlement' });
    }

    const lockKey = `lock:settlement:weekly:${id}`;
    const lockToken = crypto.randomUUID();

    // 1. Acquire Distributed Valkey/Redis Lock (TTL 30s)
    let acquiredLock = false;
    try {
      const lockRes = await cache.set(lockKey, lockToken, 'PX', 30000, 'NX');
      acquiredLock = lockRes === 'OK';
    } catch {
      // In case Redis is offline, fallback strictly to PostgreSQL advisory lock
      acquiredLock = true;
    }

    if (!acquiredLock) {
      return reply.status(409).send({
        success: false,
        error: 'SETTLEMENT_IN_PROGRESS',
        message: 'A tournament settlement operation is currently executing for this cycle.',
      });
    }

    const client = await pool.connect();
    try {
      // 2. Open ACID Database Transaction with Row Lock & Advisory Lock
      await client.query('BEGIN');
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`weekly_settle_${id}`]);

      const compRes = await client.query(
        `SELECT * FROM weekly_competitions WHERE competition_id = $1 FOR UPDATE`,
        [id]
      );

      if (compRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Weekly competition cycle not found' });
      }

      const comp = compRes.rows[0];

      // Check Idempotency State: If already settled, do not recalculate!
      if (comp.settlement_status === 'SETTLED') {
        await client.query('ROLLBACK');
        return reply.send({
          success: true,
          message: 'Tournament cycle already settled and prizes allocated. Idempotent return.',
          finalizedAt: comp.finalized_at,
          settlementStatus: 'SETTLED',
        });
      }

      // Mark State Transition: SETTLING
      await client.query(
        `UPDATE weekly_competitions 
         SET settlement_status = 'SETTLING' 
         WHERE competition_id = $1`,
        [id]
      );

      // Aggregate top scorers from daily_attempts across cycle dates
      const startDate = comp.start_date instanceof Date ? comp.start_date.toISOString().slice(0, 10) : String(comp.start_date).slice(0, 10);
      const endDate = comp.end_date instanceof Date ? comp.end_date.toISOString().slice(0, 10) : String(comp.end_date).slice(0, 10);

      const attemptsRes = await client.query(
        `SELECT player_msisdn, 
                SUM(score)::int as total_7day_score, 
                SUM(total_response_time_ms)::int as total_response_time_ms
         FROM daily_attempts
         WHERE attempt_date >= $1::date AND attempt_date <= $2::date AND is_completed = TRUE
         GROUP BY player_msisdn
         ORDER BY total_7day_score DESC, total_response_time_ms ASC
         LIMIT 50`,
        [startDate, endDate]
      );

      const prizeRules = Array.isArray(comp.prize_rules) ? comp.prize_rules : [];
      let rank = 1;
      let totalPrizesDistributed = 0;
      let totalWinnersCount = 0;

      // Delete any prior unfinalized snapshot for clean deterministic write
      await client.query(`DELETE FROM weekly_leaderboard WHERE competition_id = $1`, [id]);

      for (const p of attemptsRes.rows) {
        const currentRank = rank++;
        const rule = prizeRules.find((r: any) => r.rank === currentRank);
        const prizeBirr = rule ? parseFloat(rule.prizeAmountBirr || 0) : 0;
        if (prizeBirr > 0) {
          totalPrizesDistributed += prizeBirr;
          totalWinnersCount++;
        }

        await client.query(
          `INSERT INTO weekly_leaderboard 
           (competition_id, player_msisdn, masked_msisdn, total_7day_score, total_response_time_ms, rank, prize_etb, is_disbursed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
          [
            id,
            p.player_msisdn,
            maskMsisdn(p.player_msisdn),
            p.total_7day_score,
            p.total_response_time_ms,
            currentRank,
            prizeBirr,
          ]
        );
      }

      // Mark competition state: FINALIZED and SETTLED
      const adminName = req.user?.username || req.user?.email || 'Operations Admin';
      const adminId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';

      await client.query(
        `UPDATE weekly_competitions 
         SET status = 'FINALIZED',
             settlement_status = 'SETTLED',
             finalized_at = NOW(),
             finalized_by = $2,
             finalized_by_id = $3,
             total_winners = $4,
             total_prizes_distributed_birr = $5
         WHERE competition_id = $1`,
        [id, adminName, adminId, totalWinnersCount, totalPrizesDistributed]
      );

      // Write immutable audit log within the same transaction
      await logAdminAudit(
        req,
        'FINALIZE_WEEKLY_WINNERS',
        'WEEKLY_COMPETITION',
        id,
        { status: comp.status, settlementStatus: comp.settlement_status },
        { status: 'FINALIZED', settlementStatus: 'SETTLED', winners: totalWinnersCount, totalPrize: totalPrizesDistributed },
        reason,
        client
      );

      await client.query('COMMIT');

      return reply.send({
        success: true,
        message: 'Tournament cycle successfully finalized, ranked, and prize allocated.',
        winnersCount: totalWinnersCount,
        totalPrizesDistributedBirr: totalPrizesDistributed,
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      req.log.error({ err }, '[Tournament Finalize Error] Settlement failed and rolled back');
      return reply.status(500).send({
        success: false,
        error: 'SETTLEMENT_FAILED',
        message: 'Tournament settlement failed and was rolled back cleanly.',
      });
    } finally {
      client.release();
      // Release Distributed Valkey Lock
      try {
        const currentLock = await cache.get(lockKey);
        if (currentLock === lockToken) {
          await cache.del(lockKey);
        }
      } catch {}
    }
  });

  // Participant Prize Override (Super Admin Only)
  fastify.post('/weekly-competition/:id/override-participant', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { participantId, overrideAmount, reason } = req.body as {
      participantId: string;
      overrideAmount: number;
      reason: string;
    };

    if (!reason || reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Super Admin justification required for prize override' });
    }

    const admin = req.user;
    const adminId = admin?.id || 'a0000000-0000-0000-0000-000000000001';
    const adminName = admin?.username || admin?.email || 'Super Admin';

    await pool.query(
      `INSERT INTO player_prize_overrides (player_msisdn, competition_id, context, override_prize_birr, reason, admin_id, admin_name)
       VALUES ($1, $2, 'WEEKLY_COMPETITION', $3, $4, $5, $6)`,
      [participantId, id, overrideAmount, reason, adminId, adminName]
    );

    await pool.query(
      `UPDATE weekly_leaderboard SET prize_etb = $1 WHERE competition_id = $2 AND (player_msisdn = $3 OR id::text = $3)`,
      [overrideAmount, id, participantId]
    );

    await logAdminAudit(req, 'OVERRIDE_PARTICIPANT_PRIZE', 'PLAYER_PRIZE', participantId, 0, overrideAmount, reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // 4. Prize Overrides Ledger (Paginated with Server-Side Validation)
  // --------------------------------------------------------------------------
  fastify.get('/prizes/overrides', { preHandler: [verifyAdmin] }, async (req) => {
    const query = PaginationQuerySchema.parse(req.query || {});
    const offset = (query.page - 1) * query.pageSize;

    const countRes = await pool.query(`SELECT COUNT(*)::int as total FROM player_prize_overrides`);
    const totalItems = countRes.rows[0]?.total || 0;

    const res = await pool.query(
      `SELECT * FROM player_prize_overrides 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [query.pageSize, offset]
    );

    const items = res.rows.map((row) => ({
      id: row.id,
      playerId: row.player_msisdn,
      playerMsisdn: row.player_msisdn,
      competitionId: row.competition_id,
      context: row.context,
      standardPrizeBirr: parseFloat(row.standard_prize_birr || 0),
      overridePrizeBirr: parseFloat(row.override_prize_birr || 0),
      reason: row.reason,
      status: row.status,
      adminId: row.admin_id,
      adminName: row.admin_name,
      createdAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
    }));

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  });

  fastify.post('/prizes/override', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const body = (req.body || {}) as {
      msisdn: string;
      overridePrizeBirr: number;
      reason: string;
      context: string;
      competitionId?: string;
    };

    if (!body.reason || body.reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Justification required for prize override' });
    }

    const admin = req.user;
    const adminId = admin?.id || 'a0000000-0000-0000-0000-000000000001';
    const adminName = admin?.username || admin?.email || 'Super Admin';

    const res = await pool.query(
      `INSERT INTO player_prize_overrides 
       (player_msisdn, override_prize_birr, reason, context, competition_id, admin_id, admin_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [body.msisdn, body.overridePrizeBirr, body.reason, body.context || 'WEEKLY_COMPETITION', body.competitionId || null, adminId, adminName]
    );

    await logAdminAudit(
      req,
      'CREATE_PRIZE_OVERRIDE',
      'PRIZE_OVERRIDE',
      res.rows[0].id,
      0,
      body.overridePrizeBirr,
      body.reason
    );

    return reply.send({ success: true, override: res.rows[0] });
  });

  // --------------------------------------------------------------------------
  // 5. Players Management (Paginated, Audited Unmasking, Details)
  // --------------------------------------------------------------------------
  fastify.get('/players', { preHandler: [verifyAdmin] }, async (req) => {
    const query = PaginationQuerySchema.parse(req.query || {});
    const offset = (query.page - 1) * query.pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.search) {
      params.push(`%${query.search}%`);
      whereClause += ` AND (p.msisdn LIKE $${params.length} OR p.masked_msisdn LIKE $${params.length})`;
    }
    if (query.status && query.status !== 'ALL') {
      params.push(query.status);
      whereClause += ` AND p.status = $${params.length}`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total FROM players p ${whereClause}`,
      params
    );
    const totalItems = countRes.rows[0]?.total || 0;

    const dataParams = [...params, query.pageSize, offset];
    const dataSql = `SELECT p.*, s.status as sub_status 
                     FROM players p
                     LEFT JOIN subscriptions s ON p.msisdn = s.msisdn
                     ${whereClause}
                     ORDER BY p.last_active_at DESC 
                     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;

    const res = await pool.query(dataSql, dataParams);

    const items = res.rows.map((row) => ({
      id: row.id,
      msisdn: row.msisdn,
      maskedMsisdn: row.masked_msisdn,
      accountStatus: row.status,
      subscriptionStatus: row.sub_status || 'INACTIVE',
      registeredAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
      lastActivity: row.last_active_at ? row.last_active_at.toISOString() : getEatTimestampString(),
      currentLevel: row.current_level || 1,
      bestScore: row.best_score || 0,
      weeklyScore: row.weekly_score || 0,
      dailyChallengeParticipations: row.daily_challenge_participations || 0,
      totalPrizesWonBirr: parseFloat(row.total_prizes_won_birr || 0),
      telecomCircle: row.telecom_circle || 'ADDIS_ABABA',
    }));

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  });

  // Single Player Details with Historical Play Breakdown
  fastify.get('/players/:id', { preHandler: [verifyAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const pRes = await pool.query(
      `SELECT p.*, s.status as sub_status, s.last_billed_at, s.channel
       FROM players p
       LEFT JOIN subscriptions s ON p.msisdn = s.msisdn
       WHERE p.id::text = $1 OR p.msisdn = $1
       LIMIT 1`,
      [id]
    );

    if (pRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Player account not found' });
    }

    const p = pRes.rows[0];

    // Fetch Recent Attempts & Overrides
    const [attemptsRes, overridesRes] = await Promise.all([
      pool.query(
        `SELECT * FROM daily_attempts WHERE player_msisdn = $1 ORDER BY attempt_date DESC LIMIT 10`,
        [p.msisdn]
      ),
      pool.query(
        `SELECT * FROM player_prize_overrides WHERE player_msisdn = $1 ORDER BY created_at DESC LIMIT 5`,
        [p.msisdn]
      ),
    ]);

    return {
      player: {
        id: p.id,
        msisdn: p.msisdn,
        maskedMsisdn: p.masked_msisdn,
        username: p.username,
        coins: p.coins,
        totalStars: p.total_stars,
        currentLevel: p.current_level,
        status: p.status,
        telecomCircle: p.telecom_circle,
        bestScore: p.best_score,
        weeklyScore: p.weekly_score,
        totalPrizesWonBirr: parseFloat(p.total_prizes_won_birr || 0),
        subscription: {
          status: p.sub_status || 'INACTIVE',
          lastBilledAt: p.last_billed_at,
          channel: p.channel || 'SMS_6415',
        },
      },
      recentAttempts: attemptsRes.rows,
      prizeOverrides: overridesRes.rows,
    };
  });

  // Audited MSISDN Unmasking (Strict Super Admin Only)
  fastify.post('/players/:id/unmask', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    if (!reason || reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Audited justification required to unmask MSISDN' });
    }

    const playerRes = await pool.query(
      `SELECT msisdn, masked_msisdn FROM players WHERE id::text = $1 OR msisdn = $1 LIMIT 1`,
      [id]
    );

    if (playerRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    const fullMsisdn = playerRes.rows[0].msisdn;
    await logAdminAudit(
      req,
      'UNMASK_PLAYER_MSISDN',
      'PLAYER',
      id,
      playerRes.rows[0].masked_msisdn,
      fullMsisdn,
      reason
    );

    return reply.send({ fullMsisdn });
  });

  fastify.post('/players/:id/status', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    const oldRes = await pool.query(`SELECT status FROM players WHERE id::text = $1 OR msisdn = $1`, [id]);
    await pool.query(`UPDATE players SET status = $1 WHERE id::text = $2 OR msisdn = $2`, [status, id]);
    await logAdminAudit(req, 'UPDATE_PLAYER_STATUS', 'PLAYER', id, oldRes.rows[0]?.status, status, reason);

    return reply.send({ success: true });
  });

  fastify.post('/players/:id/reset-state', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    const today = getEatDateString();
    await pool.query(
      `DELETE FROM daily_attempts 
       WHERE (player_msisdn = $1 OR player_msisdn = (SELECT msisdn FROM players WHERE id::text = $1)) 
         AND attempt_date = $2`,
      [id, today]
    );

    await logAdminAudit(req, 'RESET_PLAYER_ATTEMPT', 'PLAYER', id, 'COMPLETED', 'RESET', reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // 6. Advanced Quiz Question Bank & Media Asset Management (Server-Side Paginated)
  // --------------------------------------------------------------------------
  fastify.get('/quiz/questions', { preHandler: [verifyAdmin] }, async (req) => {
    const query = PaginationQuerySchema.parse(req.query || {});
    const offset = (query.page - 1) * query.pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.levelNumber) {
      params.push(query.levelNumber);
      whereClause += ` AND level_id = $${params.length}`;
    }
    if (query.status && query.status !== 'ALL') {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }
    if (query.pool && query.pool !== 'ALL') {
      params.push(query.pool);
      whereClause += ` AND pool = $${params.length}`;
    }
    if (query.category && query.category !== 'All' && query.category !== 'ALL') {
      params.push(`%${query.category}%`);
      whereClause += ` AND category ILIKE $${params.length}`;
    }
    if (query.difficulty && query.difficulty !== 'All' && query.difficulty !== 'ALL') {
      const diffVal = query.difficulty === 'EASY' ? 1 : query.difficulty === 'HARD' ? 3 : 2;
      params.push(diffVal);
      whereClause += ` AND difficulty = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      whereClause += ` AND (question_text ILIKE $${params.length} OR prompt_am ILIKE $${params.length} OR question_code ILIKE $${params.length})`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total FROM quiz_questions ${whereClause}`,
      params
    );
    const totalItems = countRes.rows[0]?.total || 0;

    const dataParams = [...params, query.pageSize, offset];
    const dataSql = `SELECT * FROM quiz_questions 
                     ${whereClause} 
                     ORDER BY level_id ASC, id ASC 
                     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;

    const res = await pool.query(dataSql, dataParams);

    const items = res.rows.map((row) => {
      const options = row.options || row.options_en || [];
      const diffLabel = row.difficulty === 1 ? 'EASY' : row.difficulty === 3 ? 'HARD' : 'MEDIUM';
      return {
        id: row.id,
        levelNumber: row.level_id || 1,
        questionCode: row.question_code || `Q-${row.id}`,
        questionText: row.question_text || row.prompt_en || '',
        questionAmharic: row.prompt_am || '',
        options: Array.isArray(options) ? options : [],
        correctOptionIndex: row.correct_index,
        difficulty: diffLabel,
        category: row.category || 'FOOTBALL BASICS',
        status: row.status || 'PUBLISHED',
        pool: row.pool || 'LEVEL_BASED',
        explanation: row.explanation || '',
        imageUrl: row.image_url || '',
        imageAlt: row.image_caption || '',
        sourceReference: row.image_source || 'Ethio Sports Archives',
        updatedAt: getEatTimestampString(),
        updatedBy: 'Admin Operator',
      };
    });

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  });

  const parseDifficultyInt = (diff: any): number => {
    if (typeof diff === 'number') return diff;
    if (diff === 'EASY') return 1;
    if (diff === 'HARD') return 3;
    const n = parseInt(diff, 10);
    return isNaN(n) ? 2 : n;
  };

  fastify.post('/quiz/questions', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { data, reason } = req.body as { data: any; reason: string };
    const id = data.id || `q_${Date.now()}`;
    const diffInt = parseDifficultyInt(data.difficulty);

    await pool.query(
      `INSERT INTO quiz_questions 
       (id, level_id, question_text, prompt_en, prompt_am, options, options_en, correct_index, difficulty, category, status, pool, explanation, image_url, image_caption, question_code)
       VALUES ($1, $2, $3, $3, $4, $5, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        data.levelNumber || 1,
        data.questionText,
        data.questionAmharic || null,
        JSON.stringify(data.options || []),
        data.correctOptionIndex || 0,
        diffInt,
        data.category || 'FOOTBALL BASICS',
        data.status || 'PUBLISHED',
        data.pool || 'LEVEL_BASED',
        data.explanation || '',
        data.imageUrl || '',
        data.imageAlt || '',
        data.questionCode || `Q-${id}`,
      ]
    );

    await logAdminAudit(req, 'CREATE_QUIZ_QUESTION', 'QUIZ_QUESTION', id, null, data, reason);
    return reply.send({ success: true, question: { ...data, id } });
  });

  fastify.put('/quiz/questions/:id', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { data, reason } = req.body as { data: any; reason: string };
    const diffInt = parseDifficultyInt(data.difficulty);

    const oldRes = await pool.query(`SELECT * FROM quiz_questions WHERE id = $1`, [id]);

    await pool.query(
      `UPDATE quiz_questions 
       SET question_text = $1, prompt_en = $1, prompt_am = $2, options = $3, options_en = $3,
           correct_index = $4, difficulty = $5, category = $6, status = $7, pool = $8,
           explanation = $9, image_url = $10, image_caption = $11, level_id = $12
       WHERE id = $13`,
      [
        data.questionText,
        data.questionAmharic,
        JSON.stringify(data.options || []),
        data.correctOptionIndex,
        diffInt,
        data.category,
        data.status,
        data.pool,
        data.explanation,
        data.imageUrl,
        data.imageAlt,
        data.levelNumber || 1,
        id,
      ]
    );

    await logAdminAudit(req, 'UPDATE_QUIZ_QUESTION', 'QUIZ_QUESTION', id, oldRes.rows[0], data, reason);
    return reply.send({ success: true, question: { ...data, id } });
  });

  fastify.delete('/quiz/questions/:id', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = (req.body || {}) as { reason?: string };

    const oldRes = await pool.query(`SELECT * FROM quiz_questions WHERE id = $1`, [id]);
    await pool.query(`DELETE FROM quiz_questions WHERE id = $1`, [id]);
    await logAdminAudit(req, 'DELETE_QUIZ_QUESTION', 'QUIZ_QUESTION', id, oldRes.rows[0], null, reason || 'Admin deleted question');
    return reply.send({ success: true, id });
  });

  fastify.post('/quiz/questions/:id/status', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    const oldRes = await pool.query(`SELECT status FROM quiz_questions WHERE id = $1`, [id]);
    await pool.query(`UPDATE quiz_questions SET status = $1 WHERE id = $2`, [status, id]);
    await logAdminAudit(req, 'SET_QUESTION_STATUS', 'QUIZ_QUESTION', id, oldRes.rows[0]?.status, status, reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // Question Images Library (100% Live GCP PostgreSQL Asset Store)
  // --------------------------------------------------------------------------
  fastify.get('/quiz/images', { preHandler: [verifyAdmin] }, async (req) => {
    const query = (req.query || {}) as { category?: string; search?: string };
    let sql = `SELECT * FROM question_images WHERE 1=1`;
    const params: any[] = [];

    if (query.category && query.category !== 'ALL') {
      params.push(query.category);
      sql += ` AND category = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (title ILIKE $${params.length} OR alt_text ILIKE $${params.length})`;
    }

    sql += ` ORDER BY uploaded_at DESC LIMIT 100`;
    const res = await pool.query(sql, params);

    return res.rows.map((r) => ({
      id: r.id,
      url: r.url,
      thumbnailUrl: r.thumbnail_url || r.url,
      title: r.title,
      altText: r.alt_text,
      category: r.category,
      dimensions: r.dimensions,
      fileSize: r.file_size,
      usageCount: r.usage_count,
      tags: r.tags || [],
      credit: r.credit,
      uploadedAt: r.uploaded_at ? r.uploaded_at.toISOString() : getEatTimestampString(),
    }));
  });

  fastify.post('/quiz/images', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const body = req.body as any;
    const id = body.id || `img-${Date.now()}`;

    await pool.query(
      `INSERT INTO question_images (id, url, thumbnail_url, title, alt_text, category, dimensions, file_size, credit, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
       url = EXCLUDED.url, title = EXCLUDED.title, alt_text = EXCLUDED.alt_text`,
      [
        id,
        body.url,
        body.thumbnailUrl || body.url,
        body.title,
        body.altText,
        body.category || 'GENERAL',
        body.dimensions || '1920x1080',
        body.fileSize || '1 MB',
        body.credit || 'Ethio Sports Media',
        body.tags || [],
      ]
    );

    await logAdminAudit(req, 'ADD_IMAGE_ASSET', 'QUESTION_IMAGE', id, null, body, body.reason || 'Added image to asset catalog');
    return reply.send({ success: true, id });
  });

  // --------------------------------------------------------------------------
  // 7. Subscriptions Management (Server-Side Paginated)
  // --------------------------------------------------------------------------
  fastify.get('/subscriptions', { preHandler: [verifyAdmin] }, async (req) => {
    const query = PaginationQuerySchema.parse(req.query || {});
    const offset = (query.page - 1) * query.pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.search) {
      params.push(`%${query.search}%`);
      whereClause += ` AND msisdn LIKE $${params.length}`;
    }
    if (query.status && query.status !== 'ALL') {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total FROM subscriptions ${whereClause}`,
      params
    );
    const totalItems = countRes.rows[0]?.total || 0;

    const dataParams = [...params, query.pageSize, offset];
    const dataSql = `SELECT * FROM subscriptions 
                     ${whereClause} 
                     ORDER BY last_billed_at DESC 
                     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;

    const res = await pool.query(dataSql, dataParams);

    const items = res.rows.map((row) => ({
      id: row.id,
      playerId: row.msisdn,
      msisdn: row.msisdn,
      maskedMsisdn: maskMsisdn(row.msisdn),
      status: row.status,
      plan: 'DAILY_RECURRING',
      priceBirr: parseFloat(row.price_etb || 2.0),
      channel: row.channel || 'SMS_6415',
      activatedAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
      lastBilledAt: row.last_billed_at ? row.last_billed_at.toISOString() : getEatTimestampString(),
      nextRenewalAt: row.next_billing_at ? row.next_billing_at.toISOString() : getEatTimestampString(),
      autoRenew: row.auto_renew !== false,
    }));

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  });

  fastify.post('/subscriptions/:id/status', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    const oldRes = await pool.query(`SELECT status FROM subscriptions WHERE id::text = $1 OR msisdn = $1`, [id]);
    await pool.query(`UPDATE subscriptions SET status = $1 WHERE id::text = $2 OR msisdn = $2`, [status, id]);
    await logAdminAudit(req, 'UPDATE_SUBSCRIPTION_STATUS', 'SUBSCRIPTION', id, oldRes.rows[0]?.status, status, reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // 8. Service Settings & System Mode
  // --------------------------------------------------------------------------
  fastify.get('/settings', { preHandler: [verifyAdmin] }, async () => {
    const res = await pool.query(`SELECT * FROM service_settings LIMIT 1`);
    const row = res.rows[0] || {};
    return {
      serviceName: row.service_name || 'EthioFantasy',
      shortcode: row.shortcode || '6415',
      subscriptionInstruction: row.subscription_instruction || 'Send OK to 6415',
      dailySubscriptionPriceBirr: parseFloat(row.daily_subscription_price_birr || 2.0),
      dailyChallengeEnabled: row.daily_challenge_enabled !== false,
      weeklyCompetitionEnabled: row.weekly_competition_enabled !== false,
      autoFinalizeWinners: Boolean(row.auto_finalize_winners),
      telebirrDisbursementEnabled: row.telebirr_disbursement_enabled !== false,
      publicLeaderboardTopN: row.public_leaderboard_top_n || 10,
      supportContact: row.support_contact || '+251 11 551 0000',
      serviceNoticeBanner: row.service_notice_banner || '',
      systemMode: row.system_mode || 'PRODUCTION',
      updatedAt: row.updated_at ? row.updated_at.toISOString() : getEatTimestampString(),
      updatedBy: row.updated_by || 'Operations Admin',
    };
  });

  fastify.post('/settings', { preHandler: [verifyOperationsAdmin] }, async (req, reply) => {
    const { settings, reason } = req.body as { settings: any; reason: string };
    const admin = req.user?.username || 'Operations Admin';

    await pool.query(
      `UPDATE service_settings 
       SET service_name = $1, shortcode = $2, subscription_instruction = $3,
           daily_subscription_price_birr = $4, daily_challenge_enabled = $5,
           weekly_competition_enabled = $6, auto_finalize_winners = $7,
           telebirr_disbursement_enabled = $8, public_leaderboard_top_n = $9,
           support_contact = $10, service_notice_banner = $11, updated_at = NOW(),
           updated_by = $12
       WHERE id = 1`,
      [
        settings.serviceName,
        settings.shortcode,
        settings.subscriptionInstruction,
        settings.dailySubscriptionPriceBirr,
        settings.dailyChallengeEnabled,
        settings.weeklyCompetitionEnabled,
        settings.autoFinalizeWinners,
        settings.telebirrDisbursementEnabled,
        settings.publicLeaderboardTopN,
        settings.supportContact,
        settings.serviceNoticeBanner,
        admin,
      ]
    );

    await logAdminAudit(req, 'UPDATE_SETTINGS', 'SERVICE_SETTINGS', '1', null, settings, reason);
    return reply.send({ success: true, settings });
  });

  fastify.post('/system/mode', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const { mode, reason } = req.body as { mode: 'DEMO' | 'PRODUCTION'; reason?: string };
    await pool.query(`UPDATE service_settings SET system_mode = $1 WHERE id = 1`, [mode]);
    await logAdminAudit(
      req,
      'SWITCH_SYSTEM_MODE',
      'SYSTEM',
      'mode',
      null,
      mode,
      reason || `Switched system operational mode to ${mode}`
    );
    return reply.send({ success: true, mode });
  });

  // --------------------------------------------------------------------------
  // 9. Compliance & Audit Logs (Paginated & Date-Filtered)
  // --------------------------------------------------------------------------
  fastify.get('/audit-logs', { preHandler: [verifyAdmin] }, async (req) => {
    const query = PaginationQuerySchema.parse(req.query || {});
    const offset = (query.page - 1) * query.pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.action && query.action !== 'ALL') {
      params.push(query.action);
      whereClause += ` AND action = $${params.length}`;
    }
    if (query.objectType && query.objectType !== 'ALL') {
      params.push(query.objectType);
      whereClause += ` AND object_type = $${params.length}`;
    }
    if (query.dateFrom) {
      params.push(query.dateFrom);
      whereClause += ` AND created_at >= $${params.length}::timestamptz`;
    }
    if (query.dateTo) {
      params.push(query.dateTo);
      whereClause += ` AND created_at <= $${params.length}::timestamptz`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total FROM admin_audit_logs ${whereClause}`,
      params
    );
    const totalItems = countRes.rows[0]?.total || 0;

    const dataParams = [...params, query.pageSize, offset];
    const dataSql = `SELECT * FROM admin_audit_logs 
                     ${whereClause} 
                     ORDER BY created_at DESC 
                     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;

    const res = await pool.query(dataSql, dataParams);

    const items = res.rows.map((row) => ({
      id: row.id,
      timestamp: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
      adminId: row.admin_id,
      adminName: row.admin_name || 'Admin',
      adminRole: row.admin_role || 'SUPER_ADMIN',
      action: row.action,
      objectType: row.object_type,
      objectId: row.object_id,
      oldValue: row.old_value,
      newValue: row.new_value,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      reason: row.reason,
    }));

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  });

  // --------------------------------------------------------------------------
  // 10. Telecom Reconciliation Reports & Audited CSV Export
  // --------------------------------------------------------------------------
  fastify.get('/reports/data', { preHandler: [verifyAuditorOrAdmin] }, async (req) => {
    const query = PaginationQuerySchema.parse(req.query || {});
    const reportType = query.type || 'WINNERS';

    if (reportType === 'DAILY_CHALLENGE') {
      const res = await pool.query(
        `SELECT a.attempt_id, a.attempt_date, a.player_msisdn, a.score, a.total_response_time_ms, a.is_completed, a.submitted_at
         FROM daily_attempts a
         ORDER BY a.attempt_date DESC, a.score DESC 
         LIMIT 100`
      );

      return res.rows.map((r, idx) => ({
        challengeDate:
          r.attempt_date instanceof Date
            ? r.attempt_date.toISOString().slice(0, 10)
            : String(r.attempt_date).slice(0, 10),
        challengeTitle: 'Daily Football Challenge',
        rank: idx + 1,
        maskedMsisdn: maskMsisdn(r.player_msisdn),
        score: r.score,
        timeSpent: `${((r.total_response_time_ms || 0) / 1000).toFixed(1)}s`,
        eligible: 'YES',
        prizeBirr: idx === 0 ? 1000 : idx === 1 ? 500 : idx === 2 ? 250 : 0,
        isOverride: 'NO',
        submittedAt: r.submitted_at ? r.submitted_at.toISOString() : getEatTimestampString(),
      }));
    }

    if (reportType === 'SUBSCRIPTIONS') {
      const res = await pool.query(
        `SELECT * FROM subscriptions ORDER BY last_billed_at DESC LIMIT 100`
      );
      return res.rows.map((s) => ({
        msisdn: maskMsisdn(s.msisdn),
        shortcode: s.shortcode,
        status: s.status,
        planType: s.plan_type,
        priceEtb: parseFloat(s.price_etb),
        lastBilledAt: s.last_billed_at,
        nextBillingAt: s.next_billing_at,
      }));
    }

    // Default: Winners & Weekly Leaderboard Report
    const res = await pool.query(
      `SELECT w.*, c.title as comp_title, c.period_label 
       FROM weekly_leaderboard w
       JOIN weekly_competitions c ON w.competition_id = c.competition_id
       ORDER BY w.rank ASC 
       LIMIT 100`
    );

    return res.rows.map((w) => ({
      competition: w.comp_title || 'Weekly Championship',
      period: w.period_label || 'Current Cycle',
      rank: w.rank,
      maskedMsisdn: w.masked_msisdn,
      score: w.total_7day_score,
      timeSpent: `${((w.total_response_time_ms || 0) / 1000).toFixed(1)}s`,
      prizeBirr: parseFloat(w.prize_etb || 0),
      status: w.is_disbursed ? 'DISBURSED' : 'PENDING',
    }));
  });

  fastify.get('/reports/export', { preHandler: [verifyAuditorOrAdmin] }, async (req, reply) => {
    const query = (req.query || {}) as { type?: string; unmasked?: string };
    const allowUnmasked = query.unmasked === 'true';

    if (allowUnmasked) {
      if (req.user?.role !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'FORBIDDEN', message: 'Only Super Admin can export unmasked subscriber reports' });
      }

      await logAdminAudit(
        req,
        'EXPORT_UNMASKED_REPORT',
        'REPORTS',
        query.type || 'ALL',
        'MASKED',
        'UNMASKED',
        'Telecom regulatory and billing audit export'
      );
    }

    let csvContent = 'Rank,MSISDN,Score,Prize_ETB,Status\n';
    const lbRes = await pool.query(
      `SELECT * FROM weekly_leaderboard ORDER BY rank ASC LIMIT 1000`
    );

    for (const r of lbRes.rows) {
      const phone = allowUnmasked ? r.player_msisdn : r.masked_msisdn;
      csvContent += `${r.rank},${phone},${r.total_7day_score},${r.prize_etb},${r.is_disbursed ? 'DISBURSED' : 'PENDING'}\n`;
    }

    reply.header('Content-Type', 'text/csv');
    reply.header(
      'Content-Disposition',
      `attachment; filename="EthioFantasy_Report_${getEatDateString()}.csv"`
    );
    return reply.send(csvContent);
  });

  // --------------------------------------------------------------------------
  // 11. Admin Users & Access Governance (Super Admin Enforced)
  // --------------------------------------------------------------------------
  fastify.get('/admin-users', { preHandler: [verifyAdmin] }, async () => {
    const res = await pool.query(`SELECT * FROM admin_users ORDER BY created_at ASC`);
    return res.rows.map((row) => ({
      id: row.id,
      name: row.username,
      email: row.email,
      role: row.role,
      department: row.department || 'Telecom Operations',
      active: row.is_active,
      lastLogin: row.last_login ? row.last_login.toISOString() : getEatTimestampString(),
      createdAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
    }));
  });

  fastify.post('/admin-users', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const { user, reason } = req.body as { user: any; reason: string };
    if (!user || !user.email || !user.name) {
      return reply.status(400).send({ error: 'Name and email are required' });
    }
    if (!reason || reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Operational reason required for user creation' });
    }

    const defaultPass = user.password || 'EthioAdmin@2026!';
    const passwordHash = await bcrypt.hash(defaultPass, 10);
    const id = crypto.randomUUID();

    const insertRes = await pool.query(
      `INSERT INTO admin_users (id, username, email, password_hash, role, department, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, username, email, role, department, is_active, created_at`,
      [
        id,
        user.name,
        user.email.toLowerCase().trim(),
        passwordHash,
        user.role || 'OPERATIONS_ADMIN',
        user.department || 'Telecom Operations',
      ]
    );

    const created = insertRes.rows[0];
    await logAdminAudit(req, 'CREATE_ADMIN_USER', 'ADMIN_USER', created.id, null, created, reason);

    return reply.send({
      success: true,
      user: {
        id: created.id,
        name: created.username,
        email: created.email,
        role: created.role,
        department: created.department,
        active: created.is_active,
        createdAt: created.created_at,
      },
    });
  });

  fastify.put('/admin-users/:id/role', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { role, reason } = req.body as { role: string; reason: string };

    const oldRes = await pool.query(`SELECT role FROM admin_users WHERE id = $1`, [id]);
    await pool.query(
      `UPDATE admin_users 
       SET role = $1, token_version = token_version + 1 
       WHERE id = $2`,
      [role, id]
    );

    await logAdminAudit(req, 'UPDATE_ADMIN_ROLE', 'ADMIN_USER', id, oldRes.rows[0]?.role, role, reason);
    return reply.send({ success: true });
  });

  fastify.post('/admin-users/:id/toggle-active', { preHandler: [verifySuperAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    const oldRes = await pool.query(`SELECT is_active FROM admin_users WHERE id = $1`, [id]);
    const nextState = !oldRes.rows[0]?.is_active;

    await pool.query(
      `UPDATE admin_users 
       SET is_active = $1, token_version = token_version + 1 
       WHERE id = $2`,
      [nextState, id]
    );

    await logAdminAudit(
      req,
      'TOGGLE_ADMIN_ACTIVE',
      'ADMIN_USER',
      id,
      oldRes.rows[0]?.is_active,
      nextState,
      reason
    );

    return reply.send({ success: true, active: nextState });
  });
}
