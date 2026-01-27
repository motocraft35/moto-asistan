const { GoogleGenerativeAI } = require('@google/generative-ai');

// Using the key found in deploy.ps1
const apiKey = "AIzaSyA8jCu32Ei9yHo-2vtH8AwDOsDexRUHCIE";

const genAI = new GoogleGenerativeAI(apiKey);

async function testKey() {
    console.log(`Testing API Key: ${apiKey.substring(0, 5)}...`);
    const models = ["gemini-1.5-flash-8b-latest", "gemini-1.5-flash-latest"];

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`SUCCESS [${modelName}]: ${result.response.text()}`);
        } catch (err) {
            console.error(`FAIL [${modelName}]: ${err.message}`);
        }
    }
}

testKey();
