const db = require('../lib/db.js').default;

const benchmarks = [
    // 4 Math Operations
    "152 + 348",
    "1000 - 457",
    "12 * 12",
    "144 / 12",
    // 4 Normal Questions
    "Gökkyüzü neden mavidir?",
    "Şu anki saati söyle.",
    "Sen kimsin?",
    "Moto-Asistan nedir?"
];

async function runBenchmark() {
    console.log('--- STARTING 4+4 BENCHMARK ---');
    for (const msg of benchmarks) {
        console.log(`Sending: ${msg}`);
        await db.execute({
            sql: "INSERT INTO developer_requests (content, userId, status) VALUES (?, ?, ?)",
            args: [msg, 3, 'pending']
        });
        // Brief pause to allow daemon to pick up (though it's async)
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log('All signals sent. Waiting for daemon to process...');
}

runBenchmark();
