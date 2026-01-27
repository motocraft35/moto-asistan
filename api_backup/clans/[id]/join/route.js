
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

        // Check member limit
        const clanInfo = await db.execute({
            sql: `SELECT leaderId FROM clans WHERE id = ?`,
            args: [id]
        });

        if (clanInfo.rows.length === 0) {
            return NextResponse.json({ error: 'Klan bulunamadı.' }, { status: 404 });
        }

        const leaderId = clanInfo.rows[0].leaderId;
        const leaderRes = await db.execute({
            sql: `SELECT subscriptionStatus FROM users WHERE id = ?`,
            args: [leaderId]
        });

        const currentMembers = await db.execute({
            sql: `SELECT COUNT(*) as count FROM clan_members WHERE clanId = ?`,
            args: [id]
        });

        const count = currentMembers.rows[0].count;
        const leaderTier = leaderRes.rows[0]?.subscriptionStatus;
        const limit = leaderTier === 'Clan' ? 50 : 25;

        if (count >= limit) {
            return NextResponse.json({
                error: `Klan üye limitine ulaşıldı (${limit} kişi). Liderin Klan Premium abonesi olması gerekir.`
            }, { status: 400 });
        }

        // Join Clan (Auto-accept for now, later we can add approval logic)
        await db.execute({
            sql: `INSERT INTO clan_members (clanId, userId, role) VALUES (?, ?, 'member')`,
            args: [id, userId]
        });

        return NextResponse.json({ success: true, message: 'Klana başarıyla katıldınız!' });

    } catch (error) {
        console.error('Join clan error:', error);
        return NextResponse.json({ error: 'Klana katılırken hata oluştu.' }, { status: 500 });
    }
}
