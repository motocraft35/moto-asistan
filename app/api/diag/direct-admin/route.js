import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        // 1. Find the user 'Tolgahan kaya' or the latest active user
        const userResult = await db.execute("SELECT * FROM users WHERE fullName LIKE '%Tolgahan%' LIMIT 1");
        let user = userResult.rows[0];

        if (!user) {
            // Fallback to first user if Tolgahan not found
            const firstUser = await db.execute("SELECT * FROM users LIMIT 1");
            user = firstUser.rows[0];
        }

        if (!user) {
            return NextResponse.json({ error: 'Sistemde hiç kullanıcı bulunamadı.' }, { status: 404 });
        }

        // 2. Ensure they are Master
        await db.execute({
            sql: 'UPDATE users SET isMaster = 1 WHERE id = ?',
            args: [user.id]
        });

        // 3. Create Session Data
        const sessionData = {
            phone: user.phoneNumber,
            token: user.sessionToken || 'DIRECT_ACCESS_TOKEN_' + Date.now(),
            id: user.id
        };

        // Update token in DB if it was missing
        if (!user.sessionToken) {
            await db.execute({
                sql: 'UPDATE users SET sessionToken = ? WHERE id = ?',
                args: [sessionData.token, user.id]
            });
        }

        // 4. Set Cookie & Redirect
        const response = NextResponse.redirect(new URL('/dashboard/admin/reports', request.url));

        const cookieStore = await cookies();
        cookieStore.set('auth_session', encodeURIComponent(JSON.stringify(sessionData)), {
            path: '/',
            httpOnly: false, // Accessible by client if needed
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;

    } catch (error) {
        console.error('Direct Admin Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
