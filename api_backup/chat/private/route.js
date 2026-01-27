import db from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const otherUserId = searchParams.get('otherUserId');

    if (!userId || !otherUserId) {
        return Response.json({ error: 'IDs required' }, { status: 400 });
    }

    try {
        const result = await db.execute({
            sql: `SELECT * FROM private_messages 
                  WHERE (senderId = ? AND receiverId = ?) 
                     OR (senderId = ? AND receiverId = ?) 
                  ORDER BY timestamp ASC`,
            args: [userId, otherUserId, otherUserId, userId]
        });

        return Response.json({ messages: result.rows });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
        return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    try {
        await db.execute({
            sql: `INSERT INTO private_messages (senderId, receiverId, content) VALUES (?, ?, ?)`,
            args: [senderId, receiverId, content]
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Send failed' }, { status: 500 });
    }
}
