/**
 * Smart Search Helper - Rule-based NLP lokal tanpa API eksternal
 * Wonderloka Destination Search Engine
 *
 * Fitur:
 * - Parse query natural menjadi intent pencarian
 * - Kenali lokasi, kategori, harga, suasana
 * - Scoring berbasis keyword matching
 */

'use strict';

// ============================================================
// KAMUS KEYWORD UNTUK NLP
// ============================================================

/**
 * Daftar lokasi yang dikenali (termasuk alias/variasi penulisan)
 */
const LOKASI_KAMUS = {
    'jogja': ['jogja', 'jogjakarta', 'yogyakarta', 'yogya', 'jogjakarta'],
    'bali': ['bali', 'denpasar', 'denpasar', 'kuta', 'seminyak', 'ubud', 'nusa dua', 'sanur', 'canggu'],
    'bandung': ['bandung', 'bdg'],
    'malang': ['malang'],
    'surabaya': ['surabaya', 'sby'],
    'semarang': ['semarang', 'smg'],
    'bromo': ['bromo', 'gunung bromo', 'taman nasional bromo tengger semeru'],
    'ubud': ['ubud'],
    'malioboro': ['malioboro'],
    'ugm': ['ugm', 'universitas gadjah mada'],
    'merbabu': ['merbabu', 'gunung merbabu'],
    'merapi': ['merapi', 'gunung merapi'],
    'borobudur': ['borobudur', 'candi borobudur'],
    'prambanan': ['prambanan', 'candi prambanan'],
    ' lombok': ['lombok'],
    'raja ampat': ['raja ampat'],
    'banyuwangi': ['banyuwangi'],
    'dieng': ['dieng', 'kawah dieng'],
};

/**
 * Mapping keyword ke kategori enum di database
 */
const KATEGORI_KEYWORD = {
    'alam': ['alam', 'natural', 'nature', 'alam terbuka', 'outdoor'],
    'budaya': ['budaya', 'culture', 'sejarah', 'historic', 'heritage', 'candi', 'keraton', 'pura', 'museum', 'desa adat', 'bangunan bersejarah'],
    'kuliner': ['kuliner', 'makan', 'nongkrong', 'cafe', 'café', 'kopi', 'warung', 'restoran', 'oleh-oleh', 'jajanan', 'food', 'makanan', 'minuman', 'street food', 'gastronomi'],
    'pantai': ['pantai', 'beach', 'pantai pasir', 'pantai indah', 'pantai eksotis'],
    'hotel': ['hotel', 'penginapan', 'homestay', 'hostel', 'losmen', 'villa', 'resort', 'akomodasi', 'tempat inap', 'inn', 'lodging'],
    'gunung': ['gunung', 'mountain', ' pendakian', 'hiking', 'trekking', 'climbing'],
    'bukit': ['bukit', 'hill', 'hillside'],
    'camping': ['camping', 'camp', 'kemah', 'glamping'],
    'air terjun': ['air terjun', 'waterfall', 'curug', 'pemandian alam'],
    'danau': ['danau', 'lake', 'sungai', 'river'],
    'taman': ['taman', 'park', 'garden', 'gardens'],
};

/**
 * Keyword untuk harga murah
 */
const HARGA_MURAH_KEYWORDS = [
    'murah', 'hemat', 'budget', 'terjangkau', 'ekonomis', 'konomis',
    'irit', 'promo', 'diskon', 'sale', 'promosi', 'spesial',
    'bagus murah', 'harga kecil', 'harga rendah', 'cocok kantong',
    'affordable', 'value', 'value for money', 'gratis', 'free'
];

/**
 * Keyword suasana positif
 */
