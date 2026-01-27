import db from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy...');

export async function POST(request) {
    try {
        const session = await auth();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { listingId } = body;

        const listingRes = await db.execute({
            sql: 'SELECT * FROM marketplace_listings WHERE id = ?',
            args: [listingId]
        });

        const listing = listingRes.rows[0];
        if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });

        // AI ANALYSIS PROMPT
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Aşağıdaki motosiklet ilanını bir uzman gözüyle analiz et ve 3-4 cümlelik vurucu, teknik bir "Alpha-Verified" raporu oluştur. 
            Bu rapor, alıcının güvenini artırmalı ve ilan sahibine prestij sağlamalıdır.
            
            İlan Başlığı: ${listing.title}
            Marka/Model: ${listing.brand} ${listing.model} (${listing.year})
            Fiyat: ${listing.price} TL
            Kilometre: ${listing.kilometers} km
            Açıklama: ${listing.description}
            
            Dil: Türkçe olsun. 
            Format: Sadece analiz metnini döndür.
        `;

        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        await db.execute({
            sql: 'UPDATE marketplace_listings SET isAiVerified = 1, aiAnalysis = ? WHERE id = ?',
            args: [analysis, listingId]
        });

        return Response.json({ success: true, analysis });
    } catch (error) {
        console.error('AI Verify Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
