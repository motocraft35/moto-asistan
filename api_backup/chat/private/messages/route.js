import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from "@/lib/auth";

export async function GET(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUserId = userId;
        const { searchParams } = new URL(request.url);
        const otherUserId = searchParams.get('otherUserId');

        if (!otherUserId) {
            return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 });
        }

        // Mark messages as read if the current user is the receiver
        await db.execute({
            sql: `UPDATE private_messages SET isRead = 1 WHERE receiverId = ? AND senderId = ? AND isRead = 0`,
            args: [currentUserId, otherUserId]
        });

        // Fetch messages between these two users from the last 24 hours
        const query = `
            SELECT id, senderId, receiverId, content, imageUrl, timestamp, isRead 
            FROM private_messages 
            WHERE (
                (senderId = ? AND receiverId = ?) OR 
                (senderId = ? AND receiverId = ?)
            )
            AND timestamp > datetime('now', '-1 day')
            ORDER BY timestamp ASC
        `;

        const result = await db.execute({
            sql: query,
            args: [currentUserId, otherUserId, otherUserId, currentUserId]
        });

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('PM Messages Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
