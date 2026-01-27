import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '../../../../auth';
import db from '../../../../lib/db';
import { cookies } from 'next/headers';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function getCurrentWeek() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week}`;
}

const VERSION = "v1.7.2-diag";

export async function POST(request) {
    try {
        let userId = null;
        let email = null;

        // 1. Try NextAuth Session
        const session = await auth();
        if (session?.user) {
            email = session.user.email;
            const userRes = await db.execute({
                sql: 'SELECT id FROM users WHERE email = ?',
                args: [email]
            });
            userId = userRes.rows[0]?.id;
        }

        // 2. Try Custom Session
        if (!userId) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('auth_session');
            if (sessionCookie) {
                try {
                    const decodedValue = decodeURIComponent(sessionCookie.value);
                    const sessionData = JSON.parse(decodedValue);
                    const userRes = await db.execute({
                        sql: 'SELECT * FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                        args: [sessionData.phone, sessionData.token]
                    });
                    if (userRes.rows.length > 0) {
                        userId = userRes.rows[0].id;
                        email = userRes.rows[0].email || userRes.rows[0].phoneNumber; // Fallback to phone if no email
                    }
                } catch (e) { }
            }
        }

        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentWeek = getCurrentWeek();

        // 1. Get User Data
        const userResult = await db.execute({
            sql: 'SELECT id, subscriptionStatus, partsUsageCount, partsUsageWeek FROM users WHERE id = ?',
            args: [userId]
        });

        if (userResult.rows.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];
        const isPremium = ['Gold', 'Silver', 'Bronze', 'Premium', 'Active'].includes(user.subscriptionStatus);

        // 2. Check & Update Usage
        let newCount = user.partsUsageCount;

        // Reset if new week
        if (user.partsUsageWeek !== currentWeek) {
            newCount = 0;
            // Immediate reset in DB to be safe? Or just use local 0 variable. 
            // Better to update DB at the end or here.
        }

        if (!isPremium && newCount >= 2) {
            return Response.json({
                error: 'Weekly limit reached',
                limitReached: true,
                message: 'Haftalık 2 adet ücretsiz parça analiz hakkınız doldu. Sınırsız analiz için Premium\'a geçin.'
            }, { status: 403 });
        }

        // 3. Proceed with Gemini
        const body = await request.json();
        const { brand, model, year, category, part } = body;

        if (!brand || !model || !part) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // --- CACHING LOGIC START ---
        const cacheKey = `${brand}-${model}-${year}-${part}`.toLowerCase().replace(/\s+/g, '_');
        try {
            const cacheResult = await db.execute({
                sql: 'SELECT data, expiresAt FROM part_price_cache WHERE cacheKey = ?',
                args: [cacheKey]
            });

            if (cacheResult.rows.length > 0) {
                const cached = cacheResult.rows[0];
                const now = new Date().toISOString();
                if (cached.expiresAt > now) {
                    console.log(`[Parts API] Cache HIT for ${cacheKey}`);
                    // Increment usage even for cache hits (optional, based on logic)
                    await db.execute({
                        sql: 'UPDATE users SET partsUsageCount = ?, partsUsageWeek = ? WHERE id = ?',
                        args: [newCount + 1, currentWeek, userId]
                    });
                    return Response.json({
                        success: true,
                        data: JSON.parse(cached.data),
                        remaining: isPremium ? 'Unlimited' : (2 - (newCount + 1)),
                        cached: true
                    });
                } else {
                    console.log(`[Parts API] Cache EXPIRED for ${cacheKey}`);
                }
            }
        } catch (cacheErr) {
            console.warn('[Parts API] Cache read error:', cacheErr.message);
        }
        // --- CACHING LOGIC END ---

        console.log(`[Parts API] Starting request for ${brand} ${model}...`);

        // Prompt Engineering for Structured JSON Output
        const prompt = `
            Act as a motorcycle spare parts expert in Turkey.
            User is looking for price estimation for:
            Vehicle: ${brand} ${model} (${year || 'Year Unknown'})
            Part Category: ${category || 'General'}
            Part Name: ${part}

            Please provide a JSON object with the following structure (do NOT include markdown formatting like \`\`\`json):
            {
                "partName": "Standardized Part Name",
                "compatibility": "Compatible years or models",
                "prices": {
                    "zero_original": { "min": 0, "max": 0, "currency": "TL", "notes": "Authorized Dealer Price" },
                    "zero_aftermarket": { "min": 0, "max": 0, "currency": "TL", "brands": "Common brands like GP Kompozit etc." },
                    "second_hand": { "min": 0, "max": 0, "currency": "TL", "availability": "High/Medium/Low" }
                },
                "recommendation": "Expert advice (e.g., 'Buy original for electric parts')",
                "alternatives": ["Alternative part name 1", "Alternative part name 2"]
            }

            Prices should be realistic estimates for the Turkish market in Turkish Lira (TL).
            CRITICAL: Provide a **NARROW** and precise price range (e.g., 2000-2500 TL instead of 1000-5000 TL).
            Analyze specific market data sources (Sahibinden, Moto-Pazar, Official Dealers).
            If uncertain, perform a deeper comparison but keep the range tight.
            All text values (notes, recommendation, compatibility, etc.) MUST be in TURKISH language.
            Respond ONLY with the JSON string.
            
            NOTE: If this part is a common maintenance item or widely available, do NOT perform a live search, use your existing knowledge to provide the range. Only use live search for very specific or rare parts where prices fluctuate wildly.
        `;

        const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"];
        let lastError = null;
        let text = "";
        let usedModel = "";

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Parts API] Trying model: ${modelName}`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 1,
                            topP: 0.95,
                            topK: 64,
                            maxOutputTokens: 1000
                        }
                    })
                });

                if (res.ok) {
                    const responseData = await res.json();
                    if (responseData.candidates && responseData.candidates[0].content.parts[0].text) {
                        text = responseData.candidates[0].content.parts[0].text;
                        usedModel = modelName;
                        console.log(`[Parts API] Model ${modelName} success! Bytes: ${text.length}`);
                        break;
                    } else {
                        throw new Error("Empty response candidates");
                    }
                } else {
                    const errBody = await res.json();
                    const status = res.status;
                    const msg = errBody.error?.message || `HTTP ${status}`;

                    if (status === 429) {
                        console.warn(`[Parts API] Model ${modelName} hit RATE LIMIT.`);
                        throw new Error("LİMİT_DOLDU: Yapay zeka şu an çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin veya Premium hesaba geçin.");
                    }

                    console.warn(`[Parts API] Model ${modelName} failed with: ${msg}`);
                    throw new Error(msg);
                }
            } catch (err) {
                lastError = err;
            }
        }

        if (!text) {
            console.error(`[Parts API] All models failed. Last Error: ${lastError?.message}`);
            return Response.json({
                error: `Yapay zeka yanıt vermedi (API Ver: ${VERSION})`,
                details: lastError?.message,
                triedModels: modelsToTry
            }, { status: 502 });
        }

        const finalCount = newCount + 1;

        // Robust JSON extraction
        console.log(`[Parts API] Extracting JSON from response...`);
        let cleanText = text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        } else {
            cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('[Parts API] JSON Parse Error:', parseError.message);
            console.error('[Parts API] Cleaned Text:', cleanText);
            return Response.json({
                error: 'Veri işleme hatası. Yapay zeka geçersiz format döndürdü.',
                details: parseError.message,
                modelUsed: usedModel
            }, { status: 500 });
        }

        await db.execute({
            sql: 'UPDATE users SET partsUsageCount = ?, partsUsageWeek = ? WHERE id = ?',
            args: [finalCount, currentWeek, userId]
        });

        // --- CACHE STORE START ---
        try {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
            await db.execute({
                sql: 'INSERT OR REPLACE INTO part_price_cache (cacheKey, data, expiresAt) VALUES (?, ?, ?)',
                args: [cacheKey, JSON.stringify(data), expiresAt]
            });
            console.log(`[Parts API] Cached result for ${cacheKey}`);
        } catch (cacheStoreErr) {
            console.warn('[Parts API] Cache store error:', cacheStoreErr.message);
        }
        // --- CACHE STORE END ---

        console.log(`[Parts API] Success! Returning data for ${data.partName}`);
        return Response.json({ success: true, data, remaining: isPremium ? 'Unlimited' : (2 - finalCount) });

    } catch (error) {
        console.error('[Parts API] CRITICAL ERROR:', error);
        return Response.json({
            error: 'Sunucu hatası: ' + error.message,
            details: error.stack || error.toString(),
            version: VERSION
        }, { status: 500 });
    }
}
