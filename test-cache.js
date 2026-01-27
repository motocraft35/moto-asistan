const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function testCache() {
    console.log("--- Testing Part Price Cache table ---");
    try {
        const info = await db.execute("PRAGMA table_info(part_price_cache)");
        if (info.rows.length > 0) {
            console.log("SUCCESS: part_price_cache table exists.");
            console.table(info.rows.map(r => ({ name: r.name, type: r.type })));
        } else {
            console.error("FAIL: part_price_cache table not found.");
        }

        const cacheKey = "test_brand_model_part";
        const dummyData = JSON.stringify({ partName: "Test Part", prices: { zero_original: { min: 100, max: 200 } } });
        const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour later

        console.log(`Inserting test record: ${cacheKey}`);
        await db.execute({
            sql: "INSERT OR REPLACE INTO part_price_cache (cacheKey, data, expiresAt) VALUES (?, ?, ?)",
            args: [cacheKey, dummyData, expiresAt]
        });

        const check = await db.execute({
            sql: "SELECT * FROM part_price_cache WHERE cacheKey = ?",
            args: [cacheKey]
        });

        if (check.rows.length > 0) {
            console.log("SUCCESS: Cache entry retrieved correctly.");
            console.log("Data:", check.rows[0].data);
        } else {
            console.error("FAIL: Could not retrieve cache entry.");
        }

        // Cleanup
        await db.execute({
            sql: "DELETE FROM part_price_cache WHERE cacheKey = ?",
            args: [cacheKey]
        });
        console.log("Cleanup: Test record deleted.");

    } catch (err) {
        console.error("ERROR during test:", err.message);
    }
}

testCache();
