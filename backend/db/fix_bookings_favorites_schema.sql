-- ============================================================
-- MIGRATION: Fix Bookings & Favorites Schema
-- Wonderloka Database Update
-- ============================================================
-- CARA PAKAI:
-- File ini aman dijalankan berkali-kali (idempotent)
-- Jalankan setelah wonderloka.sql
-- ============================================================

USE wonderloka;

-- ============================================================
-- 1. UPDATE ENUM ROLE UNTUK MENAMBAHKAN 'admin'
-- ============================================================
-- MySQL tidak bisa ALTER ENUM langsung dengan mudah
-- Jalankan ini, akan error jika enum sudah benar

-- ============================================================
-- 2. TAMBAHKAN KOLOM-KOLOM YANG DIPERLUKAN
-- ============================================================

-- Kolom di tabel user
SET @dbname = DATABASE();
SET @tablename = 'user';

-- status_verifikasi
SET @columnname = 'status_verifikasi';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN status_verifikasi ENUM("pending", "terverifikasi", "ditolak") DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- alasan_penolakan
SET @columnname = 'alasan_penolakan';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN alasan_penolakan TEXT DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- nama_usaha
SET @columnname = 'nama_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN nama_usaha VARCHAR(200) DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- lokasi_usaha
SET @columnname = 'lokasi_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN lokasi_usaha VARCHAR(200) DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- kategori_usaha
SET @columnname = 'kategori_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN kategori_usaha ENUM("Alam", "Budaya", "Penginapan", "Tour", "Campground") DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- deskripsi_usaha
SET @columnname = 'deskripsi_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN deskripsi_usaha TEXT DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- foto_usaha
SET @columnname = 'foto_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN foto_usaha VARCHAR(500) DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- banner_usaha
SET @columnname = 'banner_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN banner_usaha VARCHAR(500) DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- link_gmaps
SET @columnname = 'link_gmaps';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN link_gmaps VARCHAR(500) DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- jam_buka
SET @columnname = 'jam_buka';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN jam_buka TIME DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- jam_tutup
SET @columnname = 'jam_tutup';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN jam_tutup TIME DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- status_usaha
SET @columnname = 'status_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE user ADD COLUMN status_usaha ENUM("buka", "tutup") DEFAULT "buka"'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================
-- 3. KOLOM DI TABEL DESTINATION
-- ============================================================
SET @tablename = 'destination';

-- id_owner
SET @columnname = 'id_owner';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE destination ADD COLUMN id_owner INT DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- fasilitas
SET @columnname = 'fasilitas';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE destination ADD COLUMN fasilitas TEXT DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- kontak_usaha
SET @columnname = 'kontak_usaha';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE destination ADD COLUMN kontak_usaha VARCHAR(50) DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- jam_buka di destination
SET @columnname = 'jam_buka';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE destination ADD COLUMN jam_buka TIME DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- jam_tutup di destination
SET @columnname = 'jam_tutup';
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
        'SELECT 1',
        'ALTER TABLE destination ADD COLUMN jam_tutup TIME DEFAULT NULL'
    )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================
-- 4. BUAT TABEL JIKA BELUM ADA
-- ============================================================

-- Tabel search_logs
CREATE TABLE IF NOT EXISTS search_logs (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT DEFAULT NULL,
    keyword VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE SET NULL
);

-- Tabel reviews
CREATE TABLE IF NOT EXISTS reviews (
    id_review INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_destinasi INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    komentar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_destinasi) REFERENCES destination(id_destinasi) ON DELETE CASCADE
);

-- ============================================================
-- 5. UPDATE DATA YANG SUDAH ADA
-- ============================================================

-- Set status verifikasi untuk pengusaha yang belum punya
UPDATE user SET status_verifikasi = 'terverifikasi'
WHERE role = 'pengusaha' AND (status_verifikasi IS NULL OR status_verifikasi = '');

-- ============================================================
-- 6. BUAT AKUN ADMIN DEFAULT (SAFE - INSERT IGNORE)
-- ============================================================
-- Password: password123
INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, role, status_verifikasi)
VALUES ('admin', 'admin@wonderloka.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQ1FKOqV.jPRKWG', 'Administrator', 'admin', NULL);

-- Update user admin yang sudah ada agar role nya admin
UPDATE user SET role = 'admin' WHERE email = 'admin@wonderloka.com';

-- ============================================================
-- SELESAI
-- ============================================================
-- ✅ Schema fix selesai!
--
-- YANG SUDAH DIPERBAIKI:
-- 1. ✅ Kolom status_verifikasi di user
-- 2. ✅ Kolom alasan_penolakan di user
-- 3. ✅ Kolom profil usaha di user
-- 4. ✅ Kolom di destination (id_owner, fasilitas, dll)
-- 5. ✅ Tabel search_logs
-- 6. ✅ Tabel reviews
-- 7. ✅ Akun admin default
--
-- JALANKAN: node db/init.js
-- Untuk seed data sample dan akun test
-- ============================================================
