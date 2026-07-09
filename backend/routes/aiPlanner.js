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
// HELPER: Hitung max_tokens dinamis berdasarkan jumlah hari
// ============================================================
function calculateMaxTokens(requestedDays) {
    // Base: 2000 untuk 1 hari
    // Tambah ~1000 per hari tambahan
    // Maksimal 7000 untuk 7 hari
    const calculated = Math.max(2000, requestedDays * 1000);
    const maxTokens = Math.min(7000, calculated);
    console.log('[AI Planner] Calculated max_tokens:', maxTokens, '(requestedDays:', requestedDays + ')');
    return maxTokens;
}

// ============================================================
// HELPER: Validasi kelengkapan itinerary
// ============================================================
function validateItineraryCompleteness(text, requestedDays) {
    if (!text || !text.trim()) {
        return {
            isComplete: false,
            foundDays: [],
            missingDays: Array.from({ length: requestedDays }, (_, i) => i + 1),
            hasRingkasan: false,
            reason: 'Teks kosong'
        };
    }

    // Regex untuk mendeteksi "Hari N" dengan berbagai format
    // Mendukung: "Hari 1", "📍 Hari 1", "Hari 1 —", "Hari 1:", dll
    const dayRegex = /(?:^|\n)\s*(?:📍\s*)?Hari\s+(\d+)\b/gi;
    const foundDaysSet = new Set();
    let match;

    while ((match = dayRegex.exec(text)) !== null) {
        const dayNum = parseInt(match[1], 10);
        if (dayNum >= 1 && dayNum <= 7) {
            foundDaysSet.add(dayNum);
        }
    }

    const foundDays = Array.from(foundDaysSet).sort((a, b) => a - b);

    // Cek apakah semua hari dari 1 sampai requestedDays ada
    const missingDays = [];
    for (let i = 1; i <= requestedDays; i++) {
        if (!foundDaysSet.has(i)) {
            missingDays.push(i);
        }
    }

    // Cek apakah ada bagian Ringkasan
    const hasRingkasan = /\bringkasan\b/i.test(text);

    const isComplete = missingDays.length === 0 && hasRingkasan;

    console.log('[AI Planner] Itinerary validation:');
    console.log('[AI Planner]   - Requested days:', requestedDays);
    console.log('[AI Planner]   - Found days:', foundDays.join(', ') || 'none');
    console.log('[AI Planner]   - Missing days:', missingDays.join(', ') || 'none');
    console.log('[AI Planner]   - Has Ringkasan:', hasRingkasan);
    console.log('[AI Planner]   - Is complete:', isComplete);

    return {
        isComplete,
        foundDays,
        missingDays,
        hasRingkasan,
        reason: isComplete ? 'OK' : (missingDays.length > 0 ? `Missing: Hari ${missingDays.join(', ')}` : 'No Ringkasan')
    };
}

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

        // Parse preferensi user untuk mendapatkan jumlah hari
        const preferences = parseUserPreferences(userMessage);
        const requestedDays = preferences.days;
        console.log('[AI Planner] User preferences parsed:', preferences);
        console.log('[AI Planner] Requested days:', requestedDays);

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

        // Hitung max_tokens dinamis
        const maxTokens = calculateMaxTokens(requestedDays);

        // Bangun prompt dengan jumlah hari yang diminta
        const prompt = buildTravelPlannerPrompt(userMessage, destinations, requestedDays);

        // Generate dengan Olagon (dengan retry)
        let reply;
        let source = 'olagon';
        let olagonMeta = null;

        try {
            const result = await generateWithOlagonWithRetry(prompt, maxTokens, requestedDays);
            reply = result.text;
            olagonMeta = result.meta;
            console.log('[AI Planner] Olagon response received, source:', source);
        } catch (olagonError) {
            console.log('[AI Planner] Olagon failed after retries, using local fallback:', olagonError.message);
            reply = generateLocalItinerary(userMessage, destinations);
            source = 'local_fallback_incomplete_olagon';
        }

        // Log metadata Olagon jika ada
        if (olagonMeta) {
            console.log('[AI Planner] Olagon metadata:');
            console.log('[AI Planner]   - stop_reason:', olagonMeta.stop_reason);
            console.log('[AI Planner]   - input_tokens:', olagonMeta.input_tokens);
            console.log('[AI Planner]   - output_tokens:', olagonMeta.output_tokens);
            console.log('[AI Planner]   - max_tokens_used:', olagonMeta.max_tokens);
            console.log('[AI Planner]   - retry_count:', olagonMeta.retry_count);
        }

        res.json({
            success: true,
            reply: reply,
            source: source,
            meta: olagonMeta || undefined
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
// HELPER: Generate Olagon dengan Retry
// ============================================================
async function generateWithOlagonWithRetry(prompt, maxTokens, requestedDays) {
    let retryCount = 0;
    const maxRetries = 1; // Maksimal 1 retry

    while (retryCount <= maxRetries) {
        console.log(`[AI Planner] Olagon request attempt ${retryCount + 1}/${maxRetries + 1}`);

        const result = await generateWithOlagon(prompt, maxTokens);

        // Validasi kelengkapan itinerary
        const validation = validateItineraryCompleteness(result.text, requestedDays);

        // Ekstrak metadata
        const meta = {
            stop_reason: result.meta?.stop_reason || 'unknown',
            input_tokens: result.meta?.usage?.input_tokens || 0,
            output_tokens: result.meta?.usage?.output_tokens || 0,
            output_length: result.text.length,
            max_tokens: maxTokens,
            retry_count: retryCount
        };

        if (validation.isComplete) {
            console.log('[AI Planner] Itinerary complete, returning response');
            return { text: result.text, meta };
        }

        // Jika tidak lengkap dan masih bisa retry
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`[AI Planner] Itinerary incomplete, retrying (${retryCount}/${maxRetries})...`);

            // Bangun prompt retry yang lebih tegas
            prompt = buildRetryPrompt(prompt, requestedDays, validation);
            // Tingkatkan max_tokens untuk retry
            maxTokens = Math.min(7000, maxTokens + 1500);
            console.log('[AI Planner] Retry max_tokens increased to:', maxTokens);
        } else {
            // Sudah maksimal retry, lempar error untuk trigger fallback
            console.log('[AI Planner] Max retries reached, itinerary still incomplete');
            throw new Error('Itinerary Olagon tidak lengkap setelah ' + (retryCount + 1) + ' percobaan');
        }
    }

    throw new Error('Loop retry gagal');
}

