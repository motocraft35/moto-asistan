
import db from './lib/db.js';

async function check() {
    try {
        const locations = await db.execute("SELECT count(*) as count FROM map_locations");
        const clans = await db.execute("SELECT count(*) as count FROM clans");
        const users = await db.execute("SELECT count(*) as count FROM users");
        const captureLogs = await db.execute("SELECT count(*) as count FROM capture_logs");

        console.log('--- Database Stats ---');
        console.log('Locations:', locations.rows[0].count);
        console.log('Clans:', clans.rows[0].count);
        console.log('Users:', users.rows[0].count);
        console.log('Capture Logs:', captureLogs.rows[0].count);

        const sampleLocs = await db.execute("SELECT name, logo_url, ownerClanId FROM map_locations LIMIT 5");
        console.log('\n--- Sample Locations ---');
        console.log(JSON.stringify(sampleLocs.rows, null, 2));

        const sampleClans = await db.execute("SELECT name, logoUrl FROM clans LIMIT 5");
        console.log('\n--- Sample Clans ---');
        console.log(JSON.stringify(sampleClans.rows, null, 2));

    } catch (e) {
        console.error('Error checking DB:', e);
    }
}

check();
