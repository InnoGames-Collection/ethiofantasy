export interface SystemConfigItem {
    key: string;
    value: any;
    category: 'gameplay' | 'economy' | 'matchmaking' | 'system' | 'telco';
    description?: string;
    updated_at?: string;
    updated_by?: string;
}

export class ConfigurationManager {
    private static _instance: ConfigurationManager | null = null;
    private _configs: Map<string, SystemConfigItem> = new Map();
    private _isLoaded: boolean = false;

    public get isLoaded(): boolean {
        return this._isLoaded;
    }

    private _defaults: Record<string, SystemConfigItem> = {
        quiz_timer_sec: { key: 'quiz_timer_sec', value: 15, category: 'gameplay', description: 'Seconds allowed per quiz question' },
        questions_per_match: { key: 'questions_per_match', value: 10, category: 'gameplay', description: 'Number of questions in a standard match' },
        max_lifelines_per_match: { key: 'max_lifelines_per_match', value: 2, category: 'gameplay', description: 'Maximum lifelines usable per match' },
        daily_login_coins: { key: 'daily_login_coins', value: 100, category: 'economy', description: 'Coins awarded for daily login streak' },
        win_coin_reward: { key: 'win_coin_reward', value: 50, category: 'economy', description: 'Coins awarded for winning a match' },
        win_xp_reward: { key: 'win_xp_reward', value: 20, category: 'economy', description: 'XP awarded for winning a match' },
        elo_base_gain: { key: 'elo_base_gain', value: 25, category: 'matchmaking', description: 'Base ELO rating points gained on win' },
        elo_base_loss: { key: 'elo_base_loss', value: 15, category: 'matchmaking', description: 'Base ELO rating points lost on defeat' },
        queue_timeout_sec: { key: 'queue_timeout_sec', value: 30, category: 'matchmaking', description: 'Matchmaking queue search timeout before bot pairing' },
        bot_fallback_enabled: { key: 'bot_fallback_enabled', value: true, category: 'matchmaking', description: 'Enable simulated opponent fallback if queue times out' },
        maintenance_mode: { key: 'maintenance_mode', value: false, category: 'system', description: 'Enable global maintenance mode to restrict player logins' },
        maintenance_message: { key: 'maintenance_message', value: 'System is under scheduled maintenance. Please check back soon.', category: 'system', description: 'Custom message displayed during maintenance' },
        daily_sub_price_etb: { key: 'daily_sub_price_etb', value: 2, category: 'telco', description: 'Daily Ethio Telecom subscription price in ETB' },
        weekly_airtime_reward_1st: { key: 'weekly_airtime_reward_1st', value: 20000, category: 'telco', description: '1st place weekly airtime reward in ETB' },
        weekly_airtime_reward_2nd: { key: 'weekly_airtime_reward_2nd', value: 12000, category: 'telco', description: '2nd place weekly airtime reward in ETB' },
        weekly_airtime_reward_3rd: { key: 'weekly_airtime_reward_3rd', value: 5000, category: 'telco', description: '3rd place weekly airtime reward in ETB' }
    };

    private constructor() {
        for (const [k, item] of Object.entries(this._defaults)) {
            this._configs.set(k, { ...item });
        }
    }

    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager._instance) {
            ConfigurationManager._instance = new ConfigurationManager();
        }
        return ConfigurationManager._instance;
    }

    public async loadConfigurations(): Promise<void> {
        this._isLoaded = true;
    }

    public get quizTimerSec(): number {
        return this.getNumber('quiz_timer_sec', 15);
    }

    public get questionsPerMatch(): number {
        return this.getNumber('questions_per_match', 10);
    }

    public get maxLifelinesPerMatch(): number {
        return this.getNumber('max_lifelines_per_match', 2);
    }

    public get dailySubPriceEtb(): number {
        return this.getNumber('daily_sub_price_etb', 2);
    }

    public get isMaintenanceMode(): boolean {
        return this.getBoolean('maintenance_mode', false);
    }

    public getAllConfigs(): SystemConfigItem[] {
        return Array.from(this._configs.values());
    }

    public async updateConfig(key: string, value: any): Promise<{ success: boolean; message: string }> {
        if (this._configs.has(key)) {
            const item = this._configs.get(key)!;
            item.value = value;
            item.updated_at = new Date().toISOString();
        } else {
            this._configs.set(key, { key, value, category: 'system', updated_at: new Date().toISOString() });
        }
        return { success: true, message: `Configuration '${key}' updated.` };
    }

    public get<T = any>(key: string, fallback?: T): T {
        if (this._configs.has(key)) {
            return this._configs.get(key)!.value as T;
        }
        return fallback as T;
    }

    public getNumber(key: string, fallback: number = 0): number {
        const val = this.get(key);
        return typeof val === 'number' ? val : (parseInt(val, 10) || fallback);
    }

    public getBoolean(key: string, fallback: boolean = false): boolean {
        const val = this.get(key);
        return typeof val === 'boolean' ? val : (val === 'true' || fallback);
    }

    public getString(key: string, fallback: string = ''): string {
        const val = this.get(key);
        return typeof val === 'string' ? val : (val ? String(val) : fallback);
    }
}
