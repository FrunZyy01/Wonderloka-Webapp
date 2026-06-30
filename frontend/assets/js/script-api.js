const API_BASE = '/api';

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

async function apiFetch(path, options = {}) {
    const url = API_BASE + path;
    const token = getToken();

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Terjadi kesalahan');
    }

    return data;
}
