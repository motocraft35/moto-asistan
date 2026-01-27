import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from "@/auth";

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const { messageId, otherUserId, deleteAll } = await request.json();

        if (deleteAll && otherUserId) {
            // Delete all messages between these two users
            await db.execute({
                sql: `DELETE FROM private_messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)`,
                args: [userId, otherUserId, otherUserId, userId]
            });
            return NextResponse.json({ success: true });
        } else if (messageId) {
            // Delete a specific message where user is sender or receiver
            await db.execute({
                sql: `DELETE FROM private_messages WHERE id = ? AND (senderId = ? OR receiverId = ?)`,
                args: [messageId, userId, userId]
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    } catch (error) {
        console.error('PM Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
    }
}
