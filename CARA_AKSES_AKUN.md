# Cara Akses Akun Wonderloka - Panduan Lengkap

## Masalah Umum Login & Solusi

### ❌ Error "Failed to fetch"
**Penyebab:** Server backend tidak berjalan.
**Solusi:** Pastikan `npm start` berjalan di folder backend.

### ❌ Error "Email belum terdaftar"
**Penyebab:** Akun belum dibuat di database.
**Solusi:** Jalankan `node db/init.js` di folder backend.

### ❌ Login berhasil tapi tidak redirect
**Penyebab:** Error di fungsi redirect atau localStorage bermasalah.
**Solusi:** Buka DevTools (F12) → Console → Cek log.

---

## Langkah-Langkah Memulai

### 1. Jalankan XAMPP
```
Buka XAMPP Control Panel
Aktifkan: Apache dan MySQL
```

### 2. Siapkan Database

**Penting:** Jika ini pertama kali atau ada error, jalankan SQL fix terlebih dahulu:

```sql
-- Jalankan di phpMyAdmin:
-- Buka phpMyAdmin → Pilih database wonderloka → Tab SQL
-- Copy-paste isi file: backend/db/fix_enum_role.sql
```

** Kemudian inisialisasi:**

```bash
cd backend
npm install
node db/init.js
npm start
```

### 3. Buka Browser
```
http://localhost:5000/halaman-login-user.html
```

---

## Daftar Akun Default

> **Password untuk semua akun: `password123`**

### 1. Admin Platform
| Field | Value |
|-------|-------|
| Email | `admin@wonderloka.com` |
| Password | `password123` |
| Role | `admin` |
| Redirect | `superadmin/verifikasi-pengelola.html` |

### 2. Pengusaha Pending
| Field | Value |
|-------|-------|
| Email | `pengusaha.pending@wonderloka.com` |
| Password | `password123` |
| Role | `pengusaha` |
| Status | `pending` |
| Redirect | `status-verifikasi.html` |

### 3. Pengusaha Terverifikasi
| Field | Value |
|-------|-------|
| Email | `pengusaha.verified@wonderloka.com` |
| Password | `password123` |
| Role | `pengusaha` |
| Status | `terverifikasi` |
| Redirect | `admin/index.html` |

### 4. Pengusaha Ditolak
| Field | Value |
|-------|-------|
| Email | `pengusaha.ditolak@wonderloka.com` |
| Password | `password123` |
| Role | `pengusaha` |
| Status | `ditolak` |
| Alasan | `Nama usaha sejenis sudah terdaftar atau data usaha belum lengkap.` |
| Redirect | `status-verifikasi.html` |

### 5. Wisatawan
| Field | Value |
|-------|-------|
| Email | `wisatawan@wonderloka.com` |
| Password | `password123` |
| Role | `wisatawan` |
| Redirect | `wisatawan/dashboard.html` |

---

## Rute/Akses Halaman

| Halaman | URL |
|---------|-----|
| Login Utama | `http://localhost:5000/halaman-login-user.html` |
| Dashboard Admin | `http://localhost:5000/superadmin/verifikasi-pengelola.html` |
| Status Verifikasi | `http://localhost:5000/status-verifikasi.html` |
| Dashboard Pengelola | `http://localhost:5000/admin/index.html` |
| Dashboard Wisatawan | `http://localhost:5000/wisatawan/dashboard.html` |

---

## Debugging

### Buka DevTools (F12)

1. **Tab Console** - Lihat log login:
   - `📡 API Fetch:` - Request API
   - `📥 Response status:` - Status response
   - `🔄 Redirect ke:` - Arah redirect

2. **Tab Network** - Lihat request:
   - Cari request ke `/api/auth/login`
   - Cek status dan response

### Test API dengan PowerShell

```powershell
# Test login Admin
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@wonderloka.com","password":"password123"}'

# Test login Pengusaha Pending
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"pengusaha.pending@wonderloka.com","password":"password123"}'

# Test login Pengusaha Terverifikasi
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"pengusaha.verified@wonderloka.com","password":"password123"}'

# Test login Pengusaha Ditolak
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"pengusaha.ditolak@wonderloka.com","password":"password123"}'

# Test login Wisatawan
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"wisatawan@wonderloka.com","password":"password123"}'
```

---

## SQL yang Mungkin Perlu Dijalankan

### File: `fix_enum_role.sql`

```sql
USE wonderloka;

-- Fix enum role
ALTER TABLE user MODIFY COLUMN role ENUM('wisatawan', 'pengusaha', 'admin') NOT NULL DEFAULT 'wisatawan';

-- Tambah kolom jika belum ada
ALTER TABLE user ADD COLUMN IF NOT EXISTS status_verifikasi ENUM('pending', 'terverifikasi', 'ditolak') DEFAULT 'pending';
ALTER TABLE user ADD COLUMN IF NOT EXISTS alasan_penolakan TEXT DEFAULT NULL;

-- Seed akun admin
UPDATE user SET role = 'admin', username = 'admin', password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQ1FKOqV.jPRKWG' WHERE email = 'admin@wonderloka.com';

INSERT IGNORE INTO user (username, email, password_hash, nama_lengkap, no_wa, role, status_verifikasi)
VALUES ('admin', 'admin@wonderloka.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQ1FKOqV.jPRKWG', 'Administrator Wonderloka', '081234567890', 'admin', NULL);

-- Verifikasi
SELECT id_user, email, role, status_verifikasi FROM user;
```

---

## Struktur Folder

```
WONDERLOKA_UI/
├── backend/
│   ├── db/
│   │   ├── init.js              # Seed database
│   │   ├── fix_enum_role.sql   # FIX: Enum role
│   │   ├── wonderloka.sql      # Schema database
│   │   └── migration_*.sql     # Migrasi
│   ├── routes/
│   │   └── auth.js             # Login/Register API
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   └── server.js               # Express server
├── frontend/
│   ├── halaman-login-user.html  # Halaman login
│   ├── status-verifikasi.html   # Status verifikasi
│   ├── script-login.js          # Logic login
│   ├── script-api.js           # API helper
│   ├── superadmin/
│   │   └── verifikasi-pengelola.html  # Dashboard admin
│   ├── admin/
│   │   └── index.html          # Dashboard pengelola
│   └── wisatawan/
│       └── dashboard.html       # Dashboard wisatawan
├── CARA_AKSES_AKUN.md         # Dokumen ini
└── package.json
```

---

## Troubleshooting

### Server tidak bisa connect ke database
1. Pastikan XAMPP MySQL running
2. Cek `.env` file
3. Pastikan database `wonderloka` ada

### Login selalu gagal
1. Buka DevTools Console
2. Cek apakah ada error `Failed to fetch`
3. Pastikan server berjalan di port 5000
4. Jalankan ulang `node db/init.js`

### Redirect tidak sesuai
1. Cek role dan status_verifikasi di database
2. Buka DevTools Console → lihat log `🔄 Redirect ke:`

### Admin tidak bisa akses
1. Pastikan enum role support 'admin'
2. Jalankan `fix_enum_role.sql`
3. Cek tabel user, role harus 'admin'

---

*© Wonderloka - 2024*
