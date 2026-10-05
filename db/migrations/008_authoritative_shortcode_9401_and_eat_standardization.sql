-- ==============================================================================
-- EthioFantasy Migration 008: Authoritative Shortcode 9401 & EAT Standardization
-- 1. Unifies all shortcodes to Ethio Telecom Shortcode 9401
-- 2. Standardizes tariffs to 2.00 ETB / day
-- 3. Standardizes channel codes to SMS_9401
-- 4. Reconciles weekly competitions to ISO-8601 Calendar Week 41 (2026-10-05 to 2026-10-11)
-- 5. Ensures prize structures and daily challenge readiness
-- ==============================================================================

-- 1. Update Service Settings to Authoritative Shortcode 9401 and 2 ETB Tariff
UPDATE service_settings
SET shortcode = '9401',
    subscription_instruction = 'Send OK to 9401',
    daily_subscription_price_birr = 2.00,
    service_notice_banner = 'EthioFantasy Official Daily & Weekly Competitions active for all Ethio Telecom subscribers on Shortcode 9401.',
    updated_at = NOW(),
    updated_by = 'system_migration_008'
WHERE id = 1;

-- Set column defaults
ALTER TABLE service_settings
    ALTER COLUMN shortcode SET DEFAULT '9401',
    ALTER COLUMN subscription_instruction SET DEFAULT 'Send OK to 9401',
    ALTER COLUMN daily_subscription_price_birr SET DEFAULT 2.00;

-- 2. Reconcile Subscriptions Table to 9401 and 2.00 ETB
UPDATE subscriptions
SET shortcode = '9401',
    channel = 'SMS_9401',
    price_etb = 2.00,
    updated_at = NOW();

ALTER TABLE subscriptions
    ALTER COLUMN shortcode SET DEFAULT '9401',
    ALTER COLUMN channel SET DEFAULT 'SMS_9401',
    ALTER COLUMN price_etb SET DEFAULT 2.00;

-- 3. Ensure Default Weekly Prize Structure in Weekly Competitions
UPDATE weekly_competitions
SET prize_pool_etb = 50000.00,
    prize_rules = '[
      {"rank": 1, "label": "1st Place Champion", "prizeAmountBirr": 20000, "prizeType": "TELEBIRR_CASH", "description": "Top weekly 7-day score + fastest cumulative time"},
      {"rank": 2, "label": "2nd Place Runner-Up", "prizeAmountBirr": 12000, "prizeType": "TELEBIRR_CASH", "description": "2nd best weekly score"},
      {"rank": 3, "label": "3rd Place Bronze", "prizeAmountBirr": 5000, "prizeType": "TELEBIRR_CASH", "description": "3rd best weekly score"},
      {"rank": 4, "label": "4th–10th Places", "prizeAmountBirr": 1000, "prizeType": "TELEBIRR_CASH", "description": "Top 10 leaderboard contenders"}
    ]'::jsonb
WHERE prize_rules IS NULL OR prize_rules = '[]'::jsonb;

-- 4. Reconcile Active Competition to Real-Time ISO Week 41 (Monday 2026-10-05 to Sunday 2026-10-11 23:59:59 EAT)
-- If cycle 39 exists, mark as FINALIZED / SETTLED
UPDATE weekly_competitions
SET status = 'FINALIZED',
    settlement_status = 'SETTLED',
    finalized_at = NOW(),
    finalized_by = 'system_migration_008'
WHERE competition_id = 'comp_cycle_2026_w39';

-- Insert or ensure Active Cycle 41 exists
INSERT INTO weekly_competitions (
    competition_id, cycle_number, start_date, end_date, status, prize_pool_etb,
    title, period_label, prize_rules, settlement_status
)
VALUES (
    'comp_cycle_2026_w41',
    41,
    '2026-10-05',
    '2026-10-11',
    'ACTIVE',
    50000.00,
    '7-Day Telecom Championship (Cycle 41)',
    'Week 41: 2026-10-05 — 2026-10-11',
    '[
      {"rank": 1, "label": "1st Place Champion", "prizeAmountBirr": 20000, "prizeType": "TELEBIRR_CASH", "description": "Top weekly 7-day score + fastest cumulative time"},
      {"rank": 2, "label": "2nd Place Runner-Up", "prizeAmountBirr": 12000, "prizeType": "TELEBIRR_CASH", "description": "2nd best weekly score"},
      {"rank": 3, "label": "3rd Place Bronze", "prizeAmountBirr": 5000, "prizeType": "TELEBIRR_CASH", "description": "3rd best weekly score"},
      {"rank": 4, "label": "4th–10th Places", "prizeAmountBirr": 1000, "prizeType": "TELEBIRR_CASH", "description": "Top 10 leaderboard contenders"}
    ]'::jsonb,
    'UNSETTLED'
)
ON CONFLICT (competition_id) DO UPDATE
SET status = 'ACTIVE',
    start_date = '2026-10-05',
    end_date = '2026-10-11',
    title = EXCLUDED.title,
    period_label = EXCLUDED.period_label,
    prize_rules = EXCLUDED.prize_rules;

-- Copy or initialize top leaderboard contenders into cycle 41 if needed
INSERT INTO weekly_leaderboard (competition_id, player_msisdn, masked_msisdn, total_7day_score, total_response_time_ms, rank, prize_etb)
SELECT 'comp_cycle_2026_w41', player_msisdn, masked_msisdn, total_7day_score, total_response_time_ms, rank, prize_etb
FROM weekly_leaderboard
WHERE competition_id = 'comp_cycle_2026_w39'
ON CONFLICT (competition_id, player_msisdn) DO NOTHING;

-- 5. Ensure Today's Daily Challenge exists in DB to prevent foreign key errors
INSERT INTO daily_challenges (
    challenge_id, challenge_date, title, prize_pool_etb, questions, status, start_time, end_time,
    time_limit_seconds, min_passing_score, prize_rules
)
VALUES (
    'dc_2026-10-05',
    '2026-10-05',
    'Daily Football Challenge — 2026-10-05',
    5000.00,
    (
        SELECT jsonb_agg(q)
        FROM (
            SELECT id, category, question_text as "questionText",
                   options, correct_index as "correctAnswerIndex",
                   image_url as "imageUrl", image_caption as "imageCaption",
                   explanation, difficulty, type
            FROM quiz_questions
            WHERE is_active = TRUE
            ORDER BY id ASC
            LIMIT 10
        ) q
    ),
    'OPEN',
    '00:00',
    '23:59',
    10,
    5,
    '[
      {"rank": 1, "label": "1st Place Champion", "prizeAmountBirr": 1000, "prizeType": "TELEBIRR_CASH", "description": "Top score + fastest time"},
      {"rank": 2, "label": "2nd Place Runner-Up", "prizeAmountBirr": 500, "prizeType": "TELEBIRR_CASH", "description": "2nd best score"},
      {"rank": 3, "label": "3rd Place Bronze", "prizeAmountBirr": 250, "prizeType": "TELEBIRR_CASH", "description": "3rd best score"}
    ]'::jsonb
)
ON CONFLICT (challenge_date) DO UPDATE
SET status = 'OPEN',
    start_time = '00:00',
    end_time = '23:59';
