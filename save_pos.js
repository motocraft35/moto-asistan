const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        const res = await db.execute('SELECT latitude, longitude FROM users WHERE isMaster = 1 ORDER BY lastHeartbeat DESC LIMIT 1');
        fs.writeFileSync('master_pos.json', JSON.stringify(res.rows[0]));
        console.log('POS_SAVED');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
