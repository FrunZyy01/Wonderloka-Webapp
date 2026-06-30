const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const destinationRoutes = require('./routes/destinations');
const bookingRoutes = require('./routes/bookings');
const favoriteRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'wisatawan')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'admin')));

app.get('/api', (req, res) => {
    res.json({ message: 'Selamat datang di Wonderloka API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);

app.get('*', (req, res) => {
    const possiblePaths = [
        path.join(__dirname, '..', 'frontend', req.path),
        path.join(__dirname, '..', 'frontend', 'wisatawan', req.path),
        path.join(__dirname, '..', 'frontend', 'admin', req.path),
        path.join(__dirname, '..', 'frontend', 'halaman-login-user.html')
    ];

    const fs = require('fs');
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            return res.sendFile(filePath);
        }
    }
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan server internal.' });
});

app.listen(PORT, () => {
    console.log(`Wonderloka API berjalan di http://localhost:${PORT}`);
});
