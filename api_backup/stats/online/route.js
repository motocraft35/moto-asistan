import db from '@/lib/db';

export async function GET() {
    try {
        const result = await db.execute({
            sql: "SELECT COUNT(*) as count FROM users WHERE lastHeartbeat > datetime('now', '-5 minutes')",
            args: []
        });

        const count = result.rows[0]?.count || 0;

        return Response.json({ count });
    } catch (error) {
        console.error('Online Stats Error:', error);
        return Response.json({ count: 0 }, { status: 500 });
    }
}
