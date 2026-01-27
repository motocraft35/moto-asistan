import db from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        let currentUserId = null;

        // 1. Try manual session
        const sessionCookie = cookieStore.get('auth_session');
        let finalPhone, finalToken;

        if (sessionCookie) {
            try {
                const decodedValue = decodeURIComponent(sessionCookie.value);
                const session = JSON.parse(decodedValue);
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

        if (finalPhone && finalToken) {
            const sessionRes = await db.execute({
                sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                args: [finalPhone, finalToken]
            });
            if (sessionRes.rows.length > 0) {
                currentUserId = sessionRes.rows[0].id;
            }
        }

        // 2. Try Next-Auth session if still no user
        if (!currentUserId) {
            const { auth } = await import('@/auth');
            const session = await auth();
            if (session?.user?.email) {
                const result = await db.execute({
                    sql: 'SELECT id FROM users WHERE email = ?',
                    args: [session.user.email]
                });
                if (result.rows.length > 0) {
                    currentUserId = result.rows[0].id;
                }
            }
        }

        let targetId = id;
        if (id === 'me') {
            if (!currentUserId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            targetId = currentUserId;
        }

        const userIdInt = parseInt(targetId);
        console.log(`🔍 Profile API Request for ID: "${id}" (Target: ${targetId}, Parsed: ${userIdInt})`);

        if (isNaN(userIdInt)) {
            return Response.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Fetch Target User Profile
        const userRes = await db.execute({
            sql: `SELECT id, fullName, licensePlate, totalUsageMinutes, profileImage, bio, subscriptionStatus, respectPoints, xp, dailyKm, fuelPoints, createdAt FROM users WHERE id = ?`,
            args: [userIdInt]
        });

        if (userRes.rows.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userRes.rows[0];

        // Rank Calculation
        let rank = 'Bronz';
        if (user.totalUsageMinutes > 500) rank = 'Altın';
        else if (user.totalUsageMinutes > 150) rank = 'Gümüş';

        // Stats
        const followersRes = await db.execute({
            sql: `SELECT u.id, u.fullName, u.profileImage FROM follows f JOIN users u ON f.followerId = u.id WHERE f.followingId = ?`,
            args: [userIdInt]
        });
        const followingCountRes = await db.execute({
            sql: `SELECT COUNT(*) as count FROM follows WHERE followerId = ?`,
            args: [userIdInt]
        });

        // Check if I follow them
        let isFollowing = false;
        if (currentUserId) {
            const followCheck = await db.execute({
                sql: `SELECT id FROM follows WHERE followerId = ? AND followingId = ?`,
                args: [currentUserId, userIdInt]
            });
            isFollowing = followCheck.rows.length > 0;
        }

        // Fetch Garage (Bikes)
        const bikesRes = await db.execute({
            sql: `SELECT * FROM bikes WHERE userId = ? ORDER BY createdAt DESC`,
            args: [userIdInt]
        });

        return Response.json({
            ...user,
            rank,
            followers: followersRes.rows || [],
            followersCount: followersRes.rows.length,
            followingCount: followingCountRes.rows?.[0]?.count || 0,
            isFollowing,
            bikes: bikesRes.rows || [],
            isMe: currentUserId === userIdInt
        });

    } catch (error) {
        console.error('Profile API Error:', error);
        return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
