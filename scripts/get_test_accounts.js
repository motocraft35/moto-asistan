const db = require('./lib/db').default;
const fs = require('fs');

async function run() {
    try {
        const r = await db.execute("SELECT id, fullName, phoneNumber, password FROM users WHERE fullName LIKE '%Test%' OR fullName LIKE '%Browser%' OR fullName LIKE '%Bot%'");
        fs.writeFileSync('test_accounts.json', JSON.stringify(r.rows, null, 2));
        console.log('Query successful, results in test_accounts.json');
    } catch (e) {
        console.error('Query failed:', e);
    } finally {
        process.exit(0);
    }
}

run();
