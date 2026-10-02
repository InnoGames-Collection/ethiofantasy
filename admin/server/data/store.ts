import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AppDatabase,
  AdminUser,
  AdminRole,
  DailyChallenge,
  WeeklyCompetition,
  PlayerPrizeOverride,
  Player,
  QuizQuestion,
  QuizLevel,
  SubscriptionRecord,
  ServiceSettings,
  AuditLogEntry,
  CompetitionParticipant,
  DailyChallengeParticipant,
  PrizeRankRule,
} from '../types';
import { getDemoDatabase, getCleanProductionDatabase } from './initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'ethiofantasy_state.json');

class StoreManager {
  private db: AppDatabase;
  private currentAdmin: AdminUser;

  constructor() {
    this.db = this.loadDatabase();
    this.currentAdmin = this.db.adminUsers[0] || {
      id: 'adm-001',
      name: 'Abebe Tekele',
      email: 'atekele21@gmail.com',
      role: 'SUPER_ADMIN',
      department: 'Telecom Value Added Services (VAS)',
      active: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  private loadDatabase(): AppDatabase {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.settings && parsed.adminUsers) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading store file, initializing default demo dataset:', e);
    }
    const initial = getDemoDatabase();
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(data: AppDatabase = this.db): void {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmp = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, DATA_FILE);
    } catch (e) {
      console.error('Failed to save store to file:', e);
    }
  }

  public getDatabase(): AppDatabase {
    return this.db;
  }

  public getCurrentAdmin(): AdminUser {
    return this.currentAdmin;
  }

  public setCurrentAdmin(adminId: string): AdminUser | null {
    const found = this.db.adminUsers.find((a) => a.id === adminId);
    if (found) {
      this.currentAdmin = found;
      found.lastLogin = new Date().toISOString();
      this.saveDatabase();
      return found;
    }
    return null;
  }

  public logAudit(
    action: string,
    objectType: AuditLogEntry['objectType'],
    objectId: string,
    oldValue: string,
    newValue: string,
    reason: string
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      adminId: this.currentAdmin.id,
      adminName: this.currentAdmin.name,
      adminRole: this.currentAdmin.role,
      action,
      objectType,
      objectId,
      oldValue,
      newValue,
      reason: reason || 'Routine operational update',
    };
    this.db.auditLogs.unshift(entry);
    this.saveDatabase();
    return entry;
  }

  public setMode(mode: 'DEMO' | 'PRODUCTION'): AppDatabase {
    const oldMode = this.db.mode;
    if (mode === 'PRODUCTION') {
      this.db = getCleanProductionDatabase();
    } else {
      this.db = getDemoDatabase();
    }
    this.logAudit(
      'SWITCH_DATA_MODE',
      'SETTINGS',
      'mode',
      oldMode,
      mode,
      `Switched portal dataset mode to ${mode}`
    );
    this.saveDatabase();
    return this.db;
  }

  // Dashboard KPIs
  public getDashboardStats() {
    const activePlayers = this.db.players.filter((p) => p.accountStatus === 'ACTIVE').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayChallenge = this.db.dailyChallenges.find((d) => d.date === todayStr) || this.db.dailyChallenges[0] || null;
    const activeCompetition = this.db.weeklyCompetitions.find((c) => c.status === 'ACTIVE') || this.db.weeklyCompetitions[0] || null;
    const pendingOverrides = this.db.playerPrizeOverrides.filter((o) => o.status === 'PENDING_APPROVAL').length;

    // Current leader in active weekly competition
    let currentLeader = null;
    if (activeCompetition) {
      const topCompPart = this.db.weeklyParticipants
        .filter((w) => w.competitionId === activeCompetition.id)
        .sort((a, b) => b.score - a.score)[0];
      if (topCompPart) {
        currentLeader = {
          maskedMsisdn: topCompPart.maskedMsisdn,
          score: topCompPart.score,
          levelsCompleted: topCompPart.levelsCompleted,
        };
      }
    }

    return {
      mode: this.db.mode,
      kpis: {
        activePlayers,
        todayParticipants: todayChallenge ? todayChallenge.participantsCount : 0,
        todayChallengeStatus: todayChallenge ? todayChallenge.status : 'NOT_CONFIGURED',
        currentWeeklyStatus: activeCompetition ? activeCompetition.status : 'NOT_STARTED',
        pendingPrizeActions: pendingOverrides,
      },
      todayChallenge: todayChallenge
        ? {
            id: todayChallenge.id,
            title: todayChallenge.title,
            date: todayChallenge.date,
            status: todayChallenge.status,
            participantsCount: todayChallenge.participantsCount,
            completedCount: todayChallenge.completedCount,
            topScore: todayChallenge.topScore,
            prizeRules: todayChallenge.prizeRules,
          }
        : null,
      currentCompetition: activeCompetition
        ? {
            id: activeCompetition.id,
            title: activeCompetition.title,
            periodLabel: activeCompetition.periodLabel,
            status: activeCompetition.status,
            participantsCount: activeCompetition.participantsCount,
            topScore: activeCompetition.topScore,
            currentLeader,
          }
        : null,
      recentActivity: this.db.auditLogs.slice(0, 7),
    };
  }

  // Daily Challenge operations
  public getDailyChallenges(): DailyChallenge[] {
    return this.db.dailyChallenges;
  }

  public getDailyChallenge(id: string): { challenge: DailyChallenge; participants: DailyChallengeParticipant[] } | null {
    const challenge = this.db.dailyChallenges.find((c) => c.id === id);
    if (!challenge) return null;
    const participants = this.db.dailyParticipants.filter((p) => p.challengeId === id);
    return { challenge, participants };
  }

  public createOrUpdateDailyChallenge(data: Partial<DailyChallenge>, reason: string): DailyChallenge {
    let challenge: DailyChallenge;
    const existingIndex = this.db.dailyChallenges.findIndex((c) => c.id === data.id || c.date === data.date);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const old = this.db.dailyChallenges[existingIndex];
      challenge = {
        ...old,
        ...data,
        updatedAt: now,
      };
      this.db.dailyChallenges[existingIndex] = challenge;
      this.logAudit(
        'UPDATE_DAILY_CHALLENGE',
        'DAILY_CHALLENGE',
        challenge.id,
        `Date: ${old.date}, Status: ${old.status}`,
        `Date: ${challenge.date}, Status: ${challenge.status}`,
        reason
      );
    } else {
      challenge = {
        id: data.id || `dc-${Date.now()}`,
        date: data.date || now.split('T')[0],
        status: data.status || 'OPEN',
        title: data.title || 'Official Daily Football Challenge',
        startTime: data.startTime || '06:00',
        endTime: data.endTime || '23:59',
        quizLevelId: data.quizLevelId || 'lvl-1',
        totalQuestions: data.totalQuestions || 10,
        timeLimitSeconds: data.timeLimitSeconds || 120,
        minPassingScore: data.minPassingScore || 70,
        prizeRules: data.prizeRules || [
          { rank: 1, label: '1st Place', prizeAmountBirr: 1000, prizeType: 'AIRTIME', description: 'Winner Airtime' },
          { rank: 2, label: '2nd Place', prizeAmountBirr: 500, prizeType: 'AIRTIME', description: 'Runner-up Airtime' },
          { rank: 3, label: '3rd Place', prizeAmountBirr: 300, prizeType: 'AIRTIME', description: '3rd Place Airtime' },
        ],
        eligibilityNotes: data.eligibilityNotes || 'Requires active 2 Birr daily subscription to 9401.',
        participantsCount: 0,
        completedCount: 0,
        topScore: 0,
        createdAt: now,
        updatedAt: now,
      };
      this.db.dailyChallenges.unshift(challenge);
      this.logAudit(
        'CREATE_DAILY_CHALLENGE',
        'DAILY_CHALLENGE',
        challenge.id,
        'None',
        `Date: ${challenge.date}, Status: ${challenge.status}`,
        reason
      );
    }

    this.saveDatabase();
    return challenge;
  }

  public updateDailyChallengeStatus(id: string, status: DailyChallenge['status'], reason: string): DailyChallenge {
    const item = this.db.dailyChallenges.find((c) => c.id === id);
    if (!item) throw new Error('Challenge not found');
    const old = item.status;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    this.logAudit(
      'UPDATE_CHALLENGE_STATUS',
      'DAILY_CHALLENGE',
      id,
      old,
      status,
      reason
    );
    this.saveDatabase();
    return item;
  }

  public updateDailyPrizeRules(id: string, rules: PrizeRankRule[], reason: string): DailyChallenge {
    const item = this.db.dailyChallenges.find((c) => c.id === id);
    if (!item) throw new Error('Challenge not found');
    const oldRules = JSON.stringify(item.prizeRules);
    item.prizeRules = rules;
    item.updatedAt = new Date().toISOString();
    this.logAudit(
      'UPDATE_DAILY_PRIZE_RULES',
      'PRIZE_RULE',
      id,
      oldRules,
      JSON.stringify(rules),
      reason
    );
    this.saveDatabase();
    return item;
  }

  // Weekly Competition operations
  public getWeeklyCompetitions(): WeeklyCompetition[] {
    return this.db.weeklyCompetitions;
  }

  public getWeeklyCompetition(id: string): { competition: WeeklyCompetition; participants: CompetitionParticipant[] } | null {
    const competition = this.db.weeklyCompetitions.find((c) => c.id === id);
    if (!competition) return null;
    const participants = this.db.weeklyParticipants
      .filter((p) => p.competitionId === id)
      .sort((a, b) => b.score - a.score);
    return { competition, participants };
  }

  public createOrUpdateWeeklyCompetition(data: Partial<WeeklyCompetition>, reason: string): WeeklyCompetition {
    const now = new Date().toISOString();
    let comp: WeeklyCompetition;
    const existingIndex = this.db.weeklyCompetitions.findIndex((c) => c.id === data.id);

    if (existingIndex >= 0) {
      const old = this.db.weeklyCompetitions[existingIndex];
      comp = {
        ...old,
        ...data,
        updatedAt: now,
      };
      this.db.weeklyCompetitions[existingIndex] = comp;
      this.logAudit(
        'UPDATE_WEEKLY_COMPETITION',
        'WEEKLY_COMPETITION',
        comp.id,
        `${old.title} (${old.status})`,
        `${comp.title} (${comp.status})`,
        reason
      );
    } else {
      comp = {
        id: data.id || `wc-${Date.now()}`,
        title: data.title || 'EthioFantasy 7-Day National Cup',
        periodLabel: data.periodLabel || 'Current Active Period',
        startDate: data.startDate || now.split('T')[0],
        endDate: data.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: data.status || 'ACTIVE',
        participantsCount: 0,
        topScore: 0,
        prizeRules: data.prizeRules || [
          { rank: 1, label: '1st Place Champion', prizeAmountBirr: 25000, prizeType: 'TELEBIRR_CASH', description: 'Grand Telebirr Cash Prize' },
          { rank: 2, label: '2nd Place', prizeAmountBirr: 12000, prizeType: 'TELEBIRR_CASH', description: 'Runner-up Cash Prize' },
          { rank: 3, label: '3rd Place', prizeAmountBirr: 7000, prizeType: 'TELEBIRR_CASH', description: '3rd Position Cash Prize' },
        ],
        createdAt: now,
        updatedAt: now,
      };
      this.db.weeklyCompetitions.unshift(comp);
      this.logAudit(
        'CREATE_WEEKLY_COMPETITION',
        'WEEKLY_COMPETITION',
        comp.id,
        'None',
        `${comp.title} (${comp.periodLabel})`,
        reason
      );
    }
    this.saveDatabase();
    return comp;
  }

  public updateWeeklyStatus(id: string, status: WeeklyCompetition['status'], reason: string): WeeklyCompetition {
    const item = this.db.weeklyCompetitions.find((c) => c.id === id);
    if (!item) throw new Error('Competition not found');
    const old = item.status;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    this.logAudit(
      'UPDATE_COMPETITION_STATUS',
      'WEEKLY_COMPETITION',
      id,
      old,
      status,
      reason
    );
    this.saveDatabase();
    return item;
  }

  public finalizeWeeklyWinners(id: string, reason: string): WeeklyCompetition {
    const item = this.db.weeklyCompetitions.find((c) => c.id === id);
    if (!item) throw new Error('Competition not found');
    const oldStatus = item.status;
    item.status = 'FINALIZED';
    item.finalizedAt = new Date().toISOString();
    item.finalizedBy = this.currentAdmin.name;
    item.updatedAt = new Date().toISOString();

    // Lock and assign prize to top participants
    const parts = this.db.weeklyParticipants
      .filter((p) => p.competitionId === id && p.status !== 'DISQUALIFIED')
      .sort((a, b) => b.score - a.score);

    parts.forEach((p, idx) => {
      const rank = idx + 1;
      p.rank = rank;
      p.status = 'WINNER_CONFIRMED';
      const prizeRule = item.prizeRules.find((r) => r.rank === rank);
      if (prizeRule && !p.isOverride) {
        p.prizeAssignedBirr = prizeRule.prizeAmountBirr;
        p.prizeType = prizeRule.prizeType;
      }
    });

    this.logAudit(
      'FINALIZE_WINNERS',
      'WEEKLY_COMPETITION',
      id,
      oldStatus,
      'FINALIZED',
      reason || 'Official confirmation of final rankings and prize lock'
    );
    this.saveDatabase();
    return item;
  }

  public overrideParticipantPrize(
    competitionId: string,
    participantId: string,
    overrideAmount: number,
    reason: string
  ): CompetitionParticipant {
    const part = this.db.weeklyParticipants.find((p) => p.id === participantId && p.competitionId === competitionId);
    if (!part) throw new Error('Participant not found');
    const oldVal = `${part.prizeAssignedBirr} ETB (Override: ${part.isOverride})`;
    part.prizeAssignedBirr = overrideAmount;
    part.isOverride = true;
    part.overrideReason = reason;

    // Record in PlayerPrizeOverride table as well
    const overrideEntry: PlayerPrizeOverride = {
      id: `ovr-${Date.now()}`,
      playerId: part.playerId,
      playerMsisdn: part.fullMsisdn,
      competitionId,
      context: 'WEEKLY_COMPETITION',
      standardPrizeBirr: 0,
      overridePrizeBirr: overrideAmount,
      reason,
      status: 'APPROVED',
      adminId: this.currentAdmin.id,
      adminName: this.currentAdmin.name,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };
    this.db.playerPrizeOverrides.unshift(overrideEntry);

    this.logAudit(
      'OVERRIDE_PARTICIPANT_PRIZE',
      'PRIZE_OVERRIDE',
      part.id,
      oldVal,
      `${overrideAmount} ETB`,
      reason
    );
    this.saveDatabase();
    return part;
  }

  // Player Prize Overrides
  public getPrizeOverrides(): PlayerPrizeOverride[] {
    return this.db.playerPrizeOverrides;
  }

  public createPlayerPrizeOverride(data: {
    msisdn: string;
    context: PlayerPrizeOverride['context'];
    overridePrizeBirr: number;
    reason: string;
    competitionId?: string;
    challengeId?: string;
  }): PlayerPrizeOverride {
    const player = this.db.players.find(
      (p) => p.msisdn === data.msisdn || p.msisdn.replace(/\s+/g, '') === data.msisdn.replace(/\s+/g, '')
    );
    if (!player) throw new Error(`Player with MSISDN ${data.msisdn} not found`);

    const standardPrize = 0;
    const entry: PlayerPrizeOverride = {
      id: `ovr-${Date.now()}`,
      playerId: player.id,
      playerMsisdn: player.msisdn,
      competitionId: data.competitionId,
      challengeId: data.challengeId,
      context: data.context,
      standardPrizeBirr: standardPrize,
      overridePrizeBirr: Number(data.overridePrizeBirr),
      reason: data.reason,
      status: 'APPROVED',
      adminId: this.currentAdmin.id,
      adminName: this.currentAdmin.name,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };

    // Update player accumulated total
    player.totalPrizesWonBirr += Number(data.overridePrizeBirr);

    this.db.playerPrizeOverrides.unshift(entry);
    this.logAudit(
      'ASSIGN_PRIZE_OVERRIDE',
      'PRIZE_OVERRIDE',
      entry.id,
      `Standard: ${standardPrize} ETB`,
      `Override: ${entry.overridePrizeBirr} ETB for ${player.maskedMsisdn}`,
      data.reason
    );
    this.saveDatabase();
    return entry;
  }

  // Players
  public getPlayers(search?: string, status?: string): Player[] {
    let list = this.db.players;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.msisdn.includes(q) || p.maskedMsisdn.toLowerCase().includes(q));
    }
    if (status && status !== 'ALL') {
      list = list.filter((p) => p.accountStatus === status);
    }
    return list;
  }

  public getPlayerDetails(id: string): {
    player: Player;
    subscription: SubscriptionRecord | null;
    overrides: PlayerPrizeOverride[];
    dailyActivity: DailyChallengeParticipant[];
    weeklyActivity: CompetitionParticipant[];
  } | null {
    const player = this.db.players.find((p) => p.id === id);
    if (!player) return null;
    const subscription = this.db.subscriptions.find((s) => s.playerId === id) || null;
    const overrides = this.db.playerPrizeOverrides.filter((o) => o.playerId === id);
    const dailyActivity = this.db.dailyParticipants.filter((d) => d.playerId === id);
    const weeklyActivity = this.db.weeklyParticipants.filter((w) => w.playerId === id);
    return {
      player,
      subscription,
      overrides,
      dailyActivity,
      weeklyActivity,
    };
  }

  public updatePlayerStatus(id: string, status: Player['accountStatus'], reason: string): Player {
    const player = this.db.players.find((p) => p.id === id);
    if (!player) throw new Error('Player not found');
    const old = player.accountStatus;
    player.accountStatus = status;
    this.logAudit(
      'UPDATE_PLAYER_STATUS',
      'PLAYER',
      player.id,
      old,
      status,
      reason
    );
    this.saveDatabase();
    return player;
  }

  public resetPlayerServiceState(id: string, reason: string): Player {
    const player = this.db.players.find((p) => p.id === id);
    if (!player) throw new Error('Player not found');
    const old = `Level: ${player.currentLevel}, WeeklyScore: ${player.weeklyScore}`;
    player.currentLevel = 1;
    player.weeklyScore = 0;
    this.logAudit(
      'RESET_PLAYER_STATE',
      'PLAYER',
      player.id,
      old,
      'Level: 1, WeeklyScore: 0',
      reason
    );
    this.saveDatabase();
    return player;
  }

  // Quiz Levels & Questions
  public getQuizLevels(): QuizLevel[] {
    return this.db.quizLevels.map((lvl) => {
      const pubCount = this.db.quizQuestions.filter((q) => q.levelNumber === lvl.levelNumber && q.status === 'PUBLISHED').length;
      const totalCount = this.db.quizQuestions.filter((q) => q.levelNumber === lvl.levelNumber).length;
      return {
        ...lvl,
        publishedQuestionsCount: pubCount,
        totalQuestions: totalCount,
      };
    });
  }

  public getQuizQuestions(levelNumber?: number, status?: string): QuizQuestion[] {
    let list = this.db.quizQuestions;
    if (levelNumber) {
      list = list.filter((q) => q.levelNumber === Number(levelNumber));
    }
    if (status && status !== 'ALL') {
      list = list.filter((q) => q.status === status);
    }
    return list.sort((a, b) => a.orderNumber - b.orderNumber);
  }

  public createQuizQuestion(data: Partial<QuizQuestion>, reason: string): QuizQuestion {
    const now = new Date().toISOString();
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      levelNumber: Number(data.levelNumber || 1),
      orderNumber: Number(data.orderNumber || 1),
      questionText: data.questionText || '',
      questionAmharic: data.questionAmharic || '',
      options: data.options || ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: Number(data.correctOptionIndex ?? 0),
      difficulty: data.difficulty || 'MEDIUM',
      category: data.category || 'ETHIOPIAN_PREMIER_LEAGUE',
      status: 'DRAFT', // Default safe state
      explanation: data.explanation || '',
      updatedAt: now,
      updatedBy: this.currentAdmin.name,
    };

    this.db.quizQuestions.push(newQuestion);
    this.logAudit(
      'CREATE_QUIZ_QUESTION',
      'QUESTION',
      newQuestion.id,
      'None',
      `Draft Question created for Level ${newQuestion.levelNumber}`,
      reason || 'Content creation'
    );
    this.saveDatabase();
    return newQuestion;
  }

  public updateQuizQuestion(id: string, data: Partial<QuizQuestion>, reason: string): QuizQuestion {
    const index = this.db.quizQuestions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');
    const old = this.db.quizQuestions[index];
    const updated: QuizQuestion = {
      ...old,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: this.currentAdmin.name,
    };
    this.db.quizQuestions[index] = updated;
    this.logAudit(
      'UPDATE_QUIZ_QUESTION',
      'QUESTION',
      id,
      old.questionText.slice(0, 40),
      updated.questionText.slice(0, 40),
      reason
    );
    this.saveDatabase();
    return updated;
  }

  public setQuestionStatus(id: string, status: QuizQuestion['status'], reason: string): QuizQuestion {
    const item = this.db.quizQuestions.find((q) => q.id === id);
    if (!item) throw new Error('Question not found');
    const old = item.status;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = this.currentAdmin.name;
    this.logAudit(
      'SET_QUESTION_STATUS',
      'QUESTION',
      id,
      old,
      status,
      reason
    );
    this.saveDatabase();
    return item;
  }

  // Subscriptions
  public getSubscriptions(search?: string, status?: string): SubscriptionRecord[] {
    let list = this.db.subscriptions;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.msisdn.includes(q) || s.maskedMsisdn.includes(q));
    }
    if (status && status !== 'ALL') {
      list = list.filter((s) => s.status === status);
    }
    return list;
  }

  public updateSubscriptionStatus(id: string, status: SubscriptionRecord['status'], reason: string): SubscriptionRecord {
    const sub = this.db.subscriptions.find((s) => s.id === id);
    if (!sub) throw new Error('Subscription not found');
    const old = sub.status;
    sub.status = status;
    if (status === 'ACTIVE') {
      sub.autoRenew = true;
      sub.failureReason = undefined;
    } else if (status === 'CANCELLED') {
      sub.autoRenew = false;
      sub.failureReason = `Administrative deactivation: ${reason}`;
    }

    // sync with player record
    const player = this.db.players.find((p) => p.id === sub.playerId);
    if (player) {
      player.subscriptionStatus = status;
    }

    this.logAudit(
      'UPDATE_SUBSCRIPTION_STATUS',
      'SUBSCRIPTION',
      sub.id,
      old,
      status,
      reason
    );
    this.saveDatabase();
    return sub;
  }

  // Settings
  public getSettings(): ServiceSettings {
    return this.db.settings;
  }

  public updateSettings(updates: Partial<ServiceSettings>, reason: string): ServiceSettings {
    const old = JSON.stringify(this.db.settings);
    this.db.settings = {
      ...this.db.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: this.currentAdmin.name,
    };
    this.logAudit(
      'UPDATE_SERVICE_SETTINGS',
      'SETTINGS',
      'root',
      old,
      JSON.stringify(this.db.settings),
      reason
    );
    this.saveDatabase();
    return this.db.settings;
  }

  // Admin Users
  public getAdminUsers(): AdminUser[] {
    return this.db.adminUsers;
  }

  public createAdminUser(data: Partial<AdminUser>, reason: string): AdminUser {
    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      name: data.name || 'New Admin',
      email: data.email || `admin_${Date.now()}@ethiofantasy.et`,
      role: data.role || 'REPORTING_ADMIN',
      department: data.department || 'Operations',
      active: true,
      lastLogin: 'Never',
      createdAt: new Date().toISOString(),
    };
    this.db.adminUsers.push(newAdmin);
    this.logAudit(
      'CREATE_ADMIN_USER',
      'ADMIN_USER',
      newAdmin.id,
      'None',
      `${newAdmin.name} (${newAdmin.role})`,
      reason
    );
    this.saveDatabase();
    return newAdmin;
  }

  public updateAdminRole(id: string, role: AdminRole, reason: string): AdminUser {
    const user = this.db.adminUsers.find((u) => u.id === id);
    if (!user) throw new Error('Admin not found');
    const old = user.role;
    user.role = role;
    this.logAudit(
      'UPDATE_ADMIN_ROLE',
      'ADMIN_USER',
      id,
      old,
      role,
      reason
    );
    this.saveDatabase();
    return user;
  }

  public toggleAdminActive(id: string, reason: string): AdminUser {
    const user = this.db.adminUsers.find((u) => u.id === id);
    if (!user) throw new Error('Admin not found');
    const old = user.active ? 'ACTIVE' : 'INACTIVE';
    user.active = !user.active;
    const newVal = user.active ? 'ACTIVE' : 'INACTIVE';
    this.logAudit(
      'TOGGLE_ADMIN_STATUS',
      'ADMIN_USER',
      id,
      old,
      newVal,
      reason
    );
    this.saveDatabase();
    return user;
  }

  // Audit Logs
  public getAuditLogs(filter?: { dateFrom?: string; dateTo?: string; action?: string; objectType?: string }): AuditLogEntry[] {
    let list = this.db.auditLogs;
    if (filter?.action && filter.action !== 'ALL') {
      list = list.filter((a) => a.action === filter.action);
    }
    if (filter?.objectType && filter.objectType !== 'ALL') {
      list = list.filter((a) => a.objectType === filter.objectType);
    }
    if (filter?.dateFrom) {
      list = list.filter((a) => a.timestamp >= filter.dateFrom!);
    }
    if (filter?.dateTo) {
      list = list.filter((a) => a.timestamp <= filter.dateTo!);
    }
    return list;
  }

  // Unmask MSISDN Audit
  public unmaskMsisdn(playerId: string, reason: string): { fullMsisdn: string } {
    const player = this.db.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Player not found');

    this.logAudit(
      'VIEW_UNMASKED_MSISDN',
      'MSISDN_UNMASK',
      player.id,
      player.maskedMsisdn,
      player.msisdn,
      reason || 'Authorized Telecom subscriber verification'
    );
    return { fullMsisdn: player.msisdn };
  }
}

export const store = new StoreManager();
