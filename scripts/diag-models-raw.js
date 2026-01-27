import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function checkModels() {
    try {
        console.log('Fetching available models for key:', apiKey.substring(0, 10) + '...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error.message);
            return;
        }

        console.log('Available Models:');
        data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

checkModels();
