import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { command } = await req.json();
        if (!command) return NextResponse.json({ error: 'Command is required' }, { status: 400 });

        const parts = command.trim().split(/\s+/);
        const action = parts[0].toLowerCase();
        const args = parts.slice(1);

        let output = '';

        switch (action) {
            case 'broadcast': {
                const message = args.join(' ');
                if (!message) throw new Error('Usage: broadcast [message]');

                // Get all users
                const users = await db.execute('SELECT id FROM users');

                // Create messages for each user from 'expert'
                for (const user of users.rows) {
                    await db.execute({
                        sql: 'INSERT INTO messages (userId, content, sender, isRead) VALUES (?, ?, ?, 0)',
                        args: [user.id, message, 'expert']
                    });
                }
                output = `Broadcasted to ${users.rows.length} users: "${message}"`;
                break;
            }

            case 'user': {
                const [id, subAction] = args;
                if (!id || !subAction) throw new Error('Usage: user [id] [action: sub:on|sub:off|master:on|master:off]');

                if (subAction === 'sub:on') {
                    await db.execute({
                        sql: "UPDATE users SET subscriptionStatus = 'Active', subscriptionEndDate = datetime('now', '+30 days') WHERE id = ?",
                        args: [id]
                    });
                    output = `User ${id} subscription activated for 30 days.`;
                } else if (subAction === 'sub:off') {
                    await db.execute({
                        sql: "UPDATE users SET subscriptionStatus = 'Passive' WHERE id = ?",
                        args: [id]
                    });
                    output = `User ${id} subscription deactivated.`;
                } else if (subAction === 'master:on') {
                    await db.execute({
                        sql: "UPDATE users SET isMaster = 1 WHERE id = ?",
                        args: [id]
                    });
                    output = `User ${id} promoted to MASTER.`;
                } else if (subAction === 'master:off') {
                    await db.execute({
                        sql: "UPDATE users SET isMaster = 0 WHERE id = ?",
                        args: [id]
                    });
                    output = `User ${id} demoted from MASTER.`;
                } else {
                    throw new Error(`Unknown user action: ${subAction}`);
                }
                break;
            }

            case 'sys': {
                const [key, ...valueParts] = args;
                const value = valueParts.join(' ');
                if (!key || !value) throw new Error('Usage: sys [key] [value]');

                await db.execute({
                    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
                    args: [key, value]
                });
                output = `System setting updated: ${key} = ${value}`;
                break;
            }

            case 'stats': {
                const users = await db.execute('SELECT COUNT(*) as count FROM users');
                const subs = await db.execute("SELECT COUNT(*) as count FROM users WHERE subscriptionStatus = 'Active'");
                const masters = await db.execute("SELECT COUNT(*) as count FROM users WHERE isMaster = 1");
                const activeSession = await db.execute("SELECT COUNT(*) as count FROM users WHERE lastSeen > datetime('now', '-30 minutes')");

                output = [
                    `--- SYSTEM STATS ---`,
                    `Total Users: ${users.rows[0].count}`,
                    `Premium Users: ${subs.rows[0].count}`,
                    `Active Masters: ${masters.rows[0].count}`,
                    `Active Sessions (30m): ${activeSession.rows[0].count}`,
                    `--- END ---`
                ].join('\n');
                break;
            }

            case 'help': {
                output = [
                    'Available Commands:',
                    '  broadcast [msg]         - Send msg to all users',
                    '  user [id] [action]      - Actions: sub:on, sub:off, master:on, master:off',
                    '  sys [key] [val]         - Update system settings',
                    '  stats                   - View system health',
                    '  help                    - Show this message'
                ].join('\n');
                break;
            }

            default:
                throw new Error(`Unknown command: ${action}. Type 'help' for options.`);
        }

        return NextResponse.json({ output });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
