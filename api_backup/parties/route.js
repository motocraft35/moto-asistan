import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        // Get the party the user is currently in
        const result = await db.execute({
            sql: `SELECT p.*, u.fullName as leaderName 
                  FROM parties p
                  JOIN party_members pm ON p.id = pm.partyId
                  JOIN users u ON p.leaderId = u.id
                  WHERE pm.userId = ?`,
            args: [userId]
        });

        if (result.rows.length === 0) {
            return Response.json({ party: null });
        }

        const party = result.rows[0];

        // Also get all members
        const membersResult = await db.execute({
            sql: `SELECT u.id, u.fullName, u.licensePlate, u.profileImage, u.latitude, u.longitude, u.lastHeartbeat
                  FROM users u
                  JOIN party_members pm ON u.id = pm.userId
                  WHERE pm.partyId = ?`,
            args: [party.id]
        });

        return Response.json({
            party: {
                ...party,
                members: membersResult.rows
            }
        });
    } catch (error) {
        console.error('Party GET Error:', error);
        return Response.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name } = body;

        if (!name) return Response.json({ error: 'Party name required' }, { status: 400 });

        // Generate a random 6-character invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const result = await db.execute({
            sql: `INSERT INTO parties (name, leaderId, inviteCode) VALUES (?, ?, ?)`,
            args: [name, userId, inviteCode]
        });

        const partyId = result.lastInsertRowid;

        // Add creator as the first member
        await db.execute({
            sql: `INSERT INTO party_members (partyId, userId) VALUES (?, ?)`,
            args: [partyId.toString(), userId]
        });

        return Response.json({
            success: true,
            partyId: partyId.toString(),
            inviteCode: inviteCode
        });
    } catch (error) {
        console.error('Party POST Error:', error);
        return Response.json({ error: 'Failed to create party' }, { status: 500 });
    }
}
