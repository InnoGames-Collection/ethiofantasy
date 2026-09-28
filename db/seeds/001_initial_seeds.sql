-- ==============================================================================
-- EthioFantasy — Baseline Seeds
-- Default Admin Users, Initial Weekly Competition & Seed Contenders
-- ==============================================================================

-- 1. Default Telecom Admin Users (Passwords hashed with bcrypt: 'AdminPass@2026')
INSERT INTO admin_users (id, username, email, password_hash, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'superadmin', 'admin@ethiofantasy.innopulseplatform.com', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'SUPER_ADMIN'),
    ('a0000000-0000-0000-0000-000000000002', 'telecom_auditor', 'auditor@ethiofantasy.innopulseplatform.com', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'AUDITOR'),
    ('a0000000-0000-0000-0000-000000000003', 'ops_manager', 'ops@ethiofantasy.innopulseplatform.com', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'OPERATOR')
ON CONFLICT (username) DO NOTHING;

-- 2. Initial Active 7-Day Competition Cycle
INSERT INTO weekly_competitions (competition_id, cycle_number, start_date, end_date, status, prize_pool_etb)
VALUES 
    ('comp_cycle_2026_w39', 39, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'ACTIVE', 50000)
ON CONFLICT (competition_id) DO NOTHING;

-- 3. Top 10 Weekly Contenders (Masked MSISDNs per Ethio Telecom privacy regulation)
INSERT INTO weekly_leaderboard (competition_id, player_msisdn, masked_msisdn, total_7day_score, total_response_time_ms, rank, prize_etb)
VALUES
    ('comp_cycle_2026_w39', '251911429910', '091*****910', 685, 34200, 1, 20000),
    ('comp_cycle_2026_w39', '251922883344', '092*****344', 662, 38100, 2, 12000),
    ('comp_cycle_2026_w39', '251933001122', '093*****122', 648, 41500, 3, 5000),
    ('comp_cycle_2026_w39', '251944556677', '094*****677', 625, 45200, 4, 1000),
    ('comp_cycle_2026_w39', '251955112233', '095*****233', 612, 48900, 5, 1000),
    ('comp_cycle_2026_w39', '251966778899', '096*****899', 598, 51200, 6, 1000),
    ('comp_cycle_2026_w39', '251977334455', '097*****455', 584, 53400, 7, 1000),
    ('comp_cycle_2026_w39', '251988990011', '098*****011', 571, 56000, 8, 1000),
    ('comp_cycle_2026_w39', '251999223344', '099*****344', 559, 58300, 9, 1000),
    ('comp_cycle_2026_w39', '251910556677', '091*****677', 542, 61000, 10, 1000)
ON CONFLICT (competition_id, player_msisdn) DO NOTHING;

-- 4. Initial Baseline Quiz Levels (First 10 of 100 as initial SQL seed; full 100 populated dynamically)
INSERT INTO quiz_levels (id, chapter_name, category_title, title, subtitle, icon_type, accent_color, required_stars)
VALUES
    (1, 'Beginner', 'FOOTBALL BASICS', 'Kickoff & Basics I', 'Foundations, team size and essential kickoff rules', 'ball', 'from-blue-600 to-indigo-600', 0),
    (2, 'Beginner', 'FOOTBALL BASICS', 'Passing & Movement II', 'Passing, movement and ball control fundamentals', 'ball', 'from-blue-600 to-indigo-600', 2),
    (3, 'Beginner', 'FOOTBALL BASICS', 'Match Flow III', 'Match periods, substitutions and game flow', 'ball', 'from-blue-600 to-indigo-600', 5),
    (4, 'Beginner', 'FOOTBALL BASICS', 'Positions & Gear IV', 'Positions, jerseys and standard equipment', 'ball', 'from-blue-600 to-indigo-600', 8),
    (5, 'Beginner', 'FOOTBALL BASICS', 'Basics Mastery V', 'Mastery of core football fundamentals', 'ball', 'from-blue-600 to-indigo-600', 11),
    (6, 'Amateur', 'LAWS OF THE GAME', 'Restarts & Offside I', 'Offside rules, restarts and throw-in laws', 'referee', 'from-sky-600 to-blue-700', 14),
    (7, 'Amateur', 'LAWS OF THE GAME', 'Free Kicks II', 'Free kicks, drop balls and advantage play', 'referee', 'from-sky-600 to-blue-700', 17),
    (8, 'Amateur', 'LAWS OF THE GAME', 'Handball & Passes III', 'Handball criteria and back-pass regulations', 'referee', 'from-sky-600 to-blue-700', 20),
    (9, 'Amateur', 'LAWS OF THE GAME', 'Penalties & Goal Kicks IV', 'Penalty box regulations and goal kicks', 'referee', 'from-sky-600 to-blue-700', 23),
    (10, 'Amateur', 'LAWS OF THE GAME', 'Referee Decisions V', 'Expert IFAB laws and refereeing decisions', 'referee', 'from-sky-600 to-blue-700', 26)
ON CONFLICT (id) DO NOTHING;
