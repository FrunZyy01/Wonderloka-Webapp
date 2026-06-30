-- ============================================================
-- DATA DUMMY: Untuk testing fitur MIS dan dashboard
-- Wonderloka
-- ============================================================
-- CARA PAKAI:
-- 1. Jalankan wonderloka.sql terlebih dahulu
-- 2. Jalankan migration_pengelola_mis.sql
-- 3. Jalankan file ini (data_dummy.sql)
-- ============================================================

USE wonderloka;

-- ============================================================
-- CARI DATA YANG SUDAH ADA TERLEBIH DAHULU
-- ============================================================

-- Cek destinasi yang ada
SELECT 'Destinasi yang tersedia:' AS info;
SELECT id_destinasi, nama, kategori FROM destination LIMIT 20;

-- ============================================================
-- 1. AKUN DUMMY - WISATAWAN
-- ============================================================
-- Password untuk semua: wonderloka123

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role)
SELECT 'andi_wisatawan', 'andi@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Andi Pratama', '+6281111111111', 'wisatawan'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'andi@email.com');

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role)
SELECT 'budi_wisatawan', 'budi@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Budi Santoso', '+6282222222222', 'wisatawan'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'budi@email.com');

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role)
SELECT 'citra_wisatawan', 'citra@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Citra Dewi', '+6283333333333', 'wisatawan'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'citra@email.com');

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role)
SELECT 'diana_wisatawan', 'diana@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Diana Putri', '+6284444444444', 'wisatawan'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'diana@email.com');

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role)
SELECT 'eka_wisatawan', 'eka@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Eka Rahmawati', '+6285555555555', 'wisatawan'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'eka@email.com');

-- ============================================================
-- 2. AKUN DUMMY - PENGUSAHA
-- ============================================================

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role, nama_usaha, kategori_usaha, deskripsi_usaha, foto_usaha, banner_usaha, jam_buka, jam_tutup, status_usaha)
SELECT 'host_bukit', 'host.bukit@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Ahmad Wijaya', '+6281234567890', 'pengusaha', 'Bukit Pengilon Camp', 'Alam', 'Nikmati pemandangan laut selatan dari atas perbukitan hijau dengan sensasi perkemahan yang sejuk dan panorama tebing eksotis.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop', '06:00:00', '18:00:00', 'buka'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'host.bukit@email.com');

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role, nama_usaha, kategori_usaha, deskripsi_usaha, foto_usaha, banner_usaha, jam_buka, jam_tutup, status_usaha)
SELECT 'host_bali', 'host.bali@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Made Suryani', '+6282234567890', 'pengusaha', 'Pura Tours Bali', 'Budaya', 'Tur eksklusif menjelajahi pura-pura bersejarah di Bali dengan guide lokal berpengalaman.', 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400&h=250&fit=crop', 'https://images.unsplash.com/photo-1537996194471-e657df975ab3f?w=1200&h=400&fit=crop', '08:00:00', '20:00:00', 'buka'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'host.bali@email.com');

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role, nama_usaha, kategori_usaha, deskripsi_usaha, foto_usaha, banner_usaha, jam_buka, jam_tutup, status_usaha)
SELECT 'host_kuliner', 'host.kuliner@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4z3F7cPUCOzuWJz.', 'Siti Rahayu', '+6283234567890', 'pengusaha', 'Jogja Food Tour', 'Kuliner', 'Tur kuliner autentik menjelajahi gudeg, bakpia, dan street food legendaris Yogyakarta.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=400&fit=crop', '10:00:00', '22:00:00', 'buka'
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'host.kuliner@email.com');

-- ============================================================
-- 3. BOOKINGS DUMMY
-- ============================================================
-- Menggunakan SELECT untuk mendapatkan ID yang valid

-- Hapus bookings dummy lama (jika ada, berdasarkan email user dummy)
DELETE b FROM bookings b
JOIN user u ON b.id_user = u.id_user
WHERE u.email IN ('andi@email.com', 'budi@email.com', 'citra@email.com', 'diana@email.com', 'eka@email.com');

-- Insert bookings baru dengan ID dari SELECT
INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Bukit Pengilon' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    DATE_ADD(CURDATE(), INTERVAL 7 DAY),
    2,
    30000,
    'menunggu',
    NOW()
FROM user u WHERE u.email = 'andi@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Pantai Kuta' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    DATE_ADD(CURDATE(), INTERVAL 5 DAY),
    3,
    36000,
    'dikonfirmasi',
    NOW()
FROM user u WHERE u.email = 'budi@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Gunung Bromo' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    DATE_ADD(CURDATE(), INTERVAL 3 DAY),
    4,
    100000,
    'dikonfirmasi',
    NOW()
