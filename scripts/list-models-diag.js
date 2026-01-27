import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
    try {
        const result = await genAI.listModels();
        console.log('Available Models:');
        result.models.forEach(m => console.log(`- ${m.name}`));
    } catch (e) {
        console.error('List Error:', e.message);
    }
}

list();
