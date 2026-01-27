import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import { auth } from '../../../../../auth';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
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
                    userId = userRes.rows[0]?.id;
                } catch (e) { }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if already in a clan
        const existingMembership = await db.execute({
            sql: 'SELECT id FROM clan_members WHERE userId = ?',
            args: [userId]
        });

        if (existingMembership.rows.length > 0) {
            return NextResponse.json({ error: 'Zaten bir klana üyesiniz!' }, { status: 400 });
        }

        // Check for pending request
        const pendingRequest = await db.execute({
            sql: 'SELECT id FROM clan_requests WHERE userId = ? AND clanId = ? AND status = ?',
            args: [userId, id, 'pending']
        });

        if (pendingRequest.rows.length > 0) {
            return NextResponse.json({ error: 'Bu klan için zaten bekleyen bir isteğiniz var.' }, { status: 400 });
        }

        // Create Request
        await db.execute({
            sql: `INSERT INTO clan_requests (clanId, userId, status) VALUES (?, ?, 'pending')`,
            args: [id, userId]
        });

        // Get Clan Info for Notification
        const clanInfo = await db.execute({
            sql: `SELECT name, leaderId FROM clans WHERE id = ?`,
            args: [id]
        });

        if (clanInfo.rows.length > 0) {
            const { name, leaderId } = clanInfo.rows[0];
            // Get Applicant Name
            const userRes = await db.execute({ sql: 'SELECT fullName FROM users WHERE id = ?', args: [userId] });
            const applicantName = userRes.rows[0]?.fullName || 'Bir kullanıcı';

            // Create Notification for Leader
            await db.execute({
                sql: `INSERT INTO notifications (userId, title, content, type, relatedId) 
                      VALUES (?, ?, ?, ?, ?)`,
                args: [
                    leaderId,
                    'Yeni Klan Katılım İsteği',
                    `${applicantName}, ${name} klanınıza katılmak istiyor.`,
                    'clan_request',
                    id
                ]
            });
        }

        return NextResponse.json({ success: true, message: 'Katılım isteğiniz başarıyla gönderildi.' });

    } catch (error) {
        console.error('Apply clan error:', error);
        return NextResponse.json({ error: 'İstek gönderilirken hata oluştu.' }, { status: 500 });
    }
}
