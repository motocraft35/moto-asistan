import { NextResponse } from 'next/server';
import db from '../../../../../../lib/db';
import { auth } from '../../../../../../auth';
import { cookies } from 'next/headers';

export async function DELETE(req, { params }) {
    try {
        const { id, memberId } = await params; // id is clanId, memberId is member's userId

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

        // Check if user is leader/officer
        const membership = await db.execute({
            sql: 'SELECT role FROM clan_members WHERE clanId = ? AND userId = ?',
            args: [id, userId]
        });

        const myRole = membership.rows[0]?.role;
        if (myRole !== 'leader' && myRole !== 'officer') {
            return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
        }

        // Check target member
        const target = await db.execute({
            sql: 'SELECT role FROM clan_members WHERE clanId = ? AND userId = ?',
            args: [id, memberId]
        });

        if (target.rows.length === 0) return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 });
        const targetRole = target.rows[0].role;

        // Officers cannot kick leaders or officers
        if (myRole === 'officer' && (targetRole === 'leader' || targetRole === 'officer')) {
            return NextResponse.json({ error: 'Bunu yapmaya yetkiniz yok.' }, { status: 403 });
        }

        // Delete membership
        await db.execute({
            sql: 'DELETE FROM clan_members WHERE clanId = ? AND userId = ?',
            args: [id, memberId]
        });

        return NextResponse.json({ success: true, message: 'Üye klandan atıldı.' });

    } catch (error) {
        console.error('Kick member error:', error);
        return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
    }
}
