import db from '../lib/db.js';

async function check() {
    try {
        const result = await db.execute('SELECT name, type, latitude, longitude, is_partner, geometry_json FROM map_locations');
        console.log(JSON.stringify(result.rows, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));
    } catch (err) {
        console.error(err);
    }
}

check();
