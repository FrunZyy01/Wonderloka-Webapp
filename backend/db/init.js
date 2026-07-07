const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// DAFTAR AKUN DEFAULT UNTUK TESTING
// ============================================================
const SEED_ACCOUNTS = [
    {
        username: 'admin',
        email: 'admin@wonderloka.com',
        password: 'password123',
        nama_lengkap: 'Administrator Wonderloka',
        no_wa: '081234567890',
        role: 'admin',
        status_verifikasi: null,
        nama_usaha: null,
        alasan_penolakan: null
    },
    {
        username: 'pengusaha_pending',
        email: 'pengusaha.pending@wonderloka.com',
        password: 'password123',
        nama_lengkap: 'Budi Pengusaha',
        no_wa: '081987654321',
        role: 'pengusaha',
        status_verifikasi: 'pending',
        nama_usaha: 'Wisata EdukasiABC',
        alasan_penolakan: null
    },
    {
        username: 'pengusaha_verified',
        email: 'pengusaha.verified@wonderloka.com',
        password: 'password123',
        nama_lengkap: 'Sari Dewi',
        no_wa: '082233445566',
        role: 'pengusaha',
        status_verifikasi: 'terverifikasi',
        nama_usaha: 'Taman Safari Indonesia',
        alasan_penolakan: null
    },
    {
        username: 'pengusaha_ditolak',
        email: 'pengusaha.ditolak@wonderloka.com',
        password: 'password123',
        nama_lengkap: 'Joko Tole',
        no_wa: '085123456789',
        role: 'pengusaha',
        status_verifikasi: 'ditolak',
        nama_usaha: 'Pantai Sunset Cove',
        alasan_penolakan: 'Nama usaha sejenis sudah terdaftar atau data usaha belum lengkap.'
    },
    {
        username: 'wisatawan1',
        email: 'wisatawan@wonderloka.com',
        password: 'password123',
        nama_lengkap: 'Ahmad Tourist',
        no_wa: '081122334455',
        role: 'wisatawan',
        status_verifikasi: null,
        nama_usaha: null,
        alasan_penolakan: null
    }
];

