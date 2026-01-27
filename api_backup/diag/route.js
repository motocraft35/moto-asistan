import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

export async function GET(request) {
    const userId = await getUserId(request);
    // Strict Admin Check (Optional, but at least user check)
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fix: Do NOT leak the API key. Only show status.
        const apiKeyStatus = process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'MISSING';

        return NextResponse.json({
            status: 'SUCCESS',
            diagnostic: {
                gemini: apiKeyStatus,
                env: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        return NextResponse.json({ status: 'ERROR', error: error.message }, { status: 500 });
    }
}
