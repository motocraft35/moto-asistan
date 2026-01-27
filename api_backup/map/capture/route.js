import db from '@/lib/db';
import { cookies } from 'next/headers';

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function getSessionUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    let finalPhone, finalToken;

    if (sessionCookie) {
        try {
            const decodedValue = decodeURIComponent(sessionCookie.value);
            const session = JSON.parse(decodedValue);
            finalPhone = session.phone;
            finalToken = session.token;
        } catch (e) {
            try {
                const session = JSON.parse(sessionCookie.value);
                finalPhone = session.phone;
                finalToken = session.token;
            } catch (e2) { }
        }
    }

    if (finalPhone && finalToken) {
        const sessionRes = await db.execute({
            sql: 'SELECT id, fullName, clanId FROM users WHERE phoneNumber = ? AND sessionToken = ?',
            args: [finalPhone, finalToken]
        });
        if (sessionRes.rows.length > 0) return sessionRes.rows[0];
    }

    // Try Next-Auth session
    const { auth } = await import('@/auth');
    const session = await auth();
    if (session?.user?.email) {
        const result = await db.execute({
            sql: 'SELECT id, fullName, clanId FROM users WHERE email = ?',
            args: [session.user.email]
        });
        if (result.rows.length > 0) return result.rows[0];
    }

    return null;
}

export async function POST(request) {
    try {
        const user = await getSessionUser();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { locationId, latitude, longitude } = body;

        const locRes = await db.execute({
            sql: 'SELECT * FROM map_locations WHERE id = ?',
            args: [locationId]
        });

        if (locRes.rows.length === 0) return Response.json({ error: 'Location not found' }, { status: 404 });
        const location = locRes.rows[0];

        // 100m Radius verification
        const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
        if (distance > 100) {
            return Response.json({ error: `Bölgeye çok uzaksınız (${Math.round(distance)}m). En fazla 100m yaklaşmalısınız.` }, { status: 403 });
        }

        // Prevent capturing own clan's area
        if (user.clanId && location.ownerClanId === user.clanId) {
            return Response.json({ error: 'Bu bölge zaten klanınızın kontrolünde!' }, { status: 400 });
        }

        // Atomic Transaction for Capture
        await db.batch([
            // 1. Update location ownership
            {
                sql: 'UPDATE map_locations SET ownerClanId = ? WHERE id = ?',
                args: [user.clanId || null, locationId]
            },
            // 2. Grant Saygınlık (Respect) to user
            {
                sql: 'UPDATE users SET respectPoints = respectPoints + 50, xp = xp + 100 WHERE id = ?',
                args: [user.id]
            },
            // 3. Log the capture
            {
                sql: 'INSERT INTO capture_logs (locationId, userId, clanId) VALUES (?, ?, ?)',
                args: [locationId, user.id, user.clanId || null]
            }
        ], 'write');

        return Response.json({
            success: true,
            message: `${location.name} fethedildi! +50 Saygınlık kazandınız.`,
            respectEarned: 50
        });

    } catch (error) {
        console.error('Capture API Error:', error);
        return Response.json({ error: 'Fetih işlemi başarısız oldu' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Fetch last 10 capture logs with user/clan names for the HUD
        const result = await db.execute(`
            SELECT cl.*, u.fullName as userName, c.name as clanName, ml.name as locationName
            FROM capture_logs cl
            JOIN users u ON cl.userId = u.id
            LEFT JOIN clans c ON cl.clanId = c.id
            JOIN map_locations ml ON cl.locationId = ml.id
            ORDER BY cl.capturedAt DESC
            LIMIT 10
        `);
        return Response.json(result.rows);
    } catch (e) {
        return Response.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
