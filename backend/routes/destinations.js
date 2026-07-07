const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// GET /api/destinations
// List destinasi dengan filter & search + owner info
// ============================================================
router.get('/', async (req, res) => {
    try {
        const { kategori, search } = req.query;
        let query = `SELECT d.*,
                     u.nama_usaha AS owner_nama_usaha,
                     u.foto_usaha AS owner_foto_usaha,
                     u.banner_usaha AS owner_banner_usaha,
                     u.kategori_usaha AS owner_kategori_usaha
                     FROM destination d
                     LEFT JOIN user u ON d.id_owner = u.id_user`;
        let params = [];
        const conditions = [];

        if (kategori) {
            conditions.push('d.kategori = ?');
            params.push(kategori);
        }

        if (search) {
            conditions.push('(d.nama LIKE ? OR d.deskripsi LIKE ? OR d.lokasi LIKE ? OR u.nama_usaha LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY d.rating DESC';

        const [rows] = await pool.query(query, params);

        // Process image paths to URLs
        const processedRows = rows.map(row => {
            const processed = { ...row };
            // Convert owner image paths to URLs if they exist
            if (processed.owner_foto_usaha) {
                processed.owner_foto_usaha = '/uploads/business/' + processed.owner_foto_usaha;
            }
            if (processed.owner_banner_usaha) {
                processed.owner_banner_usaha = '/uploads/business/' + processed.owner_banner_usaha;
            }
            return processed;
        });

        res.json(processedRows);
    } catch (err) {
        console.error('Get destinations error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/destinations/:id
// Detail destinasi dengan owner info
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT d.*,
             u.nama_usaha AS owner_nama_usaha,
             u.foto_usaha AS owner_foto_usaha,
             u.banner_usaha AS owner_banner_usaha,
             u.kategori_usaha AS owner_kategori_usaha,
             u.lokasi_usaha AS owner_lokasi_usaha,
             u.link_gmaps AS owner_link_gmaps,
             u.jam_buka AS owner_jam_buka,
             u.jam_tutup AS owner_jam_tutup,
             u.deskripsi_usaha AS owner_deskripsi_usaha
             FROM destination d
             LEFT JOIN user u ON d.id_owner = u.id_user
             WHERE d.id_destinasi = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan.' });
        }

        const processed = { ...rows[0] };
        // Convert owner image paths to URLs
        if (processed.owner_foto_usaha) {
            processed.owner_foto_usaha = '/uploads/business/' + processed.owner_foto_usaha;
        }
        if (processed.owner_banner_usaha) {
            processed.owner_banner_usaha = '/uploads/business/' + processed.owner_banner_usaha;
        }

        res.json(processed);
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
