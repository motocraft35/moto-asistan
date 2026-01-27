import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return new NextResponse(JSON.stringify({ error: 'Missing required field: conversationId' }), { status: 400 });
    }

    const result = await db.execute({
      sql: `SELECT * FROM private_messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY timestamp ASC`,
      args: [userId, conversationId, conversationId, userId]
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error reading chat messages:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
