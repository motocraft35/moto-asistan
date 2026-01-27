import db from '@/lib/db';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        let userEmail = null;
        let phoneNumber = null;
        let sessionToken = null;

        // 1. Try NextAuth Session
        const session = await auth();
        if (session?.user?.email) {
            userEmail = session.user.email;
        }

        // 2. Try Custom Session Cookie (Mobile Fallback)
        if (!userEmail) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('auth_session');
            if (sessionCookie) {
                try {
                    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
                    phoneNumber = sessionData.phone;
                    sessionToken = sessionData.token;
                } catch (e) {
                    console.error('[Sync API] Cookie parse error:', e);
                }
            }
        }

        let userResult;
        if (userEmail) {
            userResult = await db.execute({
                sql: 'SELECT * FROM users WHERE email = ?',
                args: [userEmail]
            });
        } else if (phoneNumber && sessionToken) {
            userResult = await db.execute({
                sql: 'SELECT * FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                args: [phoneNumber, sessionToken]
            });
        }

        if (!userResult || userResult.rows.length === 0) {
            return Response.json({ error: 'Unauthorized Session' }, { status: 401 });
        }

        const user = userResult.rows[0];
        if (user.isMaster !== 1) {
            return Response.json({ error: 'Master Level Required' }, { status: 403 });
        }

        const { latitude, longitude } = await req.json();

        // Update TK Motors location by name
        const result = await db.execute({
            sql: 'UPDATE map_locations SET latitude = ?, longitude = ? WHERE name = ?',
            args: [latitude, longitude, 'TK Motors']
        });

        if (result.rowsAffected === 0) {
            return Response.json({ error: 'TK Motors entry not found in database' }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (e) {
        console.error('[Sync API] Critical Error:', e);
        return Response.json({ error: 'System Error: ' + e.message }, { status: 500 });
    }
}
