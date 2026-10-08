-- ==============================================================================
-- EthioFantasy — Migration 010: Enterprise Authoritative Grading & Security Hardening
-- Target: PostgreSQL 16 (GCP Cloud SQL / Container Stack)
-- Scope:
-- 1. Relational Integrity: Enforce Foreign Key constraints across player activities
-- 2. Performance Indexing: Covering indexes for real-time leaderboards & question pools
-- 3. Audit Ledger Hardening: Composite indexes on admin audit trail
-- 4. Authoritative Shortcode 9401 & 2.00 ETB Tariff Lock
-- ==============================================================================

BEGIN;

-- 1. Ensure all referenced player records exist before foreign key enforcement
INSERT INTO players (msisdn, masked_msisdn, last_active_at)
SELECT DISTINCT player_msisdn, 
       CONCAT(SUBSTRING(player_msisdn FROM 1 FOR 3), '*****', SUBSTRING(player_msisdn FROM LENGTH(player_msisdn)-2 FOR 3)),
       NOW()
FROM daily_attempts
WHERE player_msisdn NOT IN (SELECT msisdn FROM players)
ON CONFLICT (msisdn) DO NOTHING;

INSERT INTO players (msisdn, masked_msisdn, last_active_at)
SELECT DISTINCT player_msisdn, 
       CONCAT(SUBSTRING(player_msisdn FROM 1 FOR 3), '*****', SUBSTRING(player_msisdn FROM LENGTH(player_msisdn)-2 FOR 3)),
       NOW()
FROM player_progress
WHERE player_msisdn NOT IN (SELECT msisdn FROM players)
ON CONFLICT (msisdn) DO NOTHING;

INSERT INTO players (msisdn, masked_msisdn, last_active_at)
SELECT DISTINCT msisdn, 
       CONCAT(SUBSTRING(msisdn FROM 1 FOR 3), '*****', SUBSTRING(msisdn FROM LENGTH(msisdn)-2 FOR 3)),
       NOW()
FROM subscriptions
WHERE msisdn NOT IN (SELECT msisdn FROM players)
ON CONFLICT (msisdn) DO NOTHING;

-- 2. Foreign Key Constraints Enforcement
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_daily_attempts_player' AND table_name = 'daily_attempts'
    ) THEN
        ALTER TABLE daily_attempts
            ADD CONSTRAINT fk_daily_attempts_player 
            FOREIGN KEY (player_msisdn) REFERENCES players(msisdn) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_player_progress_player' AND table_name = 'player_progress'
    ) THEN
        ALTER TABLE player_progress
            ADD CONSTRAINT fk_player_progress_player 
            FOREIGN KEY (player_msisdn) REFERENCES players(msisdn) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_weekly_lb_player' AND table_name = 'weekly_leaderboard'
    ) THEN
        ALTER TABLE weekly_leaderboard
            ADD CONSTRAINT fk_weekly_lb_player 
            FOREIGN KEY (player_msisdn) REFERENCES players(msisdn) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Composite Covering Indexes for Sub-Millisecond Leaderboards
CREATE INDEX IF NOT EXISTS idx_daily_attempts_covering 
    ON daily_attempts(attempt_date, is_completed, score DESC, total_response_time_ms ASC)
    INCLUDE (player_msisdn, final_submission_timestamp);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_level_pool 
    ON quiz_questions(level_id, pool, is_active)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_daily_active 
    ON quiz_questions(pool, is_active)
    WHERE is_active = TRUE AND pool = 'DAILY_CHALLENGE';

CREATE INDEX IF NOT EXISTS idx_admin_audit_lookup 
    ON admin_audit_logs(admin_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_object 
    ON admin_audit_logs(object_type, object_id, created_at DESC);

-- 4. Authoritative Service Configuration State
UPDATE service_settings
SET shortcode = '9401',
    daily_subscription_price_birr = 2.00,
    subscription_instruction = 'Send OK to 9401',
    system_mode = 'PRODUCTION',
    updated_at = NOW(),
    updated_by = 'migration_010_enterprise_hardening'
WHERE id = 1;

COMMIT;
