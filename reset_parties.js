
import { createClient } from '@libsql/client';

const url = 'libsql://app-this1team.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjczNjQ0MzksImlkIjoiMmE3OTM0OWMtZTQ1Zi00ZjdiLTkxNTYtZjBjZGU5NDZjOTg3IiwicmlkIjoiMWZmODc0MjktMjVmOC00ZmQyLTk3MzctNjFkMjA5YzM3MDlhIn0.NslMICq8U0mRvw8cl8NRlRg_EJanJiZa8d8AxTAFgqvRtLjt4qCob93-i5nUOna0NS1Pr9cs8t2p8kX57LmpAA';

const db = createClient({ url, authToken });

async function resetParties() {
    try {
        console.log("🔥 NUKING ALL PARTIES...");
        await db.execute("DELETE FROM party_members");
        await db.execute("DELETE FROM parties");
        console.log("✅ ALL PARTIES CLEARED.");
    } catch (e) {
        console.error(e);
    }
}

resetParties();
