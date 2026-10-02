export class RealtimeService {
    private static instance: RealtimeService;
    private listeners: Map<string, Set<Function>> = new Map();

    private constructor() {}

    public static getInstance(): RealtimeService {
        if (!RealtimeService.instance) {
            RealtimeService.instance = new RealtimeService();
        }
        return RealtimeService.instance;
    }

    public initUserChannels(userId: string): void {
        console.log('[RealtimeService] Initialized user event channels for:', userId);
    }

    public on(event: string, callback: Function): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    public emit(event: string, payload: any): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(payload);
                } catch (e) {
                    console.error(`[RealtimeService] Error executing callback for event ${event}:`, e);
                }
            });
        }
    }

    public cleanup(): void {
        this.listeners.clear();
    }
}
