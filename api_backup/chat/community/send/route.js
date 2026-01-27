import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from "@/lib/auth";

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        // 1. Check Cooldown (60 seconds)
        const lastMsgRes = await db.execute({
            sql: `SELECT timestamp FROM community_messages WHERE userId = ? ORDER BY timestamp DESC LIMIT 1`,
            args: [userId]
        });

        if (lastMsgRes.rows.length > 0) {
            const lastTime = new Date(lastMsgRes.rows[0].timestamp).getTime();
            const now = new Date().getTime();
            const diffSeconds = (now - lastTime) / 1000;

            if (diffSeconds < 60) {
                const remaining = Math.ceil(60 - diffSeconds);
                return NextResponse.json({
                    error: `Lütfen bekleyin. ${remaining} saniye sonra tekrar mesaj gönderebilirsiniz.`,
                    remaining
                }, { status: 429 });
            }
        }

        // 2. Insert Message
        await db.execute({
            sql: `INSERT INTO community_messages (userId, content) VALUES (?, ?)`,
            args: [userId, content.trim().substring(0, 500)]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Chat Send Error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
