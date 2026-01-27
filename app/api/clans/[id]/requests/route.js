import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

// Get requests for a clan
export async function GET(req, { params }) {
    try {
        const { id } = await params; // clanId

        const userId = await getUserId();

        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if user is leader
        const clan = await db.execute({ sql: 'SELECT leaderId FROM clans WHERE id = ?', args: [id] });
        if (clan.rows[0]?.leaderId !== userId) {
            return NextResponse.json({ error: 'Sadece klan lideri istekleri görebilir.' }, { status: 403 });
        }

        const requests = await db.execute({
            sql: `SELECT cr.*, u.fullName, u.profileImage 
                  FROM clan_requests cr 
                  JOIN users u ON cr.userId = u.id 
                  WHERE cr.clanId = ? AND cr.status = 'pending'
                  ORDER BY cr.createdAt DESC`,
            args: [id]
        });

        return NextResponse.json({ success: true, requests: requests.rows });

    } catch (error) {
        return NextResponse.json({ error: 'İstekler alınamadı.' }, { status: 500 });
    }
}
