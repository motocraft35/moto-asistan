'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function CommunityChatClient({ user }) {
    const { showAlert } = useNotifications();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [showVideoInput, setShowVideoInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0); // Cooldown in seconds
    const messagesEndRef = useRef(null);

    // Initial Load & Polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cooldown Timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/community');
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || cooldown > 0) return;

        setLoading(true);
        try {
            const res = await fetch('/api/community', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    content: newMessage,
                    videoUrl: videoUrl.trim() || null
                })
            });

            if (res.status === 429) {
                const data = await res.json();
                showAlert(data.error);
                setCooldown(60); // Force UI cooldown
            } else if (res.ok) {
                setNewMessage('');
                setVideoUrl('');
                setShowVideoInput(false);
                fetchMessages();
                setCooldown(60); // Start lockout
            } else {
                showAlert('Mesaj gönderilemedi.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {/* Header */}
            <div style={{
                padding: '15px',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
            }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>✕</button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>📢 GENEL SOHBET</h2>
                    <span style={{ fontSize: '0.7rem', color: '#aaa' }}>Tüm Motorcular Burada</span>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.map(msg => {
                    const isMe = msg.fullName === user.fullName; // Simple ID check better but this works for display
                    const isVIP = msg.subscriptionStatus === 'Active';

                    return (
                        <div key={msg.id} style={{
                            background: isMe ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.05)',
                            padding: '10px 15px',
                            borderRadius: '10px',
                            borderLeft: isVIP ? '3px solid gold' : '3px solid transparent'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                <div
                                    onClick={() => router.push(`/dashboard/profile/${msg.userId}`)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        background: '#333',
                                        overflow: 'hidden',
                                        border: isVIP ? '1px solid gold' : '1px solid #555',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {msg.profileImage ? (
                                            <img src={msg.profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '0.8rem' }}>👤</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isMe ? 'var(--primary)' : '#fff' }}>
                                                {msg.licensePlate}
                                            </span>
                                            {/* Rank Badge */}
                                            {msg.rank === 'Gold' && <span title="Usta Şoför (500+ Saat)">🥇</span>}
                                            {msg.rank === 'Silver' && <span title="Deneyimli (150+ Saat)">🥈</span>}
                                            {msg.rank === 'Bronze' && <span title="Yolcu (50+ Saat)">🥉</span>}

                                            {/* VIP Badge */}
                                            {isVIP && (
                                                <span style={{
                                                    background: 'gold',
                                                    color: 'black',
                                                    fontSize: '0.6rem',
                                                    padding: '1px 4px',
                                                    borderRadius: '3px',
                                                    fontWeight: 'bold'
                                                }}>VIP</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.95rem', wordBreak: 'break-word', paddingLeft: '38px' }}>
                                {msg.content}
                            </div>

                            {/* Video Embed */}
                            {msg.videoUrl && (
                                <div style={{ marginTop: '10px', borderRadius: '10px', overflow: 'hidden' }}>
                                    {msg.videoUrl.includes('youtube.com') || msg.videoUrl.includes('youtu.be') ? (
                                        <iframe
                                            width="100%"
                                            height="200"
                                            src={`https://www.youtube.com/embed/${msg.videoUrl.split('v=')[1]?.split('&')[0] ||
                                                msg.videoUrl.split('youtu.be/')[1]?.split('?')[0]
                                                }`}
                                            title="YouTube video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <video controls width="100%" style={{ borderRadius: '10px' }}>
                                            <source src={msg.videoUrl} type="video/mp4" />
                                            Video formatı desteklenmiyor.
                                        </video>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} style={{
                padding: '15px',
                background: '#222',
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* VIP Promo / Cooldown Info */}
                {!loading && cooldown > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '0.8rem', color: '#aaa' }}>
                        ⏳ Bir sonraki mesaj için: <span style={{ color: '#fff', fontWeight: 'bold' }}>{cooldown}sn</span>
                    </div>
                )}

                {showVideoInput && (
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '5px' }}>
                        <input
                            className="input-field"
                            placeholder="Video Linki (YouTube veya MP4)..."
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '8px' }}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setShowVideoInput(!showVideoInput)}
                        style={{ background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '5px', padding: '0 10px', cursor: 'pointer' }}
                        title="Video Ekle"
                    >
                        🎥
                    </button>
                    <input
                        className="input-field"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={cooldown > 0 ? "Lütfen bekleyin..." : "Mesaj yaz..."}
                        disabled={cooldown > 0}
                        style={{ margin: 0, flex: 1, opacity: cooldown > 0 ? 0.5 : 1 }}
                    />
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || cooldown > 0}
                        style={{ margin: 0, padding: '0 20px', background: cooldown > 0 ? '#555' : 'var(--primary)' }}
                    >
                        ➤
                    </button>
                </div>
                {user.subscriptionStatus !== 'Active' && (
                    <p style={{ fontSize: '0.7rem', color: '#666', textAlign: 'center', marginTop: '10px' }}>
                        ⭐ VIP Üyelerin ismi <span style={{ color: 'gold' }}>Altın</span> renkte görünür.
                    </p>
                )}
            </form>
        </div>
    );
}
