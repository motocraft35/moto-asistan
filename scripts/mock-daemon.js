const db = require('../lib/db.js').default;
const dotenv = require('dotenv');
dotenv.config();

console.log('--- NEURAL MOCK DAEMON ACTIVATED ---');
console.log('Mode: Pattern Matching (Math + Logic)');

function simpleReasoning(content) {
    const text = content.toLowerCase();

    // 4 İşlem (Math) logic
    try {
        if (/[\d\+\-\*\/\ ]+/.test(text)) {
            // Very dangerous but for a localized test it works
            // Replacing Turkish characters if any (already handled by regex)
            const result = eval(text.replace(/[^\d\+\-\*\/\. ]/g, ''));
            if (!isNaN(result)) return `Sonuç: ${result} Master. Matematiksel kesinlik sağlandı.`;
        }
    } catch (e) { }

    // 4 Soru (Questions) logic
    if (text.includes('mavidir')) return "Gökkyüzü, Rayleigh saçılması nedeniyle mavidir Master. Atmosferdeki gazlar mavi ışığı diğer renklerden daha fazla dağıtır.";
    if (text.includes('saat')) return `Şu anki zaman: ${new Date().toLocaleTimeString('tr-TR')} Master. Zaman akışı stabil.`;
    if (text.includes('kimsin')) return "Ben Ghost. Senin için Moto-Asistan sistemini koordine eden yapay zeka çekirdeğiyim.";
    if (text.includes('nedir')) return "Moto-Asistan, motosikletçiler için geliştirilmiş, klan sisteminden canlı haritaya kadar her şeyi barındıran üst düzey bir ekosistemdir.";

    return "Mesajını aldım Master. Neural Link üzerinden analiz devam ediyor.";
}

async function processRequests() {
    try {
        const res = await db.execute({
            sql: "SELECT * FROM developer_requests WHERE status = 'pending' ORDER BY timestamp ASC",
            args: []
        });

        for (const row of res.rows) {
            console.log(`\n[MASTER SIGNAL] incoming: "${row.content}"`);

            await db.execute({
                sql: "UPDATE developer_requests SET status = 'processing' WHERE id = ?",
                args: [row.id]
            });

            const responseText = simpleReasoning(row.content);

            await db.execute({
                sql: "INSERT INTO developer_requests (content, userId, status) VALUES (?, ?, ?)",
                args: [responseText, 1, 'ai_response']
            });

            await db.execute({
                sql: "UPDATE developer_requests SET status = 'processed' WHERE id = ?",
                args: [row.id]
            });

            console.log(`[MOCK REPLY] dispatched: "${responseText}"`);
        }
    } catch (err) {
        console.error('Daemon Loop Error:', err.message);
    }
}

setInterval(processRequests, 2000);
processRequests();
