export type AppEvent =
    | 'DATA_REFRESHED'
    | 'PROFILE_UPDATED'
    | 'NETWORK_RESTORED'
    | 'LOCALE_CHANGED'
    | 'QUIZ_STATE_CHANGED'
    | 'TAB_CHANGED'
    | 'RELOAD_CURRENT_VIEW';

export type EventCallback = (payload?: any) => void;

export class EventBus {
    private static _instance: EventBus | null = null;
    private _listeners: Map<AppEvent, Set<EventCallback>> = new Map();

    public static getInstance(): EventBus {
        if (!EventBus._instance) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }

    private constructor() {}

    public on(event: AppEvent, callback: EventCallback): void {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event)!.add(callback);
    }

    public off(event: AppEvent, callback: EventCallback): void {
        if (this._listeners.has(event)) {
            this._listeners.get(event)!.delete(callback);
        }
    }

    public emit(event: AppEvent, payload?: any): void {
        if (this._listeners.has(event)) {
            this._listeners.get(event)!.forEach(cb => {
                try {
                    cb(payload);
                } catch (e) {
                    console.error(`[EventBus] Error handling event '${event}':`, e);
                }
            });
        }
    }
}
