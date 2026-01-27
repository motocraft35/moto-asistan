import db from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { imageBase64 } = body; // Expecting base64 string

        const cookieStore = await cookies();
        let userId = null;

        // 1. Try manual session cookie
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

        if (finalPhone && finalToken) {
            const sessionRes = await db.execute({
                sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
                args: [finalPhone, finalToken]
            });
            if (sessionRes.rows.length > 0) {
                userId = sessionRes.rows[0].id;
            }
        }

        // 2. Try Next-Auth session if still no user
        if (!userId) {
            const { auth } = await import('@/auth');
            const session = await auth();
            if (session?.user?.email) {
                const result = await db.execute({
                    sql: 'SELECT id FROM users WHERE email = ?',
                    args: [session.user.email]
                });
                if (result.rows.length > 0) {
                    userId = result.rows[0].id;
                }
            }
        }

        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (imageBase64) {
            // Validation: ~1MB limit for base64 (approx 1.3M chars)
            console.log('Profile image update request. Size:', imageBase64.length);
            if (imageBase64.length > 1500000) {
                return Response.json({ error: 'Resim çok büyük (Maks 1MB)' }, { status: 400 });
            }
            try {
                await db.execute({
                    sql: 'UPDATE users SET profileImage = ? WHERE id = ?',
                    args: [imageBase64, userId]
                });
            } catch (dbErr) {
                console.error('DB Update Error for Profile Image:', dbErr);
                return Response.json({ error: 'Database update failed' }, { status: 500 });
            }
        }

        if (body.bio !== undefined) {
            await db.execute({
                sql: 'UPDATE users SET bio = ? WHERE id = ?',
                args: [body.bio.substring(0, 500), userId]
            });
        }

        if (body.fullName !== undefined) {
            await db.execute({
                sql: 'UPDATE users SET fullName = ? WHERE id = ?',
                args: [body.fullName.substring(0, 100), userId]
            });
        }

        if (body.licensePlate !== undefined) {
            await db.execute({
                sql: 'UPDATE users SET licensePlate = ? WHERE id = ?',
                args: [body.licensePlate.substring(0, 20), userId]
            });
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('Profile Image API Error:', error);
        return Response.json({ error: 'Failed to update image' }, { status: 500 });
    }
}
