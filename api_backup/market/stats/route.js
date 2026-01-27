import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const brand = searchParams.get('brand');
        const model = searchParams.get('model');
        const year = searchParams.get('year');

        let sql = `
            SELECT 
                COUNT(*) as count,
                AVG(price) as average,
                MIN(price) as min,
                MAX(price) as max
            FROM market_listings
            WHERE 1=1
        `;

        const args = [];

        if (brand) {
            sql += ' AND brand LIKE ?';
            args.push(`%${brand}%`);
        }

        if (model) {
            sql += ' AND model LIKE ?';
            args.push(`%${model}%`);
        }

        if (year) {
            // Allow a small range for year if needed, but strict for now
            sql += ' AND year = ?';
            args.push(year);
        }

        const result = await db.execute({ sql, args });
        const stats = result.rows[0];

        // Also fetch recent listings for this criteria to show "Recent Reports"
        let listingsSql = `
            SELECT id, price, kilometers, listing_date, source_image_url 
            FROM market_listings 
            WHERE 1=1
        `;
        const listingsArgs = [];

        if (brand) { listingsSql += ' AND brand LIKE ?'; listingsArgs.push(`%${brand}%`); }
        if (model) { listingsSql += ' AND model LIKE ?'; listingsArgs.push(`%${model}%`); }
        if (year) { listingsSql += ' AND year = ?'; listingsArgs.push(year); }

        listingsSql += ' ORDER BY listing_date DESC LIMIT 5';

        const recentListingsRes = await db.execute({ sql: listingsSql, args: listingsArgs });

        return Response.json({
            stats: {
                count: stats.count,
                average: stats.average || 0,
                min: stats.min || 0,
                max: stats.max || 0
            },
            recentReports: recentListingsRes.rows
        });

    } catch (error) {
        console.error('Market Stats Error:', error);
        return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
