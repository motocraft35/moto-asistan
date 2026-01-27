import db from '../lib/db.js';

async function verify() {
    try {
        console.log('--- DB VERIFICATION ---');

        // 1. Check developer_requests table
        try {
            const tableInfo = await db.execute('PRAGMA table_info(developer_requests)');
            console.log('developer_requests columns:');
            console.table(tableInfo.rows.map(r => ({ name: r.name, type: r.type })));
        } catch (e) {
            console.log('developer_requests table might be missing. Creating it...');
            await db.execute(`
                CREATE TABLE IF NOT EXISTS developer_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    userId INTEGER,
                    status TEXT DEFAULT 'pending',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Table created!');
        }

        // 2. Ensure User 1 exists and isMaster = 1
        const userRes = await db.execute({
            sql: 'SELECT id, isMaster FROM users WHERE id = 1',
            args: []
        });

        if (userRes.rows.length === 0) {
            console.log('User 1 not found. Creating default Master user...');
            await db.execute({
                sql: "INSERT INTO users (id, name, phoneNumber, isMaster) VALUES (1, 'Master Admin', '5555555555', 1)",
                args: []
            });
            console.log('Master user created (ID: 1)');
        } else if (userRes.rows[0].isMaster !== 1) {
            console.log('User 1 is not Master. Updating...');
            await db.execute({
                sql: 'UPDATE users SET isMaster = 1 WHERE id = 1',
                args: []
            });
            console.log('User 1 promoted to Master.');
        } else {
            console.log('User 1 is already Master.');
        }

        console.log('--- VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('Verify Script Error:', err);
    }
}

verify();
