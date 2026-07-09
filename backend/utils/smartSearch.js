/**
 * Smart Search Helper - Rule-based NLP lokal tanpa API eksternal
 * Wonderloka Destination Search Engine
 */

'use strict';

const LOKASI_KAMUS = {
    'jogja': ['jogja', 'jogjakarta', 'yogyakarta', 'yogya'],
    'bali': ['bali', 'denpasar', 'kuta', 'seminyak', 'ubud', 'nusa dua', 'sanur', 'canggu'],
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
    'lombok': ['lombok'],
    'raja ampat': ['raja ampat'],
    'banyuwangi': ['banyuwangi'],
    'dieng': ['dieng', 'kawah dieng'],
};

const KATEGORI_KEYWORD = {
    'alam': ['alam', 'natural', 'nature', 'alam terbuka', 'outdoor', 'pantai', 'danau', 'gunung', 'bukit', 'goa', 'air terjun'],
    'budaya': ['budaya', 'culture', 'sejarah', 'historic', 'heritage', 'candi', 'keraton', 'museum', 'bangunan bersejarah', 'situs bersejarah'],
    'penginapan': ['hotel', 'penginapan', 'homestay', 'hostel', 'losmen', 'villa', 'resort', 'akomodasi', 'tempat inap', 'inn', 'lodging', 'guest house', 'lodge', 'cottage'],
    'tour': ['tour', 'jeep', 'lava tour', 'sunrise tour', 'sunset tour', 'city tour', 'adventure', 'petualangan', 'offroad', 'trekking', 'cave tubing', 'rafting'],
    'campground': ['camping', 'camp', 'kemah', 'glamping', 'campground', 'bivak', 'base camp', 'rancher'],
    'gunung': ['gunung', 'mountain', 'pendakian', 'hiking', 'trekking', 'climbing', 'volcano'],
    'pantai': ['pantai', 'beach', 'pantai pasir', 'pantai indah', 'pantai eksotis', 'derawan'],
    'museum': ['museum', 'galeri', 'galeri seni', 'koleksi', 'exhibition']
};

const CATEGORY_DB_MAP = {
    'alam': 'Alam',
    'budaya': 'Budaya',
    'penginapan': 'Penginapan',
    'tour': 'Tour',
    'campground': 'Campground',
    'gunung': 'Alam',
    'pantai': 'Alam',
    'museum': 'Budaya'
};

const HARGA_MURAH_KEYWORDS = [
    'murah', 'hemat', 'budget', 'terjangkau', 'ekonomis', 'konomis',
    'irit', 'promo', 'diskon', 'sale', 'promosi', 'spesial',
    'bagus murah', 'harga kecil', 'harga rendah', 'cocok kantong',
    'affordable', 'value', 'value for money', 'gratis', 'free',
    'termurah', 'harga termurah', 'paling murah', 'harga paling rendah'
];

const HARGA_MEWAH_KEYWORDS = [
    'mahal', 'mewah', 'luxury', 'premium', 'fancy', 'exclusive',
    'termewah', 'paling mahal', 'high-end', 'best quality'
];

const SUASANA_KEYWORD = {
    'sejuk': ['sejuk', 'adem', 'dingin', 'cool', 'refreshing', 'segar', 'bersih udara'],
    'sepi': ['sepi', 'tenang', 'tersembunyi', 'hidden', 'private', 'secret', 'hidden gem'],
    'ramai': ['ramai', 'popular', 'terkenal', 'famous', 'hits', 'viral', 'terpopuler'],
    'sunset': ['sunset', 'matahari terbenam', 'golden hour', 'senja'],
    'foto': ['foto', 'instagramable', 'insta-worthy', 'photogenic', 'aesthetic', 'kece', 'selfie', 'estetik'],
    'rombongan': ['rombongan', 'group', 'family', 'keluarga', 'teambuilding'],
    'romantis': ['romantis', 'romantic', 'pasangan', 'couple', 'honeymoon'],
    'petualangan': ['petualangan', 'adventure', 'trek', 'offroad', 'rafting', 'expedition'],
    'rating tinggi': ['rating tinggi', 'rating baik', 'terbaik', 'top rated', 'best rated', 'paling populer', 'rekomendasi']
};

function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseHarga(harga) {
    if (!harga) return 0;
    if (typeof harga === 'number') return harga;
    const str = String(harga).toLowerCase();
    const numStr = str.replace(/[^\d]/g, '');
    const num = parseInt(numStr) || 0;
    if (str.includes('k') || str.includes('rb')) return num * 1000;
    return num;
}

function getStrictDbCategories(parsedQuery) {
    if (!parsedQuery || !parsedQuery.categories || parsedQuery.categories.length === 0) {
        return [];
    }
    const dbCategories = new Set();
    for (const cat of parsedQuery.categories) {
        const dbCat = CATEGORY_DB_MAP[cat];
        if (dbCat) {
            dbCategories.add(dbCat);
        }
    }
    return Array.from(dbCategories);
}

