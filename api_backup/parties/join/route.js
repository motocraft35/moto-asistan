import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { inviteCode } = body;

        if (!inviteCode) return Response.json({ error: 'Invite code required' }, { status: 400 });

        // Find the party
        const partyResult = await db.execute({
            sql: `SELECT id FROM parties WHERE inviteCode = ?`,
            args: [inviteCode.toUpperCase()]
        });

        if (partyResult.rows.length === 0) {
            return Response.json({ error: 'Invalid invite code' }, { status: 404 });
        }

        const partyId = partyResult.rows[0].id;

        // Leave any existing party first
        await db.execute({
            sql: `DELETE FROM party_members WHERE userId = ?`,
            args: [userId]
        });

        // Join the new party
        await db.execute({
            sql: `INSERT INTO party_members (partyId, userId) VALUES (?, ?)`,
            args: [partyId.toString(), userId]
        });

        return Response.json({ success: true, partyId: partyId.toString() });
    } catch (error) {
        console.error('Join Party Error:', error);
        return Response.json({ error: 'Failed to join party' }, { status: 500 });
    }
}
