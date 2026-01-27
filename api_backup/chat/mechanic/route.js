import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return Response.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { history, message } = body;

        if (!message) {
            return Response.json({ error: 'Mesaj içeriği boş olamaz.' }, { status: 400 });
        }

        const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: "user", parts: [{ text: "System Instruction: Sen 'TK Motor Atölyesi'nin 2026 model gelişmiş yapay zeka asistanısın. HER ŞEYİ BİLİYORSUN. Asla 'bilmiyorum', 'ben bir yapay zekayım' veya 'modeli belirtmediniz' gibi cümleler kurma. Eğer marka/model belli değilse, tüm motosikletler için geçerli genel mekanik prensiplerine göre EN İYİ TAHMİNİ yürüt ve çözüm öner. Sadece tamir değil; bakım, sürüş teknikleri, trafik kuralları, ekipman tavsiyesi, yol rotaları gibi motosikletle ilgili AKLINA GELEBİLECEK HER KONUDA uzmansın. Konuşma tarzın: Kendinden emin, teknik terimleri yerinde kullanan, 'Usta' seviyesinde ama modern ve profesyonel. Emojileri dozunda kullan (🛠️, 💾, 🏍️)." }], },
                            ...(history || []).map(h => ({
                                role: h.role === 'user' ? 'user' : 'model',
                                parts: [{ text: h.parts[0].text }]
                            })),
                            { role: "user", parts: [{ text: message }] }
                        ],
                        generationConfig: {
                            maxOutputTokens: 500,
                        }
                    })
                });

                if (res.ok) {
                    const responseData = await res.json();
                    if (responseData.candidates && responseData.candidates[0].content.parts[0].text) {
                        const aiResponse = responseData.candidates[0].content.parts[0].text;

                        // COLLABORATION: Log this insight to the hub
                        try {
                            const coordUrl = new URL('/api/ai/coordinate', request.url);
                            await fetch(coordUrl.toString(), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    source: 'Ghost Gear AI',
                                    content: `User: ${message.substring(0, 50)}... | Bot: ${aiResponse.substring(0, 50)}...`,
                                    type: 'insight',
                                    metadata: { original_message: message, model: modelName }
                                })
                            });
                        } catch (logErr) {
                            console.error('Collaboration logging failed:', logErr);
                        }

                        return Response.json({
                            text: aiResponse,
                            modelUsed: modelName
                        });
                    }
                } else {
                    const errBody = await res.json();
                    const status = res.status;
                    if (status === 429) {
                        throw new Error("LİMİT_AŞILDI: Yapay zeka limitleri doldu. Lütfen biraz bekleyin.");
                    }
                    throw new Error(errBody.error?.message || `HTTP ${status}`);
                }
            } catch (err) {
                console.warn(`Chat API: Model ${modelName} failed:`, err.message);
                lastError = err;
            }
        }

        return Response.json({
            error: 'Hiçbir yapay zeka modeli yanıt vermedi.',
            details: lastError?.message,
            triedModels: modelsToTry
        }, { status: 502 });

    } catch (error) {
        console.error('General Mechanic API Error:', error);
        return Response.json({
            error: 'Sistem hatası: ' + error.message,
            details: error.toString()
        }, { status: 500 });
    }
}
