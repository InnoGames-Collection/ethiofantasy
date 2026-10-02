-- ==============================================================================
-- EthioFantasy — Migration 003: Admin Portal & Game Mechanics Production Upgrade
-- Adds:
-- 1. Service settings & Telecom Operations config
-- 2. Question image library & asset catalog
-- 3. Player prize overrides & disputes ledger
-- 4. Expands quiz_questions with pool, status, image metadata, and IFAB rules
-- 5. Expands daily_challenges with prize tier rules and timing
-- 6. Expands daily_attempts with granular answer verification audits
-- 7. Expands weekly_competitions with prize structures and finalization audits
-- 8. Aligns admin_users roles and immutable audit logging
-- Target: PostgreSQL 16 (UTC+3:00 East Africa Time aligned)
-- ==============================================================================

-- 1. Dynamic Service Settings Store (Single Row Configuration)
CREATE TABLE IF NOT EXISTS service_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    service_name VARCHAR(100) NOT NULL DEFAULT 'EthioFantasy',
    shortcode VARCHAR(20) NOT NULL DEFAULT '9401',
    subscription_instruction TEXT NOT NULL DEFAULT 'Send OK to 9401',
    daily_subscription_price_birr NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    daily_challenge_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_competition_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_finalize_winners BOOLEAN NOT NULL DEFAULT FALSE,
    telebirr_disbursement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    public_leaderboard_top_n INT NOT NULL DEFAULT 10,
    support_contact VARCHAR(100) NOT NULL DEFAULT '+251 11 551 0000',
    service_notice_banner TEXT DEFAULT 'EthioFantasy Official Daily & Weekly Competitions active for all Ethio Telecom subscribers.',
    system_mode VARCHAR(20) NOT NULL DEFAULT 'PRODUCTION' CHECK (system_mode IN ('DEMO', 'PRODUCTION')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- Seed default settings row if missing
INSERT INTO service_settings (id, service_name, shortcode, subscription_instruction, daily_subscription_price_birr)
VALUES (1, 'EthioFantasy', '9401', 'Send OK to 9401', 5.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Question Image Assets Catalog (Stadiums, Players, Trophies, Matches)
CREATE TABLE IF NOT EXISTS question_images (
    id VARCHAR(50) PRIMARY KEY,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(200) NOT NULL,
    alt_text TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL' CHECK (category IN ('STADIUMS', 'PLAYERS', 'TROPHIES', 'MATCHES', 'ETHIOPIAN', 'GENERAL')),
    dimensions VARCHAR(50),
    file_size VARCHAR(50),
    usage_count INT NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    credit TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_images_cat ON question_images(category);

-- 3. Player Prize Override & Dispute Ledger
CREATE TABLE IF NOT EXISTS player_prize_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player_msisdn VARCHAR(20) NOT NULL,
    competition_id VARCHAR(50),
    challenge_id VARCHAR(50),
    context VARCHAR(50) NOT NULL DEFAULT 'WEEKLY_COMPETITION' CHECK (context IN ('DAILY_CHALLENGE', 'WEEKLY_COMPETITION', 'SPECIAL_RECOGNITION', 'DISPUTE_RESOLUTION')),
    standard_prize_birr NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    override_prize_birr NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'DISBURSED', 'CANCELLED')),
    admin_id VARCHAR(100) NOT NULL,
    admin_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prize_overrides_msisdn ON player_prize_overrides(player_msisdn);
CREATE INDEX IF NOT EXISTS idx_prize_overrides_status ON player_prize_overrides(status);

-- 4. Expand Quiz Questions with Question Bank & Image Attributes
ALTER TABLE quiz_questions
    ADD COLUMN IF NOT EXISTS pool VARCHAR(50) NOT NULL DEFAULT 'LEVEL_BASED',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    ADD COLUMN IF NOT EXISTS question_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS order_number INT,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS image_caption TEXT,
    ADD COLUMN IF NOT EXISTS image_source TEXT,
    ADD COLUMN IF NOT EXISTS image_source_url TEXT,
    ADD COLUMN IF NOT EXISTS image_license TEXT,
    ADD COLUMN IF NOT EXISTS image_status VARCHAR(50) DEFAULT 'VERIFIED_RELEVANT',
    ADD COLUMN IF NOT EXISTS hint_cost INT DEFAULT 5,
    ADD COLUMN IF NOT EXISTS expert_cost INT DEFAULT 10,
    ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'trivia',
    ADD COLUMN IF NOT EXISTS image_identifier VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_questions_pool_status ON quiz_questions(pool, status);

-- 5. Expand Daily Challenges with Status, Timing, and Prize Rules
ALTER TABLE daily_challenges
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    ADD COLUMN IF NOT EXISTS start_time VARCHAR(10) DEFAULT '00:00',
    ADD COLUMN IF NOT EXISTS end_time VARCHAR(10) DEFAULT '23:59',
    ADD COLUMN IF NOT EXISTS quiz_level_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 10,
    ADD COLUMN IF NOT EXISTS time_limit_seconds INT DEFAULT 10,
    ADD COLUMN IF NOT EXISTS min_passing_score INT DEFAULT 5,
    ADD COLUMN IF NOT EXISTS prize_rules JSONB DEFAULT '[]'::jsonb;

-- 6. Expand Daily Attempts with UTC+3 Answers Audit & Final Timestamps
ALTER TABLE daily_attempts
    ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS final_submission_timestamp TIMESTAMPTZ;

-- 7. Expand Weekly Competitions with Period Labels, Finalization, and Prize Rules
ALTER TABLE weekly_competitions
    ADD COLUMN IF NOT EXISTS title VARCHAR(150),
    ADD COLUMN IF NOT EXISTS period_label VARCHAR(100),
    ADD COLUMN IF NOT EXISTS prize_rules JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS finalized_by VARCHAR(100);

-- 8. Expand Players Table for Telecom Circle, High Scores, and Total Prizes
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS telecom_circle VARCHAR(50) DEFAULT 'ADDIS_ABABA',
    ADD COLUMN IF NOT EXISTS best_score INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS weekly_score INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS daily_challenge_participations INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_prizes_won_birr NUMERIC(10,2) DEFAULT 0.00;

-- 9. Expand Subscriptions Table with Channels and Failure Audits
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'SMS_9401',
    ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- 10. Admin Users Roles Alignment
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
    CHECK (role IN ('SUPER_ADMIN', 'OPERATIONS_ADMIN', 'REPORTING_ADMIN', 'OPERATOR', 'AUDITOR'));

ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Telecom Operations',
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 11. Admin Audit Trail Alignment
ALTER TABLE admin_audit_logs
    ADD COLUMN IF NOT EXISTS admin_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS object_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS object_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS old_value TEXT,
    ADD COLUMN IF NOT EXISTS new_value TEXT,
    ADD COLUMN IF NOT EXISTS reason TEXT;
