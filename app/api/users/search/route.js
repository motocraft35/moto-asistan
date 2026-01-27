import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return Response.json({ users: [] });
        }

        const result = await db.execute({
            sql: `
                SELECT id, fullName, licensePlate, profileImage, totalUsageMinutes 
                FROM users 
                WHERE (licensePlate LIKE ? OR fullName LIKE ? OR CAST(id AS TEXT) = ?) 
                LIMIT 10
            `,
            args: [`%${query}%`, `%${query}%`, query]
        });

        const users = result.rows.map(u => ({
            ...u,
            rank: u.totalUsageMinutes > 500 ? 'Altın' : u.totalUsageMinutes > 150 ? 'Gümüş' : 'Bronz'
        }));

        return Response.json({ users });

    } catch (error) {
        console.error('Search API Error:', error);
        return Response.json({ error: 'Search failed' }, { status: 500 });
    }
}
