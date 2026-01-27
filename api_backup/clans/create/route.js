import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { auth } from '../../../../auth';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        let userId = null;
        let userEmail = null;

        // 1. Try NextAuth Session (Social Login)
        const session = await auth();
        if (session?.user) {
            userEmail = session.user.email;
            const userRes = await db.execute({
                sql: 'SELECT id FROM users WHERE email = ?',
                args: [userEmail]
            });
            userId = userRes.rows[0]?.id;
        }

        // 2. Try Custom Session (Phone/Password Login)
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
                } catch (e) {
                    console.error('Custom session parse error:', e);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, city, logoUrl, flagId } = await req.json();

        // Validation
        if (!name || name.length < 3) {
            return NextResponse.json({ error: 'Klan ismi en az 3 karakter olmalıdır.' }, { status: 400 });
        }

        // Check if user is already a member of any clan
        const existingMembership = await db.execute({
            sql: 'SELECT id FROM clan_members WHERE userId = ?',
            args: [userId]
        });

        if (existingMembership.rows.length > 0) {
            return NextResponse.json({ error: 'Zaten bir klana üyesiniz!' }, { status: 400 });
        }

        // 1. Create Clan
        const clanResult = await db.execute({
            sql: `INSERT INTO clans (name, description, leaderId, city, logoUrl, flagId) 
                  VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
            args: [name, description, userId, city, logoUrl, flagId || 1]
        });

        const newClanId = clanResult.rows[0].id;

        // 2. Add Leader as Member
        await db.execute({
            sql: `INSERT INTO clan_members (clanId, userId, role) VALUES (?, ?, 'leader')`,
            args: [newClanId, userId]
        });

        return NextResponse.json({ success: true, clanId: newClanId });

    } catch (error) {
        console.error('Clan creation error:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return NextResponse.json({ error: 'Bu klan ismi zaten alınmış.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Klan oluşturulurken bir hata oluştu.' }, { status: 500 });
    }
}
