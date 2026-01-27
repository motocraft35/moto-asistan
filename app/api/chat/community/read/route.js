import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT 
                cm.id, 
                cm.content, 
                cm.timestamp, 
                u.fullName, 
                u.profileImage,
                u.licensePlate
            FROM community_messages cm
            JOIN users u ON cm.userId = u.id
            ORDER BY cm.timestamp DESC
            LIMIT 50
        `;

        const result = await db.execute(query);

        // Reverse to show oldest first in UI
        return NextResponse.json(result.rows.reverse());
    } catch (error) {
        console.error('Chat Read Error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
