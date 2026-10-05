import {
  AdminUser,
  DashboardStats,
  DailyChallenge,
  WeeklyCompetition,
  PlayerPrizeOverride,
  Player,
  QuizLevel,
  QuizQuestion,
  SubscriptionRecord,
  ServiceSettings,
  AuditLogEntry,
  PrizeRankRule,
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'ethiofantasy_admin_token';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error || errorData?.message) {
        errorMsg = errorData.message || errorData.error;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ success: boolean; token: string; admin: AdminUser }> {
    const res = await request<any>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      setAdminToken(res.token);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/admin/logout', { method: 'POST' });
    } catch {}
    clearAdminToken();
  },

  async getAuthMe(): Promise<{ currentAdmin: AdminUser; availableAdmins: AdminUser[] }> {
    const res = await request<{ token?: string; currentAdmin: AdminUser; availableAdmins: AdminUser[] }>('/auth/me');
    if (res.token) {
      setAdminToken(res.token);
    }
    return res;
  },

  async switchAdmin(adminId: string): Promise<{ success: boolean; currentAdmin: AdminUser }> {
    const res = await request<{ success: boolean; token?: string; currentAdmin: AdminUser }>('/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ adminId }),
    });
    if (res.token) {
      setAdminToken(res.token);
    }
    return res;
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardStats(): Promise<DashboardStats> {
    return request('/dashboard/stats');
  },

  // ── Daily Challenge ───────────────────────────────────────────────────────
  async getDailyChallenges(): Promise<DailyChallenge[]> {
    return request('/daily-challenge');
  },
  async getDailyChallengeDetails(id: string): Promise<{ challenge: DailyChallenge; participants: any[] }> {
    return request(`/daily-challenge/${id}`);
  },
  async saveDailyChallenge(data: Partial<DailyChallenge>, reason: string): Promise<{ challenge: DailyChallenge }> {
    return request('/daily-challenge', {
      method: 'POST',
      body: JSON.stringify({ data, reason }),
    });
  },
  async updateDailyStatus(id: string, status: string, reason: string): Promise<{ challenge: DailyChallenge }> {
    return request(`/daily-challenge/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },
  async updateDailyPrizeRules(id: string, rules: PrizeRankRule[], reason: string): Promise<{ challenge: DailyChallenge }> {
    return request(`/daily-challenge/${id}/prizes`, {
      method: 'POST',
      body: JSON.stringify({ rules, reason }),
    });
  },

  // ── Weekly Competition ────────────────────────────────────────────────────
  async getWeeklyCompetitions(): Promise<WeeklyCompetition[]> {
    return request('/weekly-competition');
  },
  async getWeeklyCompetitionDetails(id: string): Promise<{ competition: WeeklyCompetition; participants: any[] }> {
    return request(`/weekly-competition/${id}`);
  },
  async saveWeeklyCompetition(data: Partial<WeeklyCompetition>, reason: string): Promise<{ competition: WeeklyCompetition }> {
    return request('/weekly-competition', {
      method: 'POST',
      body: JSON.stringify({ data, reason }),
    });
  },
  async updateWeeklyStatus(id: string, status: string, reason: string): Promise<{ competition: WeeklyCompetition }> {
    return request(`/weekly-competition/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },
  async finalizeWeeklyWinners(id: string, reason: string): Promise<{ competition: WeeklyCompetition }> {
    return request(`/weekly-competition/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  async overrideParticipantPrize(
    competitionId: string,
    participantId: string,
    overrideAmount: number,
    reason: string
  ): Promise<{ participant: any }> {
    return request(`/weekly-competition/${competitionId}/override-participant`, {
      method: 'POST',
      body: JSON.stringify({ participantId, overrideAmount, reason }),
    });
  },

  // ── Prizes ────────────────────────────────────────────────────────────────
  async getPrizeOverrides(): Promise<PlayerPrizeOverride[]> {
    const res = await request<any>('/prizes/overrides?pageSize=100');
    return Array.isArray(res) ? res : res.items || [];
  },
  async createPlayerPrizeOverride(data: {
    msisdn: string;
    overridePrizeBirr: number;
    reason: string;
    context: string;
    competitionId?: string;
  }): Promise<{ override: PlayerPrizeOverride }> {
    return request('/prizes/override', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── Players ───────────────────────────────────────────────────────────────
  async getPlayers(search?: string, status?: string): Promise<Player[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    params.append('pageSize', '100');
    const res = await request<any>(`/players?${params.toString()}`);
    return Array.isArray(res) ? res : res.items || [];
  },
  async getPlayerDetails(id: string): Promise<any> {
    return request(`/players/${id}`);
  },
  async updatePlayerStatus(id: string, status: string, reason: string): Promise<{ player: Player }> {
    return request(`/players/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },
  async resetPlayerState(id: string, reason: string): Promise<{ player: Player }> {
    return request(`/players/${id}/reset-state`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  async unmaskMsisdn(playerId: string, reason: string): Promise<{ fullMsisdn: string }> {
    return request(`/players/${playerId}/unmask`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ── Quiz & Question Bank ──────────────────────────────────────────────────
  async getQuizLevels(): Promise<QuizLevel[]> {
    return request('/quiz/levels');
  },
  async getQuizQuestions(levelNumber?: number, status?: string): Promise<QuizQuestion[]> {
    const params = new URLSearchParams();
    if (levelNumber) params.append('levelNumber', String(levelNumber));
    if (status && status !== 'ALL') params.append('status', status);
    params.append('pageSize', '100');
    const res = await request<any>(`/quiz/questions?${params.toString()}`);
    return Array.isArray(res) ? res : res.items || [];
  },
  async createQuizQuestion(data: Partial<QuizQuestion>, reason: string): Promise<{ question: QuizQuestion }> {
    return request('/quiz/questions', {
      method: 'POST',
      body: JSON.stringify({ data, reason }),
    });
  },
  async updateQuizQuestion(id: string, data: Partial<QuizQuestion>, reason: string): Promise<{ question: QuizQuestion }> {
    return request(`/quiz/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data, reason }),
    });
  },
  async setQuestionStatus(id: string, status: string, reason: string): Promise<{ question: QuizQuestion }> {
    return request(`/quiz/questions/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },

  // ── Images Catalog ────────────────────────────────────────────────────────
  async getQuizImages(category?: string, search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search) params.append('search', search);
    return request(`/quiz/images?${params.toString()}`);
  },
  async createQuizImage(data: any): Promise<any> {
    return request('/quiz/images', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  async getSubscriptions(search?: string, status?: string): Promise<SubscriptionRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    params.append('pageSize', '100');
    const res = await request<any>(`/subscriptions?${params.toString()}`);
    return Array.isArray(res) ? res : res.items || [];
  },
  async updateSubscriptionStatus(id: string, status: string, reason: string): Promise<{ subscription: SubscriptionRecord }> {
    return request(`/subscriptions/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  async getReportData(type: string, options: { competitionId?: string; dateFrom?: string; dateTo?: string } = {}): Promise<any> {
    const params = new URLSearchParams({ type });
    if (options.competitionId) params.append('competitionId', options.competitionId);
    if (options.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options.dateTo) params.append('dateTo', options.dateTo);
    return request(`/reports/data?${params.toString()}`);
  },
  getExportUrl(type: string, unmasked = false): string {
    return `${API_BASE}/reports/export?type=${type}&unmasked=${unmasked ? 'true' : 'false'}`;
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings(): Promise<ServiceSettings> {
    return request('/settings');
  },
  async updateSettings(settings: Partial<ServiceSettings>, reason: string): Promise<{ settings: ServiceSettings }> {
    return request('/settings', {
      method: 'POST',
      body: JSON.stringify({ settings, reason }),
    });
  },

  // ── Admin Users ───────────────────────────────────────────────────────────
  async getAdminUsers(): Promise<AdminUser[]> {
    return request('/admin-users');
  },
  async createAdminUser(user: Partial<AdminUser>, reason: string): Promise<{ user: AdminUser }> {
    return request('/admin-users', {
      method: 'POST',
      body: JSON.stringify({ user, reason }),
    });
  },
  async updateAdminRole(id: string, role: string, reason: string): Promise<{ user: AdminUser }> {
    return request(`/admin-users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, reason }),
    });
  },
  async toggleAdminActive(id: string, reason: string): Promise<{ user: AdminUser }> {
    return request(`/admin-users/${id}/toggle-active`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(filters: { dateFrom?: string; dateTo?: string; action?: string; objectType?: string } = {}): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.action && filters.action !== 'ALL') params.append('action', filters.action);
    if (filters.objectType && filters.objectType !== 'ALL') params.append('objectType', filters.objectType);
    params.append('pageSize', '100');
    const res = await request<any>(`/audit-logs?${params.toString()}`);
    return Array.isArray(res) ? res : res.items || [];
  },

  // ── System Mode ───────────────────────────────────────────────────────────
  async switchSystemMode(mode: 'DEMO' | 'PRODUCTION'): Promise<{ success: boolean; mode: 'DEMO' | 'PRODUCTION' }> {
    return request('/system/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  },
};
