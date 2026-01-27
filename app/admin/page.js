import db from '../../lib/db';
import AdminClient from './client';
import AdminNotificationSender from './notifications/client';

export default async function AdminPage() {
    // Fetch all users directly from DB for Admin view
    // In real app, this should be protected by auth!
    const result = await db.execute('SELECT * FROM users ORDER BY createdAt DESC');
    const users = result.rows;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto', height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <a href="/" style={{ fontSize: '1.5rem', textDecoration: 'none', color: '#fff' }}>🏠</a>
                    <h1 className="heading-xl" style={{ margin: 0 }}>YÖNETİCİ PANELİ</h1>
                    <a href="/admin/remote" style={{
                        background: '#0f0',
                        color: '#000',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px #0f0'
                    }}>SHELL</a>
                    <a href="/admin/requests" style={{
                        background: '#007AFF',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(0, 122, 255, 0.5)'
                    }}>AI İSTEK</a>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                    Admin: <span style={{ color: '#fff' }}>Moto Usta</span>
                </div>
            </div>

            <AdminNotificationSender />
            <div style={{ margin: '20px 0', borderBottom: '1px solid #333' }}></div>
            <AdminClient initialUsers={users} />
        </div>
    );
}
