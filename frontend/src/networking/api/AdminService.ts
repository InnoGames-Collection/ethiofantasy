export interface QuestionFilter {
    category?: string;
    difficulty?: number;
    searchQuery?: string;
    page?: number;
    limit?: number;
}

export interface AdminUserRecord {
    id: string;
    username: string;
    phone?: string;
    elo_rating: number;
    coins: number;
    xp: number;
    role: string;
    subscription_tier: string;
    total_matches: number;
    total_wins: number;
    created_at: string;
    last_active?: string;
    is_banned?: boolean;
}

export interface TelcoRewardItem {
    id: string;
    user_id: string;
    msisdn: string;
    reward_type: string;
    reward_amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    period_type: string;
    rank_position: number;
    created_at: string;
    processed_at?: string;
    response_payload?: any;
    username?: string;
}

export interface AuditLogItem {
    id: string;
    admin_id?: string;
    action: string;
    target_entity: string;
    target_id?: string;
    details?: any;
    created_at: string;
    admin_username?: string;
}

export class AdminService {
    private static _instance: AdminService | null = null;
    private _mockAuditLogs: AuditLogItem[] = [];

    public static getInstance(): AdminService {
        if (!AdminService._instance) {
            AdminService._instance = new AdminService();
        }
        return AdminService._instance;
    }

    // --- Super Admin Authentication Check ---
    public async verifySuperAdmin(): Promise<boolean> {
        return true;
    }

    // --- Trilingual Question CMS ---
    public async fetchQuestions(_filter: QuestionFilter = {}): Promise<{ questions: any[]; totalCount: number }> {
        return { questions: [], totalCount: 0 };
    }

    public async saveQuestion(_questionPayload: any, _adminId?: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: 'Question saved successfully.' };
    }

    public async deleteQuestion(_questionId: string, _adminId?: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: 'Question deleted successfully.' };
    }

    public async bulkImportCsv(csvText: string, _adminId?: string): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
        const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
            return { successCount: 0, errorCount: 1, errors: ['CSV must contain header row and at least 1 data row.'] };
        }
        return { successCount: lines.length - 1, errorCount: 0, errors: [] };
    }

    // --- User & Player Support Management ---
    public async searchUsers(_query: string): Promise<AdminUserRecord[]> {
        return [];
    }

    public async updateUserCoinsAndXp(userId: string, coinsDelta: number, xpDelta: number, _reason: string, _adminId?: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: `Updated balance for user ${userId}. Coins delta: ${coinsDelta}, XP delta: ${xpDelta}` };
    }

    public async setUserRole(userId: string, role: 'user' | 'super_admin', _adminId?: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: `User ${userId} role updated to '${role}'.` };
    }

    // --- Telco Rewards Operations ---
    public async fetchTelcoRewardsQueue(): Promise<TelcoRewardItem[]> {
        return [];
    }

    public async retryTelcoDisbursement(queueId: string, _adminId?: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: `Queued reward ${queueId} for re-processing.` };
    }

    // --- Broadcast Notifications & Audits ---
    public async sendBroadcastNotification(payload: { titleEn: string; titleAm?: string; titleOm?: string; bodyEn: string; bodyAm?: string; bodyOm?: string; category: string }, adminId?: string): Promise<{ success: boolean; message: string }> {
        this._mockAuditLogs.unshift({
            id: `audit-${Date.now()}`,
            admin_id: adminId || 'admin',
            action: 'SEND_BROADCAST_NOTIFICATION',
            target_entity: 'notifications',
            details: payload,
            created_at: new Date().toISOString()
        });
        return { success: true, message: 'Broadcast notification sent successfully to all players!' };
    }

    public async fetchAuditLogs(): Promise<AuditLogItem[]> {
        return this._mockAuditLogs;
    }
}
