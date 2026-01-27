import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Sisteme giriş yapmalısın.' }, { status: 401 });
        }

        await db.execute({
            sql: 'UPDATE users SET isMaster = 1 WHERE id = ?',
            args: [userId]
        });

        return new NextResponse(`
            <html>
                <body style="background: #050510; color: #00f2ff; font-family: monospace; display: flex; flex-direction: column; items-center; justify-content; height: 100vh; margin: 0; text-align: center;">
                    <div style="border: 1px solid #00f2ff; padding: 40px; border-radius: 20px; background: rgba(0, 242, 255, 0.05); box-shadow: 0 0 30px rgba(0, 242, 255, 0.2);">
                        <h1 style="text-transform: uppercase; letter-spacing: 5px;">YETKİ AKTİF EDİLDİ</h1>
                        <p style="color: #fff; opacity: 0.7;">Hesabın MASTER seviyesine yükseltildi.</p>
                        <a href="/dashboard" style="color: #00f2ff; text-decoration: none; border: 1px solid #00f2ff; padding: 10px 20px; border-radius: 5px; margin-top: 20px; display: inline-block;">DASHBOARD'A DÖN</a>
                    </div>
                </body>
            </html>
        `, { headers: { 'Content-Type': 'text/html' } });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
