CREATE DATABASE IF NOT EXISTS wonderloka;
USE wonderloka;

-- Disable foreign key check untuk DROP TABLE yang aman
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS favorit;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS search_logs;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS destination;
DROP TABLE IF EXISTS user;

-- Re-enable foreign key check
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_wa VARCHAR(20),
    role ENUM('wisatawan', 'pengusaha') DEFAULT 'wisatawan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE destination (
    id_destinasi INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    deskripsi TEXT,
    kategori ENUM('Alam', 'Budaya', 'Kuliner') NOT NULL,
    lokasi VARCHAR(200),
    harga INT DEFAULT 0,
    gambar VARCHAR(500),
    rating DECIMAL(2,1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id_booking INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_destinasi INT NOT NULL,
    tgl_kunjungan DATE NOT NULL,
    jumlah_tiket INT DEFAULT 1,
    total_harga INT DEFAULT 0,
    status ENUM('menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan') DEFAULT 'menunggu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_destinasi) REFERENCES destination(id_destinasi) ON DELETE CASCADE
);

CREATE TABLE favorit (
    id_favorit INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_destinasi INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_destinasi) REFERENCES destination(id_destinasi) ON DELETE CASCADE,
    UNIQUE KEY unique_favorit (id_user, id_destinasi)
);

