const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url,
    authToken
});

async function inspectUsers() {
    try {
        console.log('Inspecting last 5 users...');
        const result = await db.execute('SELECT id, fullName, phoneNumber, sessionToken, subscriptionStatus FROM users ORDER BY id DESC LIMIT 5');
        console.table(result.rows);
    } catch (e) {
        console.error('Error:', e);
    }
}

inspectUsers();
