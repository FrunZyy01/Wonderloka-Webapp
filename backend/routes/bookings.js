const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// ============================================================
// VALIDASI HELPER - Cek id_user sebelum query
// ============================================================
function validateUserId(req, res) {
    const id_user = req.user.id_user;
    if (!id_user) {
        res.status(401).json({ message: 'Sesi login bermasalah. Silakan login ulang.' });
        return null;
    }
    return id_user;
}

// ============================================================
// POST /api/bookings
// Buat booking baru
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { id_destinasi, tgl_kunjungan, jumlah_tiket } = req.body;
        const id_user = validateUserId(req, res);
        if (!id_user) return;

        // Validasi input
        if (!id_destinasi) {
            return res.status(400).json({ message: 'Destinasi wajib dipilih.' });
        }
        if (!tgl_kunjungan) {
            return res.status(400).json({ message: 'Tanggal kunjungan wajib diisi.' });
        }

        const tiket = parseInt(jumlah_tiket) || 1;
        if (tiket < 1) {
            return res.status(400).json({ message: 'Jumlah tiket minimal 1.' });
        }

        // Cek destinasi ada
        const [destinasi] = await pool.query(
            'SELECT id_destinasi, harga, nama FROM destination WHERE id_destinasi = ?',
            [id_destinasi]
        );

        if (destinasi.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        const harga = parseInt(destinasi[0].harga) || 0;
        const total_harga = harga * tiket;

        const [result] = await pool.query(
            'INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id_user, id_destinasi, tgl_kunjungan, tiket, total_harga, 'menunggu']
        );

        console.log('✅ Booking dibuat:', { id_booking: result.insertId, id_user, id_destinasi, total_harga });

        res.status(201).json({
            message: 'Booking berhasil dibuat.',
            booking: {
                id_booking: result.insertId,
                id_user,
                id_destinasi,
                nama_destinasi: destinasi[0].nama,
                tgl_kunjungan,
                jumlah_tiket: tiket,
                total_harga,
                status: 'menunggu'
            }
        });
    } catch (err) {
        console.error('❌ Create booking error:', err.code, err.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/bookings
// Ambil semua booking user
// ============================================================
router.get('/', async (req, res) => {
    try {
        const id_user = validateUserId(req, res);
        if (!id_user) return;

        const [rows] = await pool.query(
            `SELECT b.id_booking, b.id_user, b.id_destinasi, b.tgl_kunjungan,
                    b.jumlah_tiket, b.total_harga, b.status, b.created_at,
                    COALESCE(d.nama, 'Destinasi') AS destinasi,
                    COALESCE(d.lokasi, '-') AS lokasi,
                    COALESCE(d.gambar, '') AS gambar,
                    COALESCE(d.harga, 0) AS harga
             FROM bookings b
             LEFT JOIN destination d ON b.id_destinasi = d.id_destinasi
             WHERE b.id_user = ?
             ORDER BY b.created_at DESC`,
            [id_user]
        );

        console.log('✅ Get bookings:', { id_user, count: rows.length });
        res.json(rows);
    } catch (err) {
        console.error('❌ Get bookings error:', err.code, err.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/bookings/:id/batal
// Batalkan booking
// ============================================================
router.put('/:id/batal', async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = validateUserId(req, res);
        if (!id_user) return;

        // Cek booking ada dan milik user
        const [booking] = await pool.query(
            'SELECT id_booking, status FROM bookings WHERE id_booking = ? AND id_user = ?',
            [id, id_user]
        );

        if (booking.length === 0) {
            return res.status(404).json({ message: 'Booking tidak ditemukan.' });
        }

        if (booking[0].status === 'selesai' || booking[0].status === 'dibatalkan') {
            return res.status(400).json({ message: 'Booking tidak dapat dibatalkan.' });
        }

        await pool.query(
            'UPDATE bookings SET status = ? WHERE id_booking = ?',
            ['dibatalkan', id]
        );

        console.log('✅ Booking dibatalkan:', { id_booking: id, id_user });
        res.json({ message: 'Booking berhasil dibatalkan.' });
    } catch (err) {
        console.error('❌ Cancel booking error:', err.code, err.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
