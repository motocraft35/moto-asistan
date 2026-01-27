import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request) {
    try {
        const userId = await getUserId(request);
        console.log('[MASTER BRIDGE] GET request from userId:', userId);
        if (!userId) {
            console.warn('[MASTER BRIDGE] GET: No userId found');
            return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        }

        // Check if user is Master
        const userRes = await db.execute({
            sql: 'SELECT isMaster FROM users WHERE id = ?',
            args: [userId]
        });

        const isDev = process.env.NODE_ENV === 'development';
        if (!userRes.rows[0]?.isMaster && !isDev) {
            console.warn('[MASTER BRIDGE] GET: Access denied (isMaster=0) for userId:', userId);
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        console.log(`[MASTER BRIDGE] GET: Access granted for ${isDev ? 'Dev Mode/Master' : 'Master'} userId:`, userId);

        // Fetch all recent system activity logs
        const requests = await db.execute({
            sql: 'SELECT * FROM developer_requests ORDER BY timestamp DESC LIMIT 100',
            args: []
        });

        // Map to bridge format for the UI
        const logs = requests.rows.map(req => ({
            type: req.status === 'ai_response' ? 'AI' : 'USER',
            content: req.content,
            timestamp: req.timestamp
        })).reverse();

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('[MASTER BRIDGE] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getUserId(request);
        console.log('[MASTER BRIDGE] POST request from userId:', userId);
        if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { content } = await request.json();
        console.log('[MASTER BRIDGE] POST content:', content);

        const res = await db.execute({
            sql: 'INSERT INTO developer_requests (content, userId, status) VALUES (?, ?, ?)',
            args: [content, userId, 'pending']
        });
        console.log('[MASTER BRIDGE] POST: Insert success, rowid:', res.lastInsertRowid);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[MASTER BRIDGE] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
