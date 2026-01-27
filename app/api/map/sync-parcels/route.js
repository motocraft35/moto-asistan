
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
    try {
        const { bounds } = await req.json(); // { south, west, north, east }

        const overpassUrl = "https://overpass-api.de/api/interpreter";
        const query = `
            [out:json][timeout:60];
            (
              node["amenity"~"cafe|fuel"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
              way["amenity"~"cafe|fuel"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
              relation["amenity"~"cafe|fuel"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
            );
            out body;
            >;
            out skel qt;
        `;

        const response = await fetch(overpassUrl, {
            method: "POST",
            body: query
        });

        const data = await response.json();
        const elements = data.elements || [];

        // Helper to find geometry for a way/relation
        const findGeometry = (el, allElements) => {
            if (el.geometry) return el.geometry.map(g => [g.lat, g.lon]);
            if (el.nodes) {
                return el.nodes.map(nodeId => {
                    const node = allElements.find(e => e.id === nodeId);
                    return node ? [node.lat, node.lon] : null;
                }).filter(n => n !== null);
            }
            if (el.members) {
                // Simplified relation handling
                const outer = el.members.find(m => m.role === 'outer' || m.type === 'way');
                if (outer) {
                    const way = allElements.find(e => e.id === outer.ref);
                    if (way) return findGeometry(way, allElements);
                }
            }
            return null;
        };

        let count = 0;
        for (const el of elements) {
            // Include everything that is a building or has a name
            if ((el.tags && (el.tags.name || el.tags.building || el.tags.shop || el.tags.amenity))) {
                const name = el.tags.name || (el.tags.building ? `Blok #${el.id.toString().slice(-4)}` : 'İsimsiz Yapı');
                const type = el.tags.amenity === 'fuel' ? 'fuel' : (['community_centre', 'social_facility'].includes(el.tags.amenity) ? 'meetup' : 'cafe');
                const lat = el.lat || (el.center ? el.center.lat : null);
                const lng = el.lon || (el.center ? el.center.lon : null);

                if (!lat || !lng) continue;

                let geometryJson = null;
                if (el.type === 'way' || el.type === 'relation') {
                    const coords = findGeometry(el, elements);
                    if (coords) geometryJson = JSON.stringify(coords);
                }

                // Skip points if they don't have a specific name and aren't an amenity
                if (el.type === 'node' && !el.tags.name && !el.tags.amenity) continue;

                const contact = el.tags['contact:phone'] || el.tags.phone || '';
                const website = el.tags['contact:website'] || el.tags.website || '';
                const address = el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : '';
                const parcelRef = el.tags['ref'] || el.tags['lot'] || '';

                // Check if already exists
                const existing = await db.execute({
                    sql: "SELECT id FROM map_locations WHERE (name = ? AND latitude = ?) OR (geometry_json = ? AND geometry_json IS NOT NULL) LIMIT 1",
                    args: [name, lat, geometryJson]
                });

                if (existing.rows.length === 0) {
                    await db.execute({
                        sql: `INSERT INTO map_locations (name, type, latitude, longitude, description, is_partner, geometry_json, phone, website, address) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        args: [name, type, lat, lng, el.tags.name ? `${name} - Keşfedilen İşletme` : `Sektör Yapısı - ${parcelRef}`, 0, geometryJson, contact, website, address]
                    });
                    count++;
                }
            }
        }

        return NextResponse.json({ success: true, added: count });
    } catch (error) {
        console.error('OSM Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed', details: error.message }, { status: 500 });
    }
}
