import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        await db.execute({
            sql: 'UPDATE users SET chatActive = 0 WHERE id = ?',
            args: [userId]
        });

        // Optional: Send a system message that chat is ended
        await db.execute({
            sql: `INSERT INTO messages (userId, content, sender, isRead) VALUES (?, ?, ?, 1)`,
            args: [userId, 'Sohbet usta tarafından sonlandırıldı. Yeni bir mesaj gönderdiğinizde süreç tekrar başlayacaktır.', 'expert']
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
