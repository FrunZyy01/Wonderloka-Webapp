document.addEventListener('DOMContentLoaded', function() {

    // Jika sudah login, redirect sesuai role
    if (isLoggedIn()) {
        const user = getUser();
        if (user && user.role === 'pengusaha') {
            window.location.href = 'admin/index.html';
        } else {
            window.location.href = 'wisatawan/dashboard.html';
        }
        return;
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

    // ---------- FUNGSI REDIRECT BERDASARKAN ROLE ----------
    function goToDashboard() {
        const user = getUser();
        const target = (user && user.role === 'pengusaha')
            ? 'admin/index.html'
            : 'wisatawan/dashboard.html';

        console.log('🔄 Redirect ke ' + target + '...');

        try {
            window.location.href = target;
        } catch (e) {
            console.error('❌ Redirect gagal:', e);
            feedback.innerHTML = `
                ✅ Login berhasil!
                <a href="${target}" style="color:#00695c;font-weight:bold;text-decoration:underline;">
                    Klik di sini
                </a>
                untuk melanjutkan.
            `;
            feedback.className = 'form-feedback success';
        }
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
            showFeedback('✅ Login berhasil! Mengalihkan ke Dashboard...', 'success');
            setTimeout(goToDashboard, 800);
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
            showFeedback('✅ Pendaftaran berhasil! Mengalihkan ke Dashboard...', 'success');
            setTimeout(goToDashboard, 800);
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