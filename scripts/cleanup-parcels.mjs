import db from '../lib/db.js';

async function cleanup() {
    try {
        const result = await db.execute("DELETE FROM map_locations WHERE description = 'Sektör Yapısı' OR name LIKE 'Blok #%' OR name = 'İsimsiz Yapı'");
        console.log(`Deleted: ${result.rowsAffected} generic buildings.`);

        // Let's also verify how many are left and what mereka are
        const remaining = await db.execute("SELECT name, is_partner FROM map_locations");
        console.log(`Remaining locations: ${remaining.rows.length}`);
        console.log(remaining.rows.map(r => r.name).join(', '));
    } catch (err) {
        console.error("Cleanup error:", err);
    }
}

cleanup().then(() => process.exit(0));
