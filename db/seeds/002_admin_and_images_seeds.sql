-- ==============================================================================
-- EthioFantasy — Production Seeds 002: Admin Users, Images, and Default Settings
-- ==============================================================================

-- 1. Insert Initial Multi-Role Operations Admin Users
INSERT INTO admin_users (id, username, email, password_hash, role, department)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Abebe Tekele', 'atekele21@gmail.com', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'SUPER_ADMIN', 'Telecom Value Added Services (VAS)'),
    ('a0000000-0000-0000-0000-000000000002', 'Selamawit Desta', 'selam.desta@ethiofantasy.et', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'OPERATIONS_ADMIN', 'Game Operations & Competitions'),
    ('a0000000-0000-0000-0000-000000000003', 'Yonas Kebede', 'yonas.k@ethiofantasy.et', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'REPORTING_ADMIN', 'Revenue Assurance & Telecom Audit')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department;

-- 2. Seed High-Resolution Football Image Catalog
INSERT INTO question_images (id, url, thumbnail_url, title, alt_text, category, dimensions, file_size, usage_count, tags, credit)
VALUES
    ('img-01', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80', 'Addis Ababa Stadium floodlights', 'Historic stadium night match', 'STADIUMS', '1920x1080', '1.2 MB', 3, ARRAY['stadium', 'addis', 'ethiopia'], 'Ethio Sports Media'),
    ('img-02', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=300&q=80', 'Walia Ibex AFCON celebration', 'Ethiopian national team squad', 'PLAYERS', '1800x1200', '1.8 MB', 2, ARRAY['walia', 'afcon', 'national-team'], 'CAF Media Channel'),
    ('img-03', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=300&q=80', 'Ethiopian Premier League Trophy', 'Championship silver cup on podium', 'TROPHIES', '1200x800', '950 KB', 1, ARRAY['trophy', 'championship', 'epl'], 'Ethiopian Football Federation'),
    ('img-04', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=300&q=80', 'Sheger Derby Crowd Atmosphere', 'St. George vs Coffee packed stadium', 'MATCHES', '1920x1080', '2.1 MB', 2, ARRAY['derby', 'sheger', 'rivalry'], 'Sheger Sports Archives'),
    ('img-05', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=300&q=80', 'Bahir Dar International Arena', 'Modern international football stadium', 'STADIUMS', '2048x1152', '2.4 MB', 1, ARRAY['bahir-dar', 'arena', 'caf'], 'Amhara Sports Commission')
ON CONFLICT (id) DO NOTHING;