async function initDatabase() {
    let conn;

    try {
        console.log('\n========================================');
        console.log('🚀 WONDERLOKA DATABASE INITIALIZATION');
        console.log('========================================\n');

        // Connect ke MySQL
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('✅ Terhubung ke MySQL');

        // 1. Buat database dan tabel dari wonderloka.sql
        const sqlPath = path.join(__dirname, 'wonderloka.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error('File wonderloka.sql tidak ditemukan di ' + sqlPath);
        }

        console.log('\n📦 Membuat database dan tabel...');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        await conn.query(sqlScript);
        console.log('✅ Tabel berhasil dibuat');

        await conn.query('USE wonderloka');
        console.log('✅ Menggunakan database wonderloka');

        // 2. Jalankan fix migration
        console.log('\n📦 Menjalankan migration fix...');
        const fixPath = path.join(__dirname, 'fix_bookings_favorites_schema.sql');
        if (fs.existsSync(fixPath)) {
            try {
                const fixScript = fs.readFileSync(fixPath, 'utf8');
                await conn.query(fixScript);
                console.log('✅ Migration fix berhasil');
            } catch (migrationErr) {
                console.log('⚠️ Migration ada error (mungkin kolom sudah ada):', migrationErr.message);
            }
        }

        // 3. Fix enum role
        console.log('\n📦 Memperbaiki enum role...');
        try {
            await conn.query(
                `ALTER TABLE user MODIFY COLUMN role ENUM('wisatawan', 'pengusaha', 'admin') NOT NULL DEFAULT 'wisatawan'`
            );
            console.log('✅ Enum role berhasil diupdate');
        } catch (enumErr) {
            if (enumErr.code === 'ER_PARSE_ERROR' || enumErr.code === 'ER_TRUNCATED_WRONG_VALUE') {
                console.log('⚠️ Enum role sudah benar atau perlu dicek manual');
            } else {
                console.log('⚠️ Enum role error:', enumErr.message);
            }
        }

        // 4. Seed akun default
        console.log('\n========================================');
        console.log('📋 SEED AKUN DEFAULT');
        console.log('========================================');

        for (const account of SEED_ACCOUNTS) {
            console.log('\n--- Memproses:', account.email, '---');

            const [existing] = await conn.query(
                'SELECT id_user, role FROM user WHERE email = ?',
                [account.email]
            );

            // Hash password
            const salt = await bcrypt.genSalt(12);
            const passwordHash = await bcrypt.hash(account.password, salt);

            if (existing.length === 0) {
                // Insert baru
                console.log('📝 Insert user baru...');
                await conn.query(
                    `INSERT INTO user
                    (username, email, password_hash, nama_lengkap, no_wa, role, status_verifikasi, nama_usaha, alasan_penolakan)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        account.username,
                        account.email,
                        passwordHash,
                        account.nama_lengkap,
                        account.no_wa,
                        account.role,
                        account.status_verifikasi,
                        account.nama_usaha,
                        account.alasan_penolakan
                    ]
                );
                console.log('✅ Akun dibuat:', account.email, '| Role:', account.role, '| Status:', account.status_verifikasi || '-');
            } else {
                // Update yang sudah ada
                console.log('📝 Update user yang sudah ada...');
                await conn.query(
                    `UPDATE user SET
                    username = ?, password_hash = ?, nama_lengkap = ?, no_wa = ?,
                    role = ?, status_verifikasi = ?, nama_usaha = ?, alasan_penolakan = ?
                    WHERE email = ?`,
                    [
                        account.username,
                        passwordHash,
                        account.nama_lengkap,
                        account.no_wa,
                        account.role,
                        account.status_verifikasi,
                        account.nama_usaha,
                        account.alasan_penolakan,
                        account.email
                    ]
                );
                console.log('✅ Akun diupdate:', account.email, '| Role:', account.role, '| Status:', account.status_verifikasi || '-');
            }

            // Verifikasi password hash
            const [verify] = await conn.query(
                'SELECT password_hash FROM user WHERE email = ?',
                [account.email]
            );
            if (verify.length > 0) {
                const testValid = await bcrypt.compare('password123', verify[0].password_hash);
                console.log('🔐 Password test:', testValid ? 'BERHASIL' : 'GAGAL');
            }
        }

        // 5. Seed data booking untuk wisatawan
        console.log('\n📦 Memeriksa data booking...');
        const [bookingsExist] = await conn.query('SELECT COUNT(*) as cnt FROM bookings');
        if (bookingsExist[0].cnt === 0) {
            const [users] = await conn.query('SELECT id_user FROM user WHERE role = "wisatawan" LIMIT 1');
            const [destinations] = await conn.query('SELECT id_destinasi, harga, nama FROM destination LIMIT 5');

            if (users.length > 0 && destinations.length > 0) {
                const idUser = users[0].id_user;

                for (let i = 0; i < Math.min(destinations.length, 3); i++) {
                    const dest = destinations[i];
                    const tiket = Math.floor(Math.random() * 3) + 1;
                    const tgl = new Date();
                    tgl.setDate(tgl.getDate() + (i + 7));
                    const harga = parseInt(dest.harga) || 0;

                    await conn.query(
                        'INSERT INTO bookings (id_user, id_destinasi, tgl_kunjungan, jumlah_tiket, total_harga, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [idUser, dest.id_destinasi, tgl.toISOString().split('T')[0], tiket, harga * tiket, ['menunggu', 'dikonfirmasi', 'selesai'][i % 3]]
                    );
                }
                console.log('✅ 3 booking sampel berhasil dibuat');
            }
        } else {
            console.log('ℹ️ Booking sudah ada, skip');
        }

        // 6. Seed data favorit untuk wisatawan
        console.log('\n📦 Memeriksa data favorit...');
        const [favoritExist] = await conn.query('SELECT COUNT(*) as cnt FROM favorit');
        if (favoritExist[0].cnt === 0) {
            const [users] = await conn.query('SELECT id_user FROM user WHERE role = "wisatawan" LIMIT 1');
            const [destinations] = await conn.query('SELECT id_destinasi FROM destination LIMIT 3');

            if (users.length > 0 && destinations.length > 0) {
                const idUser = users[0].id_user;

                for (let i = 0; i < Math.min(destinations.length, 2); i++) {
                    try {
                        await conn.query(
                            'INSERT INTO favorit (id_user, id_destinasi) VALUES (?, ?)',
                            [idUser, destinations[i].id_destinasi]
                        );
                    } catch (favErr) {
                        // Ignore duplicate error
                    }
                }
                console.log('✅ 2 favorit sampel berhasil dibuat');
            }
        } else {
            console.log('ℹ️ Favorit sudah ada, skip');
        }

        // 7. Tampilkan ringkasan
        console.log('\n========================================');
        console.log('✅ DATABASE SIAP DIGUNAKAN!');
        console.log('========================================');

        // Cek semua user
        const [allUsers] = await conn.query('SELECT email, role, status_verifikasi FROM user');
        console.log('\n📋 DAFTAR USER DI DATABASE:');
        console.log('--------------------------------------------------------');
        for (const u of allUsers) {
            console.log(`  - ${u.email} | ${u.role} | ${u.status_verifikasi || '-'}`);
        }
        console.log('--------------------------------------------------------');

        console.log('\n📋 AKUN DEFAULT (password: password123):');
        console.log('--------------------------------------------------------');
        console.log('1. Admin Platform');
        console.log('   Email: admin@wonderloka.com | Role: admin');
        console.log('   Redirect: superadmin/verifikasi-pengelola.html');
        console.log('');
        console.log('2. Pengusaha Pending');
        console.log('   Email: pengusaha.pending@wonderloka.com | Role: pengusaha | Status: pending');
        console.log('   Redirect: status-verifikasi.html');
        console.log('');
        console.log('3. Pengusaha Terverifikasi');
        console.log('   Email: pengusaha.verified@wonderloka.com | Role: pengusaha | Status: terverifikasi');
        console.log('   Redirect: admin/index.html');
        console.log('');
        console.log('4. Pengusaha Ditolak');
        console.log('   Email: pengusaha.ditolak@wonderloka.com | Role: pengusaha | Status: ditolak');
        console.log('   Redirect: status-verifikasi.html');
        console.log('');
        console.log('5. Wisatawan');
        console.log('   Email: wisatawan@wonderloka.com | Role: wisatawan');
        console.log('   Redirect: wisatawan/dashboard.html');
        console.log('--------------------------------------------------------');

        console.log('\n🔗 BUKA BROWSER: http://localhost:5000/halaman-login-user.html');
        console.log('');

    } catch (err) {
        console.error('\n❌ GAGAL INISIALISASI DATABASE');
        console.error('Error:', err.message);
        console.error('Stack:', err.stack);
    } finally {
        if (conn) {
            await conn.end();
            console.log('\n👋 Koneksi database ditutup');
        }
    }
}

// Jalankan
initDatabase();
