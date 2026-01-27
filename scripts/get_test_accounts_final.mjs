import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = (url && authToken) ? createClient({
    url,
    authToken
}) : null;

async function run() {
    if (!db) {
        console.error('No DB connection info');
        process.exit(1);
    }
    try {
        const r = await db.execute("SELECT id, fullName, phoneNumber, password FROM users WHERE fullName LIKE '%Test%' OR fullName LIKE '%Browser%' OR fullName LIKE '%Bot%'");
        fs.writeFileSync('test_accounts_final.json', JSON.stringify(r.rows, null, 2));
        console.log('Success');
    } catch (e) {
        console.error('Query failed:', e);
    } finally {
        process.exit(0);
    }
}

run();
