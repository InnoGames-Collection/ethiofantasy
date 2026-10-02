export interface CacheOptions {
    ttlMs?: number;
    forceRefresh?: boolean;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttlMs: number;
}

export class CacheManager {
    private static _instance: CacheManager | null = null;
    private _memoryCache: Map<string, CacheEntry<any>> = new Map();
    private _isQuizActive: boolean = false;

    public static getInstance(): CacheManager {
        if (!CacheManager._instance) {
            CacheManager._instance = new CacheManager();
        }
        return CacheManager._instance;
    }

    private constructor() {}

    public setQuizActive(active: boolean): void {
        this._isQuizActive = active;
    }

    public get isQuizActive(): boolean {
        return this._isQuizActive;
    }

    public async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const ttl = options.ttlMs ?? 5 * 60 * 1000;
        const cached = this.get<T>(key);

        if (cached && !options.forceRefresh && !this.isStale(key)) {
            return cached;
        }

        if (this._isQuizActive && cached) {
            return cached;
        }

        try {
            const data = await fetcher();
            this.set(key, data, ttl);
            return data;
        } catch (err) {
            if (cached) return cached;
            throw err;
        }
    }

    public get<T>(key: string): T | null {
        if (this._memoryCache.has(key)) {
            return this._memoryCache.get(key)!.data as T;
        }
        return null;
    }

    public set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
        this._memoryCache.set(key, { data, timestamp: Date.now(), ttlMs });
    }

    public isStale(key: string): boolean {
        const entry = this._memoryCache.get(key);
        if (!entry) return true;
        return Date.now() - entry.timestamp > entry.ttlMs;
    }

    public invalidate(key: string): void {
        this._memoryCache.delete(key);
    }

    public clear(): void {
        this._memoryCache.clear();
    }
}
