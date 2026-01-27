import { initDb } from '@/lib/db';

export async function GET() {
    try {
        console.log('--- Starting Manual Migration ---');
        await initDb();
        console.log('--- Manual Migration Completed ---');
        return Response.json({ success: true, message: 'Database migration executed successfully.' });
    } catch (error) {
        console.error('Migration Error:', error);
        return Response.json({ error: 'Migration failed', details: error.message }, { status: 500 });
    }
}
