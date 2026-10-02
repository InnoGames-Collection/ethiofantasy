import type { SupportTicketRow } from '../supabase/types';

export class SupportService {
    private static instance: SupportService;
    private _tickets: SupportTicketRow[] = [];

    private constructor() {}

    public static getInstance(): SupportService {
        if (!SupportService.instance) {
            SupportService.instance = new SupportService();
        }
        return SupportService.instance;
    }

    public async createTicket(category: string, message: string, subject?: string): Promise<{ ticketId: string, success: boolean }> {
        const ticketId = `tkt_${Date.now()}`;
        const newTicket: SupportTicketRow = {
            id: ticketId,
            user_id: 'current_user',
            category,
            subject: subject || null,
            message,
            status: 'open',
            admin_response: null,
            created_at: new Date().toISOString(),
            resolved_at: null
        };
        this._tickets.unshift(newTicket);
        return { ticketId, success: true };
    }

    public async getMyTickets(): Promise<SupportTicketRow[]> {
        return [...this._tickets];
    }
}
