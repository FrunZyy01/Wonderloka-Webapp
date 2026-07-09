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

-- Tabel user
CREATE TABLE user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_wa VARCHAR(20),
    role ENUM('wisatawan', 'pengusaha', 'admin') DEFAULT 'wisatawan',
    status_verifikasi ENUM('pending', 'terverifikasi', 'ditolak') DEFAULT NULL,
    alasan_penolakan TEXT DEFAULT NULL,
    nama_usaha VARCHAR(200) DEFAULT NULL,
    lokasi_usaha VARCHAR(200) DEFAULT NULL,
    kategori_usaha ENUM('Alam', 'Budaya', 'Kuliner', 'Penginapan', 'Tour', 'Campground') DEFAULT NULL,
    deskripsi_usaha TEXT DEFAULT NULL,
    foto_usaha VARCHAR(500) DEFAULT NULL,
    banner_usaha VARCHAR(500) DEFAULT NULL,
    link_gmaps VARCHAR(500) DEFAULT NULL,
    jam_buka TIME DEFAULT NULL,
    jam_tutup TIME DEFAULT NULL,
    status_usaha ENUM('buka', 'tutup') DEFAULT 'buka',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel destination dengan SEMUA kolom yang diperlukan aplikasi
CREATE TABLE destination (
    id_destinasi INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    deskripsi TEXT,
    kategori ENUM('Alam', 'Budaya', 'Penginapan', 'Tour', 'Campground') NOT NULL,
    lokasi VARCHAR(200),
    harga INT DEFAULT 0,
    gambar VARCHAR(500),
    rating DECIMAL(2,1) DEFAULT 0.0,
    id_owner INT DEFAULT NULL,
    fasilitas TEXT DEFAULT NULL,
    kontak_usaha VARCHAR(50) DEFAULT NULL,
    jam_buka TIME DEFAULT NULL,
    jam_tutup TIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_owner) REFERENCES user(id_user) ON DELETE SET NULL
);

-- Tabel bookings
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

-- Tabel favorit
CREATE TABLE favorit (
    id_favorit INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_destinasi INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_destinasi) REFERENCES destination(id_destinasi) ON DELETE CASCADE,
    UNIQUE KEY unique_favorit (id_user, id_destinasi)
);

-- Tabel search_logs
CREATE TABLE search_logs (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT DEFAULT NULL,
    keyword VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE SET NULL
);

-- Tabel reviews
CREATE TABLE reviews (
    id_review INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_destinasi INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    komentar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_destinasi) REFERENCES destination(id_destinasi) ON DELETE CASCADE
);

-- DATA DUMMY DESTINASI
INSERT INTO destination (nama, deskripsi, kategori, lokasi, harga, gambar, rating) VALUES

