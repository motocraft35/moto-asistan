import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await db.execute("SELECT value FROM settings WHERE key = 'notifications_enabled'");
        const setting = result.rows[0];
        // Default to true if not set
        const enabled = setting ? setting.value === 'true' : true;
        return NextResponse.json({ notificationsEnabled: enabled });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { enabled } = body;

        await db.execute({
            sql: `INSERT INTO settings (key, value) VALUES ('notifications_enabled', ?) 
                  ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
            args: [String(enabled)]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