const SUASANA_KEYWORD = {
    'sejuk': ['sejuk', 'adem', 'dingin', 'cool', 'refreshing', 'segar', 'freshing', 'bersih udara', 'sejuk alami'],
    'sepi': ['sepi', 'tenang', 'tersembunyi', 'hidden', 'private', 'undiscovered', 'secret', 'hidden gem', 'langka'],
    'ramai': ['ramai', 'popular', 'terkenal', 'famous', 'hits', 'viral', 'banyak dikunjungi', 'terpopuler'],
    'sunset': ['sunset', 'matahari terbenam', 'golden hour', 'senja', 'pemandangan matahari', 'sunset view'],
    'foto': ['foto', 'instagramable', 'insta-worthy', 'photogenic', 'aesthetic', 'kece', 'keren', 'cantik', 'bagus untuk foto', 'selfie', 'estetik'],
    'rombongan': ['rombongan', 'group', 'kelas', 'event', 'gather', 'family', 'keluarga', 'rombongan', 'teambuilding'],
    'romantis': ['romantis', 'romantic', 'pasangan', 'couple', 'honeymoon', ' bulan madu', 'date'],
    'petualangan': ['petualangan', 'adventure', 'trek', 'offroad', 'rafting', 'arung jeram', 'arung', 'expedition'],
};

/**
 * Keyword tambahan untuk meningkatkan relevance scoring
 */
const TAMBAHAN_KEYWORD = {
    'alam': ['pemandangan', 'view', 'vista', 'panorama', 'outdoor', 'green', 'hijau', 'asri'],
    'budaya': ['tradisi', 'tradisional', 'authentic', 'autentik', 'warisan', 'ritual', 'upacara'],
    'kuliner': ['enak', 'lezat', 'gurih', 'pedas', 'manis', 'segar', 'fresh', 'hangat', '特色', 'specialty', 'signature'],
    'pantai': ['laut', 'ocean', 'pasir putih', 'coral', 'terumbu', 'snorkeling', 'diving', 'selam', 'ombak'],
    'hotel': ['comfortable', 'nyaman', 'bersih', 'clean', 'modern', 'mewah', 'luxury', 'cozy', 'asin'],
    'camping': ['api unggun', 'bonfire', 'bintang', 'star', 'alam terbuka', 'nature camping', 'campsite'],
    'air terjun': ['basah', 'siraman', 'spray', 'mist', 'kabut', 'kering'],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Normalisasi teks untuk pencarian
 * - Lowercase
 * - Hapus tanda baca berlebih
 * - Normalisasi spasi
 */
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Hapus tanda baca
        .replace(/\s+/g, ' ')       // Normalisasi spasi
        .trim();
}

/**
 * Parse harga dari string ke number
 * @param {string|number} harga - Harga dalam berbagai format
 * @returns {number} - Harga sebagai number, 0 jika tidak valid
 */
function parseHarga(harga) {
    if (!harga) return 0;
    if (typeof harga === 'number') return harga;

    const str = String(harga).toLowerCase();
    // Hapus karakter non-angka
    const numStr = str.replace(/[^\d]/g, '');
    const num = parseInt(numStr) || 0;

    // Jika harga mengandung 'k' atau 'rb', kalikan dengan 1000
    if (str.includes('k') || str.includes('rb')) {
        return num * 1000;
    }
    return num;
}

/**
 * Cek apakah teks mengandung keyword tertentu (fuzzy match)
 */
function containsKeyword(text, keywords) {
    if (!text || !keywords || !keywords.length) return false;
    const normalizedText = normalizeText(text);
    return keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()));
}

/**
 * Hitung score berdasarkan harga
 * Jika query meminta "murah", destinasi dengan harga rendah mendapat bonus
 */
function calculateHargaScore(harga, wantMurah) {
    if (!wantMurah) return 0;

    const numericHarga = parseHarga(harga);

    if (numericHarga === 0) {
        // Gratis
        return 18;
    } else if (numericHarga <= 15000) {
        return 15;
    } else if (numericHarga <= 30000) {
        return 10;
    } else if (numericHarga <= 50000) {
        return 5;
    }

    return 0;
}

/**
 * Parse query dan ekstrak intent
 * Mengembalikan objek dengan:
 * - locations: array lokasi yang ditemukan
 * - categories: array kategori yang ditemukan
 * - hargaMurah: boolean
 * - suasana: object { type: boolean }
 * - originalTerms: array kata-kata yang tidak teridentifikasi
 */
