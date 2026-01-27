import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { brand, model, year, nickname, imageUrls, kilometers, accessories } = body;

        await db.execute({
            sql: `INSERT INTO bikes (userId, brand, model, year, nickname, imageUrls, kilometers, accessories) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [userId, brand, model, year, nickname, imageUrls || '', kilometers || 0, accessories || '']
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Add Bike Error:', error);
        return Response.json({ error: 'Failed to add bike' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, brand, model, year, nickname, imageUrls, kilometers, accessories } = body;

        if (!id) return Response.json({ error: 'Bike ID is required' }, { status: 400 });

        // Verify ownership
        const bikeRes = await db.execute({
            sql: 'SELECT userId FROM bikes WHERE id = ?',
            args: [id]
        });

        if (bikeRes.rows.length === 0) return Response.json({ error: 'Bike not found' }, { status: 404 });
        if (bikeRes.rows[0].userId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 });

        await db.execute({
            sql: `UPDATE bikes SET brand = ?, model = ?, year = ?, nickname = ?, imageUrls = ?, kilometers = ?, accessories = ? WHERE id = ?`,
            args: [brand, model, year, nickname, imageUrls || '', kilometers || 0, accessories || '', id]
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Update Bike Error:', error);
        return Response.json({ error: 'Failed to update bike' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const userId = await getUserId();
        if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: 'Bike ID is required' }, { status: 400 });

        // Verify ownership
        const bikeRes = await db.execute({
            sql: 'SELECT userId FROM bikes WHERE id = ?',
            args: [id]
        });

        if (bikeRes.rows.length === 0) return Response.json({ error: 'Bike not found' }, { status: 404 });
        if (bikeRes.rows[0].userId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 });

        await db.execute({
            sql: 'DELETE FROM bikes WHERE id = ?',
            args: [id]
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Delete Bike Error:', error);
        return Response.json({ error: 'Failed to delete bike' }, { status: 500 });
    }
}
