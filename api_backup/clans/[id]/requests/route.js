import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import { auth } from '../../../../../auth';
import { cookies } from 'next/headers';

// Get requests for a clan
export async function GET(req, { params }) {
    try {
        const { id } = await params; // clanId

        let userId = null;
        const session = await auth();
        if (session?.user) {
            const userRes = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [session.user.email] });
            userId = userRes.rows[0]?.id;
        }

        if (!userId) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('auth_session');
            if (sessionCookie) {
                const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
                const userRes = await db.execute({ sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?', args: [sessionData.phone, sessionData.token] });
                userId = userRes.rows[0]?.id;
            }
        }

        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if user is leader
        const clan = await db.execute({ sql: 'SELECT leaderId FROM clans WHERE id = ?', args: [id] });
        if (clan.rows[0]?.leaderId !== userId) {
            return NextResponse.json({ error: 'Sadece klan lideri istekleri görebilir.' }, { status: 403 });
        }

        const requests = await db.execute({
            sql: `SELECT cr.*, u.fullName, u.profileImage 
                  FROM clan_requests cr 
                  JOIN users u ON cr.userId = u.id 
                  WHERE cr.clanId = ? AND cr.status = 'pending'
                  ORDER BY cr.createdAt DESC`,
            args: [id]
        });

        return NextResponse.json({ success: true, requests: requests.rows });

    } catch (error) {
        return NextResponse.json({ error: 'İstekler alınamadı.' }, { status: 500 });
    }
}
