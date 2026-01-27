import { initDb } from './lib/db.js';

async function runInit() {
    console.log("Starting database initialization...");
    await initDb();
    console.log("Database initialization finished.");
    process.exit(0);
}

runInit();
