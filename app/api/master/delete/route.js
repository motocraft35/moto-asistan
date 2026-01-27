import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        // Check if user is Master
        const userRes = await db.execute({
            sql: 'SELECT isMaster FROM users WHERE id = ?',
            args: [userId]
        });

        const isDev = process.env.NODE_ENV === 'development';
        if (!userRes.rows[0]?.isMaster && !isDev) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Clear logs
        await db.execute({
            sql: 'DELETE FROM developer_requests',
            args: []
        });

        console.log('[MASTER DELETE] Logs cleared by userId:', userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[MASTER DELETE] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
