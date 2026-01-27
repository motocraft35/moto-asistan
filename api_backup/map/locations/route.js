import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    try {
        // 0. Ensure table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS map_locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                description TEXT,
                logo_url TEXT,
                ownerClanId INTEGER,
                is_partner INTEGER DEFAULT 0,
                has_banner INTEGER DEFAULT 0,
                geometry_json TEXT,
                rating REAL DEFAULT 0.0,
                phone TEXT,
                address TEXT,
                website TEXT
            )
        `);

        // Add indexes for performance
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_map_locations_lat_lng ON map_locations(latitude, longitude)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_map_locations_is_partner ON map_locations(is_partner)`);

        const { searchParams } = new URL(request.url);
        const shouldReseed = searchParams.get('reseed') === 'true';

        // Viewport bounds
        const south = parseFloat(searchParams.get('south'));
        const west = parseFloat(searchParams.get('west'));
        const north = parseFloat(searchParams.get('north'));
        const east = parseFloat(searchParams.get('east'));

        const dikiliCheck = await db.execute("SELECT id FROM map_locations WHERE name = 'Enla Costa' AND latitude = 39.0792 LIMIT 1");

        if (dikiliCheck.rows.length === 0 || shouldReseed) {
            if (shouldReseed) {
                await db.execute("DELETE FROM map_locations");
                console.log("Forced re-seed triggered");
            }
            const seeds = [
                {
                    name: 'Enla Costa',
                    type: 'cafe',
                    lat: 39.0792,
                    lng: 26.8870,
                    logo: 'https://instagram.fgzt3-1.fna.fbcdn.net/v/t51.2885-19/444487988_6957263044375109_3927480802807920025_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fgzt3-1.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2QHfeHqdZx8b4DM9Ihscgkr8cbNScsJnTeoVFRfcsXiSY9bByaYIahaOZ7xKd6PeHew&_nc_ohc=U2Vx3FfnW0kQ7kNvwGyz0KW&_nc_gid=9Nl1xVBccPMzVg2mmofnSQ&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfqaxcfvVvlULrrPoPJqJRL0Ung1Bb4B77-cg36zjzgcaA&oe=6965B97E&_nc_sid=8b3546',
                    desc: 'EN La Costa Restaurant & Bar. Vice City sahil esintisi.',
                    is_partner: 1,
                    rating: 4.8,
                    phone: '+90 532 000 00 00',
                    address: 'Dikili Sahil Yolu No: 1'
                },
                {
                    name: 'Lunas',
                    type: 'cafe',
                    lat: 39.0798,
                    lng: 26.8869,
                    logo: 'https://instagram.fgzt3-1.fna.fbcdn.net/v/t51.2885-19/476182783_9531268150269977_4500994728721145824_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby41MDAuYzIifQ&_nc_ht=instagram.fgzt3-1.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2QEdBTwcgS1b2g9AiGfe7Pd5jhEouVerNh6MnTgYfvEEPzAgBWcRnxN8sHV7zeISrwg&_nc_ohc=xBpV6058Bp4Q7kNvwH7adFQ&_nc_gid=0WTT6mXKrk0WOgi_t5VTfw&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfqhACB_YqbaDuB248k4eLU8HiC6Jt6QkVsezNk1MQwyOw&oe=6965E87B&_nc_sid=8b3546',
                    desc: 'Lunas Coffee & Bakery. Neon ışıklar altında taze lezzetler.',
                    is_partner: 1,
                    rating: 4.5,
                    phone: '+90 533 111 22 33',
                    address: 'Dikili Çarşı No: 42'
                },
                {
                    name: 'Taphouse',
                    type: 'meetup',
                    lat: 39.0575,
                    lng: 26.8872,
                    logo: 'https://instagram.fgzt3-2.fna.fbcdn.net/v/t51.2885-19/487838296_1193826455605014_2264928601164204525_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby41MDAuYzIifQ&_nc_ht=instagram.fgzt3-2.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QEdBTwcgS1b2g9AiGfe7Pd5jhEouVerNh6MnTgYfvEEPzAgBWcRnxN8sHV7zeISrwg&_nc_ohc=F6zTGZEuoKgQ7kNvwGo5v2F&_nc_gid=Vz_0Hfs7Hehnopr_kzeyVA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfoY1dxSaI4Ep-nTlWb0CvctF-w1j1LvE84hjwJF7NiL3Q&oe=6965CFBC&_nc_sid=8b3546',
                    desc: 'Taphouse Dikili. Motorcuların buluşma noktası.',
                    is_partner: 1,
                    rating: 4.9,
                    phone: '+90 535 444 55 66',
                    address: 'Dikili Liman Arkası No: 12'
                },
                {
                    name: 'Opet Efeoğlu',
                    type: 'fuel',
                    lat: 39.08462,
                    lng: 26.90785,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Opet_logo.png/640px-Opet_logo.png',
                    desc: 'Opet Dikili istasyonu. (Dikili Yolu)',
                    address: 'Cumhuriyet Mah. Atatürk Cad. No:157',
                    is_partner: 1,
                    rating: 4.2
                },
                {
                    name: 'Hazar Petrol (Merkez)',
                    type: 'fuel',
                    lat: 39.0732,
                    lng: 26.8895,
                    logo: 'https://upload.wikimedia.org/wikipedia/tr/9/90/Petrol_Ofisi_logosu.png',
                    desc: 'Dikili Merkez Akaryakıt İstasyonu.',
                    address: 'Şehit Sami Akbulut Cad. No:5',
                    is_partner: 1,
                    rating: 4.0
                },
                {
                    name: 'Total Ögeler Petrol',
                    type: 'fuel',
                    lat: 39.0797,
                    lng: 26.8969,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/TotalEnergies_logo.svg/640px-TotalEnergies_logo.svg.png',
                    desc: 'TotalEnergies Dikili İstasyonu.',
                    address: 'İsmetpaşa Mah. Atatürk Cad. No:134',
                    is_partner: 1,
                    rating: 4.4
                },
                {
                    name: 'Hazar Petrol (Bergama)',
                    type: 'fuel',
                    lat: 39.1708,
                    lng: 27.1891,
                    logo: 'https://upload.wikimedia.org/wikipedia/tr/9/90/Petrol_Ofisi_logosu.png',
                    desc: 'Bergama Sağancı Akaryakıt İstasyonu.',
                    address: 'Bergama Sağancı Mah.',
                    is_partner: 1,
                    rating: 4.1
                },
                {
                    name: 'Shell Bergama Asfaltı',
                    type: 'fuel',
                    lat: 39.0665,
                    lng: 26.8845,
                    logo: 'https://upload.wikimedia.org/wikipedia/tr/d/d2/Shell_Logo.png',
                    desc: 'Shell Bergama Yolu Girişi.',
                    address: 'Bergama Asfaltı Cad. No:30',
                    is_partner: 1,
                    rating: 4.5
                },
                {
                    name: 'Shell Salihleraltı',
                    type: 'fuel',
                    lat: 39.1663,
                    lng: 26.8400,
                    logo: 'https://upload.wikimedia.org/wikipedia/tr/d/d2/Shell_Logo.png',
                    desc: 'Shell Salihler Köyü Altı istasyonu.',
                    address: 'Dikili-Ayvalık Yolu',
                    is_partner: 1,
                    rating: 4.3
                },
                {
                    name: 'Petrol Ofisi Cesaret',
                    type: 'fuel',
                    lat: 39.0705,
                    lng: 26.8880,
                    logo: 'https://upload.wikimedia.org/wikipedia/tr/9/90/Petrol_Ofisi_logosu.png',
                    desc: 'Petrol Ofisi Dikili İstasyonu.',
                    address: 'İsmetpaşa Mah. Şehit Sami Akbulut Cad. No:3',
                    is_partner: 1,
                    rating: 4.2
                },
                {
                    name: 'Petrol Ofisi Enes',
                    type: 'fuel',
                    lat: 39.1050,
                    lng: 26.9200,
                    logo: 'https://upload.wikimedia.org/wikipedia/tr/9/90/Petrol_Ofisi_logosu.png',
                    desc: 'Petrol Ofisi Kızılçukur istasyonu.',
                    address: 'Kızılçukur Köyü',
                    is_partner: 1,
                    rating: 4.0
                },
                {
                    name: 'Opet Hak Değirmencilik',
                    type: 'fuel',
                    lat: 39.1330,
                    lng: 26.9000,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Opet_logo.png/640px-Opet_logo.png',
                    desc: 'Opet Kabakum şubesi.',
                    address: 'Kabakum Köyü',
                    is_partner: 1,
                    rating: 4.1
                },
                {
                    name: 'Petrol Ofisi Çandarlı',
                    type: 'fuel',
                    lat: 38.9960,
                    lng: 27.0858,
                    logo: 'https://upload.wikimedia.org/wikipedia/tr/9/90/Petrol_Ofisi_logosu.png',
                    desc: 'Petrol Ofisi Çandarlı Girişi.',
                    address: 'Bergama Çandarlı Yolu',
                    is_partner: 1,
                    rating: 4.2
                },
                {
                    name: 'TK Motor Atölyesi',
                    type: 'mechanic',
                    lat: 39.0835,
                    lng: 26.9048,
                    logo: '',
                    desc: 'Dikili Sanayi Sitesi - Profesyonel Motosiklet Bakım ve Onarım Merkezi.',
                    address: 'Sanayi Sitesi, Dikili/İzmir',
                    is_partner: 1,
                    rating: 5.0,
                    phone: '+90 500 000 00 00'
                }
            ];

            for (const s of seeds) {
                await db.execute({
                    sql: `INSERT INTO map_locations (name, type, latitude, longitude, description, logo_url, is_partner, has_banner, rating, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [s.name, s.type, s.lat, s.lng, s.desc, s.logo, s.is_partner, 0, s.rating || 0.0, s.phone || '', s.address || '']
                });
            }
        }

        // 3. Fetch all with owner info and logo_url
        let query = `
            SELECT ml.*, c.name as ownerName, c.logoUrl as ownerLogo, c.flagId
            FROM map_locations ml
            LEFT JOIN clans c ON ml.ownerClanId = c.id
        `;
        let args = [];

        if (!isNaN(south) && !isNaN(north) && !isNaN(west) && !isNaN(east)) {
            query += ` WHERE (ml.latitude >= ? AND ml.latitude <= ? AND ml.longitude >= ? AND ml.longitude <= ?)`;
            args = [south, north, west, east];
        } else {
            query += ` LIMIT 1000`;
        }

        const result = await db.execute({ sql: query, args });
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error('Map API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch locations', details: error.message }, { status: 500 });
    }
}
