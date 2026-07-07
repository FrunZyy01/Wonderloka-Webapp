document.addEventListener('DOMContentLoaded', function() {

    // Jika sudah login, redirect sesuai role (cek profil completion untuk pengusaha)
    if (isLoggedIn()) {
        const user = getUser();
        if (user && user.role === 'pengusaha') {
            // Cek kelengkapan profil secara async
            checkPengelolaRedirect();
            return;
        } else if (user && user.role === 'admin') {
            window.location.href = 'superadmin/verifikasi-pengelola.html';
            return;
        } else {
            window.location.href = 'wisatawan/dashboard.html';
            return;
        }
    }

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
        setTimeout(() => clearFeedback(), 5000);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Role selector
    roleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            roleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            roleInput.value = this.dataset.role;
        });
    });

    // Toggle password
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    toggleRegPassword.addEventListener('click', function() {
        const type = regPassword.type === 'password' ? 'text' : 'password';
        regPassword.type = type;
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    toggleRegConfirm.addEventListener('click', function() {
        const type = regConfirmPassword.type === 'password' ? 'text' : 'password';
        regConfirmPassword.type = type;
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // ---------- LUPA PASSWORD ----------
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
                showFeedback('✅ ' + result.message + ' Password: password123', 'success');
            } catch (err) {
                showFeedback('⚠️ ' + err.message, 'error');
            }
        });
    }

    // ---------- CEK REDIRECT UNTUK PENGELOLA ----------
    async function checkPengelolaRedirect() {
        const user = getUser();
        if (user.status_verifikasi !== 'terverifikasi') {
            // Pending atau ditolak -> ke status verifikasi
            window.location.href = '../status-verifikasi.html';
            return;
        }

        try {
            const profileData = await apiFetch('/pengelola/profile-completion');
            if (profileData.complete) {
                window.location.href = 'pengelola/index.html';
            } else {
                window.location.href = 'pengelola/profil-usaha.html';
            }
        } catch (err) {
            // Default ke profil usaha jika gagal
            window.location.href = 'pengelola/profil-usaha.html';
        }
    }

    // ---------- FUNGSI REDIRECT BERDASARKAN ROLE & STATUS VERIFIKASI ----------
    async function goToDashboard() {
        const user = getUser();
        let target = 'wisatawan/dashboard.html';
        let message = 'Login berhasil! Mengalihkan ke Dashboard...';

        if (user && user.role === 'admin') {
            target = 'superadmin/verifikasi-pengelola.html';
            message = 'Login berhasil! Mengalihkan ke Dashboard Admin...';
        } else if (user && user.role === 'pengusaha') {
            if (user.status_verifikasi === 'terverifikasi') {
                // Cek kelengkapan profil usaha
                try {
                    const profileData = await apiFetch('/pengelola/profile-completion');
                    if (profileData.complete) {
                        target = 'pengelola/index.html';
                        message = 'Login berhasil! Mengalihkan ke Dashboard Pengelola...';
                    } else {
                        target = 'pengelola/profil-usaha.html';
                        message = 'Login berhasil! Mengalihkan ke Profil Usaha...';
                    }
                } catch (err) {
                    // Default ke profil usaha jika gagal
                    target = 'pengelola/profil-usaha.html';
                    message = 'Login berhasil! Mengalihkan ke Profil Usaha...';
                }
            } else if (user.status_verifikasi === 'pending') {
                target = 'status-verifikasi.html';
                message = 'Login berhasil! Mengalihkan ke halaman status verifikasi...';
            } else if (user.status_verifikasi === 'ditolak') {
                target = 'status-verifikasi.html';
                message = 'Login berhasil! Mengalihkan ke halaman status verifikasi...';
            }
        }

        console.log('🔄 Redirect ke ' + target + '...');

        showFeedback('✅ ' + message, 'success');
        setTimeout(() => {
            window.location.href = target;
        }, 1000);
    }

    // ---------- HANDLE LOGIN ----------
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

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
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            setAuth(data.token, data.user);
            goToDashboard();
        } catch (err) {
            showFeedback('⚠️ ' + err.message, 'error');
        }
    });

    // ---------- HANDLE REGISTER ----------
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = regName.value.trim();
        const email = regEmail.value.trim();
        const whatsapp = regWhatsapp.value.trim();
        const password = regPassword.value.trim();
        const confirm = regConfirmPassword.value.trim();
        const role = roleInput.value;

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

            setAuth(data.token, data.user);

            let message = '✅ Pendaftaran berhasil! ';
            if (data.user.role === 'pengusaha') {
                message += 'Akun Anda menunggu verifikasi dari admin Wonderloka. Mengalihkan...';
                setTimeout(() => {
                    clearAuth();
                    window.location.href = '../halaman-login-user.html';
                }, 3000);
            } else {
                message += 'Mengalihkan ke Dashboard...';
                setTimeout(goToDashboard, 1000);
            }
            showFeedback(message, 'success');
        } catch (err) {
            showFeedback('⚠️ ' + err.message, 'error');
        }
    });

    // Navigasi
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

    showLogin();
});
