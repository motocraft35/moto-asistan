import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Get all users
        const usersResult = await db.execute('SELECT * FROM users ORDER BY createdAt DESC');
        const users = usersResult.rows;

        // For each user, count unread messages from 'user'
        // Using Promise.all for parallel execution
        const usersWithUnread = await Promise.all(users.map(async (user) => {
            const countResult = await db.execute({
                sql: `SELECT COUNT(*) as count FROM messages WHERE userId = ? AND sender = 'user' AND isRead = 0`,
                args: [user.id]
            });
            const unreadCount = countResult.rows[0].count; // Access column directly or by index depending on driver, but usually property name works

            return {
                ...user,
                unreadCount
            };
        }));

        // Sort: Users with unread messages first
        usersWithUnread.sort((a, b) => b.unreadCount - a.unreadCount);

        return NextResponse.json({ users: usersWithUnread }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
