import db from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { targetId } = body;

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('auth_session');
        let finalPhone, finalToken;

        if (sessionCookie) {
            try {
                const session = JSON.parse(decodeURIComponent(sessionCookie.value));
                finalPhone = session.phone;
                finalToken = session.token;
            } catch (e) {
                try {
                    const session = JSON.parse(sessionCookie.value);
                    finalPhone = session.phone;
                    finalToken = session.token;
                } catch (e2) { }
            }
        }

        if (!finalPhone || !finalToken) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionRes = await db.execute({
            sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
            args: [finalPhone, finalToken]
        });

        if (sessionRes.rows.length === 0) {
            return Response.json({ error: 'Invalid Session' }, { status: 401 });
        }

        const followerId = sessionRes.rows[0].id;

        if (followerId === parseInt(targetId)) {
            return Response.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Check existing follow
        const existing = await db.execute({
            sql: 'SELECT id FROM follows WHERE followerId = ? AND followingId = ?',
            args: [followerId, targetId]
        });

        if (existing.rows.length > 0) {
            // Unfollow
            await db.execute({
                sql: 'DELETE FROM follows WHERE id = ?',
                args: [existing.rows[0].id]
            });
            return Response.json({ status: 'unfollowed' });
        } else {
            // Follow
            await db.execute({
                sql: 'INSERT INTO follows (followerId, followingId) VALUES (?, ?)',
                args: [followerId, targetId]
            });
            return Response.json({ status: 'followed' });
        }

    } catch (error) {
        console.error('Follow API Error:', error);
        return Response.json({ error: 'Failed to toggle follow' }, { status: 500 });
    }
}
export async function DELETE(request) {
    try {
        const body = await request.json();
        const { followerId } = body; // The ID of the person following the current user

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('auth_session');
        let finalPhone, finalToken;

        if (sessionCookie) {
            try {
                const session = JSON.parse(decodeURIComponent(sessionCookie.value));
                finalPhone = session.phone;
                finalToken = session.token;
            } catch (e) {
                try {
                    const session = JSON.parse(sessionCookie.value);
                    finalPhone = session.phone;
                    finalToken = session.token;
                } catch (e2) { }
            }
        }

        if (!finalPhone || !finalToken) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionRes = await db.execute({
            sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
            args: [finalPhone, finalToken]
        });

        if (sessionRes.rows.length === 0) {
            return Response.json({ error: 'Invalid Session' }, { status: 401 });
        }

        const myId = sessionRes.rows[0].id;

        // Delete the follow record where followingId = myId AND followerId = followerId
        await db.execute({
            sql: 'DELETE FROM follows WHERE followingId = ? AND followerId = ?',
            args: [myId, followerId]
        });

        return Response.json({ success: true });

    } catch (error) {
        console.error('Remove Follower API Error:', error);
        return Response.json({ error: 'Failed to remove follower' }, { status: 500 });
    }
}
