'use client';

import { useState } from 'react';

export default function AdminNotificationSender() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('/dashboard');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');

    const sendPush = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult('');

        try {
            const res = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, url })
            });
            const data = await res.json();

            if (res.ok) {
                setResult(`Başarılı! ${data.count} kişiye gönderildi.`);
                setTitle('');
                setMessage('');
            } else {
                setResult('Hata: ' + data.error);
            }
        } catch (err) {
            setResult('Bir hata oluştu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>📢 Bildirim Gönder (Push)</h3>

            <form onSubmit={sendPush} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>Başlık</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="input-field"
                        placeholder="Örn: %50 İndirim!"
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>Mesaj</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="input-field"
                        placeholder="Bildirim metni..."
                        rows={3}
                        required
                    ></textarea>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>Yönlendirme Linki</label>
                    <input
                        type="text"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        className="input-field"
                        placeholder="/dashboard"
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ background: loading ? '#555' : 'var(--primary)' }}
                >
                    {loading ? 'Gönderiliyor...' : 'GÖNDER'}
                </button>
            </form>

            {result && (
                <div style={{ marginTop: '15px', padding: '10px', background: result.includes('Hata') ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)', borderRadius: '5px' }}>
                    {result}
                </div>
            )}
        </div>
    );
}
