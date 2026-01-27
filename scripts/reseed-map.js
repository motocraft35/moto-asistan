const { createClient } = require('@libsql/client');
const fs = require('fs');

async function reseed() {
    const db = createClient({
        url: 'file:moto-asistan.db',
    });

    console.log("Cleaning old locations...");
    await db.execute("DELETE FROM map_locations");

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
            name: 'Petrol Ofisi',
            type: 'fuel',
            lat: 39.086642,
            lng: 26.916775,
            logo: 'https://upload.wikimedia.org/wikipedia/tr/9/90/Petrol_Ofisi_logosu.png',
            desc: 'Petrol Ofisi Dikili İstasyonu.',
            is_partner: 0
        },
        {
            name: 'Opet',
            type: 'fuel',
            lat: 39.084648,
            lng: 26.907838,
            logo: 'https://upload.wikimedia.org/wikipedia/tr/6/6b/Opet_logo.png',
            desc: 'Opet Dikili şubesi.',
            is_partner: 0
        }
    ];

    for (const s of seeds) {
        await db.execute({
            sql: `INSERT INTO map_locations (name, type, latitude, longitude, description, logo_url, is_partner, has_banner, rating, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [s.name, s.type, s.lat, s.lng, s.desc, s.logo, s.is_partner, 0, s.rating || 0.0, s.phone || '', s.address || '']
        });
    }

    console.log("Seed completed successfully.");

    const check = await db.execute("SELECT name, latitude, longitude FROM map_locations WHERE type = 'fuel'");
    console.log("Current Fuel Stations:");
    console.log(JSON.stringify(check.rows, null, 2));
}

reseed().catch(console.error);
