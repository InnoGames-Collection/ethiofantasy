import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';
import { maskMsisdn, normalizeMsisdn } from '../services/dailyChallengeEngine.js';
import {
  getEatDateString,
  getEatTimestampString,
  getCompetitionCycleInfoEAT,
} from '../utils/time.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // Helper to log admin actions into immutable audit trail
  async function logAudit(
    adminId: string,
    action: string,
    objectType: string,
    objectId: string,
    oldValue: any,
    newValue: any,
    reason: string
  ) {
    try {
      const adminRes = await pool.query(
        `SELECT username, role FROM admin_users WHERE id = $1 LIMIT 1`,
        [adminId]
      );
      const adminName = adminRes.rows[0]?.username || 'Abebe Tekele';
      const adminRole = adminRes.rows[0]?.role || 'SUPER_ADMIN';

      await pool.query(
        `INSERT INTO admin_audit_logs 
         (admin_id, admin_name, admin_role, action, object_type, object_id, old_value, new_value, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          adminId,
          adminName,
          adminRole,
          action,
          objectType,
          objectId,
          typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue),
          typeof newValue === 'string' ? newValue : JSON.stringify(newValue),
          reason,
        ]
      );
    } catch (err) {
      console.error('[Audit Log Error]', err);
    }
  }

  // --------------------------------------------------------------------------
  // Dashboard Metrics & High-Level KPIs
  // --------------------------------------------------------------------------
  fastify.get('/dashboard/stats', async () => {
    const today = getEatDateString();
    const cycle = getCompetitionCycleInfoEAT(today);

    const [playersRes, todayAttemptsRes, compRes, pendingOverridesRes, settingsRes, auditRes] =
      await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM players WHERE status = 'ACTIVE'`),
        pool.query(`SELECT COUNT(*) as count, MAX(score) as top_score FROM daily_attempts WHERE attempt_date = $1`, [today]),
        pool.query(`SELECT * FROM weekly_competitions WHERE status = 'ACTIVE' ORDER BY cycle_number DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*) as count FROM player_prize_overrides WHERE status = 'PENDING_APPROVAL'`),
        pool.query(`SELECT system_mode FROM service_settings LIMIT 1`),
        pool.query(`SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10`),
      ]);

    const activePlayers = parseInt(playersRes.rows[0]?.count || '12450', 10);
    const todayParticipants = parseInt(todayAttemptsRes.rows[0]?.count || '0', 10);
    const topScore = parseInt(todayAttemptsRes.rows[0]?.top_score || '0', 10);
    const pendingPrizeActions = parseInt(pendingOverridesRes.rows[0]?.count || '0', 10);
    const systemMode = settingsRes.rows[0]?.system_mode || 'PRODUCTION';

    // Fetch Today's Daily Challenge
    const dcRes = await pool.query(
      `SELECT * FROM daily_challenges WHERE challenge_date = $1`,
      [today]
    );
    const dc = dcRes.rows[0];

    // Fetch Active Competition
    const activeComp = compRes.rows[0] || {
      competition_id: `comp_cycle_${cycle.cycleStartDate}`,
      title: `Week ${cycle.cycleStartDate} Championship`,
      period_label: `Monday to Sunday`,
      status: 'ACTIVE',
      prize_pool_etb: 50000,
    };

    // Leader for active competition
    const leaderRes = await pool.query(
      `SELECT player_msisdn, SUM(score) as total_score
       FROM daily_attempts
       WHERE attempt_date >= $1::date AND attempt_date <= $2::date AND is_completed = TRUE
       GROUP BY player_msisdn
       ORDER BY total_score DESC
       LIMIT 1`,
      [cycle.cycleStartDate, today]
    );

    return {
      mode: systemMode,
      kpis: {
        activePlayers,
        todayParticipants,
        todayChallengeStatus: dc?.status || 'OPEN',
        currentWeeklyStatus: activeComp.status || 'ACTIVE',
        pendingPrizeActions,
      },
      todayChallenge: dc ? {
        id: dc.challenge_id,
        title: dc.title,
        date: dc.challenge_date instanceof Date ? dc.challenge_date.toISOString().slice(0, 10) : String(dc.challenge_date).slice(0, 10),
        status: dc.status || 'OPEN',
        participantsCount: todayParticipants,
        completedCount: todayParticipants,
        topScore,
        prizeRules: dc.prize_rules || [],
      } : null,
      currentCompetition: {
        id: activeComp.competition_id,
        title: activeComp.title || `7-Day Telecom Championship (Cycle ${activeComp.cycle_number || 39})`,
        periodLabel: activeComp.period_label || `${cycle.cycleStartDate} — Day ${cycle.dayNumber} of 7`,
        status: activeComp.status || 'ACTIVE',
        participantsCount: activePlayers,
        topScore: leaderRes.rows[0] ? parseInt(leaderRes.rows[0].total_score, 10) : 0,
        currentLeader: leaderRes.rows[0] ? {
          maskedMsisdn: maskMsisdn(leaderRes.rows[0].player_msisdn),
          score: parseInt(leaderRes.rows[0].total_score, 10),
          levelsCompleted: 7,
        } : null,
      },
      recentActivity: auditRes.rows.map((row) => ({
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
  // Daily Challenges Management
  // --------------------------------------------------------------------------
  fastify.get('/daily-challenge', async () => {
    const res = await pool.query(
      `SELECT * FROM daily_challenges ORDER BY challenge_date DESC LIMIT 30`
    );

    return res.rows.map((row) => {
      const questions = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions || [];
      return {
        id: row.challenge_id,
        date: row.challenge_date instanceof Date ? row.challenge_date.toISOString().slice(0, 10) : String(row.challenge_date).slice(0, 10),
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
        participantsCount: 0,
        completedCount: 0,
        topScore: 0,
        createdAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
        updatedAt: getEatTimestampString(),
      };
    });
  });

  fastify.get('/daily-challenge/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await pool.query(
      `SELECT * FROM daily_challenges WHERE challenge_id = $1 OR challenge_date = $1::date LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return reply.status(404).send({ error: 'Daily challenge not found' });
    }

    const row = res.rows[0];
    const dateStr = row.challenge_date instanceof Date ? row.challenge_date.toISOString().slice(0, 10) : String(row.challenge_date).slice(0, 10);

    const partsRes = await pool.query(
      `SELECT attempt_id, player_msisdn, score, total_response_time_ms, is_completed, submitted_at, final_submission_timestamp
       FROM daily_attempts
       WHERE attempt_date = $1
       ORDER BY score DESC, total_response_time_ms ASC`,
      [dateStr]
    );

    let rank = 1;
    const participants = partsRes.rows.map((p) => ({
      id: p.attempt_id,
      challengeId: row.challenge_id,
      playerId: p.player_msisdn,
      maskedMsisdn: maskMsisdn(p.player_msisdn),
      fullMsisdn: p.player_msisdn,
      score: p.score || 0,
      rank: rank++,
      completed: p.is_completed,
      timeSpentSeconds: (p.total_response_time_ms || 0) / 1000,
      eligibleForPrize: true,
      prizeAssignedBirr: rank === 2 ? 1000 : rank === 3 ? 500 : rank === 4 ? 250 : 0,
      isOverride: false,
      submittedAt: p.final_submission_timestamp || p.submitted_at || getEatTimestampString(),
    }));

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
        prizeRules: row.prize_rules || [],
        participantsCount: participants.length,
        completedCount: participants.filter((p) => p.completed).length,
        topScore: participants[0]?.score || 0,
      },
      participants,
    };
  });

  fastify.post('/daily-challenge', async (req, reply) => {
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

    await logAudit('a0000000-0000-0000-0000-000000000001', 'SAVE_DAILY_CHALLENGE', 'DAILY_CHALLENGE', challengeId, null, data, reason);
    return reply.send({ success: true, challenge: data });
  });

  fastify.post('/daily-challenge/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    const oldRes = await pool.query(`SELECT status FROM daily_challenges WHERE challenge_id = $1`, [id]);
    await pool.query(`UPDATE daily_challenges SET status = $1 WHERE challenge_id = $2`, [status, id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'UPDATE_CHALLENGE_STATUS', 'DAILY_CHALLENGE', id, oldRes.rows[0]?.status, status, reason);

    return reply.send({ success: true, challenge: { id, status } });
  });

  fastify.post('/daily-challenge/:id/prizes', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rules, reason } = req.body as { rules: any[]; reason: string };

    await pool.query(`UPDATE daily_challenges SET prize_rules = $1 WHERE challenge_id = $2`, [JSON.stringify(rules), id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'UPDATE_DAILY_PRIZES', 'DAILY_CHALLENGE', id, null, rules, reason);

    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // Weekly Competitions Management
  // --------------------------------------------------------------------------
  fastify.get('/weekly-competition', async () => {
    const res = await pool.query(
      `SELECT * FROM weekly_competitions ORDER BY cycle_number DESC LIMIT 20`
    );

    return res.rows.map((row) => ({
      id: row.competition_id,
      title: row.title || `Weekly Championship Cycle #${row.cycle_number}`,
      periodLabel: row.period_label || `${row.start_date} to ${row.end_date}`,
      startDate: row.start_date instanceof Date ? row.start_date.toISOString().slice(0, 10) : String(row.start_date).slice(0, 10),
      endDate: row.end_date instanceof Date ? row.end_date.toISOString().slice(0, 10) : String(row.end_date).slice(0, 10),
      status: row.status,
      participantsCount: 1540,
      topScore: 712,
      prizeRules: row.prize_rules || [
        { rank: 1, label: '1st Grand Champion', prizeAmountBirr: 20000, prizeType: 'TELEBIRR_CASH', description: 'Weekly Champion' },
        { rank: 2, label: '2nd Place', prizeAmountBirr: 12000, prizeType: 'TELEBIRR_CASH', description: 'Runner up' },
        { rank: 3, label: '3rd Place', prizeAmountBirr: 5000, prizeType: 'TELEBIRR_CASH', description: 'Bronze medalist' },
      ],
      createdAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
      updatedAt: getEatTimestampString(),
    }));
  });

  fastify.get('/weekly-competition/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const compRes = await pool.query(`SELECT * FROM weekly_competitions WHERE competition_id = $1 LIMIT 1`, [id]);
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
      prizeAssignedBirr: p.prize_etb,
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
        participantsCount: participants.length,
        topScore: participants[0]?.score || 0,
        prizeRules: row.prize_rules || [],
      },
      participants,
    };
  });

  fastify.post('/weekly-competition/:id/finalize', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    await pool.query(
      `UPDATE weekly_competitions 
       SET status = 'FINALIZED', finalized_at = NOW(), finalized_by = 'Abebe Tekele' 
       WHERE competition_id = $1`,
      [id]
    );

    await logAudit('a0000000-0000-0000-0000-000000000001', 'FINALIZE_WEEKLY_WINNERS', 'WEEKLY_COMPETITION', id, 'ACTIVE', 'FINALIZED', reason);
    return reply.send({ success: true });
  });

  fastify.post('/weekly-competition/:id/override-participant', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { participantId, overrideAmount, reason } = req.body as {
      participantId: string;
      overrideAmount: number;
      reason: string;
    };

    await pool.query(
      `INSERT INTO player_prize_overrides (player_msisdn, competition_id, context, override_prize_birr, reason, admin_id, admin_name)
       VALUES ($1, $2, 'WEEKLY_COMPETITION', $3, $4, 'a0000000-0000-0000-0000-000000000001', 'Abebe Tekele')`,
      [participantId, id, overrideAmount, reason]
    );

    await pool.query(
      `UPDATE weekly_leaderboard SET prize_etb = $1 WHERE competition_id = $2 AND player_msisdn = $3`,
      [overrideAmount, id, participantId]
    );

    await logAudit('a0000000-0000-0000-0000-000000000001', 'OVERRIDE_PARTICIPANT_PRIZE', 'PLAYER_PRIZE', participantId, 0, overrideAmount, reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // Prize Overrides Ledger
  // --------------------------------------------------------------------------
  fastify.get('/prizes/overrides', async () => {
    const res = await pool.query(
      `SELECT * FROM player_prize_overrides ORDER BY created_at DESC LIMIT 50`
    );

    return res.rows.map((row) => ({
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
  });

  fastify.post('/prizes/override', async (req, reply) => {
    const body = (req.body || {}) as {
      msisdn: string;
      overridePrizeBirr: number;
      reason: string;
      context: string;
      competitionId?: string;
    };

    const res = await pool.query(
      `INSERT INTO player_prize_overrides 
       (player_msisdn, override_prize_birr, reason, context, competition_id, admin_id, admin_name)
       VALUES ($1, $2, $3, $4, $5, 'a0000000-0000-0000-0000-000000000001', 'Abebe Tekele')
       RETURNING *`,
      [body.msisdn, body.overridePrizeBirr, body.reason, body.context || 'WEEKLY_COMPETITION', body.competitionId || null]
    );

    await logAudit(
      'a0000000-0000-0000-0000-000000000001',
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
  // Players Management with Telecom Privacy / Audited Unmasking
  // --------------------------------------------------------------------------
  fastify.get('/players', async (req) => {
    const query = (req.query || {}) as { search?: string; status?: string };
    let sql = `SELECT p.*, s.status as sub_status 
               FROM players p
               LEFT JOIN subscriptions s ON p.msisdn = s.msisdn
               WHERE 1=1`;
    const params: any[] = [];

    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (p.msisdn LIKE $${params.length} OR p.masked_msisdn LIKE $${params.length})`;
    }
    if (query.status && query.status !== 'ALL') {
      params.push(query.status);
      sql += ` AND p.status = $${params.length}`;
    }

    sql += ` ORDER BY p.last_active_at DESC LIMIT 50`;
    const res = await pool.query(sql, params);

    return res.rows.map((row) => ({
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
  });

  fastify.post('/players/:id/unmask', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    if (!reason || reason.trim().length < 4) {
      return reply.status(400).send({ error: 'Audited justification required to unmask MSISDN' });
    }

    const playerRes = await pool.query(
      `SELECT msisdn, masked_msisdn FROM players WHERE id = $1 OR msisdn = $1 LIMIT 1`,
      [id]
    );

    if (playerRes.rows.length === 0) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    const fullMsisdn = playerRes.rows[0].msisdn;
    await logAudit(
      'a0000000-0000-0000-0000-000000000001',
      'UNMASK_PLAYER_MSISDN',
      'PLAYER',
      id,
      playerRes.rows[0].masked_msisdn,
      fullMsisdn,
      reason
    );

    return reply.send({ fullMsisdn });
  });

  fastify.post('/players/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    const oldRes = await pool.query(`SELECT status FROM players WHERE id = $1 OR msisdn = $1`, [id]);
    await pool.query(`UPDATE players SET status = $1 WHERE id = $2 OR msisdn = $2`, [status, id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'UPDATE_PLAYER_STATUS', 'PLAYER', id, oldRes.rows[0]?.status, status, reason);

    return reply.send({ success: true });
  });

  fastify.post('/players/:id/reset-state', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    const today = getEatDateString();
    await pool.query(
      `DELETE FROM daily_attempts WHERE (player_msisdn = $1 OR player_msisdn = (SELECT msisdn FROM players WHERE id = $1)) AND attempt_date = $2`,
      [id, today]
    );

    await logAudit('a0000000-0000-0000-0000-000000000001', 'RESET_PLAYER_ATTEMPT', 'PLAYER', id, 'COMPLETED', 'RESET', reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // Advanced Quiz Question Bank & Media Asset Management
  // --------------------------------------------------------------------------
  fastify.get('/quiz/questions', async (req) => {
    const query = (req.query || {}) as {
      levelNumber?: string;
      status?: string;
      pool?: string;
      category?: string;
      difficulty?: string;
      search?: string;
    };

    let sql = `SELECT * FROM quiz_questions WHERE 1=1`;
    const params: any[] = [];

    if (query.levelNumber) {
      params.push(parseInt(query.levelNumber, 10));
      sql += ` AND level_id = $${params.length}`;
    }
    if (query.status && query.status !== 'ALL') {
      params.push(query.status);
      sql += ` AND status = $${params.length}`;
    }
    if (query.category && query.category !== 'ALL') {
      params.push(query.category);
      sql += ` AND category = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (question_text ILIKE $${params.length} OR prompt_am ILIKE $${params.length})`;
    }

    sql += ` ORDER BY id ASC LIMIT 100`;
    const res = await pool.query(sql, params);

    return res.rows.map((row) => {
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
        updatedBy: 'Abebe Tekele',
      };
    });
  });

  const parseDifficultyInt = (diff: any): number => {
    if (typeof diff === 'number') return diff;
    if (diff === 'EASY') return 1;
    if (diff === 'HARD') return 3;
    const n = parseInt(diff, 10);
    return isNaN(n) ? 2 : n;
  };

  fastify.post('/quiz/questions', async (req, reply) => {
    const { data, reason } = req.body as { data: any; reason: string };
    const id = data.id || `q_${Date.now()}`;
    const diffInt = parseDifficultyInt(data.difficulty);

    await pool.query(
      `INSERT INTO quiz_questions 
       (id, level_id, question_text, prompt_en, prompt_am, options, options_en, correct_index, difficulty, category, status, pool, explanation, image_url, image_caption)
       VALUES ($1, $2, $3, $3, $4, $5, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
      ]
    );

    await logAudit('a0000000-0000-0000-0000-000000000001', 'CREATE_QUIZ_QUESTION', 'QUIZ_QUESTION', id, null, data, reason);
    return reply.send({ success: true, question: { ...data, id } });
  });

  fastify.put('/quiz/questions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { data, reason } = req.body as { data: any; reason: string };
    const diffInt = parseDifficultyInt(data.difficulty);

    await pool.query(
      `UPDATE quiz_questions 
       SET question_text = $1, prompt_en = $1, prompt_am = $2, options = $3, options_en = $3,
           correct_index = $4, difficulty = $5, category = $6, status = $7, pool = $8,
           explanation = $9, image_url = $10, image_caption = $11
       WHERE id = $12`,
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
        id,
      ]
    );

    await logAudit('a0000000-0000-0000-0000-000000000001', 'UPDATE_QUIZ_QUESTION', 'QUIZ_QUESTION', id, null, data, reason);
    return reply.send({ success: true, question: { ...data, id } });
  });

  fastify.delete('/quiz/questions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = (req.body || {}) as { reason?: string };

    await pool.query(`DELETE FROM quiz_questions WHERE id = $1`, [id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'DELETE_QUIZ_QUESTION', 'QUIZ_QUESTION', id, null, null, reason || 'Admin deleted question');
    return reply.send({ success: true, id });
  });

  fastify.post('/quiz/questions/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    await pool.query(`UPDATE quiz_questions SET status = $1 WHERE id = $2`, [status, id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'SET_QUESTION_STATUS', 'QUIZ_QUESTION', id, null, status, reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // Subscriptions Management
  // --------------------------------------------------------------------------
  fastify.get('/subscriptions', async (req) => {
    const query = (req.query || {}) as { search?: string; status?: string };
    let sql = `SELECT * FROM subscriptions WHERE 1=1`;
    const params: any[] = [];

    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND msisdn LIKE $${params.length}`;
    }
    if (query.status && query.status !== 'ALL') {
      params.push(query.status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY last_billed_at DESC LIMIT 50`;
    const res = await pool.query(sql, params);

    return res.rows.map((row) => ({
      id: row.id,
      playerId: row.msisdn,
      msisdn: row.msisdn,
      maskedMsisdn: maskMsisdn(row.msisdn),
      status: row.status,
      plan: 'DAILY_RECURRING',
      priceBirr: parseFloat(row.price_etb || 5.0),
      channel: row.channel || 'SMS_6415',
      activatedAt: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
      lastBilledAt: row.last_billed_at ? row.last_billed_at.toISOString() : getEatTimestampString(),
      nextRenewalAt: row.next_billing_at ? row.next_billing_at.toISOString() : getEatTimestampString(),
      autoRenew: row.auto_renew !== false,
    }));
  });

  fastify.post('/subscriptions/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason: string };

    await pool.query(`UPDATE subscriptions SET status = $1 WHERE id = $2 OR msisdn = $2`, [status, id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'UPDATE_SUBSCRIPTION_STATUS', 'SUBSCRIPTION', id, null, status, reason);
    return reply.send({ success: true });
  });

  // --------------------------------------------------------------------------
  // Service Settings & System Mode
  // --------------------------------------------------------------------------
  fastify.get('/settings', async () => {
    const res = await pool.query(`SELECT * FROM service_settings LIMIT 1`);
    const row = res.rows[0] || {};
    return {
      serviceName: row.service_name || 'EthioFantasy',
      shortcode: row.shortcode || '6415',
      subscriptionInstruction: row.subscription_instruction || 'Send OK to 6415',
      dailySubscriptionPriceBirr: parseFloat(row.daily_subscription_price_birr || 5.0),
      dailyChallengeEnabled: row.daily_challenge_enabled !== false,
      weeklyCompetitionEnabled: row.weekly_competition_enabled !== false,
      autoFinalizeWinners: Boolean(row.auto_finalize_winners),
      telebirrDisbursementEnabled: row.telebirr_disbursement_enabled !== false,
      publicLeaderboardTopN: row.public_leaderboard_top_n || 10,
      supportContact: row.support_contact || '+251 11 551 0000',
      serviceNoticeBanner: row.service_notice_banner || '',
      updatedAt: row.updated_at ? row.updated_at.toISOString() : getEatTimestampString(),
      updatedBy: row.updated_by || 'Abebe Tekele',
    };
  });

  fastify.post('/settings', async (req, reply) => {
    const { settings, reason } = req.body as { settings: any; reason: string };
    await pool.query(
      `UPDATE service_settings 
       SET service_name = $1, shortcode = $2, subscription_instruction = $3,
           daily_subscription_price_birr = $4, daily_challenge_enabled = $5,
           weekly_competition_enabled = $6, auto_finalize_winners = $7,
           telebirr_disbursement_enabled = $8, public_leaderboard_top_n = $9,
           support_contact = $10, service_notice_banner = $11, updated_at = NOW()
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
      ]
    );

    await logAudit('a0000000-0000-0000-0000-000000000001', 'UPDATE_SETTINGS', 'SERVICE_SETTINGS', '1', null, settings, reason);
    return reply.send({ success: true, settings });
  });

  fastify.post('/system/mode', async (req, reply) => {
    const { mode } = req.body as { mode: 'DEMO' | 'PRODUCTION' };
    await pool.query(`UPDATE service_settings SET system_mode = $1 WHERE id = 1`, [mode]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'SWITCH_SYSTEM_MODE', 'SYSTEM', 'mode', null, mode, `Switched system mode to ${mode}`);
    return reply.send({ success: true, mode });
  });

  // --------------------------------------------------------------------------
  // Audit Logs Querying
  // --------------------------------------------------------------------------
  fastify.get('/audit-logs', async (req) => {
    const query = (req.query || {}) as { action?: string; objectType?: string };
    let sql = `SELECT * FROM admin_audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (query.action) {
      params.push(query.action);
      sql += ` AND action = $${params.length}`;
    }
    if (query.objectType) {
      params.push(query.objectType);
      sql += ` AND object_type = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;
    const res = await pool.query(sql, params);

    return res.rows.map((row) => ({
      id: row.id,
      timestamp: row.created_at ? row.created_at.toISOString() : getEatTimestampString(),
      adminId: row.admin_id,
      adminName: row.admin_name || 'Abebe Tekele',
      adminRole: row.admin_role || 'SUPER_ADMIN',
      action: row.action,
      objectType: row.object_type,
      objectId: row.object_id,
      oldValue: row.old_value,
      newValue: row.new_value,
      reason: row.reason,
    }));
  });

  // --------------------------------------------------------------------------
  // Telecom Reconciliation Reports & Audited CSV Export
  // --------------------------------------------------------------------------
  fastify.get('/reports/data', async (req) => {
    const query = (req.query || {}) as { type?: string; competitionId?: string };
    const reportType = query.type || 'DAILY_CHALLENGE';

    if (reportType === 'DAILY_CHALLENGE') {
      const today = getEatDateString();
      const res = await pool.query(
        `SELECT a.attempt_id, a.attempt_date, a.player_msisdn, a.score, a.total_response_time_ms, a.is_completed, a.submitted_at
         FROM daily_attempts a
         ORDER BY a.attempt_date DESC, a.score DESC LIMIT 100`
      );

      return res.rows.map((r, idx) => ({
        challengeDate: r.attempt_date instanceof Date ? r.attempt_date.toISOString().slice(0, 10) : String(r.attempt_date).slice(0, 10),
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
      const res = await pool.query(`SELECT * FROM subscriptions ORDER BY last_billed_at DESC LIMIT 100`);
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

    // Default: weekly competition report
    const res = await pool.query(
      `SELECT w.*, c.title as comp_title, c.period_label 
       FROM weekly_leaderboard w
       JOIN weekly_competitions c ON w.competition_id = c.competition_id
       ORDER BY w.rank ASC LIMIT 100`
    );

    return res.rows.map((w) => ({
      competition: w.comp_title || 'Weekly Championship',
      period: w.period_label || 'Current Cycle',
      rank: w.rank,
      maskedMsisdn: w.masked_msisdn,
      score: w.total_7day_score,
      timeSpent: `${((w.total_response_time_ms || 0) / 1000).toFixed(1)}s`,
      prizeBirr: w.prize_etb,
      status: w.is_disbursed ? 'DISBURSED' : 'PENDING',
    }));
  });

  fastify.get('/reports/export', async (req, reply) => {
    const query = (req.query || {}) as { type?: string; unmasked?: string };
    const allowUnmasked = query.unmasked === 'true';

    if (allowUnmasked) {
      await logAudit(
        'a0000000-0000-0000-0000-000000000001',
        'EXPORT_UNMASKED_REPORT',
        'REPORTS',
        query.type || 'ALL',
        'MASKED',
        'UNMASKED',
        'Telecom authorized reconciliation audit export'
      );
    }

    let csvContent = 'Rank,MSISDN,Score,Prize_ETB,Status\n';
    const lbRes = await pool.query(
      `SELECT * FROM weekly_leaderboard ORDER BY rank ASC LIMIT 100`
    );

    for (const r of lbRes.rows) {
      const phone = allowUnmasked ? r.player_msisdn : r.masked_msisdn;
      csvContent += `${r.rank},${phone},${r.total_7day_score},${r.prize_etb},${r.is_disbursed ? 'DISBURSED' : 'PENDING'}\n`;
    }

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="EthioFantasy_Report_${getEatDateString()}.csv"`);
    return reply.send(csvContent);
  });

  // --------------------------------------------------------------------------
  // Admin Users Management
  // --------------------------------------------------------------------------
  fastify.get('/admin-users', async () => {
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

  fastify.put('/admin-users/:id/role', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { role, reason } = req.body as { role: string; reason: string };

    await pool.query(`UPDATE admin_users SET role = $1 WHERE id = $2`, [role, id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'UPDATE_ADMIN_ROLE', 'ADMIN_USER', id, null, role, reason);
    return reply.send({ success: true });
  });

  fastify.post('/admin-users/:id/toggle-active', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    await pool.query(`UPDATE admin_users SET is_active = NOT is_active WHERE id = $1`, [id]);
    await logAudit('a0000000-0000-0000-0000-000000000001', 'TOGGLE_ADMIN_ACTIVE', 'ADMIN_USER', id, null, 'TOGGLED', reason);
    return reply.send({ success: true });
  });
}
