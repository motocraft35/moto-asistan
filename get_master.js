const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        const res = await db.execute('SELECT id, fullName, latitude, longitude FROM users WHERE isMaster = 1 ORDER BY lastHeartbeat DESC LIMIT 1');
        if (res.rows.length > 0) {
            console.log('MASTER_FOUND');
            console.log(JSON.stringify(res.rows[0]));
        } else {
            console.log('MASTER_NOT_FOUND');
        }
    } catch (e) {
        console.error('DB_ERROR', e);
    } finally {
        process.exit(0);
    }
}
run();
