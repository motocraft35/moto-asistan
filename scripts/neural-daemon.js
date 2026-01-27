import { GoogleGenerativeAI } from '@google/generative-ai';
import db from '../lib/db.js';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let model = null;

if (!apiKey) {
    console.warn('--- WARNING: GEMINI_API_KEY is missing. ---');
    console.warn('--- RUNNING IN NEURAL MOCK MODE ---');
} else {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                maxOutputTokens: 256,
                temperature: 0.7,
            }
        });
        console.log('--- NEURAL LINK ESTABLISHED (Gemini Flash Latest) ---');
    } catch (err) {
        console.error('AI Initialization Error:', err.message);
    }
}

console.log('--- NEURAL DAEMON ACTIVATED ---');
console.log(`Mode: ${model ? 'Autonomous (Gemini)' : 'Mock (Simulation)'}`);

async function processRequests() {
    try {
        const res = await db.execute({
            sql: "SELECT * FROM developer_requests WHERE status = 'pending' ORDER BY timestamp ASC",
            args: []
        });

        for (const row of res.rows) {
            console.log(`\n[MASTER SIGNAL] incoming: "${row.content}"`);

            // 1. Mark as processing
            await db.execute({
                sql: "UPDATE developer_requests SET status = 'processing' WHERE id = ?",
                args: [row.id]
            });

            let responseText = '';

            if (model) {
                // 2. Generate AI Response
                const prompt = `Sen Moto-Asistan projesinin 'Ghost' kod adlı yapay zeka çekirdeğisin. 
                Kullanıcın (Master) sana Master Console üzerinden bir emir veya soru gönderdi. 
                Kısa, öz, cyberpunk temalı ve otoriter ama sadık bir dille cevap ver. 
                Matematiksel işlemleri kesinlikle doğru yap.
                
                Master Mesajı: "${row.content}"`;

                try {
                    const result = await model.generateContent(prompt);
                    responseText = result.response.text().trim();
                } catch (aiErr) {
                    console.error('AI Generation Error:', aiErr.message);
                    responseText = "[ERROR: Neural link unstable. Returning to standby.]";
                }
            } else {
                // Mock Response
                responseText = `[MOCK] Bilgi: AI anahtarı yüklü değil, ancak sinyal alındı. Komut: "${row.content}". Sistem normal çalışıyor.`;
            }

            // 3. Post AI Response back to DB
            await db.execute({
                sql: "INSERT INTO developer_requests (content, userId, status) VALUES (?, ?, ?)",
                args: [responseText, 1, 'ai_response']
            });

            // 4. Mark original as processed
            await db.execute({
                sql: "UPDATE developer_requests SET status = 'processed' WHERE id = ?",
                args: [row.id]
            });

            console.log(`[DAEMON REPLY] dispatched: "${responseText.substring(0, 50)}..."`);
        }
    } catch (err) {
        console.error('Daemon Loop Error:', err.message);
    }
}

// Start polling
setInterval(processRequests, 3000);
processRequests();
