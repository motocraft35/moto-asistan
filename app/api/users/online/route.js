import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const result = await db.execute({
      sql: "SELECT value FROM settings WHERE key = 'manual_online_count' LIMIT 1"
    });

    const onlineCount = result.rows.length > 0 ? parseInt(result.rows[0].value, 10) : 0;

    return NextResponse.json({ count: onlineCount });
  } catch (error) {
    console.error('Error fetching online count:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