// ============================================================
// HELPER: Bangun Prompt Retry
// ============================================================
function buildRetryPrompt(originalPrompt, requestedDays, validation) {
    const missingDaysStr = validation.missingDays.join(', ');

    return `${originalPrompt}

================================================================
PERINGATAN PENTING - PERBAIKI RESPONS ANDA:
================================================================

Respons sebelumnya TIDAK LENGKAP karena:
- Hari yang hilang: ${missingDaysStr}
${!validation.hasRingkasan ? '- Bagian RINGKASAN tidak ditemukan' : ''}

BUAT ULANG RESPONS DENGAN LENGKAP:

1. WAJIB selesaikan SEMUA hari dari Hari 1 sampai Hari ${requestedDays}
2. WAJIB tulis bagian RINGKASAN di akhir
3. JANGAN berhenti sebelum selesai
4. JANGAN tulis "dan seterusnya", "dst.", "lanjutkan", atau placeholder apapun
5. Setiap hari harus memiliki format: Pagi, Siang, Sore dengan destinasi masing-masing
6. Budget per hari WAJIB ada
7. Ringkasan harus ada di akhir dengan total budget dan tips

Buat sekarang secara lengkap:
`;
}

// ============================================================
// HELPER: Ekstrak teks dari response Olagon
// Mendukung berbagai kemungkinan format response
// ============================================================
function extractTextFromOlagonResponse(data) {
    // Logging debugging yang aman - hanya struktur, bukan data sensitif
    console.log('[AI Planner] Response structure analysis:');
    console.log('[AI Planner]   - Top-level keys:', Object.keys(data));
    console.log('[AI Planner]   - data.content type:', typeof data.content);
    if (Array.isArray(data.content)) {
        console.log('[AI Planner]   - data.content is array, length:', data.content.length);
        data.content.forEach((block, idx) => {
            console.log(`[AI Planner]   - content[${idx}] type:`, typeof block, block && typeof block === 'object' ? `keys: ${Object.keys(block)}` : '');
        });
    }
    console.log('[AI Planner]   - data.base_resp type:', typeof data.base_resp);
    if (data.base_resp !== undefined && data.base_resp !== null) {
        if (typeof data.base_resp === 'object') {
            console.log('[AI Planner]   - base_resp keys:', Object.keys(data.base_resp));
        } else if (typeof data.base_resp === 'string') {
            const preview = data.base_resp.substring(0, 100);
            console.log('[AI Planner]   - base_resp is string, preview:', preview + (data.base_resp.length > 100 ? '...' : ''));
        }
    }

    let text = null;
    let parserUsed = null;

    // ========== STRATEGI 1: Cari di data.content (array of blocks) ==========
    if (data.content) {
        if (Array.isArray(data.content)) {
            // Gabungkan semua block dengan type "text" yang memiliki teks
            const textBlocks = data.content.filter(block =>
                block && block.type === 'text' && block.text && typeof block.text === 'string'
            );
            if (textBlocks.length > 0) {
                text = textBlocks.map(block => block.text).join('');
                parserUsed = `content[].text (${textBlocks.length} blocks)`;
                console.log('[AI Planner] Parser: STRATEGI 1a - Combined', textBlocks.length, 'text blocks');
            }

            // Fallback: coba content[0].text saja
            if (!text && data.content[0] && data.content[0].text) {
                text = data.content[0].text;
                parserUsed = 'content[0].text';
                console.log('[AI Planner] Parser: STRATEGI 1b - content[0].text');
            }
        } else if (typeof data.content === 'string') {
            text = data.content;
            parserUsed = 'content (string)';
            console.log('[AI Planner] Parser: STRATEGI 2 - content as string');
        }
    }

    // ========== STRATEGI 3: Cari di data.text ==========
    if (!text && data.text) {
        text = data.text;
        parserUsed = 'data.text';
        console.log('[AI Planner] Parser: STRATEGI 3 - data.text');
    }

    // ========== STRATEGI 4: Cari di data.message ==========
    if (!text && data.message) {
        if (typeof data.message === 'string') {
            text = data.message;
            parserUsed = 'data.message (string)';
            console.log('[AI Planner] Parser: STRATEGI 4a - data.message string');
        } else if (data.message.content) {
            if (typeof data.message.content === 'string') {
                text = data.message.content;
                parserUsed = 'data.message.content (string)';
                console.log('[AI Planner] Parser: STRATEGI 4b - data.message.content string');
            } else if (Array.isArray(data.message.content)) {
                // Gabungkan semua text block dari message.content
                const textBlocks = data.message.content.filter(block =>
                    block && block.type === 'text' && block.text
                );
                if (textBlocks.length > 0) {
                    text = textBlocks.map(block => block.text).join('');
                    parserUsed = `data.message.content[].text (${textBlocks.length} blocks)`;
                    console.log('[AI Planner] Parser: STRATEGI 4c - message.content combined blocks');
                }
            }
        }
    }

    // ========== STRATEGI 5: Format OpenAI - data.choices ==========
    if (!text && data.choices && data.choices[0]) {
        const choice = data.choices[0];
        if (choice.message && choice.message.content) {
            text = choice.message.content;
            parserUsed = 'choices[0].message.content';
            console.log('[AI Planner] Parser: STRATEGI 5a - OpenAI format');
        } else if (choice.text) {
            text = choice.text;
            parserUsed = 'choices[0].text';
            console.log('[AI Planner] Parser: STRATEGI 5b - choices[0].text');
        }
    }

    // ========== STRATEGI 6: Cek di dalam data.base_resp ==========
    if (!text && data.base_resp !== undefined && data.base_resp !== null) {
        console.log('[AI Planner] Attempting to extract from base_resp...');

        let baseRespData = data.base_resp;

        // Jika base_resp adalah string JSON, coba parse
        if (typeof baseRespData === 'string') {
            try {
                baseRespData = JSON.parse(baseRespData);
                console.log('[AI Planner] base_resp parsed from JSON string');
            } catch (e) {
                // Bukan JSON string, gunakan sebagai teks langsung jika tidak kosong
                if (baseRespData.trim().length > 0) {
                    text = baseRespData;
                    parserUsed = 'base_resp (string)';
                    console.log('[AI Planner] Parser: STRATEGI 6a - base_resp as string');
                } else {
                    console.log('[AI Planner] base_resp is non-JSON string but empty');
                }
            }
        } else if (typeof baseRespData === 'object' && baseRespData !== null) {
            // base_resp adalah object, cari teks di dalamnya dengan berbagai kemungkinan
            const candidates = [
                () => { const t = baseRespData.content?.[0]?.text; return t || null; },
                () => { const t = baseRespData.content?.text; return t || null; },
                () => { const t = baseRespData.text; return t || null; },
                () => { const t = baseRespData.message?.content; return t || null; },
                () => { const t = baseRespData.message; return (typeof t === 'string' ? t : null); },
                () => { const t = baseRespData.choices?.[0]?.message?.content; return t || null; },
                () => { const t = baseRespData.choices?.[0]?.text; return t || null; }
            ];

            for (let i = 0; i < candidates.length && !text; i++) {
                try {
                    const result = candidates[i]();
                    if (result && typeof result === 'string' && result.trim().length > 0) {
                        text = result;
                    }
                } catch (e) {
                    // Abaikan error, coba cara lain
                }
            }

            // Coba gabungkan semua text block di base_resp.content jika array
            if (!text && Array.isArray(baseRespData.content)) {
                const textBlocks = baseRespData.content.filter(block =>
                    block && block.type === 'text' && block.text
                );
                if (textBlocks.length > 0) {
                    text = textBlocks.map(block => block.text).join('');
                    parserUsed = `base_resp.content[].text (${textBlocks.length} blocks)`;
                    console.log('[AI Planner] Parser: STRATEGI 6b - base_resp combined text blocks');
                }
            }
        }

        if (text) {
            console.log('[AI Planner] Parser: STRATEGI 6 - base_resp extraction successful');
        }
    }

    // ========== STRATEGI 7: Cek field lain yang mungkin ada teks ==========
    if (!text) {
        const otherFields = ['result', 'response', 'output', 'data', 'body'];
        for (const field of otherFields) {
            if (data[field] && typeof data[field] === 'string' && data[field].trim().length > 0) {
                text = data[field];
                parserUsed = `data.${field}`;
                console.log('[AI Planner] Parser: STRATEGI 7 - found in', field);
                break;
            }
        }
    }

    // ========== Finalisasi ==========
    if (text && typeof text === 'string') {
        const trimmedText = text.trim();
        const preview = trimmedText.substring(0, 150);
        console.log('[AI Planner] Text extracted successfully:');
        console.log('[AI Planner]   - Parser used:', parserUsed);
        console.log('[AI Planner]   - Text length:', trimmedText.length);
        console.log('[AI Planner]   - Text preview:', preview + (trimmedText.length > 150 ? '...' : ''));
        return { text: trimmedText, parserUsed };
    }

    console.log('[AI Planner] WARNING: No text found in any format');
    return { text: null, parserUsed: null };
}

