export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'REPORTING_ADMIN';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  department: string;
  active: boolean;
  lastLogin: string;
  createdAt: string;
}

export type ChallengeStatus = 'NOT_CONFIGURED' | 'OPEN' | 'PAUSED' | 'CLOSED';
export type CompetitionStatus = 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'FINALIZED';

export interface PrizeRankRule {
  rank: number;
  label: string; // e.g., "1st Place", "2nd Place"
  prizeAmountBirr: number;
  prizeType: 'AIRTIME' | 'TELEBIRR_CASH' | 'MERCHANDISE' | 'SPECIAL';
  description: string;
}

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  status: ChallengeStatus;
  title: string;
  startTime: string; // ISO or HH:mm
  endTime: string;
  quizLevelId: string;
  totalQuestions: number;
  timeLimitSeconds: number;
  minPassingScore: number;
  prizeRules: PrizeRankRule[];
  eligibilityNotes: string;
  participantsCount: number;
  completedCount: number;
  topScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyCompetition {
  id: string;
  title: string;
  periodLabel: string; // e.g. "Week 38 - 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: CompetitionStatus;
  participantsCount: number;
  topScore: number;
  prizeRules: PrizeRankRule[];
  finalizedAt?: string;
  finalizedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerPrizeOverride {
  id: string;
  playerId: string;
  playerMsisdn: string;
  competitionId?: string;
  challengeId?: string;
  context: 'DAILY_CHALLENGE' | 'WEEKLY_COMPETITION' | 'SPECIAL_RECOGNITION' | 'DISPUTE_RESOLUTION';
  standardPrizeBirr: number;
  overridePrizeBirr: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISBURSED' | 'CANCELLED';
  adminId: string;
  adminName: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Player {
  id: string;
  msisdn: string; // Real full MSISDN: e.g. "+251911234567"
  maskedMsisdn: string; // "+251 91 **** 567"
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PENDING';
  registeredAt: string;
  lastActivity: string;
  currentLevel: number;
  bestScore: number;
  weeklyScore: number;
  dailyChallengeParticipations: number;
  totalPrizesWonBirr: number;
  telecomCircle: 'ADDIS_ABABA' | 'OROMIA' | 'AMHARA' | 'TIGRAY' | 'SIDAMA' | 'OTHER';
}

export interface CompetitionParticipant {
  id: string;
  competitionId: string;
  playerId: string;
  maskedMsisdn: string;
  fullMsisdn: string;
  score: number;
  rank: number;
  levelsCompleted: number;
  timeSpentSeconds: number;
  eligibleForPrize: boolean;
  prizeAssignedBirr: number;
  prizeType?: string;
  isOverride: boolean;
  overrideReason?: string;
  status: 'ACTIVE_PLAY' | 'QUALIFIED' | 'WINNER_CONFIRMED' | 'DISQUALIFIED';
  lastSubmittedAt: string;
}

export interface DailyChallengeParticipant {
  id: string;
  challengeId: string;
  playerId: string;
  maskedMsisdn: string;
  fullMsisdn: string;
  score: number;
  rank: number;
  completed: boolean;
  timeSpentSeconds: number;
  eligibleForPrize: boolean;
  prizeAssignedBirr: number;
  isOverride: boolean;
  overrideReason?: string;
  submittedAt: string;
}

export interface QuizQuestion {
  id: string;
  levelNumber: number;
  orderNumber: number;
  questionText: string;
  questionAmharic?: string;
  options: string[];
  correctOptionIndex: number; // 0..3
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: 'ETHIOPIAN_PREMIER_LEAGUE' | 'WALIA_IBEX' | 'AFRICAN_FOOTBALL' | 'WORLD_CUP' | 'EUROPEAN_LEAGUES';
  status: 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
  explanation?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface QuizLevel {
  id: string;
  levelNumber: number;
  title: string;
  description: string;
  requiredScore: number;
  pointsPerQuestion: number;
  totalQuestions: number;
  publishedQuestionsCount: number;
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
}

export interface SubscriptionRecord {
  id: string;
  playerId: string;
  msisdn: string;
  maskedMsisdn: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PENDING';
  plan: 'DAILY_RECURRING';
  priceBirr: number; // 2 Birr
  channel: 'SMS_9401' | 'USSD' | 'WEB' | 'TELEBIRR';
  activatedAt: string;
  lastBilledAt: string;
  nextRenewalAt: string;
  autoRenew: boolean;
  failureReason?: string;
}

export interface ServiceSettings {
  serviceName: string;
  shortcode: string; // e.g. "9401"
  subscriptionInstruction: string; // e.g. "Send OK to 9401"
  dailySubscriptionPriceBirr: number; // e.g. 2
  dailyChallengeEnabled: boolean;
  weeklyCompetitionEnabled: boolean;
  autoFinalizeWinners: boolean;
  telebirrDisbursementEnabled: boolean;
  publicLeaderboardTopN: number; // 10
  supportContact: string;
  serviceNoticeBanner: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: string;
  objectType: 'DAILY_CHALLENGE' | 'WEEKLY_COMPETITION' | 'PRIZE_RULE' | 'PRIZE_OVERRIDE' | 'PLAYER' | 'QUESTION' | 'SUBSCRIPTION' | 'SETTINGS' | 'ADMIN_USER' | 'MSISDN_UNMASK';
  objectId: string;
  oldValue: string;
  newValue: string;
  reason: string;
  ipAddress?: string;
}

export interface AppDatabase {
  mode: 'DEMO' | 'PRODUCTION';
  settings: ServiceSettings;
  adminUsers: AdminUser[];
  dailyChallenges: DailyChallenge[];
  weeklyCompetitions: WeeklyCompetition[];
  playerPrizeOverrides: PlayerPrizeOverride[];
  players: Player[];
  quizLevels: QuizLevel[];
  quizQuestions: QuizQuestion[];
  subscriptions: SubscriptionRecord[];
  dailyParticipants: DailyChallengeParticipant[];
  weeklyParticipants: CompetitionParticipant[];
  auditLogs: AuditLogEntry[];
}
