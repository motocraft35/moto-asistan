import db from '@/lib/db';

export async function GET(request) {
    try {
        // 1. AUTO-RESET: Delete messages older than 1 hour
        await db.execute(`DELETE FROM community_messages WHERE timestamp < datetime('now', '-1 hour')`);

        // 2. Fetch messages with User Usage Data for Ranks
        const result = await db.execute(`
            SELECT 
                cm.id,
                cm.content,
                cm.videoUrl,
                cm.timestamp,
                u.id as userId,
                u.fullName,
                u.licensePlate,
                u.subscriptionStatus,
                u.totalUsageMinutes,
                u.profileImage
            FROM community_messages cm
            JOIN users u ON cm.userId = u.id
            ORDER BY cm.timestamp DESC
            LIMIT 50
        `);

        // 3. Process Ranks
        const messages = result.rows.map(msg => {
            let rank = 'Newbie';
            const mins = msg.totalUsageMinutes || 0;

            if (mins >= 30000) rank = 'Gold';      // 500 hours
            else if (mins >= 9000) rank = 'Silver'; // 150 hours
            else if (mins >= 3000) rank = 'Bronze'; // 50 hours

            return { ...msg, rank };
        }).reverse();

        return Response.json({ messages });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    const { userId, content, videoUrl } = body;

    if (!userId || !content) {
        return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    try {
        // COOLDOWN CHECK: Check last message time for this user
        const lastMsgResult = await db.execute({
            sql: `SELECT timestamp FROM community_messages WHERE userId = ? ORDER BY timestamp DESC LIMIT 1`,
            args: [userId]
        });

        if (lastMsgResult.rows.length > 0) {
            const lastTime = new Date(lastMsgResult.rows[0].timestamp).getTime();
            const now = Date.now();
            const diffSeconds = (now - lastTime) / 1000;

            if (diffSeconds < 60) {
                return Response.json({ error: `Lütfen bekleyin: ${Math.ceil(60 - diffSeconds)} sn` }, { status: 429 });
            }
        }

        // Insert Message
        await db.execute({
            sql: `INSERT INTO community_messages (userId, content, videoUrl) VALUES (?, ?, ?)`,
            args: [userId, content, videoUrl || null]
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Send failed' }, { status: 500 });
    }
}