// ============================================================
// PROVIDER: Olagon (Anthropic-compatible)
// ============================================================
async function generateWithOlagon(prompt, maxTokens) {
    const baseUrl = (process.env.OLAGON_BASE_URL || 'https://gateway.olagon.site/anthropic').trim().replace(/\/$/, '');
    const model = process.env.OLAGON_MODEL || 'claude-3-5-haiku-latest';
    const apiKey = process.env.OLAGON_API_KEY;

    // Logging aman - tidak pernah log API key
    console.log('[AI Planner] Attempting Olagon request:');
    console.log('[AI Planner]   - Provider: Olagon');
    console.log('[AI Planner]   - Base URL:', baseUrl);
    console.log('[AI Planner]   - Model:', model);
    console.log('[AI Planner]   - Max tokens:', maxTokens);
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
                max_tokens: maxTokens,
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

        console.log('[AI Planner] Olagon response status:', response.status);

        if (!response.ok) {
            // Ambil error body dengan aman
            const errorBody = await response.text();
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

        // Ambil raw body untuk debugging yang lebih baik
        const rawBody = await response.text();
        console.log('[AI Planner] Raw response body length:', rawBody.length);

        // Coba parse JSON
        let data;
        try {
            data = JSON.parse(rawBody);
            console.log('[AI Planner] JSON parse: success');
        } catch (parseError) {
            const preview = rawBody.substring(0, 200);
            console.error('[AI Planner] JSON parse FAILED:', parseError.message);
            console.error('[AI Planner] Raw body preview (max 200 chars):', preview);
            throw new Error('Response Olagon bukan JSON valid: ' + preview);
        }

        // Ekstrak teks dari response menggunakan helper
        const extracted = extractTextFromOlagonResponse(data);

        if (extracted.text && extracted.text.length > 0) {
            console.log('[AI Planner] Olagon response text length:', extracted.text.length);
            console.log('[AI Planner] SUCCESS: Text extracted from Olagon response');

            // Ekstrak metadata untuk logging
            const meta = {
                stop_reason: data.stop_reason || 'unknown',
                usage: data.usage || {}
            };

            console.log('[AI Planner] Olagon stop reason:', meta.stop_reason);
            if (meta.usage) {
                console.log('[AI Planner] Olagon usage:', {
                    input_tokens: meta.usage.input_tokens,
                    output_tokens: meta.usage.output_tokens
                });
            }

            return { text: extracted.text, meta };
        }

        // Log struktur response untuk debugging jika tidak ada teks
        console.log('[AI Planner] Response structure keys:', Object.keys(data));
        throw new Error('Format response Olagon tidak valid atau kosong');

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[AI Planner] Olagon request timeout after 60 seconds');
            throw new Error('Olagon request timeout');
        }
        throw error;
    } finally {
        // Selalu bersihkan timeout
        clearTimeout(timeoutId);
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
function buildTravelPlannerPrompt(userMessage, destinations, requestedDays) {
    const destinationsText = destinations.map(d => {
        return `• ${d.nama}
  Lokasi: ${d.lokasi}
  Kategori: ${d.kategori}
  Harga Tiket: Rp ${d.harga.toLocaleString('id-ID')}${d.harga === 0 ? ' (Gratis)' : ''}
  Rating: ${d.rating}/5
  Info: ${(d.deskripsi || '-').substring(0, 150)}`;
    }).join('\n');

    // Bangun kerangka hari secara dinamis
    const dayTemplates = [];
    const themes = ['Budaya & Sejarah', 'Alam & Petualangan', 'Kuliner & Relaksasi', 'Heritage & Kuliner', 'Alam & Pantai', 'Budaya & Alam', 'Pantai & Kuliner'];

    for (let day = 1; day <= requestedDays; day++) {
        const theme = themes[(day - 1) % themes.length];
        dayTemplates.push(`📍 Hari ${day} — ${theme}
Pagi: [Nama Destinasi]
   └ [Penjelasan singkat, 1 kalimat]
   └ Estimasi: Rp ...

Siang: [Nama Destinasi]
   └ [Penjelasan singkat, 1 kalimat]
   └ Estimasi: Rp ...

Sore: [Nama Destinasi]
   └ [Penjelasan singkat, 1 kalimat]
   └ Estimasi: Rp ...

💰 Budget Hari ${day}: Rp ...`);
    }

    const daysFramework = dayTemplates.join('\n\n');

    return `Kamu adalah AI Travel Planner untuk aplikasi Wonderloka - platform destinasi wisata Indonesia.

TUGAS UTAMA:
Buat itinerary perjalanan yang santai, natural, dan mudah dibaca seperti berbicara dengan teman.

WAJIB SELESAIKAN ${requestedDays} HARI:
Kamu HARUS menyelesaikan SEMUA hari dari Hari 1 sampai Hari ${requestedDays} dan bagian RINGKASAN.
JANGAN berhenti setelah Hari 1.
Respons belum selesai sebelum Hari ${requestedDays} dan Ringkasan dibuat.
Setiap nomor hari dari 1 sampai ${requestedDays} harus muncul tepat satu kali.

ATURAN PENTING:
1. Jawab DALAM Bahasa Indonesia yang ramah, santai, dan natural. Gunakan kata-kata yang mengalir seperti chat biasa, BUKAN seperti laporan formal.
2. GUNAKAN HANYA destinasi yang disediakan di bawah ini. JANGAN pernah mengarang destinasi baru yang tidak ada dalam daftar.
3. Jika data destinasi terbatas untuk kota/kategori yang diminta, bilang saja dengan sopan: "Data destinasi Wonderloka untuk pilihan ini masih terbatas, jadi saya pilihkan yang paling mendekati."
4. MAKSIMAL 3 destinasi per hari. Jangan lebih.
5. JANGAN ULAH destinasi yang sama di hari yang berbeda, kecuali memang data sangat terbatas.
6. Pastikan total budget masuk akal dan sesuai dengan harga tiket yang diberikan.
7. Gunakan penjelasan singkat, maksimal satu kalimat pendek untuk setiap destinasi. Hindari paragraf panjang.
8. JANGAN tulis "dan seterusnya", "dst.", "lanjutkan sendiri", "dan berikutnya", atau placeholder apapun.
9. JANGAN hanya mengulang contoh format. Buat itinerary yang BERBEDA dari contoh.

FORMAT JAWABAN YANG DIHARAPKAN:
Gunakan format teks biasa yang bersih dan mudah dibaca di chat mobile.

${daysFramework}

📋 Ringkasan
• Total Estimasi Budget: Rp ...
• Destinasi dikunjungi: ... destinasi
• Tips: [3 tips singkat]

LARANGAN - JANGAN GUNAKAN:
- ❌ Tabel markdown (| Waktu | Destinasi | Alasan |)
- ❌ Heading ### atau ## untuk sub-bagian
- ❌ Garis pemisah ---
- ❌ Bullet points dengan (*) atau (-) untuk list destinasi utama
- ❌ Format seperti laporan atau dokumen formal
- ❌ Terlalu banyak emoji beruntun
- ❌ "dan seterusnya", "dst.", atau placeholder apapun
- ❌ Mengulang contoh di atas

GUNAKAN:
- ✅ Teks biasa yang mengalir natural
- ✅ Emoji yang sparse dan relevan
- ✅ Struktur yang jelas tapi tetap ringan
- ✅ Estimasi budget per hari
- ✅ Penjelasan singkat per destinasi

DATA DESTINASI WONDERLOKA:
${destinationsText}

PESAN PENGGUNA:
"${userMessage}"

Buat itinerary lengkap untuk ${requestedDays} hari yang sesuai dengan preferensi user, gunakan data yang ada, dan buat outputnya enak dibaca di chat mobile!`;
}

module.exports = router;
