/**
 * Auto-generated TypeScript types for the Football Quiz League Supabase database.
 * These types provide compile-time safety for all database operations.
 * 
 * In production, regenerate with: npx supabase gen types typescript --project-id <id>
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Locale = 'en' | 'am' | 'om';
export type SubscriptionTier = 'free' | 'basic' | 'premium';
export type MatchType = 'solo' | 'live_1v1' | 'tournament' | 'challenge' | 'daily';
export type LiveMatchStatus = 'waiting' | 'in_progress' | 'completed' | 'forfeited';
export type SeasonStatus = 'upcoming' | 'active' | 'completed';
export type TournamentStatus = 'registration' | 'in_progress' | 'completed';
export type ChallengeStatus = 'pending' | 'accepted' | 'completed' | 'expired';
export type BracketStatus = 'pending' | 'in_progress' | 'completed' | 'bye';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type LeaderboardTimeRange = 'daily' | 'weekly' | 'monthly' | 'all_time';
export type NotificationCategory = 'daily' | 'tournament' | 'rewards' | 'announcements' | 'subscription' | 'system';
export type MessageChannel = 'global' | 'direct' | 'system';
export type GameSessionState = 'playing' | 'paused' | 'completed' | 'abandoned' | 'expired';
export type GameSessionMatchType = 'solo' | 'daily' | 'league' | 'tournament' | 'guess' | 'iq' | 'penalty';
export type RewardType = 'match' | 'daily' | 'weekly' | 'tournament' | 'achievement' | 'referral' | 'streak';
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type UserRole = 'player' | 'admin' | 'moderator';

export interface Database {
    public: {
        Views: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
        Tables: {
            users: {
                Row: {
                    id: string;
                    username: string;
                    phone: string | null;
                    avatar_url: string | null;
                    locale: Locale;
                    elo_rating: number;
                    coins: number;
                    xp: number;
                    total_matches: number;
                    total_wins: number;
                    subscription_tier: SubscriptionTier;
                    streak_count: number;
                    streak_last_date: string | null;
                    role: UserRole;
                    referral_code: string | null;
                    referred_by: string | null;
                    created_at: string;
                    last_active: string;
                };
                Insert: {
                    id: string;
                    username: string;
                    phone?: string | null;
                    avatar_url?: string | null;
                    locale?: Locale;
                    elo_rating?: number;
                    coins?: number;
                    xp?: number;
                    total_matches?: number;
                    total_wins?: number;
                    subscription_tier?: SubscriptionTier;
                    streak_count?: number;
                    streak_last_date?: string | null;
                    role?: UserRole;
                    referral_code?: string | null;
                    referred_by?: string | null;
                };
                Update: {
                    username?: string;
                    phone?: string | null;
                    avatar_url?: string | null;
                    locale?: Locale;
                    elo_rating?: number;
                    coins?: number;
                    xp?: number;
                    total_matches?: number;
                    total_wins?: number;
                    subscription_tier?: SubscriptionTier;
                    streak_count?: number;
                    streak_last_date?: string | null;
                    last_active?: string;
                    role?: UserRole;
                    referral_code?: string | null;
                    referred_by?: string | null;
                }
                    Relationships: any[];
            };
            questions: {
                Row: {
                    id: string;
                    category: string;
                    difficulty: number;
                    competition_id: string | null;
                    prompt_en: string;
                    prompt_am: string | null;
                    prompt_om: string | null;
                    options_en: string[];
                    options_am: string[] | null;
                    options_om: string[] | null;
                    correct_index: number;
                    times_answered: number;
                    times_correct: number;
                    is_active: boolean;
                    created_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    category: string;
                    difficulty: number;
                    competition_id?: string | null;
                    prompt_en: string;
                    prompt_am?: string | null;
                    prompt_om?: string | null;
                    options_en: string[];
                    options_am?: string[] | null;
                    options_om?: string[] | null;
                    correct_index: number;
                    is_active?: boolean;
                    created_by?: string | null;
                };
                Update: {
                    category?: string;
                    difficulty?: number;
                    competition_id?: string | null;
                    prompt_en?: string;
                    prompt_am?: string | null;
                    prompt_om?: string | null;
                    options_en?: string[];
                    options_am?: string[] | null;
                    options_om?: string[] | null;
                    correct_index?: number;
                    times_answered?: number;
                    times_correct?: number;
                    is_active?: boolean;
                }
                    Relationships: any[];
            };
            competitions: {
                Row: {
                    id: string;
                    name_en: string;
                    name_am: string | null;
                    name_om: string | null;
                    badge: string;
                    description_en: string | null;
                    description_am: string | null;
                    description_om: string | null;
                    color: string;
                    question_count: number;
                    is_active: boolean;
                    min_level: number;
                    subscription_required: SubscriptionTier;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    name_en: string;
                    name_am?: string | null;
                    name_om?: string | null;
                    badge: string;
                    description_en?: string | null;
                    description_am?: string | null;
                    description_om?: string | null;
                    color?: string;
                    question_count?: number;
                    is_active?: boolean;
                    min_level?: number;
                    subscription_required?: SubscriptionTier;
                };
                Update: {
                    name_en?: string;
                    name_am?: string | null;
                    name_om?: string | null;
                    badge?: string;
                    description_en?: string | null;
                    description_am?: string | null;
                    description_om?: string | null;
                    color?: string;
                    question_count?: number;
                    is_active?: boolean;
                    min_level?: number;
                    subscription_required?: SubscriptionTier;
                }
                    Relationships: any[];
            };
            seasons: {
                Row: {
                    id: string;
                    competition_id: string;
                    name: string;
                    starts_at: string;
                    ends_at: string;
                    status: SeasonStatus;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    competition_id: string;
                    name: string;
                    starts_at: string;
                    ends_at: string;
                    status?: SeasonStatus;
                };
                Update: {
                    competition_id?: string;
                    name?: string;
                    starts_at?: string;
                    ends_at?: string;
                    status?: SeasonStatus;
                }
                    Relationships: any[];
            };
            matches: {
                Row: {
                    id: string;
                    user_id: string;
                    competition_id: string | null;
                    season_id: string | null;
                    match_type: MatchType;
                    opponent_id: string | null;
                    live_match_id: string | null;
                    goals: number;
                    correct_answers: number;
                    total_questions: number;
                    accuracy: number | null;
                    avg_response_time: number | null;
                    max_combo: number;
                    match_rating: number | null;
                    coins_earned: number;
                    xp_earned: number;
                    elo_change: number;
                    is_winner: boolean | null;
                    answers: Json | null;
                    played_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    competition_id?: string | null;
                    season_id?: string | null;
                    match_type: MatchType;
                    opponent_id?: string | null;
                    live_match_id?: string | null;
                    goals?: number;
                    correct_answers?: number;
                    total_questions?: number;
                    accuracy?: number | null;
                    avg_response_time?: number | null;
                    max_combo?: number;
                    match_rating?: number | null;
                    coins_earned?: number;
                    xp_earned?: number;
                    elo_change?: number;
                    is_winner?: boolean | null;
                    answers?: Json | null;
                };
                Update: {
                    correct_answers?: number;
                    total_questions?: number;
                    accuracy?: number | null;
                    avg_response_time?: number | null;
                    max_combo?: number;
                    match_rating?: number | null;
                    coins_earned?: number;
                    xp_earned?: number;
                    elo_change?: number;
                    is_winner?: boolean | null;
                    answers?: Json | null;
                }
                    Relationships: any[];
            };
            matchmaking_queue: {
                Row: {
                    id: string;
                    user_id: string;
                    elo_rating: number;
                    competition_id: string | null;
                    joined_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    elo_rating: number;
                    competition_id?: string | null;
                };
                Update: {
                    elo_rating?: number;
                    competition_id?: string | null;
                }
                    Relationships: any[];
            };
            live_matches: {
                Row: {
                    id: string;
                    player_a_id: string;
                    player_b_id: string;
                    competition_id: string | null;
                    question_ids: string[];
                    status: LiveMatchStatus;
                    player_a_score: number;
                    player_b_score: number;
                    current_question: number;
                    winner_id: string | null;
                    started_at: string | null;
                    completed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    player_a_id: string;
                    player_b_id: string;
                    competition_id?: string | null;
                    question_ids: string[];
                    status?: LiveMatchStatus;
                };
                Update: {
                    status?: LiveMatchStatus;
                    player_a_score?: number;
                    player_b_score?: number;
                    current_question?: number;
                    winner_id?: string | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                }
                    Relationships: any[];
            };
            live_match_answers: {
                Row: {
                    id: string;
                    live_match_id: string;
                    user_id: string;
                    question_index: number;
                    selected_index: number;
                    response_time_ms: number;
                    is_correct: boolean;
                    answered_at: string;
                };
                Insert: {
                    id?: string;
                    live_match_id: string;
                    user_id: string;
                    question_index: number;
                    selected_index: number;
                    response_time_ms: number;
                    is_correct: boolean;
                };
                Update: never
                    Relationships: any[];
            };
            tournaments: {
                Row: {
                    id: string;
                    name_en: string;
                    name_am: string | null;
                    name_om: string | null;
                    competition_id: string | null;
                    max_players: number;
                    bracket_size: number | null;
                    status: TournamentStatus;
                    starts_at: string;
                    prize_coins: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name_en: string;
                    name_am?: string | null;
                    name_om?: string | null;
                    competition_id?: string | null;
                    max_players?: number;
                    bracket_size?: number | null;
                    status?: TournamentStatus;
                    starts_at: string;
                    prize_coins?: number;
                };
                Update: {
                    name_en?: string;
                    name_am?: string | null;
                    name_om?: string | null;
                    status?: TournamentStatus;
                    bracket_size?: number | null;
                    prize_coins?: number;
                }
                    Relationships: any[];
            };
            tournament_registrations: {
                Row: {
                    tournament_id: string;
                    user_id: string;
                    registered_at: string;
                };
                Insert: {
                    tournament_id: string;
                    user_id: string;
                };
                Update: never
                    Relationships: any[];
            };
            tournament_brackets: {
                Row: {
                    id: string;
                    tournament_id: string;
                    round: number;
                    match_slot: number;
                    player_a_id: string | null;
                    player_b_id: string | null;
                    winner_id: string | null;
                    live_match_id: string | null;
                    status: BracketStatus;
                };
                Insert: {
                    id?: string;
                    tournament_id: string;
                    round: number;
                    match_slot: number;
                    player_a_id?: string | null;
                    player_b_id?: string | null;
                    status?: BracketStatus;
                };
                Update: {
                    winner_id?: string | null;
                    live_match_id?: string | null;
                    status?: BracketStatus;
                }
                    Relationships: any[];
            };
            challenges: {
                Row: {
                    id: string;
                    challenger_id: string;
                    opponent_id: string;
                    match_id: string;
                    question_ids: string[];
                    opponent_match_id: string | null;
                    status: ChallengeStatus;
                    expires_at: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    challenger_id: string;
                    opponent_id: string;
                    match_id: string;
                    question_ids: string[];
                    status?: ChallengeStatus;
                };
                Update: {
                    opponent_match_id?: string | null;
                    status?: ChallengeStatus;
                }
                    Relationships: any[];
            };
            leaderboard_entries: {
                Row: {
                    id: string;
                    user_id: string;
                    competition_id: string | null;
                    season_id: string | null;
                    time_range: LeaderboardTimeRange;
                    score: number;
                    matches_played: number;
                    wins: number;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    competition_id?: string | null;
                    season_id?: string | null;
                    time_range: LeaderboardTimeRange;
                    score?: number;
                    matches_played?: number;
                    wins?: number;
                };
                Update: {
                    score?: number;
                    matches_played?: number;
                    wins?: number;
                    updated_at?: string;
                }
                    Relationships: any[];
            };
            achievements: {
                Row: {
                    id: string;
                    name_en: string;
                    name_am: string | null;
                    name_om: string | null;
                    description_en: string;
                    description_am: string | null;
                    description_om: string | null;
                    icon: string;
                    category: string;
                    requirement_type: string;
                    requirement_value: number;
                    reward_coins: number;
                    reward_xp: number;
                };
                Insert: {
                    id: string;
                    name_en: string;
                    name_am?: string | null;
                    name_om?: string | null;
                    description_en: string;
                    description_am?: string | null;
                    description_om?: string | null;
                    icon: string;
                    category: string;
                    requirement_type: string;
                    requirement_value: number;
                    reward_coins?: number;
                    reward_xp?: number;
                };
                Update: {
                    name_en?: string;
                    name_am?: string | null;
                    name_om?: string | null;
                    description_en?: string;
                    description_am?: string | null;
                    description_om?: string | null;
                    icon?: string;
                    requirement_value?: number;
                    reward_coins?: number;
                    reward_xp?: number;
                }
                    Relationships: any[];
            };
            user_achievements: {
                Row: {
                    user_id: string;
                    achievement_id: string;
                    earned_at: string;
                };
                Insert: {
                    user_id: string;
                    achievement_id: string;
                };
                Update: never
                    Relationships: any[];
            };
            daily_challenges: {
                Row: {
                    id: string;
                    challenge_date: string;
                    theme_en: string;
                    theme_am: string | null;
                    theme_om: string | null;
                    question_ids: string[];
                    bonus_multiplier: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    challenge_date: string;
                    theme_en: string;
                    theme_am?: string | null;
                    theme_om?: string | null;
                    question_ids: string[];
                    bonus_multiplier?: number;
                };
                Update: {
                    theme_en?: string;
                    theme_am?: string | null;
                    theme_om?: string | null;
                    question_ids?: string[];
                    bonus_multiplier?: number;
                }
                    Relationships: any[];
            };
            daily_challenge_completions: {
                Row: {
                    user_id: string;
                    challenge_date: string;
                    match_id: string;
                    completed_at: string;
                };
                Insert: {
                    user_id: string;
                    challenge_date: string;
                    match_id: string;
                };
                Update: never
                    Relationships: any[];
            };
            subscriptions: {
                Row: {
                    id: string;
                    user_id: string;
                    phone: string;
                    tier: SubscriptionTier;
                    status: SubscriptionStatus;
                    started_at: string;
                    expires_at: string | null;
                    auto_renew: boolean;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    phone: string;
                    tier: SubscriptionTier;
                    status?: SubscriptionStatus;
                    expires_at?: string | null;
                    auto_renew?: boolean;
                };
                Update: {
                    tier?: SubscriptionTier;
                    status?: SubscriptionStatus;
                    expires_at?: string | null;
                    auto_renew?: boolean;
                }
                    Relationships: any[];
            };
            user_preferences: {
                Row: {
                    user_id: string;
                    locale: Locale;
                    sound_enabled: boolean;
                    vibration_enabled: boolean;
                    dark_mode: boolean;
                    notif_daily: boolean;
                    notif_tournament: boolean;
                    notif_rewards: boolean;
                    notif_announcements: boolean;
                    notif_subscription: boolean;
                    notif_system: boolean;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    locale?: Locale;
                    sound_enabled?: boolean;
                    vibration_enabled?: boolean;
                    dark_mode?: boolean;
                    notif_daily?: boolean;
                    notif_tournament?: boolean;
                    notif_rewards?: boolean;
                    notif_announcements?: boolean;
                    notif_subscription?: boolean;
                    notif_system?: boolean;
                };
                Update: {
                    locale?: Locale;
                    sound_enabled?: boolean;
                    vibration_enabled?: boolean;
                    dark_mode?: boolean;
                    notif_daily?: boolean;
                    notif_tournament?: boolean;
                    notif_rewards?: boolean;
                    notif_announcements?: boolean;
                    notif_subscription?: boolean;
                    notif_system?: boolean;
                    updated_at?: string;
                }
                    Relationships: any[];
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string | null;
                    title_en: string;
                    title_am: string | null;
                    title_om: string | null;
                    body_en: string;
                    body_am: string | null;
                    body_om: string | null;
                    category: NotificationCategory;
                    read: boolean;
                    action_type: string | null;
                    action_target: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    title_en: string;
                    title_am?: string | null;
                    title_om?: string | null;
                    body_en: string;
                    body_am?: string | null;
                    body_om?: string | null;
                    category: NotificationCategory;
                    read?: boolean;
                    action_type?: string | null;
                    action_target?: string | null;
                };
                Update: {
                    user_id?: string | null;
                    title_en?: string;
                    title_am?: string | null;
                    title_om?: string | null;
                    body_en?: string;
                    body_am?: string | null;
                    body_om?: string | null;
                    category?: NotificationCategory;
                    read?: boolean;
                    action_type?: string | null;
                    action_target?: string | null;
                }
                    Relationships: any[];
            };
            messages: {
                Row: {
                    id: string;
                    sender_id: string | null;
                    recipient_id: string | null;
                    channel: MessageChannel;
                    body_en: string;
                    body_am: string | null;
                    body_om: string | null;
                    read: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    sender_id?: string | null;
                    recipient_id?: string | null;
                    channel: MessageChannel;
                    body_en: string;
                    body_am?: string | null;
                    body_om?: string | null;
                    read?: boolean;
                };
                Update: {
                    sender_id?: string | null;
                    recipient_id?: string | null;
                    channel?: MessageChannel;
                    body_en?: string;
                    body_am?: string | null;
                    body_om?: string | null;
                    read?: boolean;
                }
                    Relationships: any[];
            };
            game_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    competition_id: string | null;
                    match_type: GameSessionMatchType;
                    state: GameSessionState;
                    difficulty: number;
                    total_questions: number;
                    current_question: number;
                    correct_count: number;
                    wrong_count: number;
                    timeout_count: number;
                    score: number;
                    final_score: number | null;
                    accuracy: number | null;
                    avg_response_time: number | null;
                    max_combo: number;
                    time_remaining: number;
                    question_ids: string[];
                    started_at: string;
                    paused_at: string | null;
                    completed_at: string | null;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    competition_id?: string | null;
                    match_type: GameSessionMatchType;
                    state?: GameSessionState;
                    difficulty: number;
                    total_questions: number;
                    current_question?: number;
                    correct_count?: number;
                    wrong_count?: number;
                    timeout_count?: number;
                    score?: number;
                    final_score?: number | null;
                    accuracy?: number | null;
                    avg_response_time?: number | null;
                    max_combo?: number;
                    time_remaining: number;
                    question_ids: string[];
                    paused_at?: string | null;
                    completed_at?: string | null;
                };
                Update: {
                    competition_id?: string | null;
                    match_type?: GameSessionMatchType;
                    state?: GameSessionState;
                    difficulty?: number;
                    total_questions?: number;
                    current_question?: number;
                    correct_count?: number;
                    wrong_count?: number;
                    timeout_count?: number;
                    score?: number;
                    final_score?: number | null;
                    accuracy?: number | null;
                    avg_response_time?: number | null;
                    max_combo?: number;
                    time_remaining?: number;
                    question_ids?: string[];
                    paused_at?: string | null;
                    completed_at?: string | null;
                    updated_at?: string;
                }
                    Relationships: any[];
            };
            game_session_answers: {
                Row: {
                    id: string;
                    session_id: string;
                    question_id: string;
                    question_index: number;
                    selected_index: number;
                    correct_index: number;
                    is_correct: boolean;
                    response_time_ms: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    question_id: string;
                    question_index: number;
                    selected_index: number;
                    correct_index: number;
                    is_correct: boolean;
                    response_time_ms: number;
                };
                Update: {
                    session_id?: string;
                    question_id?: string;
                    question_index?: number;
                    selected_index?: number;
                    correct_index?: number;
                    is_correct?: boolean;
                    response_time_ms?: number;
                }
                    Relationships: any[];
            };
            rewards: {
                Row: {
                    id: string;
                    user_id: string;
                    type: RewardType;
                    coins: number;
                    xp: number;
                    description_en: string | null;
                    description_am: string | null;
                    description_om: string | null;
                    claimed: boolean;
                    claimed_at: string | null;
                    expires_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: RewardType;
                    coins?: number;
                    xp?: number;
                    description_en?: string | null;
                    description_am?: string | null;
                    description_om?: string | null;
                    claimed?: boolean;
                    claimed_at?: string | null;
                    expires_at?: string | null;
                };
                Update: {
                    user_id?: string;
                    type?: RewardType;
                    coins?: number;
                    xp?: number;
                    description_en?: string | null;
                    description_am?: string | null;
                    description_om?: string | null;
                    claimed?: boolean;
                    claimed_at?: string | null;
                    expires_at?: string | null;
                }
                    Relationships: any[];
            };
            faq_items: {
                Row: {
                    id: string;
                    category: string;
                    question_en: string;
                    question_am: string | null;
                    question_om: string | null;
                    answer_en: string;
                    answer_am: string | null;
                    answer_om: string | null;
                    sort_order: number;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    category: string;
                    question_en: string;
                    question_am?: string | null;
                    question_om?: string | null;
                    answer_en: string;
                    answer_am?: string | null;
                    answer_om?: string | null;
                    sort_order?: number;
                    is_active?: boolean;
                };
                Update: {
                    category?: string;
                    question_en?: string;
                    question_am?: string | null;
                    question_om?: string | null;
                    answer_en?: string;
                    answer_am?: string | null;
                    answer_om?: string | null;
                    sort_order?: number;
                    is_active?: boolean;
                }
                    Relationships: any[];
            };
            support_tickets: {
                Row: {
                    id: string;
                    user_id: string;
                    category: string;
                    subject: string | null;
                    message: string;
                    status: SupportTicketStatus;
                    admin_response: string | null;
                    created_at: string;
                    resolved_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    category: string;
                    subject?: string | null;
                    message: string;
                    status?: SupportTicketStatus;
                    admin_response?: string | null;
                    resolved_at?: string | null;
                };
                Update: {
                    user_id?: string;
                    category?: string;
                    subject?: string | null;
                    message?: string;
                    status?: SupportTicketStatus;
                    admin_response?: string | null;
                    resolved_at?: string | null;
                }
                    Relationships: any[];
            };
        };
        Functions: {
            submit_match_result: {
                Args: {
                    p_match_type: MatchType;
                    p_competition_id: string | null;
                    p_answers: Json;
                };
                Returns: Json;
            };
            get_leaderboard: {
                Args: {
                    p_competition_id: string | null;
                    p_time_range: LeaderboardTimeRange;
                    p_limit: number;
                };
                Returns: Json;
            };
            get_daily_challenge: {
                Args: Record<string, never>;
                Returns: Json;
            };
            claim_daily_streak: {
                Args: Record<string, never>;
                Returns: Json;
            };
        };
    };
}

// Convenience type aliases for common operations
export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type QuestionRow = Database['public']['Tables']['questions']['Row'];
export type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
export type QuestionUpdate = Database['public']['Tables']['questions']['Update'];

export type CompetitionRow = Database['public']['Tables']['competitions']['Row'];
export type CompetitionInsert = Database['public']['Tables']['competitions']['Insert'];

export type SeasonRow = Database['public']['Tables']['seasons']['Row'];

export type MatchRow = Database['public']['Tables']['matches']['Row'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];

export type LiveMatchRow = Database['public']['Tables']['live_matches']['Row'];
export type LiveMatchAnswerRow = Database['public']['Tables']['live_match_answers']['Row'];

export type LeaderboardEntryRow = Database['public']['Tables']['leaderboard_entries']['Row'];

export type ChallengeRow = Database['public']['Tables']['challenges']['Row'];

export type TournamentRow = Database['public']['Tables']['tournaments']['Row'];
export type TournamentBracketRow = Database['public']['Tables']['tournament_brackets']['Row'];

export type AchievementRow = Database['public']['Tables']['achievements']['Row'];
export type UserAchievementRow = Database['public']['Tables']['user_achievements']['Row'];

export type DailyChallengeRow = Database['public']['Tables']['daily_challenges']['Row'];

export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

export type UserPreferenceRow = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferenceInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type UserPreferenceUpdate = Database['public']['Tables']['user_preferences']['Update'];

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export type GameSessionRow = Database['public']['Tables']['game_sessions']['Row'];
export type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert'];
export type GameSessionUpdate = Database['public']['Tables']['game_sessions']['Update'];

export type GameSessionAnswerRow = Database['public']['Tables']['game_session_answers']['Row'];
export type GameSessionAnswerInsert = Database['public']['Tables']['game_session_answers']['Insert'];

export type RewardRow = Database['public']['Tables']['rewards']['Row'];
export type RewardInsert = Database['public']['Tables']['rewards']['Insert'];
export type RewardUpdate = Database['public']['Tables']['rewards']['Update'];

export type FaqItemRow = Database['public']['Tables']['faq_items']['Row'];

export type SupportTicketRow = Database['public']['Tables']['support_tickets']['Row'];
export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];
