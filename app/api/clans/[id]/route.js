import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        // Get Clan Details with leader's subscription status for limits
        const clanResult = await db.execute({
            sql: `SELECT c.*, u.fullName as leaderName, u.subscriptionStatus as leaderTier 
                  FROM clans c 
                  JOIN users u ON c.leaderId = u.id 
                  WHERE c.id = ?`,
            args: [id]
        });

        if (clanResult.rows.length === 0) {
            return NextResponse.json({ error: 'Klan bulunamadı.' }, { status: 404 });
        }

        const clanData = clanResult.rows[0];
        // Calculate limit based on leader tier
        clanData.limit = clanData.leaderTier === 'Clan' ? 50 : 25;

        // Check if current user is the leader
        const currentUserId = await getUserId();
        clanData.isLeader = currentUserId === clanData.leaderId;

        // Get Members with their bikes
        const membersResult = await db.execute({
            sql: `SELECT cm.*, u.fullName, u.profileImage 
                  FROM clan_members cm 
                  JOIN users u ON cm.userId = u.id 
                  WHERE cm.clanId = ? 
                  ORDER BY 
                    CASE WHEN cm.role = 'leader' THEN 1 
                         WHEN cm.role = 'officer' THEN 2 
                         ELSE 3 
                    END`,
            args: [id]
        });

        // Get Member Bikes for the Garage
        const bikesResult = await db.execute({
            sql: `SELECT b.*, u.fullName as ownerName 
                  FROM bikes b 
                  JOIN clan_members cm ON b.userId = cm.userId 
                  JOIN users u ON b.userId = u.id
                  WHERE cm.clanId = ?`,
            args: [id]
        });

        return NextResponse.json({
            success: true,
            clan: clanData,
            members: membersResult.rows,
            garage: bikesResult.rows
        });

    } catch (error) {
        console.error('Get clan details error:', error);
        return NextResponse.json({ error: 'Klan detayları alınamadı.' }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const { flagId } = await req.json();

        if (!flagId) {
            return NextResponse.json({ error: 'Flag ID is required' }, { status: 400 });
        }

        // Auth check
        const currentUserId = await getUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check ownership
        const clanOwner = await db.execute({
            sql: 'SELECT leaderId FROM clans WHERE id = ?',
            args: [id]
        });

        if (clanOwner.rows.length === 0 || clanOwner.rows[0].leaderId !== currentUserId) {
            return NextResponse.json({ error: 'Sadece klan lideri bayrağı değiştirebilir.' }, { status: 403 });
        }

        await db.execute({
            sql: 'UPDATE clans SET flagId = ? WHERE id = ?',
            args: [flagId, id]
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update clan flag error:', error);
        return NextResponse.json({ error: 'Bayrak güncellenemedi.' }, { status: 500 });
    }
}
