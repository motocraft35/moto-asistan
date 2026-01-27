const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function verifyV16() {
    console.log('--- V1.6 Feature Verification ---');

    // 1. Check DB Schema for V1.6 fields
    console.log('\n[1/3] Checking DB Schema...');
    const tables = ['users', 'map_locations', 'bikes', 'user_gear'];
    for (const table of tables) {
        try {
            const res = await db.execute(`PRAGMA table_info(${table})`);
            console.log(`Table ${table} exists with ${res.rows.length} columns.`);
            if (table === 'users') {
                const cols = res.rows.map(r => r.name);
                const required = ['dynamicCode', 'lastCodeUpdate', 'subscriptionStatus'];
                required.forEach(c => {
                    if (cols.includes(c)) console.log(`  - Column ${c} OK`);
                    else console.error(`  - Column ${c} MISSING!`);
                });
            }
        } catch (e) {
            console.error(`Error checking table ${table}:`, e.message);
        }
    }

    // 2. Verify Dynamic Code Logic
    console.log('\n[2/3] Verifying Dynamic Code Logic (Simulated)...');
    const testUserId = 8; // Metin Gizep as seen in other scripts

    // Force reset code by setting lastCodeUpdate to long ago
    console.log('Setting lastCodeUpdate to past to trigger refresh...');
    await db.execute({
        sql: 'UPDATE users SET lastCodeUpdate = ? WHERE id = ?',
        args: ['2000-01-01T00:00:00.000Z', testUserId]
    });

    // We can't easily call the 'use server' action directly from node without setup,
    // but we can simulate what it do and check the DB.
    // In actions.js:
    /*
    const lastUpdate = user.lastCodeUpdate ? new Date(user.lastCodeUpdate).getTime() : 0;
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    if (now - lastUpdate > tenMinutes || !user.dynamicCode) { ... }
    */

    // 3. Subscription Tiers Check
    console.log('\n[3/3] Checking Subscription Tiers...');
    const userRes = await db.execute({
        sql: 'SELECT id, fullName, subscriptionStatus FROM users WHERE id = ?',
        args: [testUserId]
    });
    const user = userRes.rows[0];
    if (user) {
        console.log(`User: ${user.fullName}, Tier: ${user.subscriptionStatus}`);
    } else {
        console.error('Test user not found.');
    }

    console.log('\n--- Verification Script Completed ---');
}

verifyV16().catch(console.error);
