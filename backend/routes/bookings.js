const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', async (req, res) => {
    try {
        const { id_destinasi, tgl_kunjungan, jumlah_tiket } = req.body;
        const id_user = req.user.id_user;

        if (!id_destinasi || !tgl_kunjungan) {
            return res.status(400).json({ message: 'Destinasi dan tanggal kunjungan wajib diisi.' });
        }

        const [destinasi] = await pool.query(
            'SELECT id_destinasi, harga FROM destination WHERE id_destinasi = ?',
            [id_destinasi]
        );

        if (destinasi.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        const tiket = parseInt(jumlah_tiket) || 1;
        const total_harga = destinasi[0].harga * tiket;

        const [result] = await pool.query(
            'INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga) VALUES (?, ?, ?, ?, ?)',
            [id_user, id_destinasi, tgl_kunjungan, tiket, total_harga]
        );

        res.status(201).json({
            message: 'Booking berhasil dibuat.',
            booking: {
                id_booking: result.insertId,
                id_user,
                id_destinasi,
                tgl_kunjungan,
                jumlah_tiket: tiket,
                total_harga,
                status: 'menunggu'
            }
        });
    } catch (err) {
        console.error('Create booking error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const [rows] = await pool.query(
            `SELECT b.*, d.nama AS destinasi, d.lokasi, d.gambar, d.harga
             FROM bookings b
             JOIN destination d ON b.id_destinasi = d.id_destinasi
             WHERE b.id_user = ?
             ORDER BY b.created_at DESC`,
            [id_user]
        );

        res.json(rows);
    } catch (err) {
        console.error('Get bookings error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

router.put('/:id/batal', async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.id_user;

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

        res.json({ message: 'Booking berhasil dibatalkan.' });
    } catch (err) {
        console.error('Cancel booking error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
