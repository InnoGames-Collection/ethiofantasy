-- ==============================================================================
-- EthioFantasy — Production Relational Schema
-- Target: PostgreSQL 16
-- Service: Ethio Telecom Football Quiz & 7-Day Prize Competition (Shortcode 9401)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Players Master Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    msisdn VARCHAR(20) NOT NULL UNIQUE,
    masked_msisdn VARCHAR(20) NOT NULL,
    username VARCHAR(100) DEFAULT 'Ethio Fan',
    coins INT NOT NULL DEFAULT 50 CHECK (coins >= 0),
    total_stars INT NOT NULL DEFAULT 0 CHECK (total_stars >= 0),
    current_level INT NOT NULL DEFAULT 1 CHECK (current_level >= 1),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BANNED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_msisdn ON players(msisdn);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);

-- 2. Telecom Subscriptions (SMS Shortcode 9401 / Airtime Billing)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    msisdn VARCHAR(20) NOT NULL,
    shortcode VARCHAR(10) NOT NULL DEFAULT '9401',
    service_id VARCHAR(50) NOT NULL DEFAULT 'srv_ethiofantasy_daily',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'UNSUBSCRIBED', 'SUSPENDED')),
    plan_type VARCHAR(20) NOT NULL DEFAULT 'daily',
    price_etb NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    renew_count INT NOT NULL DEFAULT 1,
    last_billed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_billing_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subs_msisdn ON subscriptions(msisdn);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);

-- 3. SP Gateway Webhook Audit Log
CREATE TABLE IF NOT EXISTS sp_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    request_id VARCHAR(100),
    msisdn VARCHAR(20) NOT NULL,
    service_id VARCHAR(50),
    raw_payload JSONB NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sp_webhooks_msisdn ON sp_webhook_events(msisdn);
CREATE INDEX IF NOT EXISTS idx_sp_webhooks_created_at ON sp_webhook_events(created_at);

-- 4. 100 Championship Quiz Levels
CREATE TABLE IF NOT EXISTS quiz_levels (
    id INT PRIMARY KEY,
    chapter_name VARCHAR(100) NOT NULL,
    category_title VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    subtitle TEXT,
    icon_type VARCHAR(50) NOT NULL DEFAULT 'ball',
    accent_color VARCHAR(100) NOT NULL DEFAULT 'from-blue-600 to-indigo-600',
    required_stars INT NOT NULL DEFAULT 0
);

-- 5. Quiz Questions Bank
CREATE TABLE IF NOT EXISTS quiz_questions (
    id VARCHAR(50) PRIMARY KEY,
    level_id INT REFERENCES quiz_levels(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of 4 string options
    correct_index INT NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    points INT NOT NULL DEFAULT 10,
    explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_level ON quiz_questions(level_id);

-- 6. Player Progressive Level Completion
CREATE TABLE IF NOT EXISTS player_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_msisdn VARCHAR(20) NOT NULL,
    level_id INT NOT NULL REFERENCES quiz_levels(id) ON DELETE CASCADE,
    stars INT NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
    score INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_msisdn, level_id)
);

CREATE INDEX IF NOT EXISTS idx_player_progress_msisdn ON player_progress(player_msisdn);

-- 7. Daily Challenges (1 per calendar day)
CREATE TABLE IF NOT EXISTS daily_challenges (
    challenge_id VARCHAR(50) PRIMARY KEY,
    challenge_date DATE NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    prize_pool_etb INT NOT NULL DEFAULT 5000,
    questions JSONB NOT NULL, -- Array of 10 question objects without correct answers leaked
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dc_date ON daily_challenges(challenge_date);

-- 8. Daily Challenge Attempts (Strictly 1 attempt per day per player)
CREATE TABLE IF NOT EXISTS daily_attempts (
    attempt_id VARCHAR(50) PRIMARY KEY,
    challenge_id VARCHAR(50) NOT NULL REFERENCES daily_challenges(challenge_id) ON DELETE CASCADE,
    player_msisdn VARCHAR(20) NOT NULL,
    score INT NOT NULL DEFAULT 0 CHECK (score >= 0),
    total_response_time_ms INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_date DATE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    UNIQUE(player_msisdn, attempt_date)
);

CREATE INDEX IF NOT EXISTS idx_attempts_msisdn_date ON daily_attempts(player_msisdn, attempt_date);
CREATE INDEX IF NOT EXISTS idx_attempts_score ON daily_attempts(score DESC, total_response_time_ms ASC);

-- 9. Weekly 7-Day Competition Cycles
CREATE TABLE IF NOT EXISTS weekly_competitions (
    competition_id VARCHAR(50) PRIMARY KEY,
    cycle_number INT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('UPCOMING', 'ACTIVE', 'FINALIZED')),
    prize_pool_etb INT NOT NULL DEFAULT 50000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Weekly Leaderboard Snapshots & Prize Ledger
CREATE TABLE IF NOT EXISTS weekly_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id VARCHAR(50) NOT NULL REFERENCES weekly_competitions(competition_id) ON DELETE CASCADE,
    player_msisdn VARCHAR(20) NOT NULL,
    masked_msisdn VARCHAR(20) NOT NULL,
    total_7day_score INT NOT NULL DEFAULT 0,
    total_response_time_ms INT NOT NULL DEFAULT 0,
    rank INT NOT NULL,
    prize_etb INT NOT NULL DEFAULT 0,
    is_disbursed BOOLEAN NOT NULL DEFAULT FALSE,
    disbursed_at TIMESTAMPTZ,
    UNIQUE(competition_id, player_msisdn)
);

CREATE INDEX IF NOT EXISTS idx_weekly_lb_comp_rank ON weekly_leaderboard(competition_id, rank);

-- 11. Telecom Operations & Auditor Console Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'SUPER_ADMIN' CHECK (role IN ('SUPER_ADMIN', 'OPERATOR', 'AUDITOR')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Immutable Admin Activity Audit Trail
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at);
