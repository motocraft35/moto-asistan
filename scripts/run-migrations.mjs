import { initDb } from '../lib/db.js';

async function run() {
    await initDb();
    console.log("Migrations triggered.");
}

run().then(() => process.exit(0));
