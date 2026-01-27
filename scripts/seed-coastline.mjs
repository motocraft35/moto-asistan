import db from '../lib/db.js';

const DISRICT_BOUNDS = {
    south: 39.070,
    west: 26.885,
    north: 39.085,
    east: 26.892
};

async function seed() {
    console.log("Starting Targeted Partner Synchronization...");

    const query = `[out:json][timeout:30];(way["name"~"Enla Costa|Lunas|Taphouse",i];node["name"~"Enla Costa|Lunas|Taphouse",i];);out body center;>;out skel qt;`;
    const overpassUrl = `https://vps6.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;


    try {
        const response = await fetch(overpassUrl);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON.");
            return;
        }

        const elements = data.elements || [];
        console.log(`Fetched ${elements.length} elements from OSM.`);
        if (elements.length > 0) {
            console.log("First 5 elements sample:", JSON.stringify(elements.slice(0, 5), null, 2));
        }


        const findGeometry = (el, allElements) => {
            if (el.geometry) return el.geometry.map(g => [g.lat, g.lon]);
            if (el.nodes) {
                return el.nodes.map(nodeId => {
                    const node = allElements.find(e => e.id === nodeId);
                    return node ? [node.lat, node.lon] : null;
                }).filter(n => n !== null);
            }
            if (el.members) {
                const outer = el.members.find(m => m.role === 'outer' || m.type === 'way');
                if (outer) {
                    const way = allElements.find(e => e.id === outer.ref);
                    if (way) return findGeometry(way, allElements);
                }
            }
            return null;
        };

        let count = 0;
        let updated = 0;

        for (const el of elements) {
            if (el.tags && (el.tags.name || el.tags.building || el.tags.shop || el.tags.amenity)) {
                const rawName = el.tags.name || (el.tags.building ? `Blok #${el.id.toString().slice(-4)}` : 'İsimsiz Yapı');
                const name = rawName.toUpperCase('tr-TR');

                const type = el.tags.amenity === 'fuel' ? 'fuel' : (['community_centre', 'social_facility', 'meetup'].includes(el.tags.amenity) ? 'meetup' : 'cafe');
                const lat = el.lat || (el.center ? el.center.lat : null);
                const lng = el.lon || (el.center ? el.center.lon : null);

                if (!lat || !lng) continue;

                let geometryJson = null;
                if (el.type === 'way' || el.type === 'relation') {
                    const coords = findGeometry(el, elements);
                    if (coords) geometryJson = JSON.stringify(coords);
                }

                if (el.type === 'node' && !el.tags.name && !el.tags.amenity) continue;

                const contact = el.tags['contact:phone'] || el.tags.phone || '';
                const website = el.tags['contact:website'] || el.tags.website || '';
                const address = el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : '';

                // Check if exists - Improved matching for Partners
                let existingMatch = await db.execute({
                    sql: `SELECT id, name FROM map_locations 
                          WHERE (name = ?) 
                             OR (LOWER(name) LIKE LOWER(?))
                             OR (ABS(latitude - ?) < 0.0005 AND ABS(longitude - ?) < 0.0005)`,
                    args: [rawName, `%${rawName}%`, lat, lng]
                });

                // If no direct map found, check the other way (is rawName a substring of an existing location?)
                if (existingMatch.rows.length === 0) {
                    existingMatch = await db.execute({
                        sql: "SELECT id, name FROM map_locations WHERE LOWER(?) LIKE LOWER('%' || name || '%')",
                        args: [rawName]
                    });
                }

                if (existingMatch.rows.length > 0) {
                    const matchedLoc = existingMatch.rows[0];
                    if (geometryJson) {
                        await db.execute({
                            sql: "UPDATE map_locations SET geometry_json = ? WHERE id = ?",
                            args: [geometryJson, matchedLoc.id]
                        });
                        if (matchedLoc.name === 'Enla Costa' || matchedLoc.name === 'Lunas' || matchedLoc.name === 'Taphouse') {
                            console.log(`Matched Partner Geometry: ${matchedLoc.name}`);
                        }
                        updated++;
                    }
                } else {
                    await db.execute({
                        sql: `INSERT INTO map_locations (name, type, latitude, longitude, description, is_partner, geometry_json, phone, website, address) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        args: [rawName, type, lat, lng, el.tags.name ? `${rawName} - Keşfedilen İşletme` : `Sektör Yapısı`, 0, geometryJson, contact, website, address]
                    });
                    count++;
                }
            }
        }


        console.log(`Synchronization Complete.`);
        console.log(`Added: ${count} new parcels.`);
        console.log(`Updated: ${updated} existing locations with geometry.`);

    } catch (error) {
        console.error("Sync Error:", error);
    }
}

seed().then(() => process.exit(0));
