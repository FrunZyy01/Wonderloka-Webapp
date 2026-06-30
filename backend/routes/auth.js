const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, nama_lengkap, no_wa, role } = req.body;

        if (!username || !email || !password || !nama_lengkap) {
            return res.status(400).json({ message: 'Username, email, password, dan nama lengkap wajib diisi.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password minimal 6 karakter.' });
        }

        const [existing] = await pool.query(
            'SELECT id_user FROM user WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username atau email sudah terdaftar.' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO user (username, email, password_hash, nama_lengkap, no_wa, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, password_hash, nama_lengkap, no_wa || null, role || 'wisatawan']
        );

        const token = generateToken({
            id_user: result.insertId,
            username,
            email,
            role: role || 'wisatawan'
        });

        res.status(201).json({
            message: 'Registrasi berhasil.',
            token,
            user: {
                id_user: result.insertId,
                username,
                email,
                nama_lengkap,
                no_wa: no_wa || null,
                role: role || 'wisatawan'
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password wajib diisi.' });
        }

        const [users] = await pool.query(
            'SELECT id_user, username, email, password_hash, nama_lengkap, no_wa, role FROM user WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Email belum terdaftar.' });
        }

        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ message: 'Password salah.' });
        }

        const token = generateToken({
            id_user: user.id_user,
            username: user.username,
            email: user.email,
            role: user.role
        });

        res.json({
            message: 'Login berhasil.',
            token,
            user: {
                id_user: user.id_user,
                username: user.username,
                email: user.email,
                nama_lengkap: user.nama_lengkap,
                no_wa: user.no_wa,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

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
            return res.status(404).json({ message: 'Email tidak ditemukan.' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE user SET password_hash = ? WHERE email = ?',
            [password_hash, email]
        );

        res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

module.exports = router;
