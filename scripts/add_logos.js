const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        console.log('--- Adding logo_url column if not exists ---');
        try {
            await db.execute('ALTER TABLE map_locations ADD COLUMN logo_url TEXT');
        } catch (e) {
            console.log('logo_url column might already exist.');
        }

        console.log('--- Updating logos for strategic locations ---');

        const updates = [
            {
                name: 'Enla Costa',
                logo: 'https://instagram.fgzt3-1.fna.fbcdn.net/v/t51.2885-19/444487988_6957263044375109_3927480802807920025_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fgzt3-1.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2QHfeHqdZx8b4DM9Ihscgkr8cbNScsJnTeoVFRfcsXiSY9bByaYIahaOZ7xKd6PeHew&_nc_ohc=U2Vx3FfnW0kQ7kNvwGyz0KW&_nc_gid=9Nl1xVBccPMzVg2mmofnSQ&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfqaxcfvVvlULrrPoPJqJRL0Ung1Bb4B77-cg36zjzgcaA&oe=6965B97E&_nc_sid=8b3546'
            },
            {
                name: 'Lunas',
                logo: 'https://instagram.fgzt3-1.fna.fbcdn.net/v/t51.2885-19/476182783_9531268150269977_4500994728721145824_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby41MDAuYzIifQ&_nc_ht=instagram.fgzt3-1.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2QEdBTwcgS1b2g9AiGfe7Pd5jhEouVerNh6MnTgYfvEEPzAgBWcRnxN8sHV7zeISrwg&_nc_ohc=xBpV6058Bp4Q7kNvwH7adFQ&_nc_gid=0WTT6mXKrk0WOgi_t5VTfw&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfqhACB_YqbaDuB248k4eLU8HiC6Jt6QkVsezNk1MQwyOw&oe=6965E87B&_nc_sid=8b3546'
            },
            {
                name: 'Taphouse',
                logo: 'https://instagram.fgzt3-2.fna.fbcdn.net/v/t51.2885-19/487838296_1193826455605014_2264928601164204525_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby41MDAuYzIifQ&_nc_ht=instagram.fgzt3-2.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QEdBTwcgS1b2g9AiGfe7Pd5jhEouVerNh6MnTgYfvEEPzAgBWcRnxN8sHV7zeISrwg&_nc_ohc=F6zTGZEuoKgQ7kNvwGo5v2F&_nc_gid=Vz_0Hfs7Hehnopr_kzeyVA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfoY1dxSaI4Ep-nTlWb0CvctF-w1j1LvE84hjwJF7NiL3Q&oe=6965CFBC&_nc_sid=8b3546'
            }
        ];

        for (const u of updates) {
            await db.execute({
                sql: 'UPDATE map_locations SET logo_url = ? WHERE name = ?',
                args: [u.logo, u.name]
            });
            console.log(`Logo updated for: ${u.name}`);
        }

        console.log('--- All logos integrated into DB ---');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

run();
