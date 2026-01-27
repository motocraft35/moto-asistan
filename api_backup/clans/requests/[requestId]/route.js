import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import { auth } from '../../../../../auth';
import { cookies } from 'next/headers';

// Handle Accept/Reject
export async function POST(req, { params }) {
    try {
        const { requestId } = await params;
        const { action } = await req.json(); // 'accept' or 'reject'

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

        // Get Request Info
        const requestRes = await db.execute({
            sql: 'SELECT * FROM clan_requests WHERE id = ?',
            args: [requestId]
        });

        if (requestRes.rows.length === 0) return NextResponse.json({ error: 'İstek bulunamadı.' }, { status: 404 });
        const request = requestRes.rows[0];

        // Verify leader
        const clan = await db.execute({ sql: 'SELECT leaderId, name FROM clans WHERE id = ?', args: [request.clanId] });
        if (clan.rows[0]?.leaderId !== userId) {
            return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
        }

        if (action === 'accept') {
            // Check limit again
            const leaderRes = await db.execute({ sql: 'SELECT subscriptionStatus FROM users WHERE id = ?', args: [userId] });
            const limit = leaderRes.rows[0]?.subscriptionStatus === 'Clan' ? 50 : 25;

            const currentMembers = await db.execute({ sql: 'SELECT COUNT(*) as count FROM clan_members WHERE clanId = ?', args: [request.clanId] });
            if (currentMembers.rows[0].count >= limit) {
                return NextResponse.json({ error: 'Üye kapasitesi dolu!' }, { status: 400 });
            }

            // Transaction-like update
            await db.execute({
                sql: `UPDATE clan_requests SET status = 'accepted' WHERE id = ?`,
                args: [requestId]
            });

            await db.execute({
                sql: `INSERT INTO clan_members (clanId, userId, role) VALUES (?, ?, 'member')`,
                args: [request.clanId, request.userId]
            });

            // Notify User
            await db.execute({
                sql: `INSERT INTO notifications (userId, title, content, type) VALUES (?, ?, ?, ?)`,
                args: [request.userId, 'Klan İsteği Onaylandı', `${clan.rows[0].name} klanına kabul edildiniz!`, 'system']
            });

        } else if (action === 'reject') {
            await db.execute({
                sql: `UPDATE clan_requests SET status = 'rejected' WHERE id = ?`,
                args: [requestId]
            });

            // Notify User
            await db.execute({
                sql: `INSERT INTO notifications (userId, title, content, type) VALUES (?, ?, ?, ?)`,
                args: [request.userId, 'Klan İsteği Reddedildi', `${clan.rows[0].name} klanına olan başvurunuz reddedildi.`, 'system']
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Handle request error:', error);
        return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
    }
}
