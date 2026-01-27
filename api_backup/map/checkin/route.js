
import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { auth } from '../../../../auth';

// Helper to calculate distance between two points in meters
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

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        const body = await req.json();
        const { locationId, latitude, longitude } = body;

        if (!locationId || !latitude || !longitude) {
            return NextResponse.json({ error: 'Eksik veri: Konum bilgileri gerekiyor.' }, { status: 400 });
        }

        // 1. Get User and Clan Info
        const userRes = await db.execute({
            sql: `SELECT u.id, cm.clanId 
                  FROM users u 
                  LEFT JOIN clan_members cm ON u.id = cm.userId 
                  WHERE u.email = ?`,
            args: [session.user.email]
        });

        if (userRes.rows.length === 0) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

        const userId = userRes.rows[0].id;
        const clanId = userRes.rows[0].clanId;

        // 2. Get Location Coordinates
        const locRes = await db.execute({
            sql: 'SELECT id, latitude, longitude, name FROM map_locations WHERE id = ?',
            args: [locationId]
        });

        if (locRes.rows.length === 0) return NextResponse.json({ error: 'Konum bulunamadı.' }, { status: 404 });
        const location = locRes.rows[0];

        // 3. Validate GPS Distance (Max 200 meters)
        const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
        if (distance > 200) {
            return NextResponse.json({
                error: 'Çok uzaktasınız!',
                message: `Burayı fethetmek için konuma daha yakın olmalısın (${Math.round(distance)}m uzaktasın).`
            }, { status: 403 });
        }

        // 4. Record Check-in
        await db.execute({
            sql: `INSERT INTO location_checkins (locationId, userId, clanId, latitude, longitude) 
                  VALUES (?, ?, ?, ?, ?)`,
            args: [locationId, userId, clanId, latitude, longitude]
        });

        // 5. Update Weekly Count for the location
        await db.execute({
            sql: 'UPDATE map_locations SET weeklyCheckInCount = weeklyCheckInCount + 1 WHERE id = ?',
            args: [locationId]
        });

        // 6. Territory Logic: Who has the most check-ins this week?
        if (clanId) {
            const standings = await db.execute({
                sql: `SELECT clanId, COUNT(*) as cCount 
                      FROM location_checkins 
                      WHERE locationId = ? AND timestamp > date('now', '-7 days')
                      AND clanId IS NOT NULL
                      GROUP BY clanId 
                      ORDER BY cCount DESC LIMIT 1`,
                args: [locationId]
            });

            const topClanId = standings.rows[0]?.clanId;

            // If a different clan is now leading, take over!
            if (topClanId && topClanId !== location.ownerClanId) {
                await db.execute({
                    sql: 'UPDATE map_locations SET ownerClanId = ?, lastCaptureAt = CURRENT_TIMESTAMP WHERE id = ?',
                    args: [topClanId, locationId]
                });

                return NextResponse.json({
                    success: true,
                    captured: true,
                    message: `TEBRİKLER! ${location.name} artık sizin klanın kontrolünde! 🛡️`
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `${location.name} konumunda check-in yapıldı! 📍`
        });

    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
