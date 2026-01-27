import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST() {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        // Get the party ID before leaving
        const memberResult = await db.execute({
            sql: `SELECT partyId FROM party_members WHERE userId = ?`,
            args: [userId]
        });

        if (memberResult.rows.length === 0) {
            return Response.json({ success: true, message: 'Not in a party' });
        }

        const partyId = memberResult.rows[0].partyId;

        // Leave the party
        await db.execute({
            sql: `DELETE FROM party_members WHERE userId = ?`,
            args: [userId]
        });

        // Check if party is empty
        const remainingResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM party_members WHERE partyId = ?`,
            args: [partyId.toString()]
        });

        if (remainingResult.rows[0].count === 0) {
            // Delete the party if empty
            await db.execute({
                sql: `DELETE FROM parties WHERE id = ?`,
                args: [partyId.toString()]
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Leave Party Error:', error);
        return Response.json({ error: 'Failed to leave party' }, { status: 500 });
    }
}
