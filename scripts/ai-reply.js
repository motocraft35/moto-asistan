/**
 * Neural Bridge - AI Reply Tool
 * This script is used by the AI to send a response back to the Master Console.
 */
import db from '../lib/db.js';

const content = process.argv[2];
const userId = process.argv[3] || 1; // Default to Master ID

if (!content) {
    console.error('Usage: node scripts/ai-reply.js "message" [userId]');
    process.exit(1);
}

async function sendReply() {
    try {
        await db.execute({
            sql: 'INSERT INTO developer_requests (content, userId, status) VALUES (?, ?, ?)',
            args: [content, userId, 'ai_response']
        });
        console.log('Neural Response Dispatched: ' + content);
        process.exit(0);
    } catch (err) {
        console.error('Dispatch Error:', err);
        process.exit(1);
    }
}

sendReply();
