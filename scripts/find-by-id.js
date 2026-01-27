const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Manually parse .env since I can't read it via tool but node can
function getEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
            }
        });
        return env;
    }
    return {};
}

async function run() {
    const env = getEnv();
    const url = env.TURSO_DATABASE_URL;
    const authToken = env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error("No TURSO_DATABASE_URL found in .env");
        process.exit(1);
    }

    const db = createClient({ url, authToken });

    console.log("Searching for IDs 193 and 194...");
    const result = await db.execute("SELECT id, name, type, latitude, longitude, description FROM map_locations WHERE id IN (193, 194)");
    console.log(JSON.stringify(result.rows, null, 2));
}

run().catch(console.error);
