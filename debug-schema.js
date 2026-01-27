const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url,
    authToken
});

async function checkSchema() {
    try {
        console.log('Checking "users" table info...');
        // SQLite PRAGMA to get table info
        const result = await db.execute('PRAGMA table_info(users)');
        console.table(result.rows);

        const hasBio = result.rows.some(r => r.name === 'bio');
        console.log('Has "bio" column:', hasBio);

        if (!hasBio) {
            console.log('Attempting to add bio column manually...');
            try {
                await db.execute('ALTER TABLE users ADD COLUMN bio TEXT');
                console.log('Bio column added successfully!');
            } catch (e) {
                console.error('Failed to add bio column:', e);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkSchema();
