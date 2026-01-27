const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        const res = await db.execute({
            sql: 'INSERT INTO map_locations (name, type, latitude, longitude, address, description, is_partner) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: ['TK Motors', 'mechanic', 39.0699283, 26.8881817, 'Master HQ, Dikili', 'TK Motors Official Headquarters. Flag Race Target.', 1]
        });
        console.log('LOCATION_ADDED');
        console.log('ID:', res.lastInsertRowid.toString());
    } catch (e) {
        console.error('DB_ERROR', e);
    } finally {
        process.exit(0);
    }
}
run();