INSERT INTO destination (nama, deskripsi, kategori, lokasi, harga, gambar, rating) VALUES
-- Alam
('Bukit Pengilon', 'Nikmati pemandangan laut selatan dari atas perbukitan hijau. Bukit Pengilon menawarkan sensasi perkemahan yang sejuk dengan panorama tebing yang eksotis.', 'Alam', 'Yogyakarta, Indonesia', 15000, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop', 4.8),
('Pantai Kuta', 'Pantai dengan pasir putih dan ombak yang cocok untuk berselancar. Tempat yang sempurna untuk menikmati matahari terbenam yang memukau.', 'Alam', 'Bali, Indonesia', 12000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop', 4.7),
('Gunung Bromo', 'Gunung berapi aktif yang terkenal dengan lautan pasir dan pemandangan matahari terbit yang menakjubkan dari puncak Penanjakan.', 'Alam', 'Jawa Timur, Indonesia', 25000, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=250&fit=crop', 4.9),
('Danau Toba', 'Danau vulkanik terbesar di dunia dengan pemandangan yang memukau dan Pulau Samosir di tengahnya yang kaya akan budaya Batak.', 'Alam', 'Sumatera Utara, Indonesia', 20000, 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&h=250&fit=crop', 4.6),
('Raja Ampat', 'Surga bawah laut dengan keanekaragaman hayati laut terkaya di dunia. Destinasi wajib bagi pecinta diving dan snorkeling.', 'Alam', 'Papua Barat, Indonesia', 35000, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=250&fit=crop', 4.9),
('Nusa Penida', 'Pulau eksotis dengan tebing-tebing dramatis, pantai tersembunyi seperti Kelingking Beach, dan spot snorkeling yang luar biasa.', 'Alam', 'Bali, Indonesia', 18000, 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400&h=250&fit=crop', 4.8),
('Kawah Ijen', 'Kawah dengan api biru abadi dan pemandangan matahari terbit yang spektakuler. Destinasi favorit para pendaki dan fotografer.', 'Alam', 'Jawa Timur, Indonesia', 22000, 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=400&h=250&fit=crop', 4.7),
('Taman Nasional Komodo', 'Habitat asli komodo, kadal purba terbesar di dunia. Nikmati trekking dan pemandangan pantai pink yang eksotis.', 'Alam', 'Nusa Tenggara Timur, Indonesia', 30000, 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&h=250&fit=crop', 4.8),
('Air Terjun Tumpak Sewu', 'Air terjun bertingkat yang memukau di perbatasan Lumajang dan Malang. Dikenal sebagai Niagara-nya Jawa Timur.', 'Alam', 'Jawa Timur, Indonesia', 15000, 'https://images.unsplash.com/photo-1564419320416-9a78a30c3b1c?w=400&h=250&fit=crop', 4.7),
('Pulau Derawan', 'Pulau tropis dengan pasir putih, air jernih, dan taman bawah laut yang menakjubkan. Surga tersembunyi di Kalimantan Timur.', 'Alam', 'Kalimantan Timur, Indonesia', 28000, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=250&fit=crop', 4.6),

-- Budaya
('Candi Borobudur', 'Candi Buddha terbesar di dunia, warisan dunia UNESCO. Nikmati keindahan arsitektur dan relief cerita Buddha yang megah.', 'Budaya', 'Jawa Tengah, Indonesia', 50000, 'https://images.unsplash.com/photo-1590168130096-ee3db0e3fb6f?w=400&h=250&fit=crop', 4.9),
('Pura Tanah Lot', 'Pura ikonik di atas batu karang di tepi laut. Tempat terbaik untuk menikmati matahari terbenam dengan latar belakang pura yang megah.', 'Budaya', 'Bali, Indonesia', 30000, 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400&h=250&fit=crop', 4.7),
('Tana Toraja', 'Destinasi budaya dengan upacara pemakaman tradisional, rumah tongkonan, dan alam pegunungan yang memukau di Sulawesi Selatan.', 'Budaya', 'Sulawesi Selatan, Indonesia', 40000, 'https://images.unsplash.com/photo-1582666716886-5ec0979670da?w=400&h=250&fit=crop', 4.8),
('Keraton Yogyakarta', 'Istana Kesultanan Yogyakarta yang sarat akan nilai sejarah dan budaya Jawa. Nikmati arsitektur tradisional dan pertunjukan seni.', 'Budaya', 'Yogyakarta, Indonesia', 25000, 'https://images.unsplash.com/photo-1590128200009-1f8d2b98f1d4?w=400&h=250&fit=crop', 4.6),
('Kampung Warna-Warni Jodipan', 'Kampung wisata dengan rumah-rumah berwarna-warni yang instagramable. Spot foto favorit wisatawan di Kota Malang.', 'Budaya', 'Jawa Timur, Indonesia', 10000, 'https://images.unsplash.com/photo-1590664861852-5a45f7b45f3c?w=400&h=250&fit=crop', 4.5),
('Desa Penglipuran', 'Desa adat Bali yang masih menjaga tradisi dan kearifan lokal. Arsitektur tradisional yang tertata rapi dan asri.', 'Budaya', 'Bali, Indonesia', 20000, 'https://images.unsplash.com/photo-1560693229-3e428adf0e5e?w=400&h=250&fit=crop', 4.8),

-- Kuliner
('Pusat Oleh-Oleh Malioboro', 'Surga belanja oleh-oleh khas Yogyakarta. Temukan gudeg, bakpia, dan berbagai kuliner tradisional dalam satu tempat.', 'Kuliner', 'Yogyakarta, Indonesia', 0, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop', 4.5),
('Wisata Kuliner Bandung', 'Jelajahi ragam kuliner khas Bandung mulai dari seblak, batagor, mie kocok, hingga martabak legendaris di sepanjang jalan.', 'Kuliner', 'Jawa Barat, Indonesia', 0, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop', 4.6),
('Pasar Kuliner Semarang', 'Destinasi wisata kuliner dengan beragam makanan khas Semarang seperti lumpia, tahu gimbal, dan wingko babat.', 'Kuliner', 'Jawa Tengah, Indonesia', 0, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 4.4),
('Kuliner Kaki Lima Surabaya', 'Jelajahi street food Surabaya yang legendaris: lontong balap, rujak cingur, sate klopo, dan rawon yang menggugah selera.', 'Kuliner', 'Jawa Timur, Indonesia', 0, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=250&fit=crop', 4.5),
('Festival Kuliner Ubud', 'Nikmati pengalaman kuliner organik dan tradisional Bali di tengah sawah dan alam Ubud yang asri dan menenangkan.', 'Kuliner', 'Bali, Indonesia', 5000, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop', 4.7);
