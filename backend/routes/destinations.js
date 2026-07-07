/**
 * Smart Search lokal berbasis rule-based NLP, tanpa API eksternal.
 * Wonderloka Destination Search Engine
 */
const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { smartSearchDestinations, fallbackLikeSearch } = require('../utils/smartSearch');

const router = express.Router();

// ============================================================
// GET /api/destinations
// List destinasi dengan filter & search + owner info
// Support Smart Search dengan query natural language
// ============================================================
router.get('/', async (req, res) => {
    try {
        const { kategori, search } = req.query;

        // Tentukan apakah query menggunakan Smart Search SEBELUM query SQL
        const useSmart = search && search.trim().length > 0 && shouldUseSmartSearch(search);

        let query = `SELECT d.*,
                     u.nama_usaha AS owner_nama_usaha,
                     u.foto_usaha AS owner_foto_usaha,
                     u.banner_usaha AS owner_banner_usaha,
                     u.kategori_usaha AS owner_kategori_usaha
                     FROM destination d
                     LEFT JOIN user u ON d.id_owner = u.id_user`;
        let params = [];
        const conditions = [];

        // Filter kategori (selalu diterapkan)
        if (kategori) {
            conditions.push('d.kategori = ?');
            params.push(kategori);
        }

        // HANYA gunakan LIKE search untuk query sederhana (non-smart)
        // Smart Search memproses di memory setelah data diambil dari DB
        if (search && !useSmart) {
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

        // ============================================================
        // SMART SEARCH PROCESSING
        // Jika ada search query, proses dengan Smart Search
        // ============================================================
        let resultData = processedRows;

        if (search && search.trim().length > 0) {
            if (useSmart) {
                // Gunakan Smart Search (rule-based NLP)
                let smartResults = smartSearchDestinations(processedRows, search);

                // Fallback jika smart search tidak menemukan hasil
                if (smartResults.length === 0) {
                    smartResults = fallbackLikeSearch(processedRows, search);
                    // Tandai sebagai fallback
                    smartResults = smartResults.map(d => ({
                        ...d,
                        _isFallback: true,
                        _searchScore: d._searchScore || 1,
                        _searchReason: d._searchReason || `Fallback: "${search}"`
                    }));
                }

                resultData = smartResults;
            } else {
                // Gunakan LIKE search lama (query sederhana)
                resultData = processedRows;
            }
        }

        res.json(resultData);
    } catch (err) {
        console.error('Get destinations error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

/**
 * Cek apakah query sebaiknya menggunakan Smart Search
 * Smart Search digunakan jika query mengandung:
 * - Keyword suasana (murah, sejuk, sepi, dll)
 * - Multi-word location phrases
 * - Kategori kompleks (bukan single word)
 */
function shouldUseSmartSearch(query) {
    if (!query || typeof query !== 'string') return false;

    const normalized = query.toLowerCase();

    // Smart keywords yang memicu smart search
    const smartTriggers = [
        // Harga
        'murah', 'hemat', 'budget', 'terjangkau', 'ekonomis',
        // Suasana
        'sejuk', 'adem', 'dingin', 'sepi', 'tenang', 'ramai', 'terkenal', 'populer',
        'sunset', 'matahari', 'foto', 'instagram', 'romantis', 'rombongan',
        // Aktivitas
        'camping', 'nongkrong', 'trekking', 'hiking', 'snorkeling', 'diving',
        // Location phrases
        'dekat', 'terdekat', 'sekitar',
        // Multi-word locations
        'jogja', 'yogyakarta', 'bali', 'bandung', 'malang', 'surabaya',
        'malioboro', 'ugm', 'ubud', 'bromo'
    ];

    for (const trigger of smartTriggers) {
        if (normalized.includes(trigger)) {
            return true;
        }
    }

    // Jika query > 3 kata, kemungkinan smart search
    const words = normalized.split(/\s+/).filter(w => w.length > 1);
    if (words.length >= 3) {
        return true;
    }

    return false;
}

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