-- =====================
-- CANDI & BUDAYA YOGYA
-- =====================
('Candi Borobudur', 'Candi Buddha terbesar di dunia, warisan dunia UNESCO dengan relief cerita Buddha yang megah. Tiket masuk sudah termasuk akses seluruh area candi dan museum.', 'Budaya', 'Magelang, Jawa Tengah', 50000, 'https://images.unsplash.com/photo-1590168130096-ee3db0f1fb6f?w=400&h=250&fit=crop', 4.9),
('Candi Prambanan', 'Kompleks candi Hindu terbesar di Indonesia dengan arsitektur yang memukau. Saksi bisu kejayaan kerajaan Hindu di Jawa. Link Maps: https://www.google.com/maps/search/?api=1&query=Candi+Prambanan', 'Budaya', 'Sleman, Yogyakarta', 45000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop', 4.8),
('Candi Ratu Boko', 'Situs purbakala di atas bukit dengan pemandangan spektakuler. Cocok untuk menikmati sunset dan belajar sejarah kerajaan. Link Maps: https://www.google.com/maps/search/?api=1&query=Candi+Ratu+Boko+Yogyakarta', 'Budaya', 'Sleman, Yogyakarta', 35000, 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400&h=250&fit=crop', 4.7),
('Candi Ijo', 'Candi Hindu di atas bukit dengan pemandangan lembah yang indah. Spot sunset favorit wisatawan. Link Maps: https://www.google.com/maps/search/?api=1&query=Candi+Ijo+Yogyakarta', 'Budaya', 'Sleman, Yogyakarta', 25000, 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=250&fit=crop', 4.6),
('Candi Sambisari', 'Candi Hindu yang pernah tertimbun abu vulkanik Merapi selama ratusan tahun. Terletak di area persawahan yang asri. Link Maps: https://www.google.com/maps/search/?api=1&query=Candi+Sambisari+Yogyakarta', 'Budaya', 'Sleman, Yogyakarta', 20000, 'https://images.unsplash.com/photo-1548796715-afc71f11a7b8?w=400&h=250&fit=crop', 4.5),
('Candi Plaosan', 'Kompleks candi Buddha dengan deretan Arca yang unik dan misterius. Atmosfer yang tenang jauh dari keramaian.', 'Budaya', 'Klaten, Jawa Tengah', 15000, 'https://images.unsplash.com/photo-1570145820259-b5b80c5c8bd6?w=400&h=250&fit=crop', 4.6),
('Candi Mendut', 'Candi Buddha tua dengan patung Buddha besar yang megah. Menjadi awal tradisi Waisyak di Yogyakarta.', 'Budaya', 'Magelang, Jawa Tengah', 15000, 'https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=400&h=250&fit=crop', 4.5),
('Keraton Yogyakarta', 'Istana Kesultanan Yogyakarta yang sarat sejarah dan budaya Jawa. Nikmati arsitektur tradisional, museum, dan pertunjukan seni setiap hari.', 'Budaya', 'Yogyakarta, Indonesia', 25000, 'https://images.unsplash.com/photo-1590128200009-1f8d2b98f1d4?w=400&h=250&fit=crop', 4.7),
('Taman Sari Yogyakarta', 'Taman air bersejarah kerajaan dengan piscina dan terowongan bawah tanah. Menyimpan misteri dan keindahan arsitektur.', 'Budaya', 'Yogyakarta, Indonesia', 15000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop', 4.4),
('Museum Ullen Sentalu', 'Museum seni dan budaya Jawa dengan koleksi yang eksklusif. Terletak di area hijau Kaliurang dengan suasana sejuk pegunungan.', 'Budaya', 'Sleman, Yogyakarta', 35000, 'https://images.unsplash.com/photo-1563210924-d071fc22e1a8?w=400&h=250&fit=crop', 4.8),
('Museum Sonobudoyo', 'Museum terbesar kedua di Indonesia untuk warisan budaya Jawa. Koleksi wayang dan batik yang lengkap dengan harga tiket terjangkau.', 'Budaya', 'Yogyakarta, Indonesia', 10000, 'https://images.unsplash.com/photo-1553882809-a4f57e59501d?w=400&h=250&fit=crop', 4.5),
('Benteng Vredeburg', 'Museum dan benteng Belanda yang menyimpan sejarah perjuangan kemerdekaan Indonesia. Terletak strategis di pusat kota Yogyakarta.', 'Budaya', 'Yogyakarta, Indonesia', 10000, 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&h=250&fit=crop', 4.4),

-- =====================
-- WISATA ALAM
-- =====================
('Pantai Parangtritis', 'Pantai ikonik Yogyakarta dengan pasir hitam dan ombak besar. Fungsi ikon budaya Yogyakarta dengan legenda Nyi Roro Kidul. Link Maps: https://www.google.com/maps/search/?api=1&query=Pantai+Parangtritis', 'Alam', 'Bantul, Yogyakarta', 15000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop', 4.6),
('Hutan Pinus Pengger', 'Hutan pinus yang instagramable dengan spot foto dari berbagai sudut. Cocok untuk camping dan menikmati udara sejuk pegunungan.', 'Alam', 'Bantul, Yogyakarta', 10000, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop', 4.8),
('Tebing Breksi', 'Tebing buatan bekas penambangan dengan pemandangan sunset yang spektakuler. Spot foto populer dengan arsitektur yang artistik.', 'Alam', 'Sleman, Yogyakarta', 15000, 'https://images.unsplash.com/photo-1570145820259-b5b80c5c8bd6?w=400&h=250&fit=crop', 4.7),
('Goa Pindul', 'Cave tubing di dalam goa dengan perahu ban. Pengalaman petualangan seru menyusuri sungai bawah tanah yang alami.', 'Alam', 'Gunung Kidul, Yogyakarta', 85000, 'https://images.unsplash.com/photo-1573096108468-30eaa9e1f7e1?w=400&h=250&fit=crop', 4.8),
('Kalibiru', 'Taman Nasional dengan spot foto di atas pohon dan tebing. Pemandangan Waduk Sempor dari ketinggian yang menakjubkan.', 'Alam', 'Kulon Progo, Yogyakarta', 20000, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=250&fit=crop', 4.7),
('HeHa Sky View', 'Terasering dengan pemandangan valley yang instagramable. Spot foto populer dengan berbagai wahana dan garden yang cantik.', 'Alam', 'Gunung Kidul, Yogyakarta', 15000, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=250&fit=crop', 4.5),
('Obelix Hills', 'Terasering hijau berbentuk bulat yang unik seperti jari-jari. Spot sunset dengan view perbukitan yang memukau.', 'Alam', 'Bantul, Yogyakarta', 15000, 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=400&h=250&fit=crop', 4.6),
('Merapi Park', 'Spot foto dengan replika Miniatur Dunia dan Gunung Merapi. Wahana seru untuk keluarga dan spot foto yang instagramable.', 'Alam', 'Sleman, Yogyakarta', 25000, 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=400&h=250&fit=crop', 4.5),
('Taman Nasional Bromo Tengger Semeru', 'Gunung berapi aktif dengan lautan pasir dan pemandangan sunrise terbaik di Jawa. Destinasi wajib bagi pecinta alam dan fotografi.', 'Alam', 'Probolinggo, Jawa Timur', 35000, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=250&fit=crop', 4.9),
('Kawah Ijen', 'Kawah dengan api biru abadi yang unik di dunia. Mendaki di malam hari untuk melihat blue fire sebelum sunrise.', 'Alam', 'Banyuwangi, Jawa Timur', 45000, 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=400&h=250&fit=crop', 4.8),
('Air Terjun Tumpak Sewu', 'Air terjun bertingkat yang dijuluki Niagara-nya Jawa Timur. Dikelilingi tebing-tebing tinggi dan suasana alam yang asri.', 'Alam', 'Lumajang, Jawa Timur', 15000, 'https://images.unsplash.com/photo-1564419320416-9a78a30c3b1c?w=400&h=250&fit=crop', 4.7),
('Pantai Timang', 'Pantai dengan dermaga gantung dan gondola kecil menuju pulau. Spot ekstrem untuk merasakan sensasi vertigo di atas laut.', 'Alam', 'Gunung Kidul, Yogyakarta', 20000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop', 4.6),
('Bukit Bintang', 'Bukit untuk menikmati gemerlap kota Yogyakarta di malam hari. Tempat nongkrong populer dengan view 360 derajat kota.', 'Alam', 'Sleman, Yogyakarta', 10000, 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=400&h=250&fit=crop', 4.4),

-- =====================
-- TOUR
-- =====================
('Lava Tour Merapi', 'Tour Jeep menelusuri bekas jalur lava Gunung Merapi. Kunjungi museum mini, bunker, dan saksikan kekuatan alam yang dahsyat.', 'Tour', 'Sleman, Yogyakarta', 350000, 'https://images.unsplash.com/photo-1548567117-b32ef9dc9d1e?w=400&h=250&fit=crop', 4.9),
('Jeep Tour Merapi', 'Petualangan offroad dengan jeep melewati bekas area terdampak erupsi. Experience seru menyusuri lumpur dan bebatuan vulkanik.', 'Tour', 'Sleman, Yogyakarta', 300000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', 4.8),
('Borobudur Sunrise Tour', 'Tour sunrise di Candi Borobudur dengan tiket khusus matahari terbit. Waktu-waktu terbaik untuk foto candi dengan langit emas.', 'Tour', 'Magelang, Jawa Tengah', 450000, 'https://images.unsplash.com/photo-1590168130096-ee3db0f1fb6f?w=400&h=250&fit=crop', 4.9),
('Prambanan Sunset Tour', 'Tour sunset di Candi Prambanan dengan pertunjukan Ramayana Ballet. Pengalaman budaya yang tak terlupakan di malam hari.', 'Tour', 'Sleman, Yogyakarta', 400000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop', 4.7),
('Goa Pindul Cave Tubing', 'Petualangan cave tubing menyusuri sungai bawah tanah Goa Pindul. Gunakan ban dan pelampung untuk menyusuri gua yang gelap.', 'Tour', 'Gunung Kidul, Yogyakarta', 85000, 'https://images.unsplash.com/photo-1573096108468-30eaa9e1f7e1?w=400&h=250&fit=crop', 4.8),
('Timang Beach Adventure', 'Tour ke Pantai Timang dengan gondola tradisional. Rasakan sensasi goncangan di atas ombak laut selatan yang deras.', 'Tour', 'Gunung Kidul, Yogyakarta', 250000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop', 4.6),
('Jogja City Tour', 'Tour keliling kota Yogyakarta mengunjungi Malioboro, Bering Songo, dan Alun-Alun. Cocok untuk tourists ringan dengan guide lokal.', 'Tour', 'Yogyakarta, Indonesia', 150000, 'https://images.unsplash.com/photo-1590128200009-1f8d2b98f1d4?w=400&h=250&fit=crop', 4.5),
('Bromo Sunrise Tour dari Yogyakarta', 'Tour 2 hari 1 malam ke Bromo dari Yogyakarta. Termasuk transportasi, akomodasi, dan tiket masuk Bromo.', 'Tour', 'Probolinggo, Jawa Timur', 850000, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=250&fit=crop', 4.8),

-- =====================
-- HOTEL & PENGINAPAN
-- =====================
('D Senopati Malioboro Grand Hotel', 'Hotel strategis di dekat Malioboro dengan fasilitas lengkap dan harga terjangkau. Akomodasi murah untuk tourists dengan kualitas bintang 3.', 'Penginapan', 'Yogyakarta, Indonesia', 250000, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop', 4.3),
('Puri Pangeran Hotel', 'Hotel klasik dengan nuansa Jawa di pusat kota Yogyakarta. Lobby megah dengan sentuhan arsitektur tradisional.', 'Penginapan', 'Yogyakarta, Indonesia', 280000, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=250&fit=crop', 4.4),
('Adhisthana Hotel', 'Hotel nyaman di kawasan Prawirotaman dengan suasana artistik. Cocok untuk backpacker dan travelers muda.', 'Penginapan', 'Sleman, Yogyakarta', 350000, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop', 4.5),
('YATS Colony', 'Akomodasi modern dengan konsep komunal di kawasan Prawirotaman. Cozy rooms dengan fasilitas lengkap dan suasana cozy.', 'Penginapan', 'Sleman, Yogyakarta', 450000, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop', 4.6),
('Greenhost Boutique Hotel', 'Hotel butik ramah lingkungan dengan desain minimalis dan artistik. Rooftop pool dengan pemandangan kota Yogyakarta.', 'Penginapan', 'Yogyakarta, Indonesia', 550000, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop', 4.7),
('Grand Inna Malioboro', 'Hotel bintang 4 legendaris di tepi Malioboro. Lokasi strategis dengan akses langsung ke shopping street legendaris.', 'Penginapan', 'Yogyakarta, Indonesia', 700000, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=250&fit=crop', 4.6),
('Royal Ambarrukmo Yogyakarta', 'Hotel bintang 5 dengan fasilitas premium dan dekat museum. Pilihan luxury dengan layanan kelas atas di Yogyakarta.', 'Penginapan', 'Sleman, Yogyakarta', 1100000, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop', 4.8),
('Hotel Tentrem Yogyakarta', 'Hotel bintang 5 paling prestisius di Yogyakarta. Fasilitas lengkap, spa, pool, dan fine dining dengan standar internasional.', 'Penginapan', 'Yogyakarta, Indonesia', 1500000, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop', 4.9),
('Eastparc Hotel Yogyakarta', 'Hotel keluarga dengan area bermain anak dan piscina besar. Cocok untuk liburan keluarga dengan anak-anak di Yogyakarta.', 'Penginapan', 'Sleman, Yogyakarta', 850000, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop', 4.6),
('The Phoenix Hotel Yogyakarta', 'Hotel bersejarah di gedung kolonial Belanda. Akomodasi iconic dengan arsitektur heritage yang klasik dan elegan.', 'Penginapan', 'Yogyakarta, Indonesia', 650000, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=250&fit=crop', 4.7),
('D Omah Hotel Yogya', 'Guest house dengan nuansa tradisional Jawa di Kaliurang. Suasana sejuk pegunungan dengan harga terjangkau dekat wisata alam.', 'Penginapan', 'Sleman, Yogyakarta', 320000, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop', 4.5),
('Jung Hill Hotel', 'Hotel ekonomis di dekat Tebing Breksi dengan view bukit. Budget hotel praktis untuk tourists yang ingin explore alam Yogya.', 'Penginapan', 'Sleman, Yogyakarta', 180000, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop', 4.3),

-- =====================
-- CAMPING
-- =====================
('Ranch Lodge Campground', 'Campground dengan fasilitas lengkap di kaki Merapi. Tenda, bbq area, dan kegiatan outdoor untuk family gathering.', 'Campground', 'Sleman, Yogyakarta', 75000, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=250&fit=crop', 4.7),
('Merapi Camp Base', 'Campground strategis untuk tracking Merapi. Base camp resmi untuk pendakian dengan guide berpengalaman.', 'Campground', 'Sleman, Yogyakarta', 100000, 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=400&h=250&fit=crop', 4.8),
('Kalibiru Camping Ground', 'Camping di atas pohon dengan pemandangan waduk yang indah. Pengalaman glamping seru di tengah hutan.', 'Campground', 'Kulon Progo, Yogyakarta', 85000, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=250&fit=crop', 4.6),
('Kopi Sulu Bivak Camp', 'Campground asri dengan view kopi plantation. Murah dan nyaman untuk camping pemula dengan fasilitas dasar.', 'Campground', 'Gunung Kidul, Yogyakarta', 50000, 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=400&h=250&fit=crop', 4.4);
