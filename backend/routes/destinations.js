const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// GET /api/destinations
// List destinasi dengan filter & search
// ============================================================
router.get('/', async (req, res) => {
    try {
        const { kategori, search } = req.query;
        let query = 'SELECT * FROM destination';
        let params = [];
        const conditions = [];

        if (kategori) {
            conditions.push('kategori = ?');
            params.push(kategori);
        }

        if (search) {
            conditions.push('(nama LIKE ? OR deskripsi LIKE ? OR lokasi LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY rating DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Get destinations error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/destinations/:id
// Detail destinasi
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM destination WHERE id_destinasi = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Get destination detail error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// POST /api/search-logs
// Simpan keyword pencarian (tidak wajib login)
// ============================================================
router.post('/search-logs', async (req, res) => {
    try {
        const { keyword } = req.body;
        const authHeader = req.headers.authorization;

        let idUser = null;

        // Coba parse user dari token jika ada
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                const JWT_SECRET = process.env.JWT_SECRET || 'wonderloka_secret_key_2026';
                const decoded = jwt.verify(token, JWT_SECRET);
                idUser = decoded.id_user;
            } catch (_) {
                // Token invalid, biarkan idUser null
            }
        }

        if (!keyword || keyword.trim().length === 0) {
            return res.status(400).json({ message: 'Keyword wajib diisi.' });
        }

        await pool.query(
            'INSERT INTO search_logs (id_user, keyword) VALUES (?, ?)',
            [idUser, keyword.trim()]
        );

        res.status(201).json({ message: 'Search log saved.' });
    } catch (err) {
        console.error('Search log error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
