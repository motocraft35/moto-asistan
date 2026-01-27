import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request) {
    try {
        // Fetch all active SOS signals
        const result = await db.execute(`
            SELECT s.*, u.fullName, u.licensePlate
            FROM sos_signals s
            JOIN users u ON s.userId = u.id
            WHERE s.status = 'active'
            AND s.createdAt > datetime('now', '-15 minutes')
            ORDER BY s.createdAt DESC
        `);

        return Response.json({ signals: result.rows });
    } catch (error) {
        console.error('SOS GET Error:', error);
        return Response.json({ error: 'Failed to fetch signals' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { latitude, longitude, message, type } = body;

        if (!latitude || !longitude) {
            return Response.json({ error: 'Location required' }, { status: 400 });
        }

        // Close any existing active SOS for this user first
        await db.execute({
            sql: "UPDATE sos_signals SET status = 'resolved', resolvedAt = CURRENT_TIMESTAMP WHERE userId = ? AND status = 'active'",
            args: [userId]
        });

        const result = await db.execute({
            sql: `INSERT INTO sos_signals (userId, latitude, longitude, message, type)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [userId, latitude, longitude, message || '', type || 'mechanical']
        });

        return Response.json({
            success: true,
            id: result.lastInsertRowid.toString()
        });

    } catch (error) {
        console.error('SOS POST Error:', error);
        return Response.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const userId = await getUserId();
        const body = await request.json();
        const { signalId } = body;

        if (!userId || !signalId) {
            return Response.json({ error: 'Missing data' }, { status: 400 });
        }

        // Only the owner can resolve their SOS
        await db.execute({
            sql: "UPDATE sos_signals SET status = 'resolved', resolvedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?",
            args: [signalId, userId]
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('SOS PUT Error:', error);
        return Response.json({ error: 'Failed' }, { status: 500 });
    }
}
