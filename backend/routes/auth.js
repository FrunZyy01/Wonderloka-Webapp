const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// POST /api/auth/login
// Login user
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('\n========== LOGIN ATTEMPT ==========');
        console.log('Email:', email);
        console.log('Password length:', password ? password.length : 0);

        // Validasi input
        if (!email || !password) {
            console.log('❌ Validasi gagal: email atau password kosong');
            return res.status(400).json({ message: 'Email dan password wajib diisi.' });
        }

        // Cek apakah user ada di database
        console.log('🔍 Mencari user di database...');
        const [users] = await pool.query(
            'SELECT id_user, username, email, password_hash, nama_lengkap, no_wa, role, status_verifikasi, alasan_penolakan FROM user WHERE email = ?',
            [email]
        );

        console.log('📊 User ditemukan:', users.length);

        if (users.length === 0) {
            console.log('❌ User tidak ditemukan untuk email:', email);
            return res.status(401).json({ message: 'Email belum terdaftar.' });
        }

        const user = users[0];
        console.log('✅ User ditemukan:', {
            id: user.id_user,
            email: user.email,
            role: user.role,
            status_verifikasi: user.status_verifikasi
        });

        // Verifikasi password
        console.log('🔐 Verifikasi password...');
        const valid = await bcrypt.compare(password, user.password_hash);
        console.log('🔐 Password valid:', valid);

        if (!valid) {
            console.log('❌ Password salah untuk user:', email);
            return res.status(401).json({ message: 'Password salah.' });
        }

        // Generate token
        console.log('🎫 Generate JWT token...');
        const token = generateToken({
            id_user: user.id_user,
            username: user.username,
            email: user.email,
            role: user.role,
            status_verifikasi: user.status_verifikasi
        });

        console.log('✅ Login berhasil untuk:', email);
        console.log('========================================\n');

        res.json({
            success: true,
            message: 'Login berhasil.',
            token,
            user: {
                id_user: user.id_user,
                username: user.username,
                email: user.email,
                nama_lengkap: user.nama_lengkap,
                no_wa: user.no_wa,
                role: user.role,
                status_verifikasi: user.status_verifikasi,
                alasan_penolakan: user.alasan_penolakan
            }
        });
    } catch (err) {
        console.error('❌ Login error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: 'Terjadi kesalahan server: ' + err.message });
    }
});

// ============================================================
// POST /api/auth/register
// Registrasi user baru
// ============================================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, nama_lengkap, no_wa, role } = req.body;

        console.log('\n========== REGISTER ATTEMPT ==========');
        console.log('Email:', email);

        // Validasi input
        if (!username || !email || !password || !nama_lengkap) {
            console.log('❌ Validasi gagal: field wajib kosong');
            return res.status(400).json({ message: 'Username, email, password, dan nama lengkap wajib diisi.' });
        }

        if (password.length < 6) {
            console.log('❌ Password terlalu pendek');
            return res.status(400).json({ message: 'Password minimal 6 karakter.' });
        }

        // Cek email duplikat
        const [existingEmail] = await pool.query(
            'SELECT id_user FROM user WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
            console.log('❌ Email sudah terdaftar:', email);
            return res.status(409).json({ message: 'Email sudah terdaftar. Silakan login.' });
        }

        // Cek username duplikat
        const [existingUsername] = await pool.query(
            'SELECT id_user FROM user WHERE username = ?',
            [username]
        );

        if (existingUsername.length > 0) {
            console.log('❌ Username sudah digunakan:', username);
            return res.status(409).json({ message: 'Username sudah digunakan.' });
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Tentukan role dan status verifikasi
        const finalRole = role || 'wisatawan';
        let statusVerifikasi = null;
        if (finalRole === 'pengusaha') {
            statusVerifikasi = 'pending';
        }

        // Insert user baru
        console.log('💾 Insert user baru...');
        const [result] = await pool.query(
            'INSERT INTO user (username, email, password_hash, nama_lengkap, no_wa, role, status_verifikasi) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, password_hash, nama_lengkap, no_wa || null, finalRole, statusVerifikasi]
        );

        console.log('✅ User berhasil dibuat:', result.insertId);

        // Generate token
        const token = generateToken({
            id_user: result.insertId,
            username,
            email,
            role: finalRole
        });

        console.log('========================================\n');

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil.',
            token,
            user: {
                id_user: result.insertId,
                username,
                email,
                nama_lengkap,
                no_wa: no_wa || null,
                role: finalRole,
                status_verifikasi: statusVerifikasi
            }
        });
    } catch (err) {
        console.error('❌ Register error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: 'Terjadi kesalahan server: ' + err.message });
    }
});

// ============================================================
// POST /api/auth/reset-password
// Reset password user
// ============================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        console.log('\n========== RESET PASSWORD ==========');
        console.log('Email:', email);

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email dan password baru wajib diisi.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
        }

        const [users] = await pool.query(
            'SELECT id_user FROM user WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ Email tidak ditemukan:', email);
            return res.status(404).json({ message: 'Email tidak ditemukan.' });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE user SET password_hash = ? WHERE email = ?',
            [password_hash, email]
        );

        console.log('✅ Password berhasil direset untuk:', email);
        console.log('========================================\n');

        res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
    } catch (err) {
        console.error('❌ Reset password error:', err.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ============================================================
// GET /api/auth/me
// Get current user info
// ============================================================
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token tidak ditemukan.' });
        }

        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'wonderloka_secret_key_2026';

        const decoded = jwt.verify(token, JWT_SECRET);

        const [users] = await pool.query(
            'SELECT id_user, username, email, nama_lengkap, no_wa, role, status_verifikasi, alasan_penolakan FROM user WHERE id_user = ?',
            [decoded.id_user]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (err) {
        console.error('❌ Get user error:', err.message);
        res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
});

module.exports = router;
