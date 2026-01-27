import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from "@/lib/auth";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUserId = userId;

        // 1. CLEANUP: Delete messages older than 24 hours
        // SQLite uses CURRENT_TIMESTAMP, let's use datetime('now', '-1 day')
        await db.execute({
            sql: `DELETE FROM private_messages WHERE timestamp < datetime('now', '-1 day')`,
            args: []
        });

        // 2. FETCH: Get list of unique conversations (latest message from each) with unread counts
        const query = `
            SELECT 
                u.id as otherUserId,
                u.fullName as otherUserName,
                u.profileImage as otherUserImage,
                pm.content as lastMessage,
                pm.timestamp as lastTimestamp,
                pm.id as lastMsgId,
                (SELECT COUNT(*) FROM private_messages WHERE receiverId = ? AND senderId = u.id AND isRead = 0) as unreadCount
            FROM private_messages pm
            JOIN users u ON u.id = (CASE WHEN pm.senderId = ? THEN pm.receiverId ELSE pm.senderId END)
            WHERE (pm.senderId = ? OR pm.receiverId = ?)
            AND pm.id IN (
                SELECT MAX(id) 
                FROM private_messages 
                WHERE senderId = ? OR receiverId = ?
                GROUP BY (CASE WHEN senderId = ? THEN receiverId ELSE senderId END)
            )
            ORDER BY pm.id DESC
        `;

        const result = await db.execute({
            sql: query,
            args: [userId, userId, userId, userId, userId, userId, userId]
        });

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('PM List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch conversation list' }, { status: 500 });
    }
}