function parseSmartQuery(query) {
    if (!query || typeof query !== 'string') {
        return {
            locations: [],
            categories: [],
            hargaMurah: false,
            suasana: {},
            originalTerms: [],
            searchReason: ''
        };
    }

    const normalized = normalizeText(query);
    const words = normalized.split(' ').filter(w => w.length > 1);
    const result = {
        locations: [],
        categories: [],
        hargaMurah: false,
        suasana: {},
        originalTerms: [],
        searchReason: ''
    };

    // 1. Cari lokasi
    for (const [lokasiUtama, aliasList] of Object.entries(LOKASI_KAMUS)) {
        const semuaAlias = [lokasiUtama, ...aliasList];
        for (const alias of semuaAlias) {
            if (normalized.includes(alias)) {
                if (!result.locations.includes(lokasiUtama)) {
                    result.locations.push(lokasiUtama);
                }
                break;
            }
        }
    }

    // 2. Cari kategori
    for (const [kategori, keywords] of Object.entries(KATEGORI_KEYWORD)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                if (!result.categories.includes(kategori)) {
                    result.categories.push(kategori);
                }
                break;
            }
        }
    }

    // 3. Cek harga murah
    for (const keyword of HARGA_MURAH_KEYWORDS) {
        if (normalized.includes(keyword)) {
            result.hargaMurah = true;
            break;
        }
    }

    // 4. Cek suasana
    for (const [suasana, keywords] of Object.entries(SUASANA_KEYWORD)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                result.suasana[suasana] = true;
                break;
            }
        }
    }

    // 5. Kumpulkan original terms yang tidak teridentifikasi
    const identifiedWords = new Set([
        ...Object.values(LOKASI_KAMUS).flat(),
        ...Object.values(KATEGORI_KEYWORD).flat(),
        ...HARGA_MURAH_KEYWORDS,
        ...Object.values(SUASANA_KEYWORD).flat()
    ]);

    for (const word of words) {
        let isIdentified = false;
        for (const keyword of identifiedWords) {
            if (keyword.length > 2 && normalized.includes(keyword) && keyword.length > 2) {
                // Check if this word is part of any identified keyword
                if (keyword.includes(word) || word.includes(keyword)) {
                    isIdentified = true;
                    break;
                }
            }
        }
        // Keep words that are likely search terms (longer than 3 chars and not common words)
        if (!isIdentified && word.length > 3 && !['yang', 'dan', 'di', 'ini', 'itu', 'dengan', 'untuk', 'pada', 'dari', 'dalam', 'tersebut', 'bisa', 'ada', 'sudah', 'akan', 'juga', 'tempat', 'lokasi', 'objek', 'rekomendasi', 'suggesti'].includes(word)) {
            result.originalTerms.push(word);
        }
    }

    // 6. Build search reason
    const reasons = [];
    if (result.locations.length > 0) reasons.push(result.locations.join(', '));
    if (result.categories.length > 0) reasons.push(result.categories.join(', '));
    if (result.hargaMurah) reasons.push('murah');
    if (Object.keys(result.suasana).length > 0) reasons.push(Object.keys(result.suasana).join(', '));
    result.searchReason = reasons.length > 0 ? reasons.join(' • ') : '';

    return result;
}

/**
 * Hitung score kemiripan antara destinasi dengan query
 * Semakin tinggi score, semakin relevan
 */
