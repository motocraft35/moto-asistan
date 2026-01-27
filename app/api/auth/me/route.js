import { auth } from '../../../../auth';
import db from '../../../../lib/db';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        let userEmail = null;
        let phoneNumber = null;
        let sessionToken = null;

        // 1. Try NextAuth Session
        const session = await auth();
        if (session?.user?.email) {
            userEmail = session.user.email;
        }

        // 2. Try Custom Session Cookie
        if (!userEmail) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('auth_session');
            if (sessionCookie) {
                try {
                    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
                    phoneNumber = sessionData.phone;
                    sessionToken = sessionData.token;
                } catch (e) {
                    console.error('[Auth Me] Cookie parse error:', e);
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
            return Response.json({ user: null }, { status: 401 });
        }

        const user = userResult.rows[0];
        // Remove sensitive data
        const { sessionToken: st, ...safeUser } = user;

        return Response.json({ user: safeUser });
    } catch (error) {
        console.error('[Auth Me API] Error:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
