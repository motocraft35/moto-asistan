/**
 * Neural Bridge - Local Relay Script
 * This script runs locally on the PC to bridge the Turso DB with the Antigravity AI.
 */
import db from '../lib/db.js';
import fs from 'fs';
import path from 'path';

const BRIDGE_LOG_PATH = path.resolve(process.cwd(), '.neural_bridge.log');

console.log('--- NEURAL BRIDGE LOCAL RELAY STARTED ---');
console.log('Monitoring developer_requests in Turso...');

async function pollBridge() {
    try {
        // Find pending user requests
        const res = await db.execute({
            sql: 'SELECT * FROM developer_requests WHERE status = ? ORDER BY timestamp ASC',
            args: ['pending']
        });

        if (res.rows.length > 0) {
            for (const row of res.rows) {
                const logEntry = `[${new Date().toISOString()}] REMOTE_COMMAND: ${row.content}\n`;

                // Append to local log file that the AI (Antigravity) can see
                fs.appendFileSync(BRIDGE_LOG_PATH, logEntry);

                console.log(`Received Remote Command: ${row.content}`);

                // Mark as processed/received
                await db.execute({
                    sql: 'UPDATE developer_requests SET status = ? WHERE id = ?',
                    args: ['processed', row.id]
                });
            }
        }
    } catch (err) {
        if (err.message.includes('no such table')) {
            console.log('Note: Tables not ready yet, waiting...');
        } else {
            console.error('Bridge Error:', err);
        }
    }
}

// Poll every 5 seconds
setInterval(pollBridge, 5000);
pollBridge();