FROM user u WHERE u.email = 'citra@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Danau Toba' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    DATE_ADD(CURDATE(), INTERVAL 2 DAY),
    2,
    40000,
    'selesai',
    NOW()
FROM user u WHERE u.email = 'diana@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Bukit Pengilon' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    CURDATE(),
    1,
    15000,
    'menunggu',
    NOW()
FROM user u WHERE u.email = 'eka@email.com';

-- Bookings bulan lalu
INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi DESC LIMIT 1 OFFSET 0),
    DATE_SUB(CURDATE(), INTERVAL 20 DAY),
    2,
    70000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 20 DAY)
FROM user u WHERE u.email = 'andi@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi DESC LIMIT 1 OFFSET 1),
    DATE_SUB(CURDATE(), INTERVAL 18 DAY),
    4,
    72000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 18 DAY)
FROM user u WHERE u.email = 'budi@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi DESC LIMIT 1 OFFSET 2),
    DATE_SUB(CURDATE(), INTERVAL 15 DAY),
    3,
    66000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 15 DAY)
FROM user u WHERE u.email = 'citra@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi DESC LIMIT 1 OFFSET 3),
    DATE_SUB(CURDATE(), INTERVAL 10 DAY),
    5,
    150000,
    'dikonfirmasi',
    DATE_SUB(NOW(), INTERVAL 10 DAY)
FROM user u WHERE u.email = 'diana@email.com';

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi DESC LIMIT 1 OFFSET 4),
    DATE_SUB(CURDATE(), INTERVAL 5 DAY),
    2,
    30000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM user u WHERE u.email = 'eka@email.com';

-- Bookings 2-6 bulan lalu
INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi ASC LIMIT 1 OFFSET ((NOW() % 20) + 0)),
    DATE_SUB(CURDATE(), INTERVAL 45 DAY),
    3,
    84000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 45 DAY)
FROM user u WHERE u.email = 'andi@email.com'
AND (SELECT COUNT(*) FROM destination) > 0;

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi ASC LIMIT 1 OFFSET ((NOW() % 20) + 1)),
    DATE_SUB(CURDATE(), INTERVAL 70 DAY),
    4,
    80000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 70 DAY)
FROM user u WHERE u.email = 'budi@email.com'
AND (SELECT COUNT(*) FROM destination) > 1;

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi ASC LIMIT 1 OFFSET ((NOW() % 20) + 2)),
    DATE_SUB(CURDATE(), INTERVAL 95 DAY),
    5,
    175000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 95 DAY)
FROM user u WHERE u.email = 'citra@email.com'
AND (SELECT COUNT(*) FROM destination) > 2;

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi ASC LIMIT 1 OFFSET ((NOW() % 20) + 3)),
    DATE_SUB(CURDATE(), INTERVAL 120 DAY),
    3,
    75000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 120 DAY)
FROM user u WHERE u.email = 'diana@email.com'
AND (SELECT COUNT(*) FROM destination) > 3;

INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status, created_at)
SELECT
    u.id_user,
    (SELECT id_destinasi FROM destination ORDER BY id_destinasi ASC LIMIT 1 OFFSET ((NOW() % 20) + 4)),
    DATE_SUB(CURDATE(), INTERVAL 145 DAY),
    4,
    120000,
    'selesai',
    DATE_SUB(NOW(), INTERVAL 145 DAY)
FROM user u WHERE u.email = 'eka@email.com'
AND (SELECT COUNT(*) FROM destination) > 4;

-- ============================================================
-- 4. REVIEWS DUMMY
-- ============================================================

-- Hapus reviews lama dari user dummy
DELETE r FROM reviews r
JOIN user u ON r.id_user = u.id_user
WHERE u.email IN ('andi@email.com', 'budi@email.com', 'citra@email.com', 'diana@email.com', 'eka@email.com');

