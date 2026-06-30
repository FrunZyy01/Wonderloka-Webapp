const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const [rows] = await pool.query(
            `SELECT f.*, d.nama, d.gambar, d.harga, d.rating, d.lokasi, d.kategori
             FROM favorit f
             JOIN destination d ON f.id_destinasi = d.id_destinasi
             WHERE f.id_user = ?
             ORDER BY f.created_at DESC`,
            [id_user]
        );

        res.json(rows);
    } catch (err) {
        console.error('Get favorites error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { id_destinasi } = req.body;
        const id_user = req.user.id_user;

        if (!id_destinasi) {
            return res.status(400).json({ message: 'ID destinasi wajib diisi.' });
        }

        const [destinasi] = await pool.query(
            'SELECT id_destinasi FROM destination WHERE id_destinasi = ?',
            [id_destinasi]
        );

        if (destinasi.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        const [existing] = await pool.query(
            'SELECT id_favorit FROM favorit WHERE id_user = ? AND id_destinasi = ?',
            [id_user, id_destinasi]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Destinasi sudah ada di favorit.' });
        }

        await pool.query(
            'INSERT INTO favorit (id_user, id_destinasi) VALUES (?, ?)',
            [id_user, id_destinasi]
        );

        res.status(201).json({ message: 'Berhasil ditambahkan ke favorit.' });
    } catch (err) {
        console.error('Add favorite error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.id_user;

        const [favorit] = await pool.query(
            'SELECT id_favorit FROM favorit WHERE id_favorit = ? AND id_user = ?',
            [id, id_user]
        );

        if (favorit.length === 0) {
            return res.status(404).json({ message: 'Favorit tidak ditemukan.' });
        }

        await pool.query('DELETE FROM favorit WHERE id_favorit = ?', [id]);

        res.json({ message: 'Berhasil dihapus dari favorit.' });
    } catch (err) {
        console.error('Delete favorite error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
