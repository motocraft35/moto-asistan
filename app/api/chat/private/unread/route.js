import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from "@/lib/auth";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ unreadCount: 0 });
        }

        const result = await db.execute({
            sql: `SELECT COUNT(*) as count FROM private_messages WHERE receiverId = ? AND isRead = 0 AND timestamp > datetime('now', '-1 day')`,
            args: [userId]
        });

        return NextResponse.json({ unreadCount: result.rows[0]?.count || 0 });
    } catch (error) {
        console.error('Unread PM Count Error:', error);
        return NextResponse.json({ unreadCount: 0 });
    }
}
