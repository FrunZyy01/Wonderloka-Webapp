document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // CONFIG
    // ============================================================
    const API_BASE = '/api';

    // ============================================================
    // ELEMENTS
    // ============================================================
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const feedback = document.getElementById('feedback');

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    const registerForm = document.getElementById('registerForm');
    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regWhatsapp = document.getElementById('regWhatsapp');
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');
    const toggleRegPassword = document.getElementById('toggleRegPassword');
    const toggleRegConfirm = document.getElementById('toggleRegConfirmPassword');
    const roleBtns = document.querySelectorAll('.role-btn');
    const roleInput = document.getElementById('roleInput');

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    function showLogin() {
        loginSection.classList.remove('hidden');
        registerSection.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        clearFeedback();
        registerForm.reset();
    }

    function showRegister() {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        clearFeedback();
        loginForm.reset();
    }

    function clearFeedback() {
        feedback.textContent = '';
        feedback.className = 'form-feedback';
    }

    function showFeedback(msg, type = 'error') {
        feedback.textContent = msg;
        feedback.className = 'form-feedback ' + type;
        setTimeout(() => clearFeedback(), 8000);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ============================================================
    // LOCAL STORAGE FUNCTIONS
    // ============================================================
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
        console.log('✅ Auth disimpan:', { token: token ? 'ada' : 'tidak ada', user });
    }

    function clearAuth() {
        localStorage.removeItem('wonderloka_token');
        localStorage.removeItem('wonderloka_user');
        console.log('🗑️ Auth dibersihkan');
    }

    function isLoggedIn() {
        return !!getToken();
    }

    // ============================================================
    // API FETCH FUNCTION
    // ============================================================
    async function apiFetch(path, options = {}) {
        const url = API_BASE + path;
        const token = getToken();

        console.log('📡 API Fetch:', {
            url: url,
            method: options.method || 'GET',
            hasToken: !!token
        });

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        try {
            const res = await fetch(url, {
                ...options,
                headers: { ...headers, ...options.headers }
            });

            console.log('📥 Response status:', res.status);

            // Parse JSON
            const data = await res.json();
            console.log('📥 Response data:', data);

            // Handle error responses
            if (!res.ok) {
                throw new Error(data.message || 'Terjadi kesalahan (' + res.status + ')');
            }

            return data;
        } catch (err) {
            console.error('❌ API Error:', err.message);
            if (err.message === 'Failed to fetch') {
                throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan di port 5000.');
            }
            throw err;
        }
    }

    // ============================================================
    // ROLE SELECTOR
    // ============================================================
    roleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            roleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            roleInput.value = this.dataset.role;
        });
    });

    // ============================================================
    // TOGGLE PASSWORD
    // ============================================================
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    if (toggleRegPassword) {
        toggleRegPassword.addEventListener('click', function() {
            const type = regPassword.type === 'password' ? 'text' : 'password';
            regPassword.type = type;
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    if (toggleRegConfirm) {
        toggleRegConfirm.addEventListener('click', function() {
            const type = regConfirmPassword.type === 'password' ? 'text' : 'password';
            regConfirmPassword.type = type;
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // ============================================================
    // LUPA PASSWORD
    // ============================================================
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', async function(e) {
            e.preventDefault();
            const email = prompt('Masukkan email Anda:');
            if (!email) return;

            if (!confirm('Password akan direset menjadi "password123". Lanjutkan?')) return;

            try {
                const result = await apiFetch('/auth/reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ email, newPassword: 'password123' })
                });
                showFeedback('✅ Password berhasil direset. Password baru: password123', 'success');
            } catch (err) {
                showFeedback('⚠️ ' + err.message, 'error');
            }
        });
    }

    // ============================================================
    // REDIRECT FUNCTION
    // ============================================================
    async function goToDashboard() {
        const user = getUser();
        console.log('🔄 Cek redirect untuk user:', user);

        let target = 'wisatawan/dashboard.html';
        let message = 'Login berhasil! Mengalihkan ke Dashboard...';

        if (user && user.role === 'admin') {
            target = 'superadmin/verifikasi-pengelola.html';
            message = 'Login berhasil! Mengalihkan ke Dashboard Admin...';
            console.log('🔄 Redirect ke admin dashboard');
        } else if (user && user.role === 'pengusaha') {
            if (user.status_verifikasi === 'terverifikasi') {
                // Cek kelengkapan profil usaha
                console.log('🔄 Cek kelengkapan profil usaha...');
                try {
                    const profileData = await apiFetch('/pengelola/profile-completion');
                    if (profileData.complete) {
                        target = 'pengelola/index.html';
                        message = 'Login berhasil! Mengalihkan ke Dashboard Pengelola...';
                        console.log('🔄 Redirect ke dashboard pengusaha (profil lengkap)');
                    } else {
                        target = 'pengelola/profil-usaha.html';
                        message = 'Login berhasil! Mengalihkan ke Profil Usaha...';
                        console.log('🔄 Redirect ke profil usaha (profil belum lengkap)');
                        console.log('🔄 Missing fields:', profileData.missing_fields);
                    }
                } catch (err) {
                    console.error('❌ Gagal cek profil:', err);
                    // Default ke profil usaha jika gagal cek
                    target = 'pengelola/profil-usaha.html';
                    message = 'Login berhasil! Mengalihkan ke Profil Usaha...';
                }
            } else if (user.status_verifikasi === 'pending' || user.status_verifikasi === 'ditolak') {
                target = 'status-verifikasi.html';
                message = 'Login berhasil! Mengalihkan ke halaman status verifikasi...';
                console.log('🔄 Redirect ke halaman verifikasi');
            }
        } else if (user && user.role === 'wisatawan') {
            target = 'wisatawan/dashboard.html';
            message = 'Login berhasil! Mengalihkan ke Dashboard...';
            console.log('🔄 Redirect ke dashboard wisatawan');
        }

        console.log('🔄 Target redirect:', target);

        // Tampilkan pesan sukses
        showFeedback('✅ ' + message, 'success');

        // Redirect setelah 1 detik
        setTimeout(() => {
            window.location.href = target;
        }, 1000);
    }

    // ============================================================
    // HANDLE LOGIN
    // ============================================================
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        console.log('\n========== LOGIN SUBMIT ==========');
        console.log('Email:', email);

        // Validasi
        if (!email || !password) {
            showFeedback('⚠️ Harap isi email dan password!', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showFeedback('⚠️ Format email tidak valid!', 'error');
            return;
        }
        if (password.length < 6) {
            showFeedback('⚠️ Password minimal 6 karakter!', 'error');
            return;
        }

        showFeedback('🔄 Memproses login...', 'success');

        try {
            // Panggil API login
            console.log('📡 Memanggil /api/auth/login...');
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            console.log('✅ Login API response:', data);

            // Simpan auth
            if (data.token && data.user) {
                setAuth(data.token, data.user);
                console.log('✅ Auth berhasil disimpan');
                goToDashboard();
            } else {
                console.error('❌ Response tidak punya token atau user:', data);
                showFeedback('⚠️ Response server tidak valid.', 'error');
            }
        } catch (err) {
            console.error('❌ Login gagal:', err.message);
            showFeedback('⚠️ ' + err.message, 'error');
        }

        console.log('========================================\n');
    });

    // ============================================================
    // HANDLE REGISTER
    // ============================================================
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = regName.value.trim();
        const email = regEmail.value.trim();
        const whatsapp = regWhatsapp.value.trim();
        const password = regPassword.value.trim();
        const confirm = regConfirmPassword.value.trim();
        const role = roleInput.value;

        console.log('\n========== REGISTER SUBMIT ==========');
        console.log('Email:', email);
        console.log('Role:', role);

        // Validasi
        if (!name || !email || !whatsapp || !password || !confirm) {
            showFeedback('⚠️ Semua field wajib diisi!', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showFeedback('⚠️ Format email tidak valid!', 'error');
            return;
        }
        if (password.length < 6) {
            showFeedback('⚠️ Password minimal 6 karakter!', 'error');
            return;
        }
        if (password !== confirm) {
            showFeedback('⚠️ Konfirmasi password tidak cocok!', 'error');
            return;
        }

        showFeedback('🔄 Mendaftarkan akun...', 'success');

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username: email,
                    email,
                    password,
                    nama_lengkap: name,
                    no_wa: whatsapp,
                    role
                })
            });

            console.log('✅ Register API response:', data);

            if (data.token && data.user) {
                setAuth(data.token, data.user);

                let message = '✅ Pendaftaran berhasil! ';
                if (data.user.role === 'pengusaha') {
                    message += 'Akun Anda menunggu verifikasi dari admin.';
                    showFeedback(message, 'success');
                    setTimeout(() => {
                        clearAuth();
                        window.location.href = 'halaman-login-user.html';
                    }, 3000);
                } else {
                    message += 'Mengalihkan ke Dashboard...';
                    showFeedback(message, 'success');
                    setTimeout(goToDashboard, 1000);
                }
            }
        } catch (err) {
            console.error('❌ Register gagal:', err.message);
            showFeedback('⚠️ ' + err.message, 'error');
        }

        console.log('========================================\n');
    });

    // ============================================================
    // NAVIGASI
    // ============================================================
    tabLogin.addEventListener('click', showLogin);
    tabRegister.addEventListener('click', showRegister);
    switchToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        showRegister();
    });
    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        showLogin();
    });

    // Inisialisasi
    showLogin();

    console.log('✅ Login page initialized');
    console.log('📍 API Base:', API_BASE);
    console.log('📍 Current URL:', window.location.href);
});
