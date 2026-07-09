const express = require('express');
const pool = require('../config/db');
const { authenticate, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// MIDDLEWARE: Semua route admin butuh auth + role pengusaha
// ============================================================
router.use(authenticate);
router.use(authorizeRole('pengusaha'));

// ============================================================
// GET /api/admin/stats
// Statistik dashboard utama
// ============================================================
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id_user;

        // Stats untuk semua data (global admin)
        const [[{ total_destinasi }]] = await pool.query('SELECT COUNT(*) AS total_destinasi FROM destination');
        const [[{ total_pesanan }]] = await pool.query('SELECT COUNT(*) AS total_pesanan FROM bookings');
        const [[{ total_user }]] = await pool.query('SELECT COUNT(*) AS total_user FROM user');
        const [[{ total_pendapatan }]] = await pool.query('SELECT COALESCE(SUM(total_harga), 0) AS total_pendapatan FROM bookings WHERE status != "dibatalkan"');

        // Stats untuk pengusaha ini saja
        const [[{ destinasi_saya }]] = await pool.query(
            'SELECT COUNT(*) AS destinasi_saya FROM destination WHERE id_owner = ?', [userId]
        );
        const [[{ pesanan_saya }]] = await pool.query(
            `SELECT COUNT(*) AS pesanan_saya FROM bookings b
             JOIN destination d ON b.id_destinasi = d.id_destinasi
             WHERE d.id_owner = ?`, [userId]
        );
        const [[{ pendapatan_saya }]] = await pool.query(
            `SELECT COALESCE(SUM(b.total_harga), 0) AS pendapatan_saya FROM bookings b
             JOIN destination d ON b.id_destinasi = d.id_destinasi
             WHERE d.id_owner = ? AND b.status != 'dibatalkan'`, [userId]
        );

        // Rating rata-rata untuk destinasi pengusaha
        const [[{ avg_rating }]] = await pool.query(
            'SELECT COALESCE(AVG(rating), 0) AS avg_rating FROM destination WHERE id_owner = ?', [userId]
        );

        res.json({
            total_destinasi,
            total_pesanan,
            total_user,
            total_pendapatan,
            destinasi_saya: destinasi_saya || 0,
            pesanan_saya: pesanan_saya || 0,
            pendapatan_saya: pendapatan_saya || 0,
            avg_rating: parseFloat(avg_rating) || 0
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/destinations
// List destinasi (semua atau miliknya)
// ============================================================
router.get('/destinations', async (req, res) => {
    try {
        const userId = req.user.id_user;
        const [rows] = await pool.query(
            'SELECT * FROM destination WHERE id_owner = ? OR id_owner IS NULL ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Admin get destinations error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// POST /api/admin/destinations
// Tambah destinasi baru
// ============================================================
router.post('/destinations', async (req, res) => {
    try {
        const { nama, deskripsi, kategori, lokasi, harga, gambar, rating, fasilitas, jam_buka, jam_tutup, kontak_usaha } = req.body;
        const userId = req.user.id_user;

        if (!nama || !kategori) {
            return res.status(400).json({ message: 'Nama dan kategori wajib diisi.' });
        }

        const validKategori = ['Alam', 'Budaya', 'Penginapan', 'Tour', 'Campground'];
        if (!validKategori.includes(kategori)) {
            return res.status(400).json({ message: 'Kategori harus dari daftar yang valid.' });
        }

        const [result] = await pool.query(
            `INSERT INTO destination (nama, deskripsi, kategori, lokasi, harga, gambar, rating, fasilitas, jam_buka, jam_tutup, kontak_usaha, id_owner)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nama,
                deskripsi || null,
                kategori,
                lokasi || null,
                parseInt(harga) || 0,
                gambar || null,
                parseFloat(rating) || 0,
                fasilitas || null,
                jam_buka || null,
                jam_tutup || null,
                kontak_usaha || null,
                userId
            ]
        );

        res.status(201).json({
            message: 'Destinasi berhasil ditambahkan.',
            destination: { id_destinasi: result.insertId, ...req.body, id_owner: userId }
        });
    } catch (err) {
        console.error('Admin create destination error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/admin/destinations/:id
// Update destinasi
// ============================================================
router.put('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, deskripsi, kategori, lokasi, harga, gambar, rating, fasilitas, jam_buka, jam_tutup, kontak_usaha } = req.body;
        const userId = req.user.id_user;

        // Cek kepemilikan
        const [existing] = await pool.query(
            'SELECT id_destinasi, id_owner FROM destination WHERE id_destinasi = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        // Hanya boleh edit jika miliknya atau id_owner NULL (global)
        if (existing[0].id_owner !== null && existing[0].id_owner !== userId) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengedit destinasi ini.' });
        }

        await pool.query(
            `UPDATE destination SET
             nama = ?, deskripsi = ?, kategori = ?, lokasi = ?, harga = ?,
             gambar = ?, rating = ?, fasilitas = ?, jam_buka = ?, jam_tutup = ?, kontak_usaha = ?
             WHERE id_destinasi = ?`,
            [
                nama,
                deskripsi || null,
                kategori,
                lokasi || null,
                parseInt(harga) || 0,
                gambar || null,
                parseFloat(rating) || 0,
                fasilitas || null,
                jam_buka || null,
                jam_tutup || null,
                kontak_usaha || null,
                id
            ]
        );

        res.json({ message: 'Destinasi berhasil diperbarui.' });
    } catch (err) {
        console.error('Admin update destination error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// DELETE /api/admin/destinations/:id
// Hapus destinasi
// ============================================================
router.delete('/destinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id_user;

        const [existing] = await pool.query(
            'SELECT id_destinasi, id_owner FROM destination WHERE id_destinasi = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        if (existing[0].id_owner !== null && existing[0].id_owner !== userId) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus destinasi ini.' });
        }

        await pool.query('DELETE FROM destination WHERE id_destinasi = ?', [id]);

        res.json({ message: 'Destinasi berhasil dihapus.' });
    } catch (err) {
        console.error('Admin delete destination error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/bookings
// List semua pesanan
// ============================================================
router.get('/bookings', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.*, u.username, u.nama_lengkap, u.email, u.no_wa,
                    d.nama AS destinasi, d.lokasi, d.gambar, d.harga, d.id_owner
             FROM bookings b
             JOIN user u ON b.id_user = u.id_user
             JOIN destination d ON b.id_destinasi = d.id_destinasi
             ORDER BY b.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Admin get bookings error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/admin/bookings/:id/status
// Update status pesanan
// ============================================================
router.put('/bookings/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ['menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan'];
        if (!status || !validStatus.includes(status)) {
            return res.status(400).json({ message: 'Status harus salah satu: ' + validStatus.join(', ') + '.' });
        }

        const [existing] = await pool.query(
            'SELECT id_booking FROM bookings WHERE id_booking = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Booking tidak ditemukan.' });
        }

        await pool.query('UPDATE bookings SET status = ? WHERE id_booking = ?', [status, id]);

        res.json({ message: 'Status booking berhasil diperbarui.' });
    } catch (err) {
        console.error('Admin update booking status error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/business-profile
// Ambil profil usaha pengusaha
// ============================================================
router.get('/business-profile', async (req, res) => {
    try {
        const userId = req.user.id_user;
        const [rows] = await pool.query(
            `SELECT id_user, username, email, nama_lengkap, no_wa, role,
                    nama_usaha, kategori_usaha, deskripsi_usaha, foto_usaha, banner_usaha,
                    link_gmaps, jam_buka, jam_tutup, status_usaha, status_verifikasi, created_at
             FROM user WHERE id_user = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profil tidak ditemukan.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Get business profile error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/admin/business-profile
// Update profil usaha
// ============================================================
router.put('/business-profile', async (req, res) => {
    try {
        const userId = req.user.id_user;
        const {
            nama_usaha, kategori_usaha, deskripsi_usaha, foto_usaha, banner_usaha,
            link_gmaps, jam_buka, jam_tutup, status_usaha
        } = req.body;

        await pool.query(
            `UPDATE user SET
             nama_usaha = ?, kategori_usaha = ?, deskripsi_usaha = ?,
             foto_usaha = ?, banner_usaha = ?, link_gmaps = ?,
             jam_buka = ?, jam_tutup = ?, status_usaha = ?
             WHERE id_user = ?`,
            [
                nama_usaha || null,
                kategori_usaha || null,
                deskripsi_usaha || null,
                foto_usaha || null,
                banner_usaha || null,
                link_gmaps || null,
                jam_buka || null,
                jam_tutup || null,
                status_usaha || 'buka',
                userId
            ]
        );

        res.json({ message: 'Profil usaha berhasil diperbarui.' });
    } catch (err) {
        console.error('Update business profile error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// POST /api/admin/business-profile/verification
// Ajukan verifikasi usaha
// ============================================================
router.post('/business-profile/verification', async (req, res) => {
    try {
        const userId = req.user.id_user;

        await pool.query(
            'UPDATE user SET status_verifikasi = ? WHERE id_user = ?',
            ['pending', userId]
        );

        res.json({ message: 'Pengajuan verifikasi berhasil dikirim.' });
    } catch (err) {
        console.error('Request verification error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/summary
// Ringkasan MIS untuk dashboard
// ============================================================
router.get('/mis/summary', async (req, res) => {
    try {
        const userId = req.user.id_user;

        // Total booking bulan ini
        const [[{ booking_bulan_ini }]] = await pool.query(
            `SELECT COUNT(*) AS booking_bulan_ini FROM bookings
             WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
        );

        // Total booking bulan lalu
        const [[{ booking_bulan_lalu }]] = await pool.query(
            `SELECT COUNT(*) AS booking_bulan_lalu FROM bookings
             WHERE MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
             AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
        );

        // Pendapatan bulan ini
        const [[{ pendapatan_bulan_ini }]] = await pool.query(
            `SELECT COALESCE(SUM(total_harga), 0) AS pendapatan_bulan_ini FROM bookings
             WHERE MONTH(created_at) = MONTH(CURDATE())
             AND YEAR(created_at) = YEAR(CURDATE())
             AND status != 'dibatalkan'`
        );

        // Destinasi terpopuler
        const [populer] = await pool.query(
            `SELECT d.id_destinasi, d.nama, d.kategori, COUNT(b.id_booking) AS total_booking
             FROM destination d
             LEFT JOIN bookings b ON d.id_destinasi = b.id_destinasi
             GROUP BY d.id_destinasi, d.nama, d.kategori
             ORDER BY total_booking DESC LIMIT 5`
        );

        res.json({
            booking_bulan_ini: booking_bulan_ini || 0,
            booking_bulan_lalu: booking_bulan_lalu || 0,
            pendapatan_bulan_ini: pendapatan_bulan_ini || 0,
            destinasi_terpopuler: populer
        });
    } catch (err) {
        console.error('MIS summary error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/bookings-per-month
// Data booking per bulan untuk grafik
// ============================================================
router.get('/mis/bookings-per-month', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                MONTHNAME(created_at) AS bulan,
                COUNT(*) AS total_booking
             FROM bookings
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY MONTH(created_at)
             ORDER BY created_at`
        );
        res.json(rows);
    } catch (err) {
        console.error('MIS bookings per month error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/revenue-per-month
// Data pendapatan per bulan untuk grafik
// ============================================================
router.get('/mis/revenue-per-month', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                MONTHNAME(created_at) AS bulan,
                COALESCE(SUM(total_harga), 0) AS total_pendapatan
             FROM bookings
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             AND status != 'dibatalkan'
             GROUP BY MONTH(created_at)
             ORDER BY created_at`
        );
        res.json(rows);
    } catch (err) {
        console.error('MIS revenue per month error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/popular-destinations
// Destinasi paling banyak dipesan
// ============================================================
router.get('/mis/popular-destinations', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                d.id_destinasi, d.nama, d.kategori, d.gambar,
                COUNT(b.id_booking) AS total_booking,
                SUM(b.total_harga) AS total_pendapatan
             FROM destination d
             LEFT JOIN bookings b ON d.id_destinasi = b.id_destinasi
             GROUP BY d.id_destinasi, d.nama, d.kategori, d.gambar
             ORDER BY total_booking DESC
             LIMIT 10`
        );
        res.json(rows);
    } catch (err) {
        console.error('MIS popular destinations error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/popular-categories
// Kategori wisata paling banyak dipesan
// ============================================================
router.get('/mis/popular-categories', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                d.kategori,
                COUNT(b.id_booking) AS total_booking,
                COALESCE(SUM(b.total_harga), 0) AS total_pendapatan
             FROM destination d
             LEFT JOIN bookings b ON d.id_destinasi = b.id_destinasi
             GROUP BY d.kategori
             ORDER BY total_booking DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('MIS popular categories error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/search-keywords
// Keyword pencarian populer bulan ini
// ============================================================
router.get('/mis/search-keywords', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                keyword,
                COUNT(*) AS total_search
             FROM search_logs
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY keyword
             ORDER BY total_search DESC
             LIMIT 15`
        );
        res.json(rows);
    } catch (err) {
        console.error('MIS search keywords error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/booking-status
// Status pesanan untuk pie chart
// ============================================================
router.get('/mis/booking-status', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                status,
                COUNT(*) AS total,
                COALESCE(SUM(total_harga), 0) AS total_pendapatan
             FROM bookings
             GROUP BY status`
        );
        res.json(rows);
    } catch (err) {
        console.error('MIS booking status error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/reviews
// List ulasan terbaru
// ============================================================
router.get('/reviews', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, u.nama_lengkap, d.nama AS destinasi
             FROM reviews r
             JOIN user u ON r.id_user = u.id_user
             JOIN destination d ON r.id_destinasi = d.id_destinasi
             ORDER BY r.created_at DESC
             LIMIT 20`
        );
        res.json(rows);
    } catch (err) {
        console.error('Admin get reviews error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
