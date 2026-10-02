import type { MessageRow } from '../supabase/types';

export class MessageService {
    private static _instance: MessageService | null = null;
    private _messages: MessageRow[] = [];

    private constructor() {}

    public static getInstance(): MessageService {
        if (!MessageService._instance) {
            MessageService._instance = new MessageService();
        }
        return MessageService._instance;
    }

    public async getMessages(channel: 'global' | 'direct' | 'system'): Promise<MessageRow[]> {
        return this._messages.filter(m => m.channel === channel);
    }

    public async getInbox(): Promise<MessageRow[]> {
        return [...this._messages];
    }

    public async markAsRead(id: string): Promise<void> {
        const msg = this._messages.find(m => m.id === id);
        if (msg) msg.read = true;
    }

    public async markAllAsRead(): Promise<void> {
        this._messages.forEach(m => { m.read = true; });
    }

    public subscribeToMessages(_userId: string, _callback: (message: MessageRow) => void): () => void {
        return () => {};
    }
}