function parseSmartQuery(query) {
    if (!query || typeof query !== 'string') {
        return {
            locations: [],
            categories: [],
            hargaMurah: false,
            hargaMewah: false,
            suasana: {},
            ratingTinggi: false,
            originalTerms: [],
            searchReason: '',
            strictDbCategories: []
        };
    }

    const normalized = normalizeText(query);
    const words = normalized.split(' ').filter(w => w.length > 1);
    const result = {
        locations: [],
        categories: [],
        hargaMurah: false,
        hargaMewah: false,
        suasana: {},
        ratingTinggi: false,
        originalTerms: [],
        searchReason: '',
        strictDbCategories: []
    };

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

    result.strictDbCategories = getStrictDbCategories(result);

    for (const keyword of HARGA_MURAH_KEYWORDS) {
        if (normalized.includes(keyword)) {
            result.hargaMurah = true;
            break;
        }
    }

    for (const keyword of HARGA_MEWAH_KEYWORDS) {
        if (normalized.includes(keyword)) {
            result.hargaMewah = true;
            break;
        }
    }

    for (const [suasana, keywords] of Object.entries(SUASANA_KEYWORD)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                result.suasana[suasana] = true;
                break;
            }
        }
    }

    const ratingKeywords = ['rating tinggi', 'rating baik', 'terbaik', 'top rated', 'best rated', 'paling populer', 'rekomendasi'];
    for (const keyword of ratingKeywords) {
        if (normalized.includes(keyword)) {
            result.ratingTinggi = true;
            break;
        }
    }

    const identifiedWords = new Set([
        ...Object.values(LOKASI_KAMUS).flat(),
        ...Object.values(KATEGORI_KEYWORD).flat(),
        ...HARGA_MURAH_KEYWORDS,
        ...HARGA_MEWAH_KEYWORDS,
        ...Object.values(SUASANA_KEYWORD).flat()
    ]);

    for (const word of words) {
        let isIdentified = false;
        for (const keyword of identifiedWords) {
            if (keyword.length > 2 && normalized.includes(keyword)) {
                if (keyword.includes(word) || word.includes(keyword)) {
                    isIdentified = true;
                    break;
                }
            }
        }
        if (!isIdentified && word.length > 3 && !['yang', 'dan', 'di', 'ini', 'itu', 'dengan', 'untuk', 'pada', 'dari', 'dalam', 'tersebut', 'bisa', 'ada', 'sudah', 'akan', 'juga', 'tempat', 'lokasi', 'objek', 'rekomendasi'].includes(word)) {
            result.originalTerms.push(word);
        }
    }

    const reasons = [];
    if (result.locations.length > 0) reasons.push(result.locations.join(', '));
    if (result.categories.length > 0) reasons.push(result.categories.join(', '));
    if (result.hargaMurah) reasons.push('murah');
    if (result.hargaMewah) reasons.push('mewah');
    if (result.ratingTinggi) reasons.push('rating tinggi');
    if (Object.keys(result.suasana).length > 0) reasons.push(Object.keys(result.suasana).join(', '));
    result.searchReason = reasons.length > 0 ? reasons.join(' - ') : '';

    return result;
}

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

    const allText = normalizedNama + ' ' + normalizedDeskripsi + ' ' + normalizedLokasi + ' ' + normalizedKategori + ' ' + normalizedOwnerUsaha + ' ' + normalizedOwnerKategori;

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

    if (parsedQuery.categories.length > 0) {
        for (const kategori of parsedQuery.categories) {
            const keywords = KATEGORI_KEYWORD[kategori] || [];
            const dbCategory = CATEGORY_DB_MAP[kategori];

            let matchedInField = false;

            if (dbCategory && normalizedKategori === dbCategory.toLowerCase()) {
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
        }
    }

    if (parsedQuery.hargaMurah) {
        const hargaNum = parseHarga(destination.harga);
        if (hargaNum === 0) score += 18;
        else if (hargaNum <= 15000) score += 15;
        else if (hargaNum <= 30000) score += 10;
        else if (hargaNum <= 50000) score += 5;
        if (score > 0) matchedKeywords.push('murah');
    }

    if (Object.keys(parsedQuery.suasana).length > 0) {
        for (const [suasana, isActive] of Object.entries(parsedQuery.suasana)) {
            if (!isActive) continue;
            const suasanaKeywords = SUASANA_KEYWORD[suasana] || [];
            for (const keyword of suasanaKeywords) {
                if (allText.includes(keyword)) {
                    const bobotSuasana = { 'sejuk': 15, 'sepi': 15, 'ramai': 12, 'sunset': 18, 'foto': 12, 'rombongan': 10, 'romantis': 12, 'petualangan': 15 };
                    score += bobotSuasana[suasana] || 10;
                    if (!matchedKeywords.includes(suasana)) matchedKeywords.push(suasana);
                    break;
                }
            }
        }
    }

    if (parsedQuery.suasana['ramai']) {
        const rating = parseFloat(destination.rating) || 0;
        if (rating >= 4.5) score += 15;
        else if (rating >= 4.0) score += 10;
        else if (rating >= 3.5) score += 5;
    }

    if (parsedQuery.ratingTinggi) {
        const rating = parseFloat(destination.rating) || 0;
        if (rating >= 4.5) score += 25;
        else if (rating >= 4.0) score += 18;
        else if (rating >= 3.5) score += 10;
    }

    return score;
}

