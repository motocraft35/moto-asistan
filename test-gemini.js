const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('FAIL: GEMINI_API_KEY is not set in the environment.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
    const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro-latest"];
    console.log(`Checking API Key (first 5 chars): ${apiKey.substring(0, 5)}...`);

    for (const modelName of models) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Short timeout/wait for response
            const response = await Promise.race([
                model.generateContent("Say 'API OK'"),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
            ]);

            const text = response.response.text();
            console.log(`SUCCESS [${modelName}]: ${text.trim()}`);
        } catch (err) {
            console.error(`FAIL [${modelName}]: ${err.message}`);
        }
    }
}

testModels();
