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
        console.log('Checking "community_messages" table info...');
        const result = await db.execute('PRAGMA table_info(community_messages)');
        console.table(result.rows);

        const hasVideo = result.rows.some(r => r.name === 'videoUrl');
        console.log('Has "videoUrl" column:', hasVideo);

        if (!hasVideo) {
            console.log('Adding videoUrl column...');
            await db.execute('ALTER TABLE community_messages ADD COLUMN videoUrl TEXT');
            console.log('Done.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkSchema();
