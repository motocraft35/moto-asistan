import { NextResponse } from 'next/server';
import db from '../../../../../../../lib/db';
import { auth } from '../../../../../../../auth';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
    try {
        const { id, memberId } = await params;
        const { role } = await req.json(); // 'officer', 'member' (cannot promote to leader this way)

        if (!['officer', 'member'].includes(role)) {
            return NextResponse.json({ error: 'Geçersiz rütbe.' }, { status: 400 });
        }

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

        // Only leader can change roles
        const leaderCheck = await db.execute({
            sql: 'SELECT role FROM clan_members WHERE clanId = ? AND userId = ?',
            args: [id, userId]
        });

        if (leaderCheck.rows[0]?.role !== 'leader') {
            return NextResponse.json({ error: 'Sadece klan lideri rütbe değiştirebilir.' }, { status: 403 });
        }

        // Update role
        await db.execute({
            sql: 'UPDATE clan_members SET role = ? WHERE clanId = ? AND userId = ?',
            args: [role, id, memberId]
        });

        return NextResponse.json({ success: true, message: 'Rütbe güncellendi.' });

    } catch (error) {
        console.error('Update role error:', error);
        return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
    }
}
