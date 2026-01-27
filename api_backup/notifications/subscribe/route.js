import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { userId, subscription, userAgent } = await request.json();

        if (!userId || !subscription) {
            return NextResponse.json({ success: false, message: 'Missing data' }, { status: 400 });
        }

        const subscriptionStr = JSON.stringify(subscription);

        // Check if exists
        const existing = await db.execute({
            sql: 'SELECT * FROM notification_subscriptions WHERE userId = ? AND subscription = ?',
            args: [userId, subscriptionStr]
        });

        if (existing.rows.length === 0) {
            await db.execute({
                sql: 'INSERT INTO notification_subscriptions (userId, subscription, userAgent) VALUES (?, ?, ?)',
                args: [userId, subscriptionStr, userAgent || 'Unknown']
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
