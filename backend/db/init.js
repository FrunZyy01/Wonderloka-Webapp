const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        console.log('Terhubung ke MySQL.');

        const sqlPath = path.join(__dirname, 'wonderloka.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        await conn.query(sqlScript);
        console.log('Tabel dan data destinasi berhasil dibuat.');

        await conn.query('USE wonderloka');

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash('password123', salt);

        const [existing] = await conn.query('SELECT COUNT(*) as cnt FROM user');
        if (existing[0].cnt === 0) {
            await conn.query(
                `INSERT INTO user (username, email, password_hash, nama_lengkap, no_wa, role) VALUES
                ('wisatawan1', 'wisatawan@wonderloka.com', ?, 'Budi Santoso', '081234567890', 'wisatawan'),
                ('pengusaha1', 'pengusaha@wonderloka.com', ?, 'Sari Dewi', '081987654321', 'pengusaha'),
                ('wisatawan2', 'andi@wonderloka.com', ?, 'Andi Pratama', '082233445566', 'wisatawan')`,
                [passwordHash, passwordHash, passwordHash]
            );
            console.log('3 user sampel berhasil dibuat (password: password123).');
        } else {
            console.log('User sudah ada, skip insert user.');
        }

        const [bookingsExist] = await conn.query('SELECT COUNT(*) as cnt FROM bookings');
        if (bookingsExist[0].cnt === 0) {
            const [users] = await conn.query('SELECT id_user FROM user LIMIT 1');
            const [destinations] = await conn.query('SELECT id_destinasi, harga FROM destination LIMIT 5');

            if (users.length > 0 && destinations.length > 0) {
                const idUser = users[0].id_user;

                for (let i = 0; i < destinations.length; i++) {
                    const dest = destinations[i];
                    const tiket = Math.floor(Math.random() * 3) + 1;
                    const tgl = new Date();
                    tgl.setDate(tgl.getDate() + (i + 7));

                    await conn.query(
                        'INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            idUser,
                            dest.id_destinasi,
                            tgl.toISOString().split('T')[0],
                            tiket,
                            dest.harga * tiket,
                            ['menunggu', 'dikonfirmasi', 'selesai'][i % 3]
                        ]
                    );
                }
                console.log('5 booking sampel berhasil dibuat.');
            }
        } else {
            console.log('Booking sudah ada, skip insert booking.');
        }

        const [favoritExist] = await conn.query('SELECT COUNT(*) as cnt FROM favorit');
        if (favoritExist[0].cnt === 0) {
            const [users] = await conn.query('SELECT id_user FROM user LIMIT 1');
            const [destinations] = await conn.query('SELECT id_destinasi FROM destination LIMIT 3');

            if (users.length > 0 && destinations.length > 0) {
                const idUser = users[0].id_user;

                for (let i = 0; i < destinations.length; i++) {
                    await conn.query(
                        'INSERT INTO favorit (id_user, id_destinasi) VALUES (?, ?)',
                        [idUser, destinations[i].id_destinasi]
                    );
                }
                console.log('3 favorit sampel berhasil dibuat.');
            }
        } else {
            console.log('Favorit sudah ada, skip insert favorit.');
        }

        console.log('\nDatabase wonderloka siap digunakan!');
        console.log('Akun login:');
        console.log('  Email: wisatawan@wonderloka.com / Password: password123');
        console.log('  Email: pengusaha@wonderloka.com / Password: password123');
        console.log('  Email: andi@wonderloka.com / Password: password123');
    } catch (err) {
        console.error('Gagal inisialisasi database:', err.message);
    } finally {
        await conn.end();
    }
}

initDatabase();
