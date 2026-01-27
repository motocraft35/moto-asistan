import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST() {
    try {
        const userId = await getUserId();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate random 4-digit code
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Update database
        await db.execute({
            sql: `UPDATE users SET 
                    dynamicCode = ?,
                    lastCodeUpdate = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [newCode, userId]
        });

        console.log(`Generated new service code for user ${userId}: ${newCode}`);

        return Response.json({ code: newCode });
    } catch (error) {
        console.error('Service Code API Error:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await db.execute({
            sql: 'SELECT dynamicCode FROM users WHERE id = ?',
            args: [userId]
        });

        const code = result.rows[0]?.dynamicCode || '----';

        return Response.json({ code });
    } catch (error) {
        return Response.json({ error: 'Failed' }, { status: 500 });
    }
}
