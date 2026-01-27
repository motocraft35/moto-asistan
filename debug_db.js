
import { createClient } from '@libsql/client';

const url = 'libsql://app-this1team.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjczNjQ0MzksImlkIjoiMmE3OTM0OWMtZTQ1Zi00ZjdiLTkxNTYtZjBjZGU5NDZjOTg3IiwicmlkIjoiMWZmODc0MjktMjVmOC00ZmQyLTk3MzctNjFkMjA5YzM3MDlhIn0.NslMICq8U0mRvw8cl8NRlRg_EJanJiZa8d8AxTAFgqvRtLjt4qCob93-i5nUOna0NS1Pr9cs8t2p8kX57LmpAA';

const db = createClient({ url, authToken });

async function checkDB() {
    try {
        console.log("--- PARTIES ---");
        const parties = await db.execute("SELECT * FROM parties");
        console.table(parties.rows);

        console.log("\n--- PARTY MEMBERS ---");
        const members = await db.execute("SELECT * FROM party_members");
        console.table(members.rows);

        console.log("\n--- USERS (Limit 5) ---");
        const users = await db.execute("SELECT id, fullName FROM users LIMIT 5");
        console.table(users.rows);

    } catch (e) {
        console.error(e);
    }
}

checkDB();
