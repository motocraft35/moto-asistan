import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

export async function GET(request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');

  // Security Check: Only allow viewing own messages
  if (targetUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await db.execute({
      sql: `SELECT * FROM messages WHERE userId = ? ORDER BY timestamp ASC`,
      args: [userId]
    });

    return NextResponse.json({ messages: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { content, sender } = body;

    if (!content || !sender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertResult = await db.execute({
      sql: `INSERT INTO messages (userId, content, sender, isRead) VALUES (?, ?, ?, 0)`,
      args: [userId, content, sender]
    });

    // AUTO-REPLY LOGIC
    if (sender === 'user') {
      const userResult = await db.execute({
        sql: 'SELECT chatActive FROM users WHERE id = ?',
        args: [userId]
      });
      const user = userResult.rows[0];

      if (!user || user.chatActive === 0) {
        await db.execute({
          sql: `INSERT INTO messages (userId, content, sender, isRead) VALUES (?, ?, ?, 1)`,
          args: [userId, 'Merhaba! Size daha hızlı yardımcı olabilmem için lütfen aşağıdaki bilgileri yazar mısınız?\n\n- Marka/Model\n- Plaka\n- Arızanın türü\n\nUstam birazdan dönüş yapacaktır.', 'expert']
        });

        await db.execute({
          sql: 'UPDATE users SET chatActive = 1 WHERE id = ?',
          args: [userId]
        });
      }
    }

    return NextResponse.json({
      success: true,
      messageId: insertResult.lastInsertRowid ? insertResult.lastInsertRowid.toString() : Date.now()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
