import { promises as fs } from 'fs';
import path from 'path';

const LOG_FILE = 'neural_link.json';

export async function GET() {
    try {
        const logPath = path.join(process.cwd(), LOG_FILE);
        const data = await fs.readFile(logPath, 'utf8');
        return Response.json(JSON.parse(data));
    } catch (error) {
        return Response.json({ error: 'Neural Link read failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const logPath = path.join(process.cwd(), LOG_FILE);

        let currentData = {
            active_context: {},
            pending_handover: [],
            consultation_desk: [],
            history: []
        };

        try {
            const data = await fs.readFile(logPath, 'utf8');
            currentData = JSON.parse(data);
        } catch (e) { }

        const timestamp = new Date().toISOString();

        if (body.type === 'context_update') {
            currentData.active_context = {
                ...body.content,
                last_update: timestamp
            };
        } else if (body.type === 'handover') {
            currentData.pending_handover.unshift({
                ...body.content,
                timestamp
            });
        } else if (body.type === 'consultation') {
            currentData.consultation_desk.unshift({
                ...body.content,
                timestamp
            });
        } else {
            // Default history/insight behavior
            const newEntry = {
                timestamp,
                source: body.source || 'Ghost',
                content: body.content,
                type: body.type || 'insight',
                metadata: body.metadata || {}
            };
            currentData.history = [newEntry, ...(currentData.history || [])].slice(0, 100);
        }

        await fs.writeFile(logPath, JSON.stringify(currentData, null, 2));
        return Response.json({ status: 'Neural_Link_Synced', type: body.type });
    } catch (error) {
        return Response.json({ error: 'Neural Link write failed: ' + error.message }, { status: 500 });
    }
}
