import db from '../lib/db.js';

async function fixCoordinates() {
    try {
        // Clear all geometries
        const clearResult = await db.execute("UPDATE map_locations SET geometry_json = NULL");
        console.log(`Cleared geometry for ${clearResult.rowsAffected} locations.`);

        // Fix Enla Costa (Move slightly West/South to building)
        await db.execute({
            sql: "UPDATE map_locations SET latitude = ?, longitude = ? WHERE name = 'Enla Costa'",
            args: [39.07925, 26.88685]
        });
        console.log("Updated Enla Costa coordinates.");

        // Fix Lunas (Move slightly West to building)
        await db.execute({
            sql: "UPDATE map_locations SET latitude = ?, longitude = ? WHERE name = 'Lunas'",
            args: [39.07998, 26.88675]
        });
        console.log("Updated Lunas coordinates.");

        // Fix Taphouse
        await db.execute({
            sql: "UPDATE map_locations SET latitude = ?, longitude = ? WHERE name = 'Taphouse'",
            args: [39.05763, 26.88705]
        });
        console.log("Updated Taphouse coordinates.");

    } catch (err) {
        console.error("Fix error:", err);
    }
}

fixCoordinates().then(() => process.exit(0));
