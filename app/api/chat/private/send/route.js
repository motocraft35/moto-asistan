import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from "@/lib/auth";

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const senderId = userId;
        const { receiverId, content, imageUrl } = await request.json();

        if (!receiverId || (!content && !imageUrl)) {
            return NextResponse.json({ error: 'Receiver and content/image are required' }, { status: 400 });
        }

        await db.execute({
            sql: `INSERT INTO private_messages (senderId, receiverId, content, imageUrl) VALUES (?, ?, ?, ?)`,
            args: [
                senderId,
                receiverId,
                (content || '').trim().substring(0, 500),
                imageUrl || null
            ]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PM Send Error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
