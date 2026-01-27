'use client';

import { useState, useEffect } from 'react';

export default function AIRequests() {
    const [request, setRequest] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            if (data.requests) setHistory(data.requests);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!request.trim() || loading) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: request })
            });

            if (res.ok) {
                setRequest('');
                setMessage('İsteğiniz iletildi! AI asistanı bunu ilk fırsatta inceleyecek.');
                fetchHistory();
                setTimeout(() => setMessage(''), 5000);
            }
        } catch (error) {
            setMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            color: '#fff',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            <div style={{ maxWidth: '600px', margin: 'auto' }}>
                <a href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>← Panel</a>

                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '10px' }}>AI GÜNCELLEME HATTI</h1>
                <p style={{ color: '#888', marginBottom: '30px' }}>Programda neyi güncellememi veya yapmamı istediğinizi buraya yazın.</p>

                {message && (
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        border: '1px solid var(--primary)',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        color: 'var(--primary)',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
                    <textarea
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        placeholder="Örn: Ana sayfadaki logoyu sağa çek, yeni bir mesaj gelince ses çalmasını sağla..."
                        style={{
                            width: '100%',
                            height: '150px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            color: '#fff',
                            padding: '15px',
                            fontSize: '1rem',
                            outline: 'none',
                            marginBottom: '15px',
                            resize: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !request.trim()}
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '12px',
                            background: 'var(--primary)',
                            color: '#000',
                            fontWeight: 'bold',
                            border: 'none',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            opacity: (loading || !request.trim()) ? 0.5 : 1
                        }}
                    >
                        {loading ? 'GÖNDERİLİYOR...' : 'YAPAY ZEKAYA İLET'}
                    </button>
                </form>

                <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>İstek Geçmişi</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {history.map((h) => (
                        <div key={h.id} style={{
                            background: '#1a1a1a',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid #222',
                            position: 'relative'
                        }}>
                            <div style={{ fontSize: '0.95rem', marginBottom: '8px' }}>{h.content}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: '#555' }}>
                                    {new Date(h.timestamp).toLocaleString('tr-TR')}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    background: h.status === 'pending' ? '#333' : '#4CAF50',
                                    color: h.status === 'pending' ? '#888' : '#fff'
                                }}>
                                    {h.status === 'pending' ? 'Bekliyor' : 'Yapıldı'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#444', marginTop: '20px' }}>Henüz bir isteğiniz bulunmuyor.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
