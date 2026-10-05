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
  label: string;
  prizeAmountBirr: number;
  prizeType: 'AIRTIME' | 'TELEBIRR_CASH' | 'MERCHANDISE' | 'SPECIAL';
  description: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  status: ChallengeStatus;
  title: string;
  startTime: string;
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
  periodLabel: string;
  startDate: string;
  endDate: string;
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
  msisdn: string;
  maskedMsisdn: string;
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
  daysParticipated?: number;
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

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type QuestionPool = 'LEVEL_BASED' | 'DAILY_CHALLENGE';
export type QuestionStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'PUBLISHED' | 'INACTIVE';

export interface QuestionImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  altText: string;
  category: 'STADIUMS' | 'PLAYERS' | 'TROPHIES' | 'MATCHES' | 'ETHIOPIAN' | 'GENERAL';
  dimensions?: string;
  fileSize?: string;
  usageCount: number;
  tags: string[];
  credit?: string;
  uploadedAt: string;
}

export interface QuizQuestion {
  id: string;
  questionCode?: string;
  levelNumber?: number;
  orderNumber?: number;
  questionText: string;
  questionAmharic?: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: QuestionDifficulty | string;
  category: string;
  status: QuestionStatus | string;
  explanation?: string;
  pool?: QuestionPool;
  imageUrl?: string;
  imageAlt?: string;
  sourceReference?: string;
  createdAt?: string;
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
  priceBirr: number;
  channel: 'SMS_9401' | 'SMS_6415' | 'SMS_900' | 'USSD' | 'WEB' | 'TELEBIRR';
  activatedAt: string;
  lastBilledAt: string;
  nextRenewalAt: string;
  autoRenew: boolean;
  failureReason?: string;
}

export interface ServiceSettings {
  serviceName: string;
  shortcode: string;
  subscriptionInstruction: string;
  dailySubscriptionPriceBirr: number;
  dailyChallengeEnabled: boolean;
  weeklyCompetitionEnabled: boolean;
  autoFinalizeWinners: boolean;
  telebirrDisbursementEnabled: boolean;
  publicLeaderboardTopN: number;
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
  objectType: string;
  objectId: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface DashboardStats {
  mode: 'DEMO' | 'PRODUCTION';
  kpis: {
    activePlayers: number;
    todayParticipants: number;
    todayChallengeStatus: ChallengeStatus;
    currentWeeklyStatus: CompetitionStatus;
    pendingPrizeActions: number;
  };
  todayChallenge: {
    id: string;
    title: string;
    date: string;
    status: ChallengeStatus;
    participantsCount: number;
    completedCount: number;
    topScore: number;
    prizeRules: PrizeRankRule[];
  } | null;
  currentCompetition: {
    id: string;
    title: string;
    periodLabel: string;
    status: CompetitionStatus;
    participantsCount: number;
    topScore: number;
    currentLeader: {
      maskedMsisdn: string;
      score: number;
      levelsCompleted: number;
    } | null;
  } | null;
  recentActivity: AuditLogEntry[];
}