-- Insert reviews dengan ID dari SELECT
INSERT INTO reviews (id_user, id_destinasi, rating, komentar, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Bukit Pengilon' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    4.5,
    'Tempatnya sangat indah! Pemandangannya luar biasa, wajib dikunjungi!',
    DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM user u WHERE u.email = 'andi@email.com';

INSERT INTO reviews (id_user, id_destinasi, rating, komentar, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Pantai Kuta' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    4.0,
    'Pantai yang bagus untuk bersantai bersama keluarga.',
    DATE_SUB(NOW(), INTERVAL 10 DAY)
FROM user u WHERE u.email = 'budi@email.com';

INSERT INTO reviews (id_user, id_destinasi, rating, komentar, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Gunung Bromo' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    5.0,
    'Sunrise di Bromo nggak ada duanya! Spektakuler!',
    DATE_SUB(NOW(), INTERVAL 15 DAY)
FROM user u WHERE u.email = 'citra@email.com';

INSERT INTO reviews (id_user, id_destinasi, rating, komentar, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Danau Toba' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    4.0,
    'Danau yang tenang dan pemandangannya bagus sekali.',
    DATE_SUB(NOW(), INTERVAL 20 DAY)
FROM user u WHERE u.email = 'diana@email.com';

INSERT INTO reviews (id_user, id_destinasi, rating, komentar, created_at)
SELECT
    u.id_user,
    COALESCE(
        (SELECT id_destinasi FROM destination WHERE nama = 'Raja Ampat' LIMIT 1),
        (SELECT id_destinasi FROM destination LIMIT 1)
    ),
    4.8,
    'Surga bawah laut! Sangat direkomendasikan untuk diving.',
    DATE_SUB(NOW(), INTERVAL 25 DAY)
FROM user u WHERE u.email = 'eka@email.com';

-- ============================================================
-- 5. SEARCH LOGS DUMMY
-- ============================================================

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT u.id_user, 'bukit sunrise jogja', DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM user u WHERE u.email = 'andi@email.com';

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT u.id_user, 'pantai tersembunyi bali', DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM user u WHERE u.email = 'budi@email.com';

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'tempat camping', DATE_SUB(NOW(), INTERVAL 2 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'kuliner bandung', DATE_SUB(NOW(), INTERVAL 2 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'bali murah', DATE_SUB(NOW(), INTERVAL 3 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'gunung bromo', DATE_SUB(NOW(), INTERVAL 3 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'raja ampat', DATE_SUB(NOW(), INTERVAL 4 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'danau toba', DATE_SUB(NOW(), INTERVAL 4 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'nusa penida', DATE_SUB(NOW(), INTERVAL 5 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'kawah ijen', DATE_SUB(NOW(), INTERVAL 5 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'borobudur', DATE_SUB(NOW(), INTERVAL 6 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'pantai kuta', DATE_SUB(NOW(), INTERVAL 7 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'komodo', DATE_SUB(NOW(), INTERVAL 7 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'taman nasional', DATE_SUB(NOW(), INTERVAL 8 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'air terjun', DATE_SUB(NOW(), INTERVAL 8 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'candi Prambanan', DATE_SUB(NOW(), INTERVAL 9 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'jogja', DATE_SUB(NOW(), INTERVAL 10 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'malang', DATE_SUB(NOW(), INTERVAL 11 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'surabaya', DATE_SUB(NOW(), INTERVAL 12 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'yogyakarta', DATE_SUB(NOW(), INTERVAL 13 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'bromo', DATE_SUB(NOW(), INTERVAL 14 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'tumpak sewu', DATE_SUB(NOW(), INTERVAL 15 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'merbabu', DATE_SUB(NOW(), INTERVAL 16 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'merapi', DATE_SUB(NOW(), INTERVAL 17 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'kelingking beach', DATE_SUB(NOW(), INTERVAL 18 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'tirta empul', DATE_SUB(NOW(), INTERVAL 19 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'uluwatu', DATE_SUB(NOW(), INTERVAL 20 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'tanah lot', DATE_SUB(NOW(), INTERVAL 21 DAY);

INSERT INTO search_logs (id_user, keyword, created_at)
SELECT NULL, 'penglipuran', DATE_SUB(NOW(), INTERVAL 22 DAY);

-- ============================================================
-- 6. UPDATE DESTINASI DENGAN ID_OWNER
-- ============================================================

UPDATE destination d
JOIN user u ON u.email = 'host.bukit@email.com'
SET d.id_owner = u.id_user
WHERE d.nama = 'Bukit Pengilon'
AND u.role = 'pengusaha';

UPDATE destination d
JOIN user u ON u.email = 'host.bali@email.com'
SET d.id_owner = u.id_user
WHERE d.nama IN ('Pura Tanah Lot', 'Nusa Penida')
AND u.role = 'pengusaha';

UPDATE destination d
JOIN user u ON u.email = 'host.kuliner@email.com'
SET d.id_owner = u.id_user
WHERE d.nama IN ('Pusat Oleh-Oleh Malioboro', 'Wisata Kuliner Bandung')
AND u.role = 'pengusaha';

-- ============================================================
-- SELESAI
-- ============================================================
-- ✅ Data dummy berhasil ditambahkan!
-- ============================================================
