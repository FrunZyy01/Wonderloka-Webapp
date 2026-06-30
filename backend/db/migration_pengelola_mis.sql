-- ============================================================
-- MIGRATION: Fitur Pengelola, MIS, Search Logs, Reviews
-- Wonderloka Database Update
-- ============================================================
-- CARA PAKAI:
-- 1. Jalankan wonderloka.sql terlebih dahulu
-- 2. Jalankan file ini (migration_pengelola_mis.sql)
-- 3. Jalankan data_dummy.sql
-- ============================================================

USE wonderloka;

-- ============================================================
-- 1. TAMBAH KOLOM PROFIL USAHA DI TABLE USER
-- ============================================================
-- Menambahkan kolom untuk mendukung profil usaha/pengelola

-- Cek apakah kolom sudah ada
SET @dbname = DATABASE();
SET @tablename = 'user';
SET @columnname = 'nama_usaha';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN nama_usaha VARCHAR(200) DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'kategori_usaha';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN kategori_usaha ENUM(''Alam'', ''Budaya'', ''Kuliner'', ''Penginapan'', ''Tour'', ''Campground'') DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'deskripsi_usaha';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN deskripsi_usaha TEXT DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'foto_usaha';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN foto_usaha VARCHAR(500) DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'banner_usaha';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN banner_usaha VARCHAR(500) DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'link_gmaps';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN link_gmaps VARCHAR(500) DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'jam_buka';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN jam_buka TIME DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'jam_tutup';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN jam_tutup TIME DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'status_usaha';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN status_usaha ENUM(''buka'', ''tutup'') DEFAULT ''buka'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'status_verifikasi';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE user ADD COLUMN status_verifikasi ENUM(''pending'', ''terverifikasi'', ''ditolak'') DEFAULT ''pending'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================
-- 2. TAMBAH KOLOM ID_OWNER DI DESTINATION
-- ============================================================
SET @tablename = 'destination';

SET @columnname = 'id_owner';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE destination ADD COLUMN id_owner INT DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'fasilitas';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE destination ADD COLUMN fasilitas TEXT DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'kontak_usaha';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE destination ADD COLUMN kontak_usaha VARCHAR(50) DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================
-- 3. TABLE SEARCH_LOGS (PENCARIAN)
-- ============================================================
CREATE TABLE IF NOT EXISTS search_logs (
    id_search INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT DEFAULT NULL,
    keyword VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_keyword (keyword),
    INDEX idx_created (created_at),
    INDEX idx_user (id_user)
);

-- ============================================================
-- 4. TABLE REVIEWS (ULASAN)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id_review INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_destinasi INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    komentar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_destinasi) REFERENCES destination(id_destinasi) ON DELETE CASCADE,
    UNIQUE KEY unique_review (id_user, id_destinasi)
);

-- ============================================================
-- 5. VIEW UNTUK MIS / ANALYTICS
-- ============================================================

DROP VIEW IF EXISTS v_bookings_per_month;
CREATE VIEW v_bookings_per_month AS
SELECT
    YEAR(created_at) AS tahun,
    MONTH(created_at) AS bulan,
    MONTHNAME(created_at) AS nama_bulan,
    COUNT(*) AS total_pesanan,
    COALESCE(SUM(total_harga), 0) AS total_pendapatan
FROM bookings
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY tahun, bulan;

DROP VIEW IF EXISTS v_popular_destinations;
CREATE VIEW v_popular_destinations AS
SELECT
    d.id_destinasi,
    d.nama,
    d.kategori,
    d.lokasi,
    COUNT(b.id_booking) AS total_booking
FROM destination d
LEFT JOIN bookings b ON d.id_destinasi = b.id_destinasi
GROUP BY d.id_destinasi, d.nama, d.kategori, d.lokasi
ORDER BY total_booking DESC
LIMIT 10;

DROP VIEW IF EXISTS v_popular_categories;
CREATE VIEW v_popular_categories AS
SELECT
    kategori,
    COUNT(b.id_booking) AS total_booking,
    COALESCE(SUM(b.total_harga), 0) AS total_pendapatan
FROM destination d
LEFT JOIN bookings b ON d.id_destinasi = b.id_destinasi
GROUP BY kategori
ORDER BY total_booking DESC;

DROP VIEW IF EXISTS v_search_keywords;
CREATE VIEW v_search_keywords AS
SELECT
    keyword,
    COUNT(*) AS total_search,
    DATE_FORMAT(created_at, '%Y-%m') AS bulan
FROM search_logs
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY keyword, DATE_FORMAT(created_at, '%Y-%m')
ORDER BY total_search DESC
LIMIT 20;

-- ============================================================
-- SELESAI
-- ============================================================
-- ✅ Migration selesai!
--
-- LANGKAH SELANJUTNYA:
-- Jalankan data_dummy.sql untuk menambahkan data sample
-- ============================================================
