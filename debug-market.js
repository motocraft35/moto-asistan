import db from './lib/db.js';

async function debugMarket() {
    console.log('--- Starting Market Debug ---');

    try {
        // 1. Check if table exists
        console.log('1. Checking market_listings table...');
        const tableCheck = await db.execute(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='market_listings'
        `);

        if (tableCheck.rows.length === 0) {
            console.error('❌ CHECK FAILED: market_listings table does not exist!');
        } else {
            console.log('✅ market_listings table exists.');
        }

        // 2. Try to insert a test record
        console.log('2. Inserting test record...');
        const insertRes = await db.execute({
            sql: `INSERT INTO market_listings (brand, model, price, kilometers, reported_by) VALUES (?, ?, ?, ?, ?)`,
            args: ['TEST_BRAND', 'TEST_MODEL', 12345, 1000, 1] // Assuming user ID 1 exists
        });
        console.log('✅ Insert successful. Row ID:', insertRes.lastInsertRowid);

        // 3. Try to fetch stats
        console.log('3. Fetching stats for TEST_BRAND...');
        const statsRes = await db.execute({
            sql: `SELECT AVG(price) as avg_price FROM market_listings WHERE brand = ?`,
            args: ['TEST_BRAND']
        });
        console.log('✅ Stats fetch successful. Avg Price:', statsRes.rows[0].avg_price);

        // 4. Cleanup
        console.log('4. Cleaning up test record...');
        await db.execute(`DELETE FROM market_listings WHERE brand = 'TEST_BRAND'`);
        console.log('✅ Cleanup successful.');

    } catch (error) {
        console.error('❌ DEBUG ERROR:', error);
    }

    console.log('--- End Market Debug ---');
}

debugMarket();
