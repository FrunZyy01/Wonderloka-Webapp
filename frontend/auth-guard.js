/**
 * auth-guard.js
 * Script proteksi akses halaman berdasarkan role
 * Include di halaman yang butuh proteksi
 */

// Includenya menggunakan path relatif dari halaman
// Contoh: <script src="../auth-guard.js"></script>

/**
 * Cek apakah user boleh akses halaman berdasarkan role
 * @param {Object} options - Konfigurasi proteksi
 * @param {string[]} options.allowedRoles - Role yang boleh akses (e.g., ['admin'], ['pengusaha'], ['admin', 'pengusaha'])
 * @param {string} options.verificationStatus - Status verifikasi yang required (e.g., 'terverifikasi')
 * @param {string} options.redirectOnFail - URL redirect jika gagal
 */
function protectPage(options = {}) {
    const {
        allowedRoles = ['pengusaha'],
        requiredStatus = null,
        redirectOnFail = 'halaman-login-user.html',
        adminRedirect = 'superadmin/verifikasi-pengelola.html',
        wisatawanRedirect = 'halaman-login-user.html'
    } = options;

    const user = getUser();

    // Cek apakah sudah login
    if (!user) {
        window.location.href = redirectOnFail;
        return null;
    }

    // Cek role
    if (!allowedRoles.includes(user.role)) {
        // Admin mengakses halaman pengusaha -> redirect ke admin
        if (user.role === 'admin') {
            window.location.href = adminRedirect;
            return null;
        }

        // Wisatawan mengakses halaman admin/pengusaha
        window.location.href = wisatawanRedirect;
        return null;
    }

    // Cek status verifikasi untuk pengusaha
    if (user.role === 'pengusaha' && requiredStatus) {
        if (user.status_verifikasi !== requiredStatus) {
            window.location.href = '../status-verifikasi.html';
            return null;
        }
    }

    return user;
}

/**
 * Cek apakah user adalah admin
 */
function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

/**
 * Cek apakah user adalah pengusaha terverifikasi
 */
function isVerifiedPengusaha() {
    const user = getUser();
    return user && user.role === 'pengusaha' && user.status_verifikasi === 'terverifikasi';
}

/**
 * Cek apakah user adalah wisatawan
 */
function isWisatawan() {
    const user = getUser();
    return user && user.role === 'wisatawan';
}

/**
 * Redirect berdasarkan role
 */
function redirectBasedOnRole() {
    const user = getUser();
    if (!user) {
        window.location.href = 'halaman-login-user.html';
        return;
    }

    switch (user.role) {
        case 'admin':
            window.location.href = 'superadmin/verifikasi-pengelola.html';
            break;
        case 'pengusaha':
            if (user.status_verifikasi === 'terverifikasi') {
                window.location.href = 'pengelola/index.html';
            } else {
                window.location.href = 'status-verifikasi.html';
            }
            break;
        case 'wisatawan':
            window.location.href = 'wisatawan/dashboard.html';
            break;
        default:
            window.location.href = 'halaman-login-user.html';
    }
}
