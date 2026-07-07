const API_BASE = '/api';

// Fallback path untuk halaman di subfolder (misal: wisatawan/)
// Deteksi berdasarkan lokasi file script-api.js
const isInSubfolder = window.location.pathname.includes('/wisatawan/') ||
                      window.location.pathname.includes('/admin/') ||
                      window.location.pathname.includes('/pengelola/') ||
                      window.location.pathname.includes('/superadmin/');

const LOGIN_PATH = isInSubfolder ? '../halaman-login-user.html' : 'halaman-login-user.html';
const LOGIN_PATH_ROOT = 'halaman-login-user.html';

// Fallback image lokal
const FALLBACK_IMAGE = isInSubfolder ? '../assets/images/wonderloka.jpeg' : 'assets/images/wonderloka.jpeg';

function getToken() {
    return localStorage.getItem('wonderloka_token');
}

function getUser() {
    const data = localStorage.getItem('wonderloka_user');
    return data ? JSON.parse(data) : null;
}

function setAuth(token, user) {
    localStorage.setItem('wonderloka_token', token);
    localStorage.setItem('wonderloka_user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('wonderloka_token');
    localStorage.removeItem('wonderloka_user');
}

function isLoggedIn() {
    return !!getToken();
}

/**
 * Handle authentication errors (401/403)
 * - Clear localStorage
 * - Redirect to login page with message
 */
function handleAuthError(message) {
    clearAuth();

    // Simpan pesan untuk ditampilkan di halaman login
    if (message) {
        sessionStorage.setItem('auth_error', message);
    }

    // Redirect ke halaman login
    const redirectUrl = isInSubfolder ? '../halaman-login-user.html' : 'halaman-login-user.html';
    window.location.href = redirectUrl;
}

/**
 * Custom API fetch dengan handling error yang lebih baik
 */
async function apiFetch(path, options = {}) {
    const url = API_BASE + path;
    const token = getToken();

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    let res;
    try {
        res = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
    } catch (networkErr) {
        // Network error (server down, CORS, etc)
        throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    }

    // Parse response - handle non-JSON responses
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            data = await res.json();
        } catch (_) {
            data = { message: 'Respons server tidak valid.' };
        }
    } else {
        // Non-JSON response
        const text = await res.text();
        data = { message: text || 'Respons server tidak valid.' };
    }

    // Handle HTTP errors
    if (!res.ok) {
        const status = res.status;
        const message = data.message || 'Terjadi kesalahan.';

        // Handle authentication errors
        if (status === 401 || status === 403) {
            // Token expired atau tidak valid
            if (message.includes('kedaluwarsa') ||
                message.includes('tidak valid') ||
                message.includes('tidak ditemukan') ||
                message.includes('Sesi login') ||
                message.includes('Token')) {
                handleAuthError('Sesi Anda telah berakhir. Silakan login ulang.');
                // Throw error yang akan mengarahkan ke login
                throw new Error('Sesi Anda telah berakhir. Silakan login ulang.');
            }
        }

        throw new Error(message);
    }

    return data;
}

/**
 * Helper: Get fallback image path
 */
function getFallbackImage(customPath) {
    return customPath || FALLBACK_IMAGE;
}

/**
 * Helper: Generate onerror attribute untuk img tag
 */
function getImageOnError() {
    return `this.onerror=null; this.src='${FALLBACK_IMAGE}';`;
}

// Export untuk penggunaan di module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getToken,
        getUser,
        setAuth,
        clearAuth,
        isLoggedIn,
        apiFetch,
        handleAuthError,
        getFallbackImage,
        getImageOnError,
        FALLBACK_IMAGE,
        LOGIN_PATH
    };
}
