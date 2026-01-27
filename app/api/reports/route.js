import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(request) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, content, pageUrl } = await request.json();

        if (!type || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await db.execute({
            sql: 'INSERT INTO user_reports (userId, type, content, pageUrl) VALUES (?, ?, ?, ?)',
            args: [userId, type, content, pageUrl || '']
        });

        return NextResponse.json({ status: 'SUCCESS', message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Report submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const userResult = await db.execute({
            sql: 'SELECT isMaster FROM users WHERE id = ?',
            args: [userId]
        });

        if (!userResult.rows[0]?.isMaster) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const reportsResult = await db.execute(`
            SELECT r.*, u.fullName, u.licensePlate 
            FROM user_reports r
            JOIN users u ON r.userId = u.id
            ORDER BY r.timestamp DESC
        `);

        return NextResponse.json({ status: 'SUCCESS', reports: reportsResult.rows });
    } catch (error) {
        console.error('Report fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
