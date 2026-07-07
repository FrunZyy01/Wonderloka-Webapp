const express = require('express');
const pool = require('../config/db');
const { authenticate, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// MIDDLEWARE: Semua route admin butuh auth + role admin
// ============================================================
router.use(authenticate);
router.use(authorizeRole('admin'));

// ============================================================
// GET /api/admin/verification-requests
// Daftar pengusaha yang menunggu verifikasi
// ============================================================
router.get('/verification-requests', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_user, username, email, nama_lengkap, no_wa, role,
                    nama_usaha, kategori_usaha, status_verifikasi, created_at
             FROM user
             WHERE role = 'pengusaha' AND status_verifikasi = 'pending'
             ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Get verification requests error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/all-verification-requests
// Semua data verifikasi (pending, terverifikasi, ditolak)
// ============================================================
router.get('/all-verification-requests', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_user, username, email, nama_lengkap, no_wa, role,
                    nama_usaha, kategori_usaha, status_verifikasi, alasan_penolakan, created_at
             FROM user
             WHERE role = 'pengusaha'
             ORDER BY
                CASE status_verifikasi
                    WHEN 'pending' THEN 1
                    WHEN 'terverifikasi' THEN 2
                    WHEN 'ditolak' THEN 3
                END,
                created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Get all verification requests error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/verifikasi (alias for frontend)
// ============================================================
router.get('/verifikasi', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_user, username, email, nama_lengkap, no_wa, role,
                    nama_usaha, kategori_usaha, status_verifikasi, alasan_penolakan, created_at
             FROM user
             WHERE role = 'pengusaha'
             ORDER BY
                CASE status_verifikasi
                    WHEN 'pending' THEN 1
                    WHEN 'terverifikasi' THEN 2
                    WHEN 'ditolak' THEN 3
                END,
                created_at DESC`
        );
        res.json({ pengusaha: rows });
    } catch (err) {
        console.error('Get verifikasi error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/admin/verification-requests/:id/approve
// Setujui verifikasi pengusaha
// ============================================================
router.put('/verification-requests/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        // Cek user ada
        const [existing] = await pool.query(
            'SELECT id_user, role, status_verifikasi FROM user WHERE id_user = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        if (existing[0].role !== 'pengusaha') {
            return res.status(400).json({ message: 'User ini bukan pengusaha.' });
        }

        if (existing[0].status_verifikasi === 'terverifikasi') {
            return res.status(400).json({ message: 'User sudah terverifikasi.' });
        }

        await pool.query(
            'UPDATE user SET status_verifikasi = ?, alasan_penolakan = NULL WHERE id_user = ?',
            ['terverifikasi', id]
        );

        res.json({ message: 'Verifikasi pengusaha berhasil disetujui.' });
    } catch (err) {
        console.error('Approve verification error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/admin/verification-requests/:id/reject
// Tolak verifikasi pengusaha
// ============================================================
router.put('/verification-requests/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { alasan } = req.body;

        // Cek user ada
        const [existing] = await pool.query(
            'SELECT id_user, role, status_verifikasi FROM user WHERE id_user = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        if (existing[0].role !== 'pengusaha') {
            return res.status(400).json({ message: 'User ini bukan pengusaha.' });
        }

        if (existing[0].status_verifikasi === 'ditolak') {
            return res.status(400).json({ message: 'User sudah ditolak.' });
        }

        await pool.query(
            'UPDATE user SET status_verifikasi = ?, alasan_penolakan = ? WHERE id_user = ?',
            ['ditolak', alasan || 'Pendaftaran ditolak oleh admin.', id]
        );

        res.json({ message: 'Verifikasi pengusaha berhasil ditolak.' });
    } catch (err) {
        console.error('Reject verification error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// Alias endpoints untuk frontend (tanpa 'verification-requests')
// PUT /api/admin/verifikasi/:id/approve
// ============================================================
router.put('/verifikasi/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.query(
            'SELECT id_user, role, status_verifikasi FROM user WHERE id_user = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        if (existing[0].role !== 'pengusaha') {
            return res.status(400).json({ message: 'User ini bukan pengusaha.' });
        }

        await pool.query(
            'UPDATE user SET status_verifikasi = ?, alasan_penolakan = NULL WHERE id_user = ?',
            ['terverifikasi', id]
        );

        res.json({ message: 'Verifikasi pengusaha berhasil disetujui.' });
    } catch (err) {
        console.error('Approve verification error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/admin/verifikasi/:id/reject
// ============================================================
router.put('/verifikasi/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { alasan } = req.body;

        const [existing] = await pool.query(
            'SELECT id_user, role, status_verifikasi FROM user WHERE id_user = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        await pool.query(
            'UPDATE user SET status_verifikasi = ?, alasan_penolakan = ? WHERE id_user = ?',
            ['ditolak', alasan || 'Pendaftaran ditolak oleh admin.', id]
        );

        res.json({ message: 'Verifikasi pengusaha berhasil ditolak.' });
    } catch (err) {
        console.error('Reject verification error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/admin/mis/summary
// Ringkasan MIS untuk dashboard admin
// ============================================================
router.get('/mis/summary', async (req, res) => {
    try {
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

        // Total keseluruhan
        const [[{ total_destinasi }]] = await pool.query('SELECT COUNT(*) AS total_destinasi FROM destination');
        const [[{ total_user }]] = await pool.query('SELECT COUNT(*) AS total_user FROM user WHERE role = ?', ['wisatawan']);
        const [[{ total_pengusaha }]] = await pool.query('SELECT COUNT(*) AS total_pengusaha FROM user WHERE role = ?', ['pengusaha']);
        const [[{ total_pengusaha_pending }]] = await pool.query('SELECT COUNT(*) AS total_pengusaha_pending FROM user WHERE role = ? AND status_verifikasi = ?', ['pengusaha', 'pending']);

        res.json({
            booking_bulan_ini: booking_bulan_ini || 0,
            booking_bulan_lalu: booking_bulan_lalu || 0,
            pendapatan_bulan_ini: pendapatan_bulan_ini || 0,
            total_destinasi: total_destinasi || 0,
            total_user: total_user || 0,
            total_pengusaha: total_pengusaha || 0,
            total_pengusaha_pending: total_pengusaha_pending || 0
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
                COALESCE(SUM(b.total_harga), 0) AS total_pendapatan
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

module.exports = router;
