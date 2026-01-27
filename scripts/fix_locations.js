const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        console.log('--- Applying Precise Coordinate Correction ---');
        await db.execute('DELETE FROM map_locations');

        const locs = [
            { name: 'Enla Costa', type: 'cafe', lat: 39.0792805, lng: 26.8870543, desc: 'EN La Costa Restaurant & Bar. Vice City sahil esintisi, elit mekan.' },
            { name: 'Lunas', type: 'cafe', lat: 39.0798206, lng: 26.8869408, desc: 'Lunas Coffee & Bakery. Neon ışıklar altında taze lezzetler.' },
            { name: 'Taphouse', type: 'meetup', lat: 39.0575306, lng: 26.887258, desc: 'Tap House Dikili. Motorcuların buluşma noktası, soğuk içecekler.' }
        ];

        for (const l of locs) {
            await db.execute({
                sql: 'INSERT INTO map_locations (name, type, latitude, longitude, description) VALUES (?, ?, ?, ?, ?)',
                args: [l.name, l.type, l.lat, l.lng, l.desc]
            });
            console.log(`Updated Precise: ${l.name}`);
        }

        console.log('--- Correction Applied ---');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

run();