function scoreDestination(destination, parsedQuery) {
    if (!destination || !parsedQuery) return 0;

    let score = 0;
    const matchedKeywords = [];
    const normalizedNama = normalizeText(destination.nama || '');
    const normalizedDeskripsi = normalizeText(destination.deskripsi || '');
    const normalizedLokasi = normalizeText(destination.lokasi || '');
    const normalizedKategori = normalizeText(destination.kategori || '');
    const normalizedOwnerUsaha = normalizeText(destination.owner_nama_usaha || '');
    const normalizedOwnerKategori = normalizeText(destination.owner_kategori_usaha || '');

    // Combine all text fields for searching
    const allText = `${normalizedNama} ${normalizedDeskripsi} ${normalizedLokasi} ${normalizedKategori} ${normalizedOwnerUsaha} ${normalizedOwnerKategori}`;

    // 1. LOKASI MATCH (bobot tinggi: +30)
    if (parsedQuery.locations.length > 0) {
        for (const lokasi of parsedQuery.locations) {
            const semuaAlias = [lokasi, ...(LOKASI_KAMUS[lokasi] || [])];
            for (const alias of semuaAlias) {
                if (normalizedLokasi.includes(alias) || normalizedNama.includes(alias) || normalizedDeskripsi.includes(alias)) {
                    score += 30;
                    matchedKeywords.push(lokasi);
                    break;
                }
            }
        }
    }

    // 1b. SPECIAL: UGM bonus untuk destinasi Yogyakarta
    // UGM adalah area di Yogyakarta, jadi beri bonus ke destinasi Yogya
    if (parsedQuery.locations.includes('ugm')) {
        const yogyaAliases = ['jogja', 'jogjakarta', 'yogyakarta', 'yogya'];
        for (const alias of yogyaAliases) {
            if (normalizedLokasi.includes(alias) || normalizedDeskripsi.includes(alias) || normalizedNama.includes(alias)) {
                score += 15; // Bonus untuk area Yogya
                if (!matchedKeywords.includes('yogyakarta area ugm')) {
                    matchedKeywords.push('yogyakarta area ugm');
                }
                break;
            }
        }
    }

    // 2. KATEGORI MATCH (bobot tinggi: +25)
    if (parsedQuery.categories.length > 0) {
        // Untuk kategori hotel, cek juga owner fields
        const isHotelCategory = parsedQuery.categories.includes('hotel');

        for (const kategori of parsedQuery.categories) {
            const keywords = KATEGORI_KEYWORD[kategori] || [];

            // Cek di berbagai field
            let matchedInField = false;

            if (normalizedKategori === kategori) {
                score += 25;
                matchedKeywords.push(kategori);
                matchedInField = true;
            }

            for (const keyword of keywords) {
                if (normalizedNama.includes(keyword) ||
                    normalizedDeskripsi.includes(keyword) ||
                    normalizedKategori.includes(keyword) ||
                    normalizedOwnerUsaha.includes(keyword) ||
                    normalizedOwnerKategori.includes(keyword)) {
                    score += 15;
                    if (!matchedKeywords.includes(kategori)) {
                        matchedKeywords.push(kategori);
                    }
                    matchedInField = true;
                    break;
                }
            }

            // Bonus untuk kategori hotel - cek owner usaha
            if (isHotelCategory && !matchedInField) {
                const hotelKeywords = ['hotel', 'resort', 'villa', 'homestay', 'penginapan', 'guest house', 'hostel', 'cottage', 'lodges', 'lodge'];
                for (const hk of hotelKeywords) {
                    if (normalizedOwnerUsaha.includes(hk) || normalizedOwnerKategori.includes(hk)) {
                        score += 20;
                        matchedKeywords.push('penginapan');
                        break;
                    }
                }
            }
        }
    }

    // 3. HARGA MURAH (bobot sedang: +15)
    if (parsedQuery.hargaMurah) {
        // Cek harga dari kolom database (prioritas utama)
        const hargaScore = calculateHargaScore(destination.harga, true);
        if (hargaScore > 0) {
            score += hargaScore;
            matchedKeywords.push('murah');
        } else {
            // Fallback: cek mention harga di deskripsi
            const hargaPatterns = [
                /rp\.?\s*[\d.,]+/gi,
                /[\d.,]+k/gi,
                /[\d.,]+\s*ribu/gi,
                /murah/gi,
                /hemat/gi,
                /budget/gi
            ];

            let hargaMatched = false;
            for (const pattern of hargaPatterns) {
                const matches = (normalizedDeskripsi + ' ' + normalizedNama).match(pattern);
                if (matches && matches.length > 0) {
                    // Jika ada mention "murah", "hemat", "budget" langsung加分
                    if (matches.some(m => ['murah', 'hemat', 'budget', 'terjangkau'].includes(m.replace(/[^\w]/g, '')))) {
                        score += 15;
                        matchedKeywords.push('murah');
                        hargaMatched = true;
                        break;
                    }
                    // Cek pattern harga (misal: 25rb, 50.000)
                    for (const m of matches) {
                        const numStr = m.replace(/[^\d.,]/g, '').replace(',', '.');
                        const num = parseFloat(numStr);
                        if (num > 0 && num <= 100) { // Asumsi harga dalam ribuan, maks 100rb
                            score += 10;
                            hargaMatched = true;
                            break;
                        }
                    }
                    if (hargaMatched) break;
                }
            }
        }
    }

    // 4. SUASANA MATCH (bobot sedang: +10-20)
    if (Object.keys(parsedQuery.suasana).length > 0) {
        for (const [suasana, isActive] of Object.entries(parsedQuery.suasana)) {
            if (!isActive) continue;

            const suasanaKeywords = SUASANA_KEYWORD[suasana] || [];

            // Check mood keywords in text
            for (const keyword of suasanaKeywords) {
                if (allText.includes(keyword)) {
                    // Bobot berbeda berdasarkan suasana
                    const bobotSuasana = {
                        'sejuk': 15,
                        'sepi': 15,
                        'ramai': 12,
                        'sunset': 18,
                        'foto': 12,
                        'rombongan': 10,
                        'romantis': 12,
                        'petualangan': 15
                    };
                    score += bobotSuasana[suasana] || 10;
                    if (!matchedKeywords.includes(suasana)) {
                        matchedKeywords.push(suasana);
                    }
                    break;
                }
            }

            // Bonus untuk suasana sejuk/adem - cari di lokasi tinggi
            if ((suasana === 'sejuk' || suasana === 'sepi') && !matchedKeywords.includes(suasana)) {
                const tinggiKeywords = ['bukit', 'gunung', 'camping', 'datar', 'pegunungan', 'altitude', 'dataran'];
                for (const tk of tinggiKeywords) {
                    if (allText.includes(tk)) {
                        score += 12;
                        matchedKeywords.push('sejuk/tersembunyi');
                        break;
                    }
                }
            }
        }
    }

    // 5. ORIGINAL TERMS MATCH (bobot rendah: +5 per kata)
    if (parsedQuery.originalTerms.length > 0) {
        for (const term of parsedQuery.originalTerms) {
            // Skip very common terms
            if (['tempat', 'lokasi', 'yang', 'di', 'dan', 'yang'].includes(term)) continue;

            if (normalizedNama.includes(term) ||
                normalizedDeskripsi.includes(term) ||
                normalizedLokasi.includes(term) ||
                normalizedOwnerUsaha.includes(term)) {
                score += 5;
                if (!matchedKeywords.includes(term)) {
                    matchedKeywords.push(term);
                }
            }
        }
    }

    // 6. BONUS untuk rating tinggi (untuk query "ramai", "populer", "terkenal")
    if (parsedQuery.suasana['ramai']) {
        const rating = parseFloat(destination.rating) || 0;
        if (rating >= 4.5) score += 15;
        else if (rating >= 4.0) score += 10;
        else if (rating >= 3.5) score += 5;
    }

    return score;
}

