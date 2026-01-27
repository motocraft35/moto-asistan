import db from '../../../../lib/db';
import { auth } from '../../../../auth';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        let userId = null;

        // 1. Try NextAuth Session
        const session = await auth();
        if (session?.user) {
            const userRes = await db.execute({
                sql: 'SELECT id FROM users WHERE email = ?',
                args: [session.user.email]
            });
            userId = userRes.rows[0]?.id;
        }

        // 2. Try Custom Session
        if (!userId) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('auth_session');
            if (sessionCookie) {
                try {
                    const decodedValue = decodeURIComponent(sessionCookie.value);
                    const sessionData = JSON.parse(decodedValue);
                    const userRes = await db.execute({
                        sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                        args: [sessionData.phone, sessionData.token]
                    });
                    if (userRes.rows.length > 0) {
                        userId = userRes.rows[0].id;
                    }
                } catch (e) { }
            }
        }

        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's tickets with campaign and venue details
        const ticketsResult = await db.execute({
            sql: `
                SELECT 
                    rt.id, 
                    rt.code, 
                    rt.scannedAt, 
                    rc.name as campaignName,
                    ml.name as venueName
                FROM raffle_tickets rt
                JOIN raffle_campaigns rc ON rt.campaignId = rc.id
                LEFT JOIN map_locations ml ON rt.venueId = ml.id
                WHERE rt.userId = ?
                ORDER BY rt.scannedAt DESC
            `,
            args: [userId]
        });

        return Response.json({
            success: true,
            tickets: ticketsResult.rows
        });

    } catch (error) {
        console.error('[Raffle API] Error:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
