import type { NotificationRow } from '../supabase/types';

export class NotificationService {
    private static _instance: NotificationService | null = null;
    private _listeners: ((notification: NotificationRow) => void)[] = [];
    private _notifications: NotificationRow[] = [
        {
            id: 'notif-1',
            user_id: 'default',
            title_en: 'Welcome to EthioFantasy!',
            title_am: 'ወደ ኢትዮ ፋንታሲ እንኳን በደህና መጡ!',
            title_om: 'Baga gara EthioFantasy nagaan dhuftan!',
            body_en: 'Play daily football quizzes to score points and win real cash prizes.',
            body_am: 'ነጥቦችን ለመሰብሰብ እና እውነተኛ የገንዘብ ሽልማቶችን ለማሸነፍ በየቀኑ የእግር ኳስ ጥያቄዎችን ይመልሱ።',
            body_om: 'Qabxii sassaabbachuufi badhaasa maallaqaa dhugaa injifachuuf guyyaa guyyaan gaaffiiwwan kubbaa miilaa deebisaa.',
            category: 'system',
            action_type: null,
            action_target: null,
            read: false,
            created_at: new Date().toISOString()
        }
    ];

    private constructor() {}

    public static getInstance(): NotificationService {
        if (!NotificationService._instance) {
            NotificationService._instance = new NotificationService();
        }
        return NotificationService._instance;
    }

    public async getNotifications(category?: string): Promise<NotificationRow[]> {
        if (category) {
            return this._notifications.filter(n => n.category === category);
        }
        return [...this._notifications];
    }

    public async getUnreadCount(): Promise<number> {
        return this._notifications.filter(n => !n.read).length;
    }

    public async markAsRead(id: string): Promise<void> {
        const item = this._notifications.find(n => n.id === id);
        if (item) item.read = true;
    }

    public async markAllAsRead(): Promise<void> {
        this._notifications.forEach(n => { n.read = true; });
    }

    public subscribeToNotifications(_userId: string, callback: (notification: NotificationRow) => void): () => void {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(l => l !== callback);
        };
    }

    public subscribeToNewNotifications(callback: (notification: NotificationRow) => void): () => void {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(l => l !== callback);
        };
    }
}
