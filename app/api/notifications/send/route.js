import db from '@/lib/db';
import { NextResponse } from 'next/server';
import webPush from 'web-push';

// Configuration (Normally in .env, but hardcoded for this environment as requested)
const publicVapidKey = 'BFANdFfLMx1GYoPzS_gEwMrjDxRvQsC2d3fw_RPUr5U4qowBQAO49fIYEWKsi87mvmLEKAfPejr1OVCFqiNYJtQ';
const privateVapidKey = 'UacZBLw_oS4t___i8H_vCOp3XKNQJnpyHmSp95SDhNQ';

webPush.setVapidDetails(
    'mailto:admin@motoasistan.com',
    publicVapidKey,
    privateVapidKey
);

export async function POST(request) {
    try {
        const { title, message, url, targetUserId } = await request.json();

        let query = 'SELECT * FROM notification_subscriptions';
        let args = [];

        if (targetUserId) {
            query += ' WHERE userId = ?';
            args = [targetUserId];
        }

        const result = await db.execute({ sql: query, args });
        const subscriptions = result.rows;

        const payload = JSON.stringify({
            title: title || 'Moto-Asistan',
            body: message || 'Yeni bir bildiriminiz var.',
            url: url || '/dashboard',
            icon: '/icon-192.png'
        });

        const promises = subscriptions.map(sub => {
            const subscription = JSON.parse(sub.subscription);
            return webPush.sendNotification(subscription, payload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription expired/invalid
                        db.execute({
                            sql: 'DELETE FROM notification_subscriptions WHERE id = ?',
                            args: [sub.id]
                        });
                    }
                    console.error('Push Error:', err);
                });
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true, count: subscriptions.length });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
