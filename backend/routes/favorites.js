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
// GET /api/favorites
// Ambil semua favorit user
// ============================================================
router.get('/', async (req, res) => {
    try {
        const id_user = validateUserId(req, res);
        if (!id_user) return;

        // Tabel: favorit (bukan favorites)
        const [rows] = await pool.query(
            `SELECT f.id_favorit, f.id_user, f.id_destinasi, f.created_at,
                    COALESCE(d.nama, 'Destinasi') AS nama,
                    COALESCE(d.lokasi, '-') AS lokasi,
                    COALESCE(d.gambar, '') AS gambar,
                    COALESCE(d.harga, 0) AS harga,
                    COALESCE(d.rating, 0) AS rating,
                    COALESCE(d.kategori, '-') AS kategori
             FROM favorit f
             LEFT JOIN destination d ON f.id_destinasi = d.id_destinasi
             WHERE f.id_user = ?
             ORDER BY f.created_at DESC`,
            [id_user]
        );

        console.log('✅ Get favorites:', { id_user, count: rows.length });
        res.json(rows);
    } catch (err) {
        console.error('❌ Get favorites error:', err.code, err.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// POST /api/favorites
// Tambah ke favorit
// ============================================================
router.post('/', async (req, res) => {
    try {
        const { id_destinasi } = req.body;
        const id_user = validateUserId(req, res);
        if (!id_user) return;

        if (!id_destinasi) {
            return res.status(400).json({ message: 'ID destinasi wajib diisi.' });
        }

        // Cek destinasi ada
        const [destinasi] = await pool.query(
            'SELECT id_destinasi FROM destination WHERE id_destinasi = ?',
            [id_destinasi]
        );

        if (destinasi.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        // Cek apakah sudah ada di favorit
        const [existing] = await pool.query(
            'SELECT id_favorit FROM favorit WHERE id_user = ? AND id_destinasi = ?',
            [id_user, id_destinasi]
        );

        if (existing.length > 0) {
            // Sudah ada - return 200 bukan error
            console.log('ℹ️ Favorit sudah ada:', { id_user, id_destinasi });
            return res.status(200).json({ message: 'Destinasi sudah ada di favorit.' });
        }

        await pool.query(
            'INSERT INTO favorit (id_user, id_destinasi) VALUES (?, ?)',
            [id_user, id_destinasi]
        );

        console.log('✅ Favorit ditambahkan:', { id_user, id_destinasi });
        res.status(201).json({ message: 'Berhasil ditambahkan ke favorit.' });
    } catch (err) {
        console.error('❌ Add favorite error:', err.code, err.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// DELETE /api/favorites/:id
// Hapus dari favorit
// ============================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = validateUserId(req, res);
        if (!id_user) return;

        // Cek favorit ada dan milik user
        const [favorit] = await pool.query(
            'SELECT id_favorit FROM favorit WHERE id_favorit = ? AND id_user = ?',
            [id, id_user]
        );

        if (favorit.length === 0) {
            return res.status(404).json({ message: 'Favorit tidak ditemukan.' });
        }

        await pool.query('DELETE FROM favorit WHERE id_favorit = ?', [id]);

        console.log('✅ Favorit dihapus:', { id_favorit: id, id_user });
        res.json({ message: 'Berhasil dihapus dari favorit.' });
    } catch (err) {
        console.error('❌ Delete favorite error:', err.code, err.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
