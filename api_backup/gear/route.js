
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let finalUserId = userId;
    if (userId === 'me') {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('auth_session');
        if (sessionCookie) {
            try {
                const session = JSON.parse(decodeURIComponent(sessionCookie.value));
                const res = await db.execute({
                    sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                    args: [session.phone, session.token]
                });
                if (res.rows.length > 0) finalUserId = res.rows[0].id;
            } catch (e) { }
        }
    }

    try {
        const result = await db.execute({
            sql: 'SELECT * FROM user_gear WHERE userId = ? ORDER BY createdAt DESC',
            args: [finalUserId]
        });
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch gear:', error);
        return NextResponse.json({ error: 'Failed to fetch gear' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, type, brand, model, imageUrl } = body;

        if (!userId || !type || !brand || !model) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await db.execute({
            sql: `INSERT INTO user_gear (userId, type, brand, model, imageUrl) 
                  VALUES (?, ?, ?, ?, ?) RETURNING *`,
            args: [userId, type, brand, model, imageUrl || null]
        });

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to add gear:', error);
        return NextResponse.json({ error: 'Failed to add gear' }, { status: 500 });
    }
}
