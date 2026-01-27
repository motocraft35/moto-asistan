import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        const { distanceKm } = await req.json(); // distance in KM (incremental)
        if (typeof distanceKm !== 'number' || distanceKm <= 0) {
            return NextResponse.json({ error: 'Invalid distance' }, { status: 400 });
        }

        const cookieStore = await cookies();
        let currentUserId = null;

        // Session handling (matching other routes)
        const sessionCookie = cookieStore.get('auth_session');
        let finalPhone, finalToken;
        if (sessionCookie) {
            try {
                const session = JSON.parse(decodeURIComponent(sessionCookie.value));
                finalPhone = session.phone;
                finalToken = session.token;
            } catch (e) { }
        }

        if (finalPhone && finalToken) {
            const sessionRes = await db.execute({
                sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                args: [finalPhone, finalToken]
            });
            if (sessionRes.rows.length > 0) currentUserId = sessionRes.rows[0].id;
        }

        if (!currentUserId) {
            const { auth } = await import('@/auth');
            const session = await auth();
            if (session?.user?.email) {
                const result = await db.execute({
                    sql: 'SELECT id FROM users WHERE email = ?',
                    args: [session.user.email]
                });
                if (result.rows.length > 0) currentUserId = result.rows[0].id;
            }
        }

        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get current stats
        const userRes = await db.execute({
            sql: 'SELECT dailyKm, lastKmReset, fuelPoints FROM users WHERE id = ?',
            args: [currentUserId]
        });
        const user = userRes.rows[0];

        let currentDailyKm = user.dailyKm || 0;
        let lastReset = user.lastKmReset ? new Date(user.lastKmReset) : new Date(0);
        const now = new Date();
        const diffHours = (now - lastReset) / (1000 * 60 * 60);

        let resetTriggered = false;
        if (diffHours >= 24) {
            currentDailyKm = 0;
            lastReset = now;
            resetTriggered = true;
        }

        const oldKm = currentDailyKm;
        const newKm = Math.min(100, currentDailyKm + distanceKm);
        let rewardTriggered = false;

        // Trigger reward if they just hit 100km in this 24h cycle
        if (oldKm < 100 && newKm >= 100) {
            rewardTriggered = true;
            await db.execute({
                sql: 'UPDATE users SET fuelPoints = fuelPoints + 100 WHERE id = ?',
                args: [currentUserId]
            });
        }

        await db.execute({
            sql: 'UPDATE users SET dailyKm = ?, lastKmReset = ? WHERE id = ?',
            args: [newKm, lastReset.toISOString(), currentUserId]
        });

        return NextResponse.json({
            success: true,
            dailyKm: newKm,
            reward: rewardTriggered,
            reset: resetTriggered,
            pointsEarned: rewardTriggered ? 100 : 0
        });

    } catch (error) {
        console.error('Distance Tracking API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
