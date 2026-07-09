const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const { authenticate, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// FILE UPLOAD CONFIG
// ============================================================
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads', 'business'));
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `business-${req.user.id_user}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file JPG, PNG, dan WEBP yang diizinkan.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// ============================================================
// MIDDLEWARE: Semua route pengelola butuh auth + role pengusaha
// ============================================================
router.use(authenticate);
router.use(authorizeRole('pengusaha'));

// ============================================================
// MIDDLEWARE: Cek verifikasi sebelum akses (kecuali profil completion & upload)
// ============================================================
const checkVerified = async (req, res, next) => {
    try {
        const [users] = await pool.query(
            'SELECT status_verifikasi FROM user WHERE id_user = ?',
            [req.user.id_user]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        if (users[0].status_verifikasi !== 'terverifikasi') {
            return res.status(403).json({
                message: 'Akses ditolak. Akun Anda belum diverifikasi oleh admin Wonderloka.'
            });
        }

        next();
    } catch (err) {
        console.error('Verification check error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

// ============================================================
// GET /api/pengelola/profile-completion
// Cek kelengkapan profil usaha
// ============================================================
router.get('/profile-completion', async (req, res) => {
    try {
        const userId = req.user.id_user;
        const [users] = await pool.query(
            `SELECT nama_usaha, lokasi_usaha, kategori_usaha, link_gmaps,
                    jam_buka, jam_tutup, foto_usaha, banner_usaha
             FROM user WHERE id_user = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        const profile = users[0];
        const requiredFields = [
            'nama_usaha',
            'lokasi_usaha',
            'kategori_usaha',
            'link_gmaps',
            'jam_buka',
            'jam_tutup',
            'foto_usaha',
            'banner_usaha'
        ];

        const missingFields = requiredFields.filter(field => {
            const value = profile[field];
            return value === null || value === undefined || value === '';
        });

        res.json({
            complete: missingFields.length === 0,
            missing_fields: missingFields,
            profile: {
                nama_usaha: profile.nama_usaha,
                lokasi_usaha: profile.lokasi_usaha,
                kategori_usaha: profile.kategori_usaha,
                link_gmaps: profile.link_gmaps,
                jam_buka: profile.jam_buka,
                jam_tutup: profile.jam_tutup,
                foto_usaha: profile.foto_usaha,
                banner_usaha: profile.banner_usaha
            }
        });
    } catch (err) {
        console.error('Profile completion check error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/pengelola/stats
// Statistik dashboard pengelola
// ============================================================
router.get('/stats', checkVerified, async (req, res) => {
    try {
        const userId = req.user.id_user;

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
            destinasi_saya: destinasi_saya || 0,
            pesanan_saya: pesanan_saya || 0,
            pendapatan_saya: pendapatan_saya || 0,
            avg_rating: parseFloat(avg_rating) || 0
        });
    } catch (err) {
        console.error('Pengelola stats error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/pengelola/mis/revenue-per-month
// Pendapatan per bulan untuk grafik (MILIK SENDIRI)
// ============================================================
router.get('/mis/revenue-per-month', checkVerified, async (req, res) => {
    try {
        const userId = req.user.id_user;
        const [rows] = await pool.query(
            `SELECT
                MONTHNAME(b.created_at) AS bulan,
                COALESCE(SUM(b.total_harga), 0) AS total_pendapatan
             FROM bookings b
             JOIN destination d ON b.id_destinasi = d.id_destinasi
             WHERE d.id_owner = ?
             AND b.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             AND b.status != 'dibatalkan'
             GROUP BY MONTH(b.created_at)
             ORDER BY b.created_at`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('MIS revenue per month error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/pengelola/destinations
// List destinasi milik pengusaha
// ============================================================
router.get('/destinations', checkVerified, async (req, res) => {
    try {
        const userId = req.user.id_user;
        const [rows] = await pool.query(
            'SELECT * FROM destination WHERE id_owner = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Pengelola get destinations error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// POST /api/pengelola/destinations
// Tambah destinasi baru
// ============================================================
router.post('/destinations', checkVerified, async (req, res) => {
    try {
        const userId = req.user.id_user;

        console.log('[Destination Create] Request received:', {
            userId,
            nama: req.body.nama,
            kategori: req.body.kategori,
            hasLocation: Boolean(req.body.lokasi),
            harga: req.body.harga
        });

        // Ekstrak dan validasi payload
        const { nama, deskripsi, kategori, lokasi, harga, gambar, rating, fasilitas, jam_buka, jam_tutup, kontak_usaha } = req.body;

        // Validasi minimal
        if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nama destinasi wajib diisi.'
            });
        }

        if (!kategori) {
            return res.status(400).json({
                success: false,
                message: 'Kategori wajib dipilih.'
            });
        }

        // Validasi kategori harus sesuai ENUM di database
        const validKategori = ['Alam', 'Budaya', 'Penginapan', 'Tour', 'Campground'];
        if (!validKategori.includes(kategori)) {
            return res.status(400).json({
                success: false,
                message: 'Kategori harus dari daftar yang valid: ' + validKategori.join(', ')
            });
        }

        // Validasi harga tidak negatif
        const hargaNum = parseInt(harga) || 0;
        if (hargaNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'Harga tidak boleh negatif.'
            });
        }

        // Normalisasi payload secara aman
        const normalizedData = {
            nama: nama.trim(),
            deskripsi: deskripsi && typeof deskripsi === 'string' ? deskripsi.trim() : null,
            kategori: kategori,
            lokasi: lokasi && typeof lokasi === 'string' ? lokasi.trim() : null,
            harga: hargaNum,
            gambar: gambar && typeof gambar === 'string' ? gambar.trim() : null,
            rating: parseFloat(rating) || 0,
            fasilitas: fasilitas && typeof fasilitas === 'string' ? fasilitas.trim() : null,
            jam_buka: jam_buka || null,
            jam_tutup: jam_tutup || null,
            kontak_usaha: kontak_usaha && typeof kontak_usaha === 'string' ? kontak_usaha.trim() : null,
            id_owner: userId
        };

        // INSERT ke database
        const [result] = await pool.query(
            `INSERT INTO destination (nama, deskripsi, kategori, lokasi, harga, gambar, rating, fasilitas, jam_buka, jam_tutup, kontak_usaha, id_owner)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                normalizedData.nama,
                normalizedData.deskripsi,
                normalizedData.kategori,
                normalizedData.lokasi,
                normalizedData.harga,
                normalizedData.gambar,
                normalizedData.rating,
                normalizedData.fasilitas,
                normalizedData.jam_buka,
                normalizedData.jam_tutup,
                normalizedData.kontak_usaha,
                normalizedData.id_owner
            ]
        );

        // Validasi hasil INSERT
        if (!result || result.affectedRows !== 1 || !result.insertId) {
            console.error('[Destination Create Error] INSERT failed:', result);
            return res.status(500).json({
                success: false,
                message: 'Gagal menyimpan destinasi. Silakan coba lagi.'
            });
        }

        console.log('[Destination Create Success]', {
            insertId: result.insertId,
            affectedRows: result.affectedRows,
            ownerId: userId
        });

        // Ambil kembali data yang baru dibuat dari database
        const [createdRows] = await pool.query(
            `SELECT d.*,
                    u.nama_usaha AS owner_nama_usaha,
                    u.foto_usaha AS owner_foto_usaha,
                    u.banner_usaha AS owner_banner_usaha
             FROM destination d
             LEFT JOIN user u ON d.id_owner = u.id_user
             WHERE d.id_destinasi = ?`,
            [result.insertId]
        );

        if (!createdRows || createdRows.length === 0) {
            console.error('[Destination Create Error] Created row not found:', result.insertId);
            return res.status(500).json({
                success: false,
                message: 'Destinasi tersimpan tetapi gagal mengambil data. Silakan refresh halaman.'
            });
        }

        // Process image paths untuk owner info
        const created = createdRows[0];
        if (created.owner_foto_usaha) {
            created.owner_foto_usaha = '/uploads/business/' + created.owner_foto_usaha;
        }
        if (created.owner_banner_usaha) {
            created.owner_banner_usaha = '/uploads/business/' + created.owner_banner_usaha;
        }

        res.status(201).json({
            success: true,
            message: 'Destinasi berhasil ditambahkan.',
            destination: created
        });

    } catch (err) {
        console.error('[Destination Create Error]', {
            code: err.code,
            errno: err.errno,
            message: err.message,
            sqlMessage: err.sqlMessage
        });

        res.status(500).json({
            success: false,
            message: 'Destinasi gagal disimpan.',
            error_code: process.env.NODE_ENV === 'development' ? err.code || null : undefined
        });
    }
});

// ============================================================
// PUT /api/pengelola/destinations/:id
// Update destinasi
// ============================================================
router.put('/destinations/:id', checkVerified, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id_user;

        console.log('[Destination Update] Request received:', {
            id,
            userId,
            nama: req.body.nama,
            kategori: req.body.kategori,
            harga: req.body.harga
        });

        // Ekstrak payload
        const { nama, deskripsi, kategori, lokasi, harga, gambar, rating, fasilitas, jam_buka, jam_tutup, kontak_usaha } = req.body;

        // Validasi minimal
        if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Nama destinasi wajib diisi.' });
        }

        if (!kategori) {
            return res.status(400).json({ success: false, message: 'Kategori wajib dipilih.' });
        }

        const validKategori = ['Alam', 'Budaya', 'Penginapan', 'Tour', 'Campground'];
        if (!validKategori.includes(kategori)) {
            return res.status(400).json({
                success: false,
                message: 'Kategori harus dari daftar yang valid: ' + validKategori.join(', ')
            });
        }

        const hargaNum = parseInt(harga) || 0;
        if (hargaNum < 0) {
            return res.status(400).json({ success: false, message: 'Harga tidak boleh negatif.' });
        }

        // Cek kepemilikan
        const [existing] = await pool.query(
            'SELECT id_destinasi, id_owner FROM destination WHERE id_destinasi = ? AND id_owner = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Destinasi tidak ditemukan atau bukan milik Anda.' });
        }

        // Update database
        const [updateResult] = await pool.query(
            `UPDATE destination SET
             nama = ?, deskripsi = ?, kategori = ?, lokasi = ?, harga = ?,
             gambar = ?, rating = ?, fasilitas = ?, jam_buka = ?, jam_tutup = ?, kontak_usaha = ?
             WHERE id_destinasi = ? AND id_owner = ?`,
            [
                nama.trim(),
                deskripsi && typeof deskripsi === 'string' ? deskripsi.trim() : null,
                kategori,
                lokasi && typeof lokasi === 'string' ? lokasi.trim() : null,
                hargaNum,
                gambar && typeof gambar === 'string' ? gambar.trim() : null,
                parseFloat(rating) || 0,
                fasilitas && typeof fasilitas === 'string' ? fasilitas.trim() : null,
                jam_buka || null,
                jam_tutup || null,
                kontak_usaha && typeof kontak_usaha === 'string' ? kontak_usaha.trim() : null,
                id,
                userId
            ]
        );

        // Validasi update berhasil
        if (!updateResult || updateResult.affectedRows !== 1) {
            console.error('[Destination Update Error] Update failed:', updateResult);
            return res.status(500).json({ success: false, message: 'Gagal memperbarui destinasi.' });
        }

        console.log('[Destination Update Success]', {
            id,
            userId,
            affectedRows: updateResult.affectedRows
        });

        // Ambil data terbaru dari database
        const [updatedRows] = await pool.query(
            `SELECT d.*,
                    u.nama_usaha AS owner_nama_usaha,
                    u.foto_usaha AS owner_foto_usaha,
                    u.banner_usaha AS owner_banner_usaha
             FROM destination d
             LEFT JOIN user u ON d.id_owner = u.id_user
             WHERE d.id_destinasi = ?`,
            [id]
        );

        if (!updatedRows || updatedRows.length === 0) {
            return res.status(500).json({ success: false, message: 'Gagal mengambil data terbaru.' });
        }

        const updated = updatedRows[0];
        if (updated.owner_foto_usaha) {
            updated.owner_foto_usaha = '/uploads/business/' + updated.owner_foto_usaha;
        }
        if (updated.owner_banner_usaha) {
            updated.owner_banner_usaha = '/uploads/business/' + updated.owner_banner_usaha;
        }

        res.json({
            success: true,
            message: 'Destinasi berhasil diperbarui.',
            destination: updated
        });

    } catch (err) {
        console.error('[Destination Update Error]', {
            code: err.code,
            errno: err.errno,
            message: err.message,
            sqlMessage: err.sqlMessage
        });
        res.status(500).json({
            success: false,
            message: 'Destinasi gagal diperbarui.',
            error_code: process.env.NODE_ENV === 'development' ? err.code || null : undefined
        });
    }
});

// ============================================================
// DELETE /api/pengelola/destinations/:id
// Hapus destinasi
// ============================================================
router.delete('/destinations/:id', checkVerified, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id_user;

        const [existing] = await pool.query(
            'SELECT id_destinasi, id_owner FROM destination WHERE id_destinasi = ? AND id_owner = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Destinasi tidak ditemukan atau bukan milik Anda.' });
        }

        await pool.query('DELETE FROM destination WHERE id_destinasi = ?', [id]);

        res.json({ message: 'Destinasi berhasil dihapus.' });
    } catch (err) {
        console.error('Pengelola delete destination error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/pengelola/bookings
// List pesanan untuk destinasi pengusaha
// ============================================================
router.get('/bookings', checkVerified, async (req, res) => {
    try {
        const userId = req.user.id_user;
        const [rows] = await pool.query(
            `SELECT b.*, u.username, u.nama_lengkap, u.email, u.no_wa,
                    d.nama AS destinasi, d.lokasi, d.gambar, d.harga
             FROM bookings b
             JOIN user u ON b.id_user = u.id_user
             JOIN destination d ON b.id_destinasi = d.id_destinasi
             WHERE d.id_owner = ?
             ORDER BY b.created_at DESC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Pengelola get bookings error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// PUT /api/pengelola/bookings/:id/status
// Update status pesanan
// ============================================================
router.put('/bookings/:id/status', checkVerified, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id_user;

        const validStatus = ['menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan'];
        if (!status || !validStatus.includes(status)) {
            return res.status(400).json({ message: 'Status harus salah satu: ' + validStatus.join(', ') + '.' });
        }

        // Cek booking miliknya
        const [existing] = await pool.query(
            `SELECT b.id_booking FROM bookings b
             JOIN destination d ON b.id_destinasi = d.id_destinasi
             WHERE b.id_booking = ? AND d.id_owner = ?`,
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Booking tidak ditemukan atau bukan milik Anda.' });
        }

        await pool.query('UPDATE bookings SET status = ? WHERE id_booking = ?', [status, id]);

        res.json({ message: 'Status booking berhasil diperbarui.' });
    } catch (err) {
        console.error('Pengelola update booking status error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/pengelola/business-profile
// Ambil profil usaha pengusaha
// ============================================================
router.get('/business-profile', async (req, res) => {
    try {
        const userId = req.user.id_user;
        const [rows] = await pool.query(
            `SELECT id_user, username, email, nama_lengkap, no_wa, role, status_verifikasi,
                    nama_usaha, lokasi_usaha, kategori_usaha, deskripsi_usaha,
                    foto_usaha, banner_usaha, link_gmaps, jam_buka, jam_tutup, created_at
             FROM user WHERE id_user = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profil tidak ditemukan.' });
        }

        // Convert image paths to URLs
        const profile = rows[0];
        if (profile.foto_usaha) {
            profile.foto_usaha = '/uploads/business/' + path.basename(profile.foto_usaha);
        }
        if (profile.banner_usaha) {
            profile.banner_usaha = '/uploads/business/' + path.basename(profile.banner_usaha);
        }

        res.json(profile);
    } catch (err) {
        console.error('Get business profile error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// POST /api/pengelola/business-profile/upload
// Upload foto/banner usaha
// ============================================================
router.post('/business-profile/upload', upload.fields([
    { name: 'foto_usaha', maxCount: 1 },
    { name: 'banner_usaha', maxCount: 1 }
]), async (req, res) => {
    try {
        const userId = req.user.id_user;
        const uploadedFiles = {};

        if (req.files) {
            if (req.files.foto_usaha) {
                uploadedFiles.foto_usaha = req.files.foto_usaha[0].filename;
            }
            if (req.files.banner_usaha) {
                uploadedFiles.banner_usaha = req.files.banner_usaha[0].filename;
            }
        }

        // Update database
        const updates = [];
        const values = [];

        if (uploadedFiles.foto_usaha) {
            updates.push('foto_usaha = ?');
            values.push(uploadedFiles.foto_usaha);
        }
        if (uploadedFiles.banner_usaha) {
            updates.push('banner_usaha = ?');
            values.push(uploadedFiles.banner_usaha);
        }

        if (updates.length > 0) {
            values.push(userId);
            await pool.query(
                `UPDATE user SET ${updates.join(', ')} WHERE id_user = ?`,
                values
            );
        }

        res.json({
            success: true,
            message: 'File berhasil diupload.',
            files: {
                foto_usaha: uploadedFiles.foto_usaha ? '/uploads/business/' + uploadedFiles.foto_usaha : null,
                banner_usaha: uploadedFiles.banner_usaha ? '/uploads/business/' + uploadedFiles.banner_usaha : null
            }
        });
    } catch (err) {
        console.error('Upload business image error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server: ' + err.message });
    }
});

// ============================================================
// PUT /api/pengelola/business-profile
// Update profil usaha (tanpa upload file)
// ============================================================
router.put('/business-profile', async (req, res) => {
    try {
        const userId = req.user.id_user;
        const {
            nama_usaha,
            lokasi_usaha,
            kategori_usaha,
            deskripsi_usaha,
            link_gmaps,
            jam_buka,
            jam_tutup,
            foto_usaha_url,
            banner_usaha_url
        } = req.body;

        // Validation for required fields
        const requiredFields = ['nama_usaha', 'lokasi_usaha', 'kategori_usaha', 'link_gmaps', 'jam_buka', 'jam_tutup'];

        // Get current profile to check if we need to require images
        const [currentProfile] = await pool.query(
            'SELECT foto_usaha, banner_usaha FROM user WHERE id_user = ?',
            [userId]
        );

        const hasExistingFoto = currentProfile.length > 0 && currentProfile[0].foto_usaha;
        const hasExistingBanner = currentProfile.length > 0 && currentProfile[0].banner_usaha;

        // If no existing image, require at least one upload
        // If existing, allow keeping it empty

        const updates = [];
        const values = [];

        if (nama_usaha !== undefined) {
            updates.push('nama_usaha = ?');
            values.push(nama_usaha || null);
        }
        if (lokasi_usaha !== undefined) {
            updates.push('lokasi_usaha = ?');
            values.push(lokasi_usaha || null);
        }
        if (kategori_usaha !== undefined) {
            updates.push('kategori_usaha = ?');
            values.push(kategori_usaha || null);
        }
        if (deskripsi_usaha !== undefined) {
            updates.push('deskripsi_usaha = ?');
            values.push(deskripsi_usaha || null);
        }
        if (link_gmaps !== undefined) {
            updates.push('link_gmaps = ?');
            values.push(link_gmaps || null);
        }
        if (jam_buka !== undefined) {
            updates.push('jam_buka = ?');
            values.push(jam_buka || null);
        }
        if (jam_tutup !== undefined) {
            updates.push('jam_tutup = ?');
            values.push(jam_tutup || null);
        }
        if (foto_usaha_url !== undefined) {
            updates.push('foto_usaha = ?');
            values.push(foto_usaha_url || null);
        }
        if (banner_usaha_url !== undefined) {
            updates.push('banner_usaha = ?');
            values.push(banner_usaha_url || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Tidak ada data yang diupdate.' });
        }

        values.push(userId);
        await pool.query(
            `UPDATE user SET ${updates.join(', ')} WHERE id_user = ?`,
            values
        );

        res.json({ message: 'Profil usaha berhasil diperbarui.' });
    } catch (err) {
        console.error('Update business profile error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
