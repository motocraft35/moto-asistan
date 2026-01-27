const { createClient } = require('@libsql/client');

async function listLocations() {
    const db = createClient({
        url: 'file:moto-asistan.db',
    });

    const result = await db.execute("SELECT id, name, type, latitude, longitude, description FROM map_locations");
    console.log(JSON.stringify(result.rows, null, 2));
}

listLocations().catch(console.error);
