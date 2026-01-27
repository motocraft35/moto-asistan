import db from '@/lib/db';
import { cookies } from 'next/headers';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let sql = `
            SELECT l.*, u.fullName as sellerName, u.profileImage as sellerImage 
            FROM marketplace_listings l
            JOIN users u ON l.sellerId = u.id
            WHERE l.status = 'Active'
        `;
        const args = [];

        if (category) {
            sql += ` AND l.category = ?`;
            args.push(category);
        }

        sql += ` ORDER BY l.isAiVerified DESC, l.createdAt DESC`;

        const res = await db.execute({ sql, args });
        return Response.json({ listings: res.rows });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        let userId = null;

        if (session?.user?.email) {
            const userRes = await db.execute({
                sql: 'SELECT id FROM users WHERE email = ?',
                args: [session.user.email]
            });
            userId = userRes.rows[0]?.id;
        }

        if (!userId) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('auth_session');
            if (sessionCookie) {
                const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
                const userRes = await db.execute({
                    sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                    args: [sessionData.phone, sessionData.token]
                });
                userId = userRes.rows[0]?.id;
            }
        }

        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, price, category, brand, model, year, kilometers, imageUrl, city, district } = body;

        const res = await db.execute({
            sql: `
                INSERT INTO marketplace_listings 
                (sellerId, title, description, price, category, brand, model, year, kilometers, imageUrl, city, district)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [userId, title, description, price, category, brand, model, year, kilometers, imageUrl, city, district]
        });

        return Response.json({ success: true, listingId: res.lastInsertRowid });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
