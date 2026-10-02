-- ==============================================================================
-- EthioFantasy — Migration 002: Football Quiz Expansion
-- Adds player competitive metadata, multi-language questions, and match history
-- ==============================================================================

-- 1. Player Progression & Matchmaking Columns
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elo_rating INT NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS streak_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_matches INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_wins INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date DATE,
  ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_players_elo ON players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_xp ON players(xp DESC);

-- 2. Expand Quiz Questions to Support Trilingual Content & Categories
ALTER TABLE quiz_questions
  ALTER COLUMN level_id DROP NOT NULL,
  ALTER COLUMN question_text DROP NOT NULL,
  ALTER COLUMN options DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS prompt_en TEXT,
  ADD COLUMN IF NOT EXISTS prompt_am TEXT,
  ADD COLUMN IF NOT EXISTS prompt_om TEXT,
  ADD COLUMN IF NOT EXISTS options_en JSONB,
  ADD COLUMN IF NOT EXISTS options_am JSONB,
  ADD COLUMN IF NOT EXISTS options_om JSONB,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'world-cup',
  ADD COLUMN IF NOT EXISTS difficulty INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fact TEXT,
  ADD COLUMN IF NOT EXISTS learning_tip TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_active ON quiz_questions(is_active);

-- 3. Match History Table for Server-Authoritative 1v1 and Casual Matches
CREATE TABLE IF NOT EXISTS match_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_msisdn VARCHAR(20) NOT NULL,
    match_type VARCHAR(50) NOT NULL,
    competition_id VARCHAR(50),
    score INT NOT NULL DEFAULT 0,
    accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
    correct INT NOT NULL DEFAULT 0,
    total INT NOT NULL DEFAULT 0,
    coins_earned INT NOT NULL DEFAULT 0,
    xp_earned INT NOT NULL DEFAULT 0,
    rating_earned NUMERIC(4,1) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_history_player ON match_history(player_msisdn);
CREATE INDEX IF NOT EXISTS idx_match_history_created_at ON match_history(created_at);
