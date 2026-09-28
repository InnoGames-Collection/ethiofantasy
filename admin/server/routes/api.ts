import { Router, Request, Response } from 'express';
import { store } from '../data/store';
import { AdminRole } from '../types';

export const apiRouter = Router();

// Middleware: Role Check Helper
function requireRole(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: () => void) => {
    const currentAdmin = store.getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.active) {
      return res.status(401).json({ error: 'Unauthorized. Admin session is inactive.' });
    }
    if (!allowedRoles.includes(currentAdmin.role)) {
      return res.status(403).json({
        error: `Forbidden. Your role (${currentAdmin.role}) does not have permission for this operational action. Required: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

// --------------------------------------------------------------------------
// Auth & Identity
// --------------------------------------------------------------------------
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const admin = store.getCurrentAdmin();
  const allAdmins = store.getAdminUsers();
  res.json({
    currentAdmin: admin,
    availableAdmins: allAdmins,
  });
});

apiRouter.post('/auth/switch', (req: Request, res: Response) => {
  const { adminId } = req.body;
  const switched = store.setCurrentAdmin(adminId);
  if (!switched) {
    return res.status(404).json({ error: 'Admin user not found' });
  }
  res.json({ success: true, currentAdmin: switched });
});

// --------------------------------------------------------------------------
// Dashboard
// --------------------------------------------------------------------------
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  try {
    const stats = store.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------------------------------
// Daily Challenge
// --------------------------------------------------------------------------
apiRouter.get('/daily-challenge', (req: Request, res: Response) => {
  res.json(store.getDailyChallenges());
});

apiRouter.get('/daily-challenge/:id', (req: Request, res: Response) => {
  const data = store.getDailyChallenge(req.params.id);
  if (!data) return res.status(404).json({ error: 'Daily Challenge not found' });
  res.json(data);
});

apiRouter.post(
  '/daily-challenge',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { data, reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'An operational reason is required for audit recording.' });
      }
      const saved = store.createOrUpdateDailyChallenge(data, reason);
      res.json({ success: true, challenge: saved });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/daily-challenge/:id/status',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { status, reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'An operational reason is required for audit recording.' });
      }
      const updated = store.updateDailyChallengeStatus(req.params.id, status, reason);
      res.json({ success: true, challenge: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/daily-challenge/:id/prizes',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { rules, reason } = req.body;
      if (!Array.isArray(rules) || rules.length === 0) {
        return res.status(400).json({ error: 'Valid prize rank rules are required.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'An operational reason is required for audit recording.' });
      }
      const updated = store.updateDailyPrizeRules(req.params.id, rules, reason);
      res.json({ success: true, challenge: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Weekly Competition
// --------------------------------------------------------------------------
apiRouter.get('/weekly-competition', (req: Request, res: Response) => {
  res.json(store.getWeeklyCompetitions());
});

apiRouter.get('/weekly-competition/:id', (req: Request, res: Response) => {
  const data = store.getWeeklyCompetition(req.params.id);
  if (!data) return res.status(404).json({ error: 'Competition not found' });
  res.json(data);
});

apiRouter.post(
  '/weekly-competition',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { data, reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'An operational reason is required for audit recording.' });
      }
      const comp = store.createOrUpdateWeeklyCompetition(data, reason);
      res.json({ success: true, competition: comp });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/weekly-competition/:id/status',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { status, reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'An operational reason is required for audit recording.' });
      }
      const updated = store.updateWeeklyStatus(req.params.id, status, reason);
      res.json({ success: true, competition: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/weekly-competition/:id/finalize',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'An operational reason is required to finalize winners.' });
      }
      const finalized = store.finalizeWeeklyWinners(req.params.id, reason);
      res.json({ success: true, competition: finalized });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/weekly-competition/:id/override-participant',
  requireRole(['SUPER_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { participantId, overrideAmount, reason } = req.body;
      if (overrideAmount === undefined || isNaN(Number(overrideAmount))) {
        return res.status(400).json({ error: 'Valid override amount in ETB is required.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Reason for administrative prize override is required.' });
      }
      const part = store.overrideParticipantPrize(req.params.id, participantId, Number(overrideAmount), reason);
      res.json({ success: true, participant: part });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Individual Player Prize Overrides
// --------------------------------------------------------------------------
apiRouter.get('/prizes/overrides', (req: Request, res: Response) => {
  res.json(store.getPrizeOverrides());
});

apiRouter.post(
  '/prizes/override',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { msisdn, context, overridePrizeBirr, reason, competitionId, challengeId } = req.body;
      if (!msisdn) return res.status(400).json({ error: 'Player MSISDN is required.' });
      if (overridePrizeBirr === undefined || isNaN(Number(overridePrizeBirr))) {
        return res.status(400).json({ error: 'Valid override prize value in Birr is required.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Approval reason is required for administrative prize override.' });
      }
      const entry = store.createPlayerPrizeOverride({
        msisdn,
        context: context || 'SPECIAL_RECOGNITION',
        overridePrizeBirr: Number(overridePrizeBirr),
        reason,
        competitionId,
        challengeId,
      });
      res.json({ success: true, override: entry });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Players
// --------------------------------------------------------------------------
apiRouter.get('/players', (req: Request, res: Response) => {
  const { search, status } = req.query;
  const list = store.getPlayers(search as string, status as string);
  res.json(list);
});

apiRouter.get('/players/:id', (req: Request, res: Response) => {
  const details = store.getPlayerDetails(req.params.id);
  if (!details) return res.status(404).json({ error: 'Player not found' });
  res.json(details);
});

apiRouter.post(
  '/players/:id/status',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { status, reason } = req.body;
      if (!['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid player account status.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Operational reason is required for player status modification.' });
      }
      const player = store.updatePlayerStatus(req.params.id, status, reason);
      res.json({ success: true, player });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/players/:id/reset-state',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Operational reason is required to reset player service state.' });
      }
      const player = store.resetPlayerServiceState(req.params.id, reason);
      res.json({ success: true, player });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/players/:id/unmask',
  requireRole(['SUPER_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Audit reason required to view unmasked subscriber MSISDN.' });
      }
      const result = store.unmaskMsisdn(req.params.id, reason);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Quiz Levels & Questions
// --------------------------------------------------------------------------
apiRouter.get('/quiz/levels', (req: Request, res: Response) => {
  res.json(store.getQuizLevels());
});

apiRouter.get('/quiz/questions', (req: Request, res: Response) => {
  const { levelNumber, status } = req.query;
  const list = store.getQuizQuestions(
    levelNumber ? Number(levelNumber) : undefined,
    status as string
  );
  res.json(list);
});

apiRouter.post(
  '/quiz/questions',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { data, reason } = req.body;
      if (!data.questionText || data.questionText.trim().length < 5) {
        return res.status(400).json({ error: 'Question text is required.' });
      }
      const created = store.createQuizQuestion(data, reason || 'New question created in draft');
      res.json({ success: true, question: created });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.put(
  '/quiz/questions/:id',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { data, reason } = req.body;
      const updated = store.updateQuizQuestion(req.params.id, data, reason || 'Question content edited');
      res.json({ success: true, question: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/quiz/questions/:id/status',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { status, reason } = req.body;
      if (!['DRAFT', 'PUBLISHED', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ error: 'Invalid question status.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Operational confirmation reason is required to change question publish state.' });
      }
      const updated = store.setQuestionStatus(req.params.id, status, reason);
      res.json({ success: true, question: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Subscriptions
// --------------------------------------------------------------------------
apiRouter.get('/subscriptions', (req: Request, res: Response) => {
  const { search, status } = req.query;
  const list = store.getSubscriptions(search as string, status as string);
  res.json(list);
});

apiRouter.post(
  '/subscriptions/:id/status',
  requireRole(['SUPER_ADMIN', 'OPERATIONS_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { status, reason } = req.body;
      if (!['ACTIVE', 'INACTIVE', 'CANCELLED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Invalid subscription status.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Operational reason required for telecom subscription change.' });
      }
      const updated = store.updateSubscriptionStatus(req.params.id, status, reason);
      res.json({ success: true, subscription: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Reports & Export
// --------------------------------------------------------------------------
apiRouter.get('/reports/data', (req: Request, res: Response) => {
  const { type, dateFrom, dateTo, status, competitionId } = req.query;
  const db = store.getDatabase();

  let rows: any[] = [];
  let title = '';

  switch (type) {
    case 'DAILY_CHALLENGE':
      title = 'Daily Challenge Participation & Performance Report';
      rows = db.dailyParticipants.map((p) => {
        const chal = db.dailyChallenges.find((c) => c.id === p.challengeId);
        return {
          challengeDate: chal?.date || 'N/A',
          challengeTitle: chal?.title || 'Daily Challenge',
          rank: p.rank,
          maskedMsisdn: p.maskedMsisdn,
          score: p.score,
          timeSpent: `${p.timeSpentSeconds}s`,
          eligible: p.eligibleForPrize ? 'YES' : 'NO',
          prizeBirr: p.prizeAssignedBirr,
          isOverride: p.isOverride ? 'YES' : 'NO',
          submittedAt: p.submittedAt,
        };
      });
      break;

    case 'WEEKLY_COMPETITION':
      title = 'Weekly Competition Results Report';
      rows = db.weeklyParticipants
        .filter((w) => !competitionId || competitionId === 'ALL' || w.competitionId === competitionId)
        .map((p) => {
          const comp = db.weeklyCompetitions.find((c) => c.id === p.competitionId);
          return {
            competition: comp?.title || 'Weekly Competition',
            period: comp?.periodLabel || 'N/A',
            rank: p.rank,
            maskedMsisdn: p.maskedMsisdn,
            score: p.score,
            levelsCompleted: p.levelsCompleted,
            prizeBirr: p.prizeAssignedBirr,
            prizeType: p.prizeType || 'None',
            status: p.status,
            isOverride: p.isOverride ? 'YES' : 'NO',
          };
        });
      break;

    case 'WINNERS':
      title = 'Official Telecom Winners Finalized Report';
      rows = db.weeklyParticipants
        .filter((p) => p.status === 'WINNER_CONFIRMED' || p.prizeAssignedBirr > 0)
        .map((p) => {
          const comp = db.weeklyCompetitions.find((c) => c.id === p.competitionId);
          return {
            competition: comp?.title || '7-Day Championship',
            finalizedDate: comp?.finalizedAt || 'Pending Finalization',
            rank: p.rank,
            maskedMsisdn: p.maskedMsisdn,
            score: p.score,
            prizeBirr: `${p.prizeAssignedBirr} ETB`,
            disbursementMethod: p.prizeType || 'TELEBIRR_CASH',
            eligibilityStatus: 'VERIFIED_ACTIVE_SUBSCRIBER',
            isOverride: p.isOverride ? `YES (${p.overrideReason || 'Override'})` : 'STANDARD',
          };
        });
      break;

    case 'PRIZES':
      title = 'Prize Allocation & Override Audit Report';
      rows = db.playerPrizeOverrides.map((o) => {
        return {
          date: o.createdAt.split('T')[0],
          context: o.context,
          playerMsisdn: o.playerMsisdn,
          standardPrizeBirr: `${o.standardPrizeBirr} ETB`,
          overridePrizeBirr: `${o.overridePrizeBirr} ETB`,
          reason: o.reason,
          status: o.status,
          approvedBy: o.adminName,
          timestamp: o.createdAt,
        };
      });
      break;

    case 'PARTICIPATION':
      title = 'Player Activity & Participation Summary';
      rows = db.players.map((p) => {
        return {
          maskedMsisdn: p.maskedMsisdn,
          accountStatus: p.accountStatus,
          subscription: p.subscriptionStatus,
          currentLevel: p.currentLevel,
          bestScore: p.bestScore,
          weeklyScore: p.weeklyScore,
          dailyChallengesPlayed: p.dailyChallengeParticipations,
          totalPrizesWon: `${p.totalPrizesWonBirr} ETB`,
          region: p.telecomCircle,
          lastActivity: p.lastActivity,
        };
      });
      break;

    case 'SUBSCRIPTIONS':
      title = 'Ethio Telecom 9401 Subscription Status Report';
      rows = db.subscriptions.map((s) => {
        return {
          maskedMsisdn: s.maskedMsisdn,
          status: s.status,
          tariff: `${s.priceBirr} ETB/Day`,
          channel: s.channel,
          activatedAt: s.activatedAt,
          lastBilledAt: s.lastBilledAt,
          autoRenew: s.autoRenew ? 'TRUE' : 'FALSE',
          notes: s.failureReason || 'Active Billable',
        };
      });
      break;

    case 'LEADERBOARD':
      title = 'Authoritative Leaderboard Report';
      rows = db.weeklyParticipants
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({
          rank: idx + 1,
          maskedMsisdn: p.maskedMsisdn,
          score: p.score,
          levelsCompleted: p.levelsCompleted,
          timeSpent: `${p.timeSpentSeconds}s`,
          eligible: p.eligibleForPrize ? 'YES' : 'NO',
          prizeAssigned: `${p.prizeAssignedBirr} ETB`,
        }));
      break;

    case 'AUDIT':
    default:
      title = 'Administrative Actions & Compliance Audit Report';
      rows = db.auditLogs.map((a) => ({
        timestamp: a.timestamp,
        adminName: a.adminName,
        adminRole: a.adminRole,
        action: a.action,
        objectType: a.objectType,
        objectId: a.objectId,
        oldValue: a.oldValue,
        newValue: a.newValue,
        reason: a.reason,
      }));
      break;
  }

  res.json({
    title,
    count: rows.length,
    generatedAt: new Date().toISOString(),
    data: rows,
  });
});

// CSV Export route
apiRouter.get('/reports/export', (req: Request, res: Response) => {
  const { type, unmasked } = req.query;
  const currentAdmin = store.getCurrentAdmin();
  const allowFullMsisdn = unmasked === 'true' && currentAdmin.role === 'SUPER_ADMIN';

  // Audit if unmasked export requested
  if (unmasked === 'true' && currentAdmin.role === 'SUPER_ADMIN') {
    store.logAudit(
      'EXPORT_UNMASKED_REPORT',
      'MSISDN_UNMASK',
      type as string,
      'MASKED',
      'FULL_MSISDN',
      'Authorized Telecom internal report export'
    );
  }

  const db = store.getDatabase();
  let headers: string[] = [];
  let rows: string[][] = [];
  const filename = `EthioFantasy_${type || 'Report'}_${new Date().toISOString().split('T')[0]}.csv`;

  if (type === 'WINNERS') {
    headers = ['Competition', 'Rank', 'MSISDN', 'Score', 'Prize (ETB)', 'Disbursement Method', 'Status', 'Is Override', 'Override Reason'];
    const winners = db.weeklyParticipants.filter((p) => p.status === 'WINNER_CONFIRMED' || p.prizeAssignedBirr > 0);
    rows = winners.map((w) => {
      const comp = db.weeklyCompetitions.find((c) => c.id === w.competitionId);
      const msisdn = allowFullMsisdn ? w.fullMsisdn : w.maskedMsisdn;
      return [
        comp?.title || 'Weekly Competition',
        String(w.rank),
        msisdn,
        String(w.score),
        String(w.prizeAssignedBirr),
        w.prizeType || 'TELEBIRR_CASH',
        w.status,
        w.isOverride ? 'YES' : 'NO',
        w.overrideReason || '',
      ];
    });
  } else if (type === 'DAILY_CHALLENGE') {
    headers = ['Challenge Date', 'Rank', 'MSISDN', 'Score', 'Time (sec)', 'Prize (ETB)', 'Eligible', 'Submitted At'];
    rows = db.dailyParticipants.map((p) => {
      const chal = db.dailyChallenges.find((c) => c.id === p.challengeId);
      const msisdn = allowFullMsisdn ? p.fullMsisdn : p.maskedMsisdn;
      return [
        chal?.date || 'N/A',
        String(p.rank),
        msisdn,
        String(p.score),
        String(p.timeSpentSeconds),
        String(p.prizeAssignedBirr),
        p.eligibleForPrize ? 'YES' : 'NO',
        p.submittedAt,
      ];
    });
  } else if (type === 'PRIZES') {
    headers = ['Date', 'Context', 'Player MSISDN', 'Standard (ETB)', 'Override (ETB)', 'Reason', 'Status', 'Approved By', 'Timestamp'];
    rows = db.playerPrizeOverrides.map((o) => [
      o.createdAt.split('T')[0],
      o.context,
      o.playerMsisdn,
      String(o.standardPrizeBirr),
      String(o.overridePrizeBirr),
      o.reason,
      o.status,
      o.adminName,
      o.createdAt,
    ]);
  } else if (type === 'SUBSCRIPTIONS') {
    headers = ['MSISDN', 'Status', 'Plan', 'Daily Tariff (ETB)', 'Channel', 'Activated At', 'Last Billed', 'Auto Renew'];
    rows = db.subscriptions.map((s) => [
      allowFullMsisdn ? s.msisdn : s.maskedMsisdn,
      s.status,
      s.plan,
      String(s.priceBirr),
      s.channel,
      s.activatedAt,
      s.lastBilledAt,
      s.autoRenew ? 'YES' : 'NO',
    ]);
  } else {
    // Default Audit export
    headers = ['Timestamp', 'Admin Name', 'Admin Role', 'Action', 'Object Type', 'Object ID', 'Old Value', 'New Value', 'Reason'];
    rows = db.auditLogs.map((a) => [
      a.timestamp,
      a.adminName,
      a.adminRole,
      a.action,
      a.objectType,
      a.objectId,
      a.oldValue.replace(/\n/g, ' '),
      a.newValue.replace(/\n/g, ' '),
      a.reason.replace(/\n/g, ' '),
    ]);
  }

  // Generate CSV text
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) => row.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// --------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(store.getSettings());
});

apiRouter.post(
  '/settings',
  requireRole(['SUPER_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { settings, reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Operational confirmation reason required for system settings update.' });
      }
      const updated = store.updateSettings(settings, reason);
      res.json({ success: true, settings: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Admin Users
// --------------------------------------------------------------------------
apiRouter.get('/admin-users', (req: Request, res: Response) => {
  res.json(store.getAdminUsers());
});

apiRouter.post(
  '/admin-users',
  requireRole(['SUPER_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { user, reason } = req.body;
      if (!user.name || !user.email) {
        return res.status(400).json({ error: 'Name and email are required for new admin user.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Reason is required to add an administrative user.' });
      }
      const created = store.createAdminUser(user, reason);
      res.json({ success: true, user: created });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.put(
  '/admin-users/:id/role',
  requireRole(['SUPER_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { role, reason } = req.body;
      if (!['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'REPORTING_ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid admin role.' });
      }
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Reason required for admin role modification.' });
      }
      const updated = store.updateAdminRole(req.params.id, role, reason);
      res.json({ success: true, user: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

apiRouter.post(
  '/admin-users/:id/toggle-active',
  requireRole(['SUPER_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      if (!reason || reason.trim().length < 4) {
        return res.status(400).json({ error: 'Reason required to activate/deactivate admin user.' });
      }
      const updated = store.toggleAdminActive(req.params.id, reason);
      res.json({ success: true, user: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// --------------------------------------------------------------------------
// Audit Logs
// --------------------------------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const { dateFrom, dateTo, action, objectType } = req.query;
  const list = store.getAuditLogs({
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    action: action as string,
    objectType: objectType as string,
  });
  res.json(list);
});

// --------------------------------------------------------------------------
// Mode Switch (DEMO vs PRODUCTION clean empty-state)
// --------------------------------------------------------------------------
apiRouter.post(
  '/system/mode',
  requireRole(['SUPER_ADMIN']),
  (req: Request, res: Response) => {
    try {
      const { mode } = req.body;
      if (mode !== 'DEMO' && mode !== 'PRODUCTION') {
        return res.status(400).json({ error: 'Mode must be either DEMO or PRODUCTION' });
      }
      const updatedDb = store.setMode(mode);
      res.json({ success: true, mode: updatedDb.mode });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);
