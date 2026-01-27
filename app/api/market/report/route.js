import { auth } from '@/auth'; // Adjust path if needed, but '@/auth' might work if configured

export async function POST(request) {
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
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { brand, model, year, price, kilometers, source_image_url } = body;

        // Basic Validation
        if (!brand || !model || !price) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await db.execute({
            sql: `
                INSERT INTO market_listings 
                (brand, model, year, price, kilometers, source_image_url, reported_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
                brand,
                model,
                year || null,
                parseFloat(price),
                kilometers || 0,
                source_image_url || null,
                userId
            ]
        });

        return Response.json({ success: true, message: 'Price report submitted successfully' });

    } catch (error) {
        console.error('Market Report Error:', error);
        return Response.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}
