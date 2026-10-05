-- ==============================================================================
-- EthioFantasy — Migration 007: Enterprise Admin Portal Production Hardening
-- Target: PostgreSQL 16 (GCP Cloud SQL / Container Stack)
-- Scope:
-- 1. Immutable, Tamper-Evident Admin Action Ledger (Trigger-guarded)
-- 2. Zero-Trust Admin Authentication, Lockouts & Revocation Store
-- 3. High-Performance Composite Indexes for High-Volume Admin Views
-- 4. Authoritative Question Image Asset Catalog
-- 5. Atomic Tournament Settlement & State Machine Controls
-- ==============================================================================

BEGIN;

-- 1. Ensure cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Upgrade admin_audit_logs to Immutable Enterprise Specification
ALTER TABLE admin_audit_logs
    ADD COLUMN IF NOT EXISTS admin_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS object_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS object_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS old_value TEXT,
    ADD COLUMN IF NOT EXISTS new_value TEXT,
    ADD COLUMN IF NOT EXISTS before_state_json JSONB,
    ADD COLUMN IF NOT EXISTS after_state_json JSONB,
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100),
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- Create Trigger to Enforce Append-Only / Immutable Audit Log
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'TAMPER_ALERT: Deletion or modification of admin_audit_logs records is strictly prohibited by security policy.'
        USING ERRCODE = '23506';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_admin_audit_logs ON admin_audit_logs;
CREATE TRIGGER trg_immutable_admin_audit_logs
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

-- 3. Admin Users Hardening: Lockouts, Token Versioning, and Seed Passwords
ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(100);

-- Update seed passwords to known secure hash for 'EthioAdmin@2026!'
UPDATE admin_users
SET password_hash = '$2b$10$wpZBYUqhCdEIgu40LpWzb.ydsJurr2sd5PftmNmBL7.e/rzwBdh2a'
WHERE email IN ('atekele21@gmail.com', 'admin@ethiofantasy.innopulseplatform.com', 'selam.desta@ethiofantasy.et', 'yonas.k@ethiofantasy.et')
   OR id = 'a0000000-0000-0000-0000-000000000001';

-- Insert default admin users or update existing by id
INSERT INTO admin_users (id, username, email, password_hash, role, department, is_active)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Abebe Tekele', 'atekele21@gmail.com', '$2b$10$wpZBYUqhCdEIgu40LpWzb.ydsJurr2sd5PftmNmBL7.e/rzwBdh2a', 'SUPER_ADMIN', 'Telecom Value Added Services (VAS)', TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'Selamawit Desta', 'selam.desta@ethiofantasy.et', '$2b$10$wpZBYUqhCdEIgu40LpWzb.ydsJurr2sd5PftmNmBL7.e/rzwBdh2a', 'OPERATIONS_ADMIN', 'Game Operations & Competitions', TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'Yonas Kebede', 'yonas.k@ethiofantasy.et', '$2b$10$wpZBYUqhCdEIgu40LpWzb.ydsJurr2sd5PftmNmBL7.e/rzwBdh2a', 'REPORTING_ADMIN', 'Revenue Assurance & Telecom Audit', TRUE)
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active;

-- 4. Admin Revoked Tokens Store (Persistent Blacklist / Emergency Session Invalidation)
CREATE TABLE IF NOT EXISTS admin_revoked_tokens (
    token_id VARCHAR(100) PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expiry 
    ON admin_revoked_tokens(expires_at);

-- 5. Authoritative Question Image Library Table & Seed Records
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

-- Seed core images into PostgreSQL
INSERT INTO question_images (id, url, thumbnail_url, title, alt_text, category, dimensions, file_size, usage_count, tags, credit)
VALUES
    ('img-1', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80', 'Modern Football Stadium at Night', 'Illuminated professional football stadium with packed crowd', 'STADIUMS', '1920x1080', '1.2 MB', 14, ARRAY['stadium', 'night', 'arena'], 'Unsplash Sports Media'),
    ('img-2', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80', 'Match Ball on Pitch Grass', 'Classic football match ball on pristine manicured grass turf', 'MATCHES', '1600x1200', '890 KB', 18, ARRAY['ball', 'grass', 'pitch'], 'Unsplash Sports'),
    ('img-3', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=300&q=80', 'Golden Championship Trophy', 'Gold tournament trophy gleaming on pedestal under arena spotlight', 'TROPHIES', '2048x1536', '1.8 MB', 22, ARRAY['trophy', 'world cup', 'gold'], 'FIFA Heritage Archives'),
    ('img-4', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=300&q=80', 'Striker Taking Penalty Kick', 'Football player focused on ball right before penalty strike', 'PLAYERS', '1920x1080', '1.1 MB', 9, ARRAY['player', 'penalty', 'striker'], 'SportFoto International'),
    ('img-5', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=300&q=80', 'Addis Ababa Stadium Grandstand', 'Historic Addis Ababa Stadium during a packed Ethiopian Premier League fixture', 'STADIUMS', '1920x1080', '1.5 MB', 31, ARRAY['addis', 'ethiopia', 'stadium'], 'Ethio Sports Media Channel')
ON CONFLICT (id) DO UPDATE SET
    url = EXCLUDED.url,
    title = EXCLUDED.title,
    alt_text = EXCLUDED.alt_text,
    category = EXCLUDED.category;

-- 6. Tournament Settlement Schema & Constraints
ALTER TABLE weekly_competitions
    ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS finalized_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS finalized_by_id UUID,
    ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(30) DEFAULT 'UNSETTLED'
        CHECK (settlement_status IN ('UNSETTLED', 'SETTLING', 'SETTLED', 'FAILED')),
    ADD COLUMN IF NOT EXISTS total_winners INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_prizes_distributed_birr NUMERIC(12,2) DEFAULT 0.00;

-- 7. High-Performance Composite Indexes for Admin Filter & Pagination Queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_object_created
    ON admin_audit_logs(action, object_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id_created
    ON admin_audit_logs(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_players_status_last_active
    ON players(status, last_active_at DESC);

CREATE INDEX IF NOT EXISTS idx_players_msisdn_trgm
    ON players(msisdn, masked_msisdn);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_billed
    ON subscriptions(status, last_billed_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_admin_pool_filter
    ON quiz_questions(pool, status, level_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_category_diff
    ON quiz_questions(category, difficulty);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_status_date
    ON daily_challenges(status, challenge_date DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_competitions_status_cycle
    ON weekly_competitions(status, cycle_number DESC);

CREATE INDEX IF NOT EXISTS idx_prize_overrides_status_created
    ON player_prize_overrides(status, created_at DESC);

COMMIT;
