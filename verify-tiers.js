const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function verifyTiers() {
    const testUserId = 8; // Metin Gizep
    const tiers = ['Gold', 'Silver', 'Bronze', 'Passive'];

    for (const tier of tiers) {
        console.log(`Setting user ID ${testUserId} to ${tier}...`);
        await db.execute({
            sql: 'UPDATE users SET subscriptionStatus = ? WHERE id = ?',
            args: [tier, testUserId]
        });

        const res = await db.execute({
            sql: 'SELECT subscriptionStatus FROM users WHERE id = ?',
            args: [testUserId]
        });
        console.log(`Current DB Status for User ${testUserId}: ${res.rows[0].subscriptionStatus}`);
    }
}

verifyTiers().catch(console.error);
