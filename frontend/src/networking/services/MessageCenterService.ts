import type { MessageChannel } from '../supabase/types';
import { i18n } from '../../localization/i18n';

export interface MessageCenterItem {
    id: string;
    title: string;
    content: string;
    category: string;
    priority: 'High' | 'Normal' | 'Low';
    createdAt: string;
    read: boolean;
}

type Listener = (count: number) => void;

const DEFAULT_MESSAGES: MessageCenterItem[] = [
    {
        id: 'msg-1',
        title: 'Welcome to EthioFantasy!',
        content: 'Test your football knowledge, climb the 100 Championship levels, and compete for 50,000 ETB weekly prize pools.',
        category: 'system',
        priority: 'High',
        createdAt: new Date().toISOString(),
        read: false
    },
    {
        id: 'msg-2',
        title: 'Daily Challenge Ready',
        content: 'Today’s football quiz challenge is live. You have 1 attempt today to earn bonus points!',
        category: 'global',
        priority: 'Normal',
        createdAt: new Date().toISOString(),
        read: false
    }
];

export class MessageCenterService {
    private static instance: MessageCenterService;
    private listeners: Listener[] = [];
    private messages: MessageCenterItem[] = [...DEFAULT_MESSAGES];
    
    private constructor() {}
    
    public static getInstance(): MessageCenterService {
        if (!MessageCenterService.instance) {
            MessageCenterService.instance = new MessageCenterService();
        }
        return MessageCenterService.instance;
    }

    public subscribeToBadgeUpdates(listener: Listener): () => void {
        this.listeners.push(listener);
        listener(this.getTotalUnreadCount());
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    private _notifyListeners() {
        const count = this.getTotalUnreadCount();
        this.listeners.forEach(l => l(count));
    }
    
    public getTotalUnreadCount(): number {
        return this.messages.filter(m => !m.read).length;
    }
    
    public async getDirectMessages(): Promise<MessageCenterItem[]> {
        return this.messages.filter(m => m.category === 'direct');
    }
    
    public async getSystemMessages(): Promise<MessageCenterItem[]> {
        return this.messages.filter(m => m.category === 'system');
    }
    
    public async getGlobalAnnouncements(): Promise<MessageCenterItem[]> {
        return this.messages.filter(m => m.category === 'global');
    }
    
    public async getAllMessages(): Promise<MessageCenterItem[]> {
        return [...this.messages];
    }
    
    public async markAsRead(id: string): Promise<void> {
        const msg = this.messages.find(m => m.id === id);
        if (msg) {
            msg.read = true;
            this._notifyListeners();
        }
    }
}