function smartSearchDestinations(destinations, query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return destinations.map(d => ({
            ...d,
            _searchScore: 0,
            _matchedKeywords: [],
            _searchReason: ''
        }));
    }

    const parsedQuery = parseSmartQuery(query);

    const scored = destinations.map(dest => {
        const score = scoreDestination(dest, parsedQuery);
        const matchedKeywords = [];

        const normalizedNama = normalizeText(dest.nama || '');
        const normalizedDeskripsi = normalizeText(dest.deskripsi || '');
        const normalizedLokasi = normalizeText(dest.lokasi || '');
        const normalizedKategori = normalizeText(dest.kategori || '');

        for (const lokasi of parsedQuery.locations) {
            const semuaAlias = [lokasi, ...(LOKASI_KAMUS[lokasi] || [])];
            for (const alias of semuaAlias) {
                if (normalizedLokasi.includes(alias) || normalizedNama.includes(alias)) {
                    matchedKeywords.push(lokasi);
                    break;
                }
            }
        }

        for (const kategori of parsedQuery.categories) {
            if (normalizedNama.includes(kategori) || normalizedDeskripsi.includes(kategori) || normalizedKategori.includes(kategori)) {
                matchedKeywords.push(kategori);
            }
        }

        if (parsedQuery.ratingTinggi) matchedKeywords.push('rating tinggi');

        return {
            ...dest,
            _searchScore: score,
            _matchedKeywords: [...new Set(matchedKeywords)],
            _searchReason: parsedQuery.searchReason
        };
    });

    const scoredResults = scored.filter(d => d._searchScore > 0);
    if (scoredResults.length > 0) {
        scoredResults.sort((a, b) => b._searchScore - a._searchScore);
        return scoredResults;
    }

    return [];
}

function fallbackLikeSearch(destinations, query, strictDbCategories) {
    strictDbCategories = strictDbCategories || [];

    if (!query || typeof query !== 'string') {
        return destinations.map(d => ({ ...d, _searchScore: 1, _matchedKeywords: [], _searchReason: 'Fallback: semua destinasi' }));
    }

    let filteredDests = destinations;
    if (strictDbCategories.length > 0) {
        filteredDests = destinations.filter(d => {
            const destCat = (d.kategori || '').toLowerCase();
            const ownerCat = (d.owner_kategori_usaha || '').toLowerCase();
            return strictDbCategories.some(cat => {
                const catLower = cat.toLowerCase();
                return destCat === catLower || ownerCat === catLower;
            });
        });
    }

    if (filteredDests.length === 0) {
        return [];
    }

    const normalizedQuery = normalizeText(query);
    const stopWords = ['yang', 'di', 'dan', 'ini', 'itu', 'dengan', 'untuk', 'pada', 'dari', 'dalam', 'tersebut', 'bisa', 'ada', 'sudah', 'akan', 'juga', 'tempat', 'lokasi', 'objek', 'rekomendasi', 'dekat', 'sekitar'];
    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2 && !stopWords.includes(t));

    if (tokens.length === 0) {
        return filteredDests.map(d => ({ ...d, _searchScore: 1, _matchedKeywords: [], _searchReason: 'Fallback: ' + query }));
    }

    return filteredDests
        .map(dest => {
            const searchableText = normalizeText(
                (dest.nama || '') + ' ' +
                (dest.deskripsi || '') + ' ' +
                (dest.lokasi || '') + ' ' +
                (dest.kategori || '') + ' ' +
                (dest.owner_nama_usaha || '') + ' ' +
                (dest.owner_kategori_usaha || '')
            );

            let matchedCount = 0;
            const matchedTokens = [];

            for (const token of tokens) {
                if (searchableText.includes(token)) {
                    matchedCount++;
                    matchedTokens.push(token);
                }
            }

            const scoreRatio = matchedCount / tokens.length;
            if (matchedCount > 0 && scoreRatio >= 0.3) {
                const baseScore = Math.round(scoreRatio * 20);
                return {
                    ...dest,
                    _searchScore: baseScore + matchedCount * 3,
                    _matchedKeywords: matchedTokens.slice(0, 5),
                    _searchReason: 'Fallback: ' + matchedCount + '/' + tokens.length + ' kata cocok'
                };
            }
            return null;
        })
        .filter(d => d !== null)
        .sort((a, b) => b._searchScore - a._searchScore);
}

module.exports = {
    normalizeText,
    parseSmartQuery,
    scoreDestination,
    smartSearchDestinations,
    fallbackLikeSearch,
    getStrictDbCategories,
    CATEGORY_DB_MAP,
    LOKASI_KAMUS,
    KATEGORI_KEYWORD,
    HARGA_MURAH_KEYWORDS,
    SUASANA_KEYWORD
};
