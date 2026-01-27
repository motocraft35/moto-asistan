const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('URL:', url);
// Hide token for security in logs, just check existence
console.log('Token exists:', !!authToken);

const db = createClient({
    url,
    authToken
});

async function listUsers() {
    try {
        console.log('Querying users...');
        const result = await db.execute('SELECT id, fullName, licensePlate FROM users');
        console.log('Users in DB:');
        console.table(result.rows);
    } catch (e) {
        console.error('Error:', e);
    }
}

listUsers();
