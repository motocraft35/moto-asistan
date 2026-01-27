
import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const city = searchParams.get('city');

        let query = `
            SELECT c.*, u.fullName as leaderName, u.subscriptionStatus as leaderTier,
            (SELECT COUNT(*) FROM clan_members cm WHERE cm.clanId = c.id) as memberCount
            FROM clans c
            JOIN users u ON c.leaderId = u.id
        `;

        const args = [];

        if (city && city !== 'Tümü') {
            query += ` WHERE c.city = ?`;
            args.push(city);
        }

        query += ` ORDER BY memberCount DESC, c.xp DESC, c.createdAt DESC LIMIT 50`;

        const result = await db.execute({ sql: query, args });

        return NextResponse.json({ success: true, clans: result.rows });

    } catch (error) {
        console.error('List clans error:', error);
        return NextResponse.json({ error: 'Klanlar listelenirken hata oluştu.' }, { status: 500 });
    }
}
