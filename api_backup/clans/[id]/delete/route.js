import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import { auth } from '../../../../../auth';
import { cookies } from 'next/headers';

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

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
        if (clan.rows.length === 0) return NextResponse.json({ error: 'Klan bulunamadı.' }, { status: 404 });

        if (clan.rows[0].leaderId !== userId) {
            return NextResponse.json({ error: 'Sadece klan lideri klanı silebilir.' }, { status: 403 });
        }

        // Delete members first
        await db.execute({ sql: 'DELETE FROM clan_members WHERE clanId = ?', args: [id] });
        // Delete requests
        await db.execute({ sql: 'DELETE FROM clan_requests WHERE clanId = ?', args: [id] });
        // Delete clan
        await db.execute({ sql: 'DELETE FROM clans WHERE id = ?', args: [id] });

        return NextResponse.json({ success: true, message: 'Klan silindi.' });

    } catch (error) {
        console.error('Delete clan error:', error);
        return NextResponse.json({ error: 'Klan silinemedi.' }, { status: 500 });
    }
}
