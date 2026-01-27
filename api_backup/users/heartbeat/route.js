import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ userId: null });
        return Response.json({ userId });
    } catch (error) {
        return Response.json({ userId: null });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, latitude, longitude } = body;

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Increment total usage minutes and update heartbeat timestamp + location
        await db.execute({
            sql: `UPDATE users SET 
                    totalUsageMinutes = COALESCE(totalUsageMinutes, 0) + 1,
                    lastHeartbeat = CURRENT_TIMESTAMP,
                    latitude = COALESCE(?, latitude),
                    longitude = COALESCE(?, longitude)
                  WHERE id = ?`,
            args: [latitude, longitude, userId]
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Heartbeat Error:', error);
        return Response.json({ error: 'Failed' }, { status: 500 });
    }
}
