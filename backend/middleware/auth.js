const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'wonderloka_secret_key_2026';

function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // ============================================================
        // NORMALISASI USER - Pastikan id_user selalu ada
        // Mendukung berbagai format token lama: id, id_user, userId
        // ============================================================
        req.user = {
            id_user: decoded.id_user || decoded.id || decoded.userId,
            role: decoded.role,
            email: decoded.email,
            username: decoded.username,
            status_verifikasi: decoded.status_verifikasi
        };

        // Validasi: Jika id_user masih undefined, return 401
        if (!req.user.id_user) {
            console.error('❌ Auth Error: Token tidak memiliki id_user yang valid.');
            console.error('   Decoded payload:', JSON.stringify(decoded));
            return res.status(401).json({
                message: 'Sesi login bermasalah. Silakan login ulang.'
            });
        }

        next();
    } catch (err) {
        console.error('❌ JWT Verify Error:', err.message);
        return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
}

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authorizeRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Akses ditolak. Hanya untuk ' + roles.join(', ') + '.' });
        }
        next();
    };
}

// Middleware untuk memastikan pengusaha sudah terverifikasi
function authorizeVerifiedPengusaha(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    if (req.user.role !== 'pengusaha') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya untuk pengusaha.' });
    }

    // Catatan: Untuk verifikasi status, perlu dicek dari database
    // Middleware ini hanya memastikan role sudah benar
    // Verifikasi status dicek di route handler

    next();
}

module.exports = { authenticate, generateToken, authorizeRole, authorizeVerifiedPengusaha };
