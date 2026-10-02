-- ==============================================================================
-- EthioFantasy Migration 004: SP-MA Shortcode 6415 & Sample Subscriber Registry
-- Applies Telecom Shortcode 6415 and seeds active subscribers
-- ==============================================================================

-- 1. Update service settings to use Shortcode 6415
UPDATE service_settings 
SET shortcode = '6415', 
    subscription_instruction = 'Send OK to 6415',
    updated_at = NOW(),
    updated_by = 'system_migration_004'
WHERE id = 1;

-- 2. Create test subscriber OTP pairs lookup table
CREATE TABLE IF NOT EXISTS test_subscriber_otps (
    msisdn VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    default_otp VARCHAR(10) NOT NULL,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'daily',
    tier VARCHAR(20) NOT NULL DEFAULT 'Gold',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed verified sample subscribers
INSERT INTO test_subscriber_otps (msisdn, name, default_otp, plan_type, tier, notes)
VALUES
    ('251911000000', 'Test Subscriber 1', '123456', 'daily', 'VIP', 'Primary Automated Test Account'),
    ('251911000001', 'Yared Tesfaye', '123456', 'daily', 'Gold', 'VIP Daily Contestant'),
    ('251911000002', 'Abebe Bikila', '849201', 'daily', 'Silver', 'Simulation Benchmark Account'),
    ('251965112122', 'EthioFantasy Demo Player', '849201', 'daily', 'VIP', 'Client Prototype Demo Player'),
    ('251900112233', 'Kenenisa Bekele', '123456', 'daily', 'Bronze', 'QA Test Account 4'),
    ('251912345678', 'Haile Gebrselassie', '849201', 'daily', 'Gold', 'QA Test Account 5'),
    ('251977889900', 'Derartu Tulu', '123456', 'daily', 'VIP', 'Telecom Auditor Verified Account')
ON CONFLICT (msisdn) DO UPDATE 
SET default_otp = EXCLUDED.default_otp,
    tier = EXCLUDED.tier,
    plan_type = EXCLUDED.plan_type;

-- 3. Ensure all sample subscribers exist in players table
INSERT INTO players (msisdn, masked_msisdn, name, telecom_circle, is_subscribed, subscription_tier, last_active_at)
VALUES
    ('251911000000', '251*****000', 'Test Subscriber 1', 'Addis Ababa Zone 1', TRUE, 'VIP', NOW()),
    ('251911000001', '251*****001', 'Yared Tesfaye', 'Addis Ababa Central', TRUE, 'Gold', NOW()),
    ('251911000002', '251*****002', 'Abebe Bikila', 'Oromia North', TRUE, 'Silver', NOW()),
    ('251965112122', '251*****122', 'EthioFantasy Demo Player', 'Addis Ababa Central', TRUE, 'VIP', NOW()),
    ('251900112233', '251*****233', 'Kenenisa Bekele', 'Oromia South', TRUE, 'Bronze', NOW()),
    ('251912345678', '251*****678', 'Haile Gebrselassie', 'Sidama Region', TRUE, 'Gold', NOW()),
    ('251977889900', '251*****900', 'Derartu Tulu', 'Arsi Zone', TRUE, 'VIP', NOW())
ON CONFLICT (msisdn) DO UPDATE
SET is_subscribed = TRUE,
    telecom_circle = EXCLUDED.telecom_circle,
    subscription_tier = EXCLUDED.subscription_tier;

-- 4. Seed active subscription records for sample subscribers
INSERT INTO subscriptions (msisdn, shortcode, service_id, status, plan_type, auto_renew, renew_count, last_billed_at, next_billing_at, created_at, updated_at)
VALUES
    ('251911000000', '6415', '4', 'ACTIVE', 'daily', TRUE, 42, NOW(), NOW() + INTERVAL '1 day', NOW() - INTERVAL '42 days', NOW()),
    ('251911000001', '6415', '4', 'ACTIVE', 'daily', TRUE, 15, NOW(), NOW() + INTERVAL '1 day', NOW() - INTERVAL '15 days', NOW()),
    ('251911000002', '6415', '4', 'ACTIVE', 'daily', TRUE, 8, NOW(), NOW() + INTERVAL '1 day', NOW() - INTERVAL '8 days', NOW()),
    ('251965112122', '6415', '4', 'ACTIVE', 'daily', TRUE, 30, NOW(), NOW() + INTERVAL '1 day', NOW() - INTERVAL '30 days', NOW()),
    ('251900112233', '6415', '4', 'ACTIVE', 'daily', TRUE, 5, NOW(), NOW() + INTERVAL '1 day', NOW() - INTERVAL '5 days', NOW()),
    ('251912345678', '6415', '4', 'ACTIVE', 'daily', TRUE, 22, NOW(), NOW() + INTERVAL '1 day', NOW() - INTERVAL '22 days', NOW()),
    ('251977889900', '6415', '4', 'ACTIVE', 'daily', TRUE, 60, NOW(), NOW() + INTERVAL '1 day', NOW() - INTERVAL '60 days', NOW())
ON CONFLICT (msisdn) DO UPDATE
SET status = 'ACTIVE',
    shortcode = '6415',
    auto_renew = TRUE,
    next_billing_at = NOW() + INTERVAL '1 day',
    updated_at = NOW();

-- 5. Persistent OTP store table for realtime SP-MA sync
CREATE TABLE IF NOT EXISTS otp_verification_codes (
    msisdn VARCHAR(20) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'SMS_6415',
    sp_transaction_id VARCHAR(100),
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'DISPATCHED_TO_MA',
    expires_at TIMESTAMPTZ NOT NULL,
    attempts_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
