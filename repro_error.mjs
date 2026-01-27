import db from './lib/db.js';

async function testInsert() {
    try {
        const userId = 1;
        const type = 'bug';
        const content = 'Test content';
        const pageUrl = 'http://localhost:3000/test';

        console.log('Attempting insert with 4 columns and 3 placeholders...');
        await db.execute({
            sql: 'INSERT INTO user_reports (userId, type, content, pageUrl) VALUES (?, ?, ?)',
            args: [userId, type, content, pageUrl || '']
        });
        console.log('Success (Unexpected)');
    } catch (error) {
        console.error('Caught Expected Error:', error.message);
    } finally {
        process.exit(0);
    }
}

testInsert();
