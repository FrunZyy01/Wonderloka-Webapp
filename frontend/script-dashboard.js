document.addEventListener('DOMContentLoaded', function() {

    // ---------- MOBILE NAV TOGGLE ----------
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // ---------- LOGOUT ----------
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Konfirmasi logout
            if (confirm('Yakin ingin keluar?')) {
                // Redirect ke halaman login
                window.location.href = 'halaman-login-user.html';
            }
        });
    }

    // ---------- SEARCH (simulasi) ----------
    const searchBtn = document.querySelector('.btn-search');
    const searchInput = document.querySelector('.search-box input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                alert('Mencari: "' + query + '"\n(Fitur pencarian akan terhubung ke backend)');
            } else {
                alert('Silakan ketik destinasi yang ingin dicari.');
            }
        });

        // Enter key juga bisa memicu search
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // ---------- CLICK DETAIL (simulasi) ----------
    const detailBtns = document.querySelectorAll('.btn-detail');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.destinasi-card');
            const title = card ? card.querySelector('h3')?.textContent : 'Destinasi';
            alert('Menampilkan detail: ' + title + '\n(Fitur detail akan terhubung ke backend)');
        });
    });

    // ---------- NAV MENU CLICK (simulasi) ----------
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Hapus active dari semua
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            alert('Navigasi ke: ' + this.textContent.trim() + '\n(Fitur ini akan terhubung ke halaman terkait)');
            // Tutup menu mobile
            if (navMenu) navMenu.classList.remove('active');
        });
    });
});