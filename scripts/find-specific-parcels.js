const { createClient } = require('@libsql/client');

async function findParcels(dbFile) {
    console.log(`Checking ${dbFile}...`);
    const db = createClient({
        url: `file:${dbFile}`,
    });

    try {
        const result = await db.execute("SELECT id, name, type, latitude, longitude FROM map_locations WHERE name LIKE '%0193' OR name LIKE '%0194'");
        console.log(`Results for ${dbFile}:`, JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.log(`Error checking ${dbFile}: ${e.message}`);
    }
}

async function run() {
    await findParcels('moto-asistan.db');
    await findParcels('moto.db');
}

run().catch(console.error);
