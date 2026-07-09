/**
 * AI Travel Planner - Claude/Olagon Integration
 * Wonderloka Destination Planner
 *
 * AI Provider: Olagon (Anthropic-compatible gateway)
 * Fallback: Local rule-based itinerary generator
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ============================================================
// POST /api/ai/travel-planner
// Endpoint untuk AI Travel Planner
// ============================================================
router.post('/travel-planner', async (req, res) => {
    try {
        const { message } = req.body;

        // Validasi input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Pesan tidak boleh kosong.'
            });
        }

        const userMessage = message.trim();

        // Batasi panjang pesan
        if (userMessage.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Pesan terlalu panjang. Maksimal 1000 karakter.'
            });
        }

        // Cek apakah Olagon dikonfigurasi
        if (!process.env.OLAGON_API_KEY || process.env.OLAGON_API_KEY.trim() === '') {
            console.log('[AI Planner] Olagon API key belum dikonfigurasi, menggunakan local fallback');
            const destinations = await getTopDestinations();
            const reply = generateLocalItinerary(userMessage, destinations);
            return res.json({
                success: true,
                reply: reply,
                source: 'local_fallback'
            });
        }

        // Ambil data destinasi dari database
        const destinations = await getTopDestinations();

        if (destinations.length === 0) {
            return res.json({
                success: true,
                reply: "Maaf, saat ini belum ada data destinasi yang tersedia di sistem. Silakan coba lagi nanti.",
                source: 'local'
            });
        }

        // Buat prompt untuk Olagon
        const prompt = buildTravelPlannerPrompt(userMessage, destinations);

        // Generate dengan Olagon
        let reply;
        let source = 'olagon';

        try {
            reply = await generateWithOlagon(prompt);
            console.log('[AI Planner] Olagon response received, source:', source);
        } catch (olagonError) {
            console.log('[AI Planner] Olagon failed, using local fallback:', olagonError.message);
            reply = generateLocalItinerary(userMessage, destinations);
            source = 'local_fallback';
        }

        res.json({
            success: true,
            reply: reply,
            source: source
        });

    } catch (err) {
        console.error('[AI Planner] Unexpected error:', err.message);

        // Fallback ke lokal untuk menghindari crash
        try {
            const destinations = await getTopDestinations();
            const reply = generateLocalItinerary('Buatkan itinerary', destinations);
            return res.json({
                success: true,
                reply: reply,
                source: 'local_fallback'
            });
        } catch (fallbackError) {
            console.error('[AI Planner] Fallback juga gagal:', fallbackError.message);
            return res.status(500).json({
                success: false,
                error: 'Maaf, AI Travel Planner sedang tidak bisa digunakan. Coba lagi nanti.'
            });
        }
    }
});

// ============================================================
// PROVIDER: Olagon (Anthropic-compatible)
// ============================================================
async function generateWithOlagon(prompt) {
    const baseUrl = (process.env.OLAGON_BASE_URL || 'https://gateway.olagon.site/anthropic').trim().replace(/\/$/, '');
    const model = process.env.OLAGON_MODEL || 'claude-3-5-haiku-latest';
    const apiKey = process.env.OLAGON_API_KEY;

    // Logging aman - tidak pernah log API key
    console.log('[AI Planner] Attempting Olagon request:');
    console.log('[AI Planner]   - Provider: Olagon');
    console.log('[AI Planner]   - Base URL:', baseUrl);
    console.log('[AI Planner]   - Model:', model);
    console.log('[AI Planner]   - API Key: ****' + (apiKey ? apiKey.slice(-4) : 'undefined'));

    // AbortController untuk timeout 60 detik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(`${baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 1500,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('[AI Planner] Olagon response status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            // Log error body aman - maksimal 300 karakter
            const safeErrorBody = errorBody.substring(0, 300);
            console.error('[AI Planner] Olagon error response:', response.status);
            console.error('[AI Planner] Error body (max 300 chars):', safeErrorBody);

            if (response.status === 401 || response.status === 403) {
                throw new Error('Olagon API key tidak valid atau akses ditolak');
            }

            if (response.status === 429) {
                throw new Error('Kuota/rate limit Olagon tercapai');
            }

            if (response.status === 404) {
                throw new Error('Endpoint/model Olagon tidak ditemukan. Cek OLAGON_BASE_URL dan OLAGON_MODEL.');
            }

            throw new Error(`Olagon API error: ${response.status}`);
        }

        const data = await response.json();

        // Parse response Anthropic - berbagai kemungkinan format
        let text = null;

        // Format 1: data.content[0].text (Anthropic format)
        if (data.content && data.content[0] && data.content[0].text) {
            text = data.content[0].text;
            console.log('[AI Planner] Parsed response from data.content[0].text');
        }
        // Format 2: data.content adalah string langsung
        else if (typeof data.content === 'string') {
            text = data.content;
            console.log('[AI Planner] Parsed response from data.content (string)');
        }
        // Format 3: data.text
        else if (data.text) {
            text = data.text;
            console.log('[AI Planner] Parsed response from data.text');
        }
        // Format 4: data.message
        else if (data.message) {
            text = typeof data.message === 'string' ? data.message : data.message.content;
            console.log('[AI Planner] Parsed response from data.message');
        }
        // Format 5: data.choices[0].message.content (OpenAI format)
        else if (data.choices && data.choices[0] && data.choices[0].message) {
            text = data.choices[0].message.content;
            console.log('[AI Planner] Parsed response from data.choices[0].message.content');
        }

        if (text && text.trim().length > 0) {
            console.log('[AI Planner] Olagon response text length:', text.trim().length);
            return text.trim();
        }

        // Log struktur response untuk debugging
        console.log('[AI Planner] Response structure keys:', Object.keys(data));
        throw new Error('Format response Olagon tidak valid atau kosong');

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('[AI Planner] Olagon request timeout after 60 seconds');
            throw new Error('Olagon request timeout');
        }
        throw error;
    }
}

// ============================================================
// LOCAL FALLBACK: Rule-based Itinerary Generator
// ============================================================
function generateLocalItinerary(userMessage, destinations) {
    // Safety check: pastikan destinations tidak kosong
    if (!destinations || destinations.length === 0) {
        return "Maaf, saat ini belum ada data destinasi yang tersedia di sistem. Silakan coba lagi nanti.";
    }

    // Parse preferensi user dari message
    const prefs = parseUserPreferences(userMessage);
    const { days, locations, categories, budget } = prefs;

    // Filter destinasi berdasarkan preferensi
    let filtered = [...destinations];

    // Filter berdasarkan lokasi (normalisasi nama lokasi)
    if (locations.length > 0) {
        const locationNormalized = locations.map(l => l.toLowerCase());
        filtered = filtered.filter(d => {
            const destLoc = (d.lokasi || '').toLowerCase();
            const destNama = (d.nama || '').toLowerCase();
            return locationNormalized.some(loc =>
                destLoc.includes(loc) ||
                destNama.includes(loc) ||
                // Handle variasi nama Yogyakarta/Jogja/Yogya
                ((loc.includes('jogja') || loc.includes('yogyakarta') || loc.includes('yogya')) &&
                (destLoc.includes('jogja') || destLoc.includes('yogyakarta') || destLoc.includes('yogya')))
            );
        });
    }

    // Filter berdasarkan kategori
    if (categories.length > 0) {
        const categoryNormalized = categories.map(c => c.toLowerCase());
        filtered = filtered.filter(d => {
            const destCat = (d.kategori || '').toLowerCase();
            const destNama = (d.nama || '').toLowerCase();
            const destDesc = (d.deskripsi || '').toLowerCase();
            return categoryNormalized.some(cat =>
                destCat.includes(cat) ||
                destNama.includes(cat) ||
                destDesc.includes(cat)
            );
        });
    }

    // Filter berdasarkan budget
    if (budget === 'murah') {
        filtered = filtered.filter(d => d.harga === 0 || d.harga <= 30000);
        filtered.sort((a, b) => a.harga - b.harga);
    } else if (budget === 'sedang') {
        filtered = filtered.filter(d => d.harga <= 75000);
    }

    // Urutkan berdasarkan rating
    filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    // Jika hasil kosong, gunakan semua destinasi
    if (filtered.length === 0) {
        filtered = destinations.slice(0, 20);
        filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }

    // Bangun itinerary dengan format chat-friendly (tanpa markdown table)
    let itinerary = '';

    // Tema berdasarkan kategori atau lokasi
    const themes = [];
    if (categories.includes('kuliner')) themes.push('Kuliner');
    if (categories.includes('alam')) themes.push('Alam');
    if (categories.includes('budaya')) themes.push('Budaya');
    if (categories.includes('pantai')) themes.push('Pantai');
    const themeStr = themes.length > 0 ? themes.join(' & ') : 'Wisata Umum';

    itinerary += 'Rencana Perjalanan ' + days + ' Hari\n';
    itinerary += 'Tema: ' + themeStr + '\n\n';

    // Track destinasi yang sudah dipakai untuk avoid duplikat
    const usedDestIds = new Set();
    const timeSlots = ['Pagi', 'Siang', 'Sore'];
    let totalBudget = 0;
    let totalDests = 0;

    for (let day = 1; day <= days; day++) {
        // Ambil destinasi yang belum dipakai
        let availableDests = filtered.filter(d => !usedDestIds.has(d.id));

        // Jika tidak cukup, ambil dari all destinations
        if (availableDests.length < 3) {
            const fallbackDests = destinations.filter(d => !usedDestIds.has(d.id));
            availableDests = [...availableDests, ...fallbackDests].slice(0, 3);
        }

        // Ambil maksimal 3 destinasi untuk hari ini
        const dayDests = availableDests.slice(0, 3);
        if (dayDests.length === 0) break;

        // Tandai sebagai dipakai
        dayDests.forEach(d => usedDestIds.add(d.id));

        itinerary += 'Hari ' + day + ' — ' + themeStr + '\n\n';

        let dayBudget = 0;

        dayDests.forEach((dest, idx) => {
            const waktu = timeSlots[idx] || 'Pagi';
            const alasan = getAlasanSingkat(dest, categories);
            const hargaStr = dest.harga === 0 ? 'Gratis' : 'Rp ' + dest.harga.toLocaleString('id-ID');
            itinerary += waktu + ': ' + dest.nama + '\n';
            itinerary += 'Alasan: ' + alasan + '\n';
            itinerary += 'Estimasi: ' + hargaStr + '\n\n';
            dayBudget += dest.harga || 0;
            totalDests++;
        });

        // Estimasi budget hari ini
        itinerary += 'Budget hari ' + day + ': Rp ' + dayBudget.toLocaleString('id-ID') + '\n\n';
        totalBudget += dayBudget;
    }

    // Ringkasan
    itinerary += '─────────────────────────\n';
    itinerary += 'Ringkasan:\n';
    itinerary += '─────────────────────────\n';
    itinerary += 'Total estimasi budget: Rp ' + totalBudget.toLocaleString('id-ID') + '\n';
    itinerary += 'Destinasi dikunjungi: ' + totalDests + ' destinasi\n';
    itinerary += 'Tips: ' + getTips(prefs) + '\n';

    return itinerary;
}

function parseUserPreferences(message) {
    const msg = message.toLowerCase();

    // Parse jumlah hari
    let days = 3;
    const dayMatch = msg.match(/(\d+)\s*(?:hari|day)/);
    if (dayMatch) days = parseInt(dayMatch[1]);
    if (days > 7) days = 7;
    if (days < 1) days = 1;

    // Parse lokasi
    const locations = [];
    const locationKeywords = {
        'jogja': ['jogja', 'jogjakarta', 'yogyakarta', 'yogya'],
        'bali': ['bali', 'denpasar', 'kuta', 'ubud', 'nusa penida', 'nusa dua', 'seminyak'],
        'bandung': ['bandung', 'bdg'],
        'malang': ['malang'],
        'surabaya': ['surabaya'],
        'semarang': ['semarang'],
        'yogyakarta': ['yogyakarta', 'jogja', 'jogjakarta', 'yogya'],
        'jakarta': ['jakarta', 'jkrt', 'jkt'],
        'lombok': ['lombok', 'senggigi'],
        'papua': ['papua', 'raja ampat', 'jayapura']
    };

    for (const [loc, keywords] of Object.entries(locationKeywords)) {
        if (keywords.some(k => msg.includes(k))) {
            if (!locations.includes(loc)) locations.push(loc);
        }
    }

    // Parse kategori
    const categories = [];
    const categoryKeywords = {
        'kuliner': ['kuliner', 'makan', 'cafe', 'kopi', 'warung', 'food', 'jajanan', 'restoran', 'street food'],
        'alam': ['alam', 'gunung', 'pantai', 'bukit', 'camping', 'air terjun', 'danau', 'hutan', 'outdoor'],
        'budaya': ['budaya', 'candi', 'museum', 'heritage', 'sejarah', 'tradisi', 'kesenian', 'heritage'],
        'pantai': ['pantai', 'beach', 'laut', 'snorkeling', 'diving', 'selam', 'surfing'],
        'hotel': ['hotel', 'penginapan', 'villa', 'resort', 'homestay', 'guesthouse'],
        'belanja': ['belanja', 'shopping', 'oleh-oleh', 'pasar', 'mall']
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => msg.includes(k))) {
            if (!categories.includes(cat)) categories.push(cat);
        }
    }

    // Parse budget
    let budget = 'sedang';
    if (msg.includes('murah') || msg.includes('hemat') || msg.includes('budget') || msg.includes('irit') || msg.includes('ekonomis')) {
        budget = 'murah';
    } else if (msg.includes('mahal') || msg.includes('luxe') || msg.includes('mewah') || msg.includes('premium') || msg.includes('fancy')) {
        budget = 'mahal';
    }

    return { days, locations, categories, budget };
}

function getAlasanSingkat(dest, categories) {
    const reasons = [];

    if (categories.includes('kuliner')) {
        if (dest.kategori && dest.kategori.toLowerCase().includes('kulin')) {
            reasons.push('Kuliner khas daerah yang enak');
        }
    }

    if (categories.includes('alam')) {
        if (dest.kategori && dest.kategori.toLowerCase().includes('alam')) {
            reasons.push('Spot alam yang indah');
        }
    }

    if (categories.includes('budaya')) {
        if (dest.kategori && dest.kategori.toLowerCase().includes('budaya')) {
            reasons.push('Nilai budaya dan sejarah menarik');
        }
    }

    if (categories.includes('pantai')) {
        if (dest.kategori && dest.kategori.toLowerCase().includes('pantai')) {
            reasons.push('Pantai dengan pemandangan eksotis');
        }
    }

    if (dest.rating >= 4.5) reasons.push('Rating tinggi');
    if (dest.harga === 0) reasons.push('Gratis masuk');

    if (reasons.length === 0) {
        const locPart = dest.lokasi ? dest.lokasi.split(',')[0].trim() : 'daerah ini';
        reasons.push(`Terletak di ${locPart}`);
    }

    return reasons.slice(0, 2).join(', ');
}

function getTips(prefs) {
    const tips = [];

    if (prefs.budget === 'murah') {
        tips.push('Bawa bekal dari rumah untuk hemat');
    }

    if (prefs.categories.includes('alam')) {
        tips.push('Bawa perlengkapan outdoor & obat-obatan pribadi');
    }

    if (prefs.categories.includes('kuliner')) {
        tips.push('Coba street food dan jajanan lokal');
    }

    tips.push('Cek cuaca sebelum berangkat');
    tips.push('Bawa air minum dan sunscreen');

    return tips.slice(0, 3).join(', ');
}

// ============================================================
// HELPER: Ambil destinasi dari database
// ============================================================
async function getTopDestinations() {
    try {
        const [rows] = await pool.query(`
            SELECT
                id_destinasi,
                nama,
                deskripsi,
                lokasi,
                kategori,
                harga,
                rating,
                gambar
            FROM destination
            WHERE nama IS NOT NULL AND nama != ''
            ORDER BY
                CASE
                    WHEN rating IS NOT NULL AND rating != '' THEN CAST(rating AS DECIMAL(3,2))
                    ELSE 0
                END DESC,
                id_destinasi ASC
            LIMIT 30
        `);

        return rows.map(row => ({
            id: row.id_destinasi,
            nama: row.nama || '-',
            deskripsi: row.deskripsi || '-',
            lokasi: row.lokasi || '-',
            kategori: row.kategori || '-',
            harga: row.harga !== null ? row.harga : 0,
            rating: row.rating || 0,
            gambar: row.gambar || '-'
        }));
    } catch (err) {
        console.error('Error fetching destinations:', err);
        return [];
    }
}

// ============================================================
// HELPER: Bangun prompt untuk Olagon
// ============================================================
function buildTravelPlannerPrompt(userMessage, destinations) {
    const destinationsText = destinations.map(d => {
        return `• ${d.nama}
  Lokasi: ${d.lokasi}
  Kategori: ${d.kategori}
  Harga Tiket: Rp ${d.harga.toLocaleString('id-ID')}${d.harga === 0 ? ' (Gratis)' : ''}
  Rating: ${d.rating}/5
  Info: ${(d.deskripsi || '-').substring(0, 150)}`;
    }).join('\n');

    return `Kamu adalah AI Travel Planner untuk aplikasi Wonderloka - platform destinasi wisata Indonesia.

TUGAS UTAMA:
Buat itinerary perjalanan yang santai, natural, dan mudah dibaca seperti berbicara dengan teman旅行.

ATURAN PENTING:
1. Jawab DALAM Bahasa Indonesia yang ramah, santai, dan natural. Gunakan kata-kata yang mengalir seperti chat biasa, BUKAN seperti laporan formal.
2. GUNAKAN HANYA destinasi yang disediakan di bawah ini. JANGAN pernah mengarang destinasi baru yang tidak ada dalam daftar.
3. Jika data destinasi terbatas untuk kota/kategori yang diminta, bilang saja dengan sopan: "Data destinasi Wonderloka untuk pilihan ini masih terbatas, jadi saya pilihkan yang paling mendekati."
4. MAKSIMAL 3 destinasi per hari. Jangan lebih.
5. JANGAN ULAH destinasi yang sama di hari yang berbeda, kecuali memang data sangat terbatas.
6. Pastikan total budget masuk akal dan sesuai dengan harga tiket yang diberikan.

FORMAT JAWABAN YANG DIHARAPKAN (ikuti ini dengan tepat):
Gunakan format teks biasa yang bersih dan mudah dibaca di chat mobile. Contoh:

🗓️ Rencana Perjalanan 3 Hari

📍 Hari 1 — Kuliner & Budaya Kota
Pagi: Keraton Yogyakarta
   └ Bangunan bersejarah yang ikonik, cocok untuk mulai.
   └ Estimasi: Rp 25.000

Siang: Malioboro Street
   └ Tempat belanja dan kuliner legendaris Yogyakarta.
   └ Estimasi: Gratis / sesuai belanja

Sore: Bukit Pengilon
   └ Spot sunset dengan pemandangan istana yang indah.
   └ Estimasi: Rp 15.000

💰 Budget Hari 1: Rp 40.000

📍 Hari 2 — Alam & Adventure
[dan seterusnya...]

📋 Ringkasan
• Total Estimasi Budget: Rp ...
• Tips: Cek cuaca, bawa air minum, atur perjalanan sesuai jarak lokasi.

LARANGAN - JANGAN GUNAKAN:
- ❌ Tabel markdown (| Waktu | Destinasi | Alasan |)
- ❌ Heading ### atau ## untuk sub-bagian
- ❌ Garis pemisah ---
- ❌ Bullet points dengan (*) atau (-) untuk list destinasi utama
- ❌ Format seperti laporan atau dokumen formal
- ❌ Terlalu banyak emoji beruntun

GUNAKAN:
- ✅ Teks biasa yang flows natural
- ✅ Emoji yang sparse dan relevan
- ✅ Struktur yang jelas tapi tetap ringan
- ✅ Estimasi budget per hari

DATA DESTINASI WONDERLOKA:
${destinationsText}

PESAN PENGGUNA:
"${userMessage}"

Buat itinerary yang sesuai dengan preferensi user, gunakan data yang ada, dan buat outputnya enak dibaca di chat mobile!`;
}

module.exports = router;
