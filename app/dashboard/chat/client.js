'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatClient({ userId, userFullName, userPhone, isSubscribed, initialNotificationsEnabled }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [sending, setSending] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
    const prevMessagesLenRef = useRef(0);
    const audioContextRef = useRef(null);

    // Poll for messages every 3 seconds
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [userId, notificationsEnabled]); // re-bind fetchMessages to capture latest state if needed, or better, keep fetch separate

    const playNotificationSound = () => {
        if (!notificationsEnabled) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle'; // Different tone for user
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error('Audio play failed', e);
        }
    };

    const toggleNotifications = async () => {
        const newState = !notificationsEnabled;
        setNotificationsEnabled(newState);
        try {
            await fetch('/api/users/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, enabled: newState })
            });
        } catch (e) {
            console.error('Failed to save setting', e);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chat?userId=${userId}&t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.messages) {
                // Check if new message arrived
                if (data.messages.length > prevMessagesLenRef.current) {
                    // Only play if the LAST message is from expert (or auto-reply)
                    // We don't want to beep when WE send a message
                    const lastMsg = data.messages[data.messages.length - 1];
                    if (lastMsg.sender !== 'user' && prevMessagesLenRef.current > 0) {
                        playNotificationSound();
                    }
                }

                setMessages(data.messages);
                prevMessagesLenRef.current = data.messages.length;
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    content: newMessage,
                    sender: 'user'
                })
            });
            if (res.ok) {
                setNewMessage('');
                fetchMessages(); // Update immediately
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh', // Use dvh for mobile viewports
            maxWidth: '600px',
            margin: 'auto',
            background: '#1a1a1a',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                padding: '15px 20px',
                paddingTop: 'calc(15px + env(safe-area-inset-top))', // Fix overlapping status bar
                background: '#1a1a1a',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🔧
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Moto-Asistan Ustası</h3>
                        <span style={{ fontSize: '0.7rem', color: '#00d2ff' }}>Çevrimiçi</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Notification Toggle */}
                    <button onClick={toggleNotifications} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                        {notificationsEnabled ? '🔔' : '🔕'}
                    </button>

                    {/* WhatsApp Button (Active for all, Alert for Guests) */}
                    <button
                        onClick={() => {
                            if (isSubscribed) {
                                window.open('https://wa.me/905414684047', '_blank');
                            } else {
                                setShowPremiumModal(true);
                            }
                        }}
                        style={{
                            background: 'var(--success)',
                            color: '#000',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        <span>WhatsApp</span>
                        {!isSubscribed && <span style={{ fontSize: '0.8rem' }}>🔒</span>}
                    </button>

                    {/* Back Button */}
                    <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem' }}>
                        ✕
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                {loading && <p style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>Yükleniyor...</p>}

                {messages.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>
                        <p>Henüz mesaj yok.</p>
                        <p style={{ fontSize: '0.8rem' }}>Ustamıza sorunu yazabilirsin.</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender === 'user';
                    return (
                        <div key={msg.id} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                        }}>
                            <div style={{
                                padding: '10px 15px',
                                borderRadius: '15px',
                                background: isMe ? 'var(--primary)' : '#333',
                                color: isMe ? '#000' : '#fff',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                borderBottomRightRadius: isMe ? '2px' : '15px',
                                borderBottomLeftRadius: isMe ? '15px' : '2px'
                            }}>
                                {msg.content}
                            </div>
                            <span style={{
                                display: 'block',
                                fontSize: '0.6rem',
                                color: '#666',
                                marginTop: '4px',
                                textAlign: isMe ? 'right' : 'left'
                            }}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} style={{
                padding: '15px',
                paddingBottom: 'calc(15px + env(safe-area-inset-bottom))', // Fix overlapping home bar
                background: '#222',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '10px'
            }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '25px',
                        border: '1px solid #444',
                        background: '#111',
                        color: '#fff',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: sending ? '#666' : 'var(--primary)',
                        border: 'none',
                        color: '#000',
                        fontSize: '1.2rem',
                        cursor: sending ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ➤
                </button>
            </form>

            {/* PREMIUM MODAL */}
            {showPremiumModal && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '300px', animation: 'fadeIn 0.3s' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
                        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Premium Özellik</h3>
                        <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Ustamıza WhatsApp üzerinden fotoğraf/video atmak ve anlık sesli destek almak için Premium üye olmalısınız.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowPremiumModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #444',
                                    background: 'transparent',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                Kapat
                            </button>
                            <a
                                href="/payment" // Assuming we have a payment redirection mechanism or just show info
                                onClick={(e) => {
                                    // Normally redirect, but for demo we can just let it go or show another alert
                                    // e.preventDefault();
                                    // alert('Ödeme sayfasına yönlendiriliyorsunuz... (Demo)');
                                    setShowPremiumModal(false);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'var(--primary)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-block'
                                }}
                            >
                                Premium Ol
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