/**
 * Main smart search function
 * Proses semua destinasi dan return hasil yang diurutkan berdasarkan relevance
 */
function smartSearchDestinations(destinations, query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        // No search query - return as is (sorted by rating)
        return destinations.map(d => ({
            ...d,
            _searchScore: 0,
            _matchedKeywords: [],
            _searchReason: ''
        }));
    }

    // Parse query
    const parsedQuery = parseSmartQuery(query);

    // Score semua destinasi
    const scored = destinations.map(dest => {
        const score = scoreDestination(dest, parsedQuery);
        const matchedKeywords = [];

        // Collect matched keywords
        const normalizedNama = normalizeText(dest.nama || '');
        const normalizedDeskripsi = normalizeText(dest.deskripsi || '');
        const normalizedLokasi = normalizeText(dest.lokasi || '');
        const normalizedOwnerUsaha = normalizeText(dest.owner_nama_usaha || '');

        // Check locations
        for (const lokasi of parsedQuery.locations) {
            const semuaAlias = [lokasi, ...(LOKASI_KAMUS[lokasi] || [])];
            for (const alias of semuaAlias) {
                if (normalizedLokasi.includes(alias) || normalizedNama.includes(alias)) {
                    matchedKeywords.push(lokasi);
                    break;
                }
            }
        }

        // Check categories
        for (const kategori of parsedQuery.categories) {
            if (normalizedNama.includes(kategori) ||
                normalizedDeskripsi.includes(kategori) ||
                normalizeText(dest.kategori || '').includes(kategori)) {
                matchedKeywords.push(kategori);
            }
        }

        // Check harga
        if (parsedQuery.hargaMurah && (normalizedDeskripsi.includes('murah') || normalizedDeskripsi.includes('hemat') || normalizedDeskripsi.includes('budget'))) {
            matchedKeywords.push('murah');
        }

        // Check suasana
        for (const suasana of Object.keys(parsedQuery.suasana)) {
            if (parsedQuery.suasana[suasana]) {
                const suasanaKeywords = SUASANA_KEYWORD[suasana] || [];
                for (const sk of suasanaKeywords) {
                    if (normalizedDeskripsi.includes(sk) || normalizedNama.includes(sk)) {
                        matchedKeywords.push(suasana);
                        break;
                    }
                }
            }
        }

        return {
            ...dest,
            _searchScore: score,
            _matchedKeywords: [...new Set(matchedKeywords)], // Deduplicate
            _searchReason: parsedQuery.searchReason
        };
    });

    // Filter dan sort berdasarkan score
    const scoredResults = scored.filter(d => d._searchScore > 0);

    // Jika ada hasil dengan score > 0, urutkan descending
    if (scoredResults.length > 0) {
        scoredResults.sort((a, b) => b._searchScore - a._searchScore);
        return scoredResults;
    }

    // Fallback: tidak ada hasil smart search
    // Return hasil kosong (frontend akan handle fallback ke LIKE search)
    return [];
}

