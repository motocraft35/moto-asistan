import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: 'Missing ID' }, { status: 400 });

        const sql = `
            SELECT l.*, u.fullName as sellerName, u.profileImage as sellerImage 
            FROM marketplace_listings l
            JOIN users u ON l.sellerId = u.id
            WHERE l.id = ?
        `;

        const res = await db.execute({ sql, args: [id] });

        if (res.rows.length === 0) {
            return Response.json({ error: 'Listing not found' }, { status: 404 });
        }

        return Response.json({ listing: res.rows[0] });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
