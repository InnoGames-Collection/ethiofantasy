-- ==============================================================================
-- EthioFantasy Migration 006: Enterprise Production Hardening & Anti-Cheat
-- Target: PostgreSQL 16 (GCP Cloud SQL)
-- Author: Principal Software Architect & Lead Database Architect
-- ==============================================================================

BEGIN;

-- 1. Enforce Strict UUID Generation and Timestamps
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Hardened Subscriptions Table Constraints
ALTER TABLE subscriptions 
    DROP CONSTRAINT IF EXISTS subscriptions_msisdn_key,
    DROP CONSTRAINT IF EXISTS idx_subs_msisdn_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_msisdn_unique 
    ON subscriptions(msisdn);

ALTER TABLE subscriptions
    ALTER COLUMN price_etb TYPE NUMERIC(10,2),
    ALTER COLUMN price_etb SET DEFAULT 2.00,
    ALTER COLUMN shortcode SET DEFAULT '6415',
    ALTER COLUMN status SET DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS last_transaction_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- 3. Idempotent SP Webhook Audit Table with Deduplication
ALTER TABLE sp_webhook_events
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'SUCCESS' 
        CHECK (processing_status IN ('SUCCESS', 'DUPLICATE', 'FAILED', 'IGNORED')),
    ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sp_webhook_request_id_unique 
    ON sp_webhook_events(request_id) 
    WHERE request_id IS NOT NULL;

-- 4. Authoritative Active Quiz Session Store (Server-Side Anti-Cheat)
CREATE TABLE IF NOT EXISTS player_quiz_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_msisdn VARCHAR(20) NOT NULL REFERENCES players(msisdn) ON DELETE CASCADE,
    challenge_id VARCHAR(50) NOT NULL,
    challenge_date DATE NOT NULL,
    current_question_index INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 10,
    question_ids JSONB NOT NULL,
    session_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    score INT NOT NULL DEFAULT 0,
    total_response_time_ms INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    current_question_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_unique_active_session UNIQUE (player_msisdn, challenge_date)
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_lookup 
    ON player_quiz_sessions(player_msisdn, challenge_date, is_completed);

-- 5. Optimized Indexing for Tournament Leaderboards & Fast Queries
CREATE INDEX IF NOT EXISTS idx_daily_attempts_cycle_calc 
    ON daily_attempts(attempt_date, is_completed, score DESC, total_response_time_ms ASC);

CREATE INDEX IF NOT EXISTS idx_daily_attempts_player_cycle 
    ON daily_attempts(player_msisdn, attempt_date) 
    INCLUDE (score, total_response_time_ms, is_completed);

CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_rank 
    ON weekly_leaderboard(competition_id, rank ASC);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_active_pool 
    ON quiz_questions(is_active, pool, difficulty) 
    WHERE is_active = TRUE;

-- 6. Currency Precision Alignment
ALTER TABLE weekly_competitions
    ALTER COLUMN prize_pool_etb TYPE NUMERIC(12,2),
    ALTER COLUMN prize_pool_etb SET DEFAULT 50000.00;

ALTER TABLE weekly_leaderboard
    ALTER COLUMN prize_etb TYPE NUMERIC(12,2),
    ALTER COLUMN prize_etb SET DEFAULT 0.00;

ALTER TABLE daily_challenges
    ALTER COLUMN prize_pool_etb TYPE NUMERIC(12,2),
    ALTER COLUMN prize_pool_etb SET DEFAULT 5000.00;

COMMIT;