/**
 * Fallback search dengan token-based matching
 * Pecah query menjadi token penting dan hitung kecocokan per token
 */
function fallbackLikeSearch(destinations, query) {
    if (!query || typeof query !== 'string') {
        return destinations.map(d => ({
            ...d,
            _searchScore: 1,
            _matchedKeywords: [],
            _searchReason: `Fallback: semua destinasi`
        }));
    }

    const normalizedQuery = normalizeText(query);

    // Pecah query menjadi kata-kata penting
    const stopWords = ['yang', 'di', 'dan', 'ini', 'itu', 'dengan', 'untuk', 'pada', 'dari', 'dalam', 'tersebut', 'bisa', 'ada', 'sudah', 'akan', 'juga', 'tempat', 'lokasi', 'objek', 'rekomendasi', 'suggesti', 'dekat', 'sekitar'];
    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2 && !stopWords.includes(t));

    // Jika tidak ada token valid, return semua
    if (tokens.length === 0) {
        return destinations.map(d => ({
            ...d,
            _searchScore: 1,
            _matchedKeywords: [],
            _searchReason: `Fallback: "${query}"`
        }));
    }

    return destinations
        .map(dest => {
            const searchableText = normalizeText(`
                ${dest.nama || ''}
                ${dest.deskripsi || ''}
                ${dest.lokasi || ''}
                ${dest.kategori || ''}
                ${dest.owner_nama_usaha || ''}
                ${dest.owner_kategori_usaha || ''}
            `);

            // Hitung berapa token yang cocok
            let matchedCount = 0;
            const matchedTokens = [];

            for (const token of tokens) {
                if (searchableText.includes(token)) {
                    matchedCount++;
                    matchedTokens.push(token);
                }
            }

            // Score berdasarkan prosentase kecocokan token
            const scoreRatio = matchedCount / tokens.length;

            // Minimal harus ada 1 token yang cocok, dan rasio >= 0.3
            if (matchedCount > 0 && scoreRatio >= 0.3) {
                const baseScore = Math.round(scoreRatio * 20); // Max 20 points
                return {
                    ...dest,
                    _searchScore: baseScore + matchedCount * 3, // Bonus per token
                    _matchedKeywords: matchedTokens.slice(0, 5),
                    _searchReason: `Fallback: ${matchedCount}/${tokens.length} kata cocok`
                };
            }

            return null;
        })
        .filter(d => d !== null)
        .sort((a, b) => b._searchScore - a._searchScore);
}

// Export untuk digunakan di routes
module.exports = {
    normalizeText,
    parseSmartQuery,
    scoreDestination,
    smartSearchDestinations,
    fallbackLikeSearch,
    // Export kamus untuk debugging
    LOKASI_KAMUS,
    KATEGORI_KEYWORD,
    HARGA_MURAH_KEYWORDS,
    SUASANA_KEYWORD
};
