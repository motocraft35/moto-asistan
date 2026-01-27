import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await db.execute('SELECT * FROM developer_requests ORDER BY timestamp DESC');
        return NextResponse.json({ requests: result.rows });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { content } = await req.json();
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

        await db.execute({
            sql: 'INSERT INTO developer_requests (content) VALUES (?)',
            args: [content]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { id, status } = await req.json();
        await db.execute({
            sql: 'UPDATE developer_requests SET status = ? WHERE id = ?',
            args: [status, id]
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
