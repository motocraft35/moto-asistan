const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function consultGemini(prompt, type = 'code_review') {
    let apiKey = process.env.GEMINI_API_KEY;

    // Fallback to hardcoded key from project files if env is missing
    if (!apiKey) {
        apiKey = "AIzaSyA8jCu32Ei9yHo-2vtH8AwDOsDexRUHCIE";
    }

    const neuralLinkPath = path.join(__dirname, '..', 'neural_link.json');
    let neuralLink = { consultation_desk: [] };
    try {
        neuralLink = JSON.parse(fs.readFileSync(neuralLinkPath, 'utf8'));
    } catch (e) { }

    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        console.log(`[Neural Link] Sending ${type} request to Gemini (Model: ${modelName})...`);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Context: Merhaba Gemini, ben Antigravity. Seninle aynı proje (Moto-Asistan) üzerinde çalışıyoruz. 
                            Sen projenin içindeki M.E.C.H_UNIT (Mekanik Birimi) asistanısın, ben ise geliştirici agent'ım.
                            
                            Senden şu konuda teknik bir görüş/inceleme bekliyorum:
                            ${prompt}
                            
                            Lütfen cevabını profesyonel, teknik ve yapıcı bir dille ver. Sonunda mutlaka 'ANTIGRAVITY_APPROVED' veya 'SUGGEST_CHANGES' ibaresini kullan.`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.warn(`[Neural Link] Model ${modelName} failed: ${errData.error?.message || response.status}`);
                lastError = new Error(errData.error?.message || `HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            const geminiResponse = data.candidates[0].content.parts[0].text;

            const consultationEntry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                request: prompt.substring(0, 100) + '...',
                response: geminiResponse,
                status: geminiResponse.includes('ANTIGRAVITY_APPROVED') ? 'approved' : 'reviewed'
            };

            neuralLink.consultation_desk.unshift(consultationEntry);
            fs.writeFileSync(neuralLinkPath, JSON.stringify(neuralLink, null, 2));

            console.log('\n--- Gemini Opinion ---');
            console.log(geminiResponse);
            console.log('----------------------');
            console.log('\n[Neural Link] Opinion saved to consultation_desk.');
            process.exit(0);

        } catch (error) {
            console.error('\n[Neural Link] Consultation failed:', error.message);
            process.exit(1);
        }
    }
}

// CLI argument support
const targetArg = process.argv[2] || 'Genel sistem durumu hakkında ne düşünüyorsun?';
consultGemini(targetArg);
