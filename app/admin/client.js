'use client';

import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function AdminClient({ initialUsers }) {
    const { showAlert, showConfirm } = useNotifications();
    const [users, setUsers] = useState(initialUsers);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const messagesEndRef = useRef(null);
    const audioContextRef = useRef(null);
    const prevUsersRef = useRef(initialUsers);

    // Initial fetch for settings
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.notificationsEnabled !== undefined) {
                    setNotificationsEnabled(data.notificationsEnabled);
                }
            });
    }, []);

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

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
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
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newState })
            });
        } catch (e) {
            console.error('Failed to save setting', e);
        }
    };

    // Poll for users list (to see new unread messages)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/admin/users?t=' + Date.now(), { cache: 'no-store' });
                const data = await res.json();
                if (data.users) {
                    // Check for new unread messages
                    let hasNewUnread = false;
                    data.users.forEach(newUser => {
                        const oldUser = prevUsersRef.current.find(u => u.id === newUser.id);
                        if (oldUser && newUser.unreadCount > oldUser.unreadCount) {
                            hasNewUnread = true;
                        } else if (!oldUser && newUser.unreadCount > 0) {
                            hasNewUnread = true;
                        }
                    });

                    if (hasNewUnread) {
                        playNotificationSound();
                    }

                    setUsers(data.users);
                    prevUsersRef.current = data.users;
                }
            } catch (error) {
                console.error("Error fetching users", error);
            }
        };

        const interval = setInterval(fetchUsers, 5000); // Check every 5s
        return () => clearInterval(interval);
    }, [notificationsEnabled]); // Dependency ensures state is fresh for sound

    // Derived state for selected user
    const selectedUser = users.find(u => u.id === selectedUserId);

    // Effect: Poll for messages when a user is selected AND Mark as Read
    useEffect(() => {
        if (!selectedUserId) {
            setMessages([]);
            return;
        }

        // Fetch immediately
        fetchMessages(selectedUserId);
        markAsRead(selectedUserId); // Mark as read when opening

        // Set up polling
        const interval = setInterval(() => {
            fetchMessages(selectedUserId);
            // Only mark as read if we are actively looking (simplification: yes we are if selected)
            // But we don't want to spam the read API. 
            // In a pro app, we'd check if window is focused etc. 
            // For now, let's just mark read on interval too to clear incoming messages while chat is open.
            markAsRead(selectedUserId);
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedUserId]);

    const markAsRead = async (userId) => {
        try {
            // We need an endpoint for this. I will assume /api/chat/read exists or create it.
            // Wait, I haven't created it yet. I need to create /api/chat/read first.
            // I'll add the call here, but I must create the endpoint next.
            await fetch('/api/chat/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            // Optimistically update local users state to remove unread count
            setUsers(prevUsers => prevUsers.map(u =>
                u.id === userId ? { ...u, unreadCount: 0 } : u
            ));
        } catch (error) {
            // ignore silent errors
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const res = await fetch(`/api/chat?userId=${userId}&t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserId || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    content: newMessage,
                    sender: 'expert'
                })
            });
            if (res.ok) {
                setNewMessage('');
                fetchMessages(selectedUserId);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const endChat = async (userId) => {
        const confirmed = await showConfirm('Sohbeti sonlandırmak istediğinize emin misiniz? (Otomatik cevap sistemi başa dönecektir)');
        if (!confirmed) return;

        try {
            const res = await fetch('/api/admin/chat/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                fetchMessages(userId); // Refresh to see system message
                showAlert('Sohbet başarıyla sonlandırıldı.');
            }
        } catch (error) {
            console.error('Error ending chat:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '20px', marginTop: 'calc(20px + env(safe-area-inset-top))' }}>

            {/* CONTROL BAR */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                <button
                    onClick={toggleNotifications}
                    style={{
                        background: notificationsEnabled ? 'var(--success)' : '#444',
                        color: notificationsEnabled ? '#000' : '#aaa',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    {notificationsEnabled ? '🔔 Açık' : '🔕 Kapalı'}
                </button>
            </div>

            {/* LEFT SIDEBAR: USER LIST */}
            <div className="glass-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Sürücüler ({users.length})</h3>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            style={{
                                padding: '15px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                background: selectedUserId === user.id ? 'var(--primary-glow)' : 'transparent',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            {/* UNREAD INDICATOR */}
                            {user.unreadCount > 0 ? (
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: 'var(--error)', color: '#fff', fontSize: '0.7rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }}>
                                    {user.unreadCount}
                                </div>
                            ) : (
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: user.subscriptionStatus === 'Active' ? 'var(--success)' : '#666'
                                }}></div>
                            )}

                            <div>
                                <div style={{ fontWeight: 'bold', color: '#fff' }}>{user.licensePlate}</div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{user.fullName}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE: CHAT WINDOW */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div style={{
                            padding: '15px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{selectedUser.fullName}</h3>
                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                        {selectedUser.licensePlate} • {selectedUser.phoneNumber} •
                                        <span style={{ color: selectedUser.subscriptionStatus === 'Active' ? 'var(--success)' : '#ccc', marginLeft: '5px' }}>
                                            {selectedUser.subscriptionStatus === 'Active' ? 'PREMIUM' : 'Misafir'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => endChat(selectedUserId)}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.1)',
                                        border: '1px solid var(--error)',
                                        color: 'var(--error)',
                                        padding: '5px 15px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Sohbeti Bitir
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', background: '#1a1a1a' }}>
                            {messages.length === 0 && (
                                <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>
                                    <p>Bu kullanıcı ile henüz mesajlaşma yok.</p>
                                </div>
                            )}

                            {messages.map((msg) => {
                                const isMe = msg.sender === 'expert';
                                return (
                                    <div key={msg.id} style={{
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                    }}>
                                        <div style={{
                                            padding: '10px 15px',
                                            borderRadius: '15px',
                                            background: isMe ? 'var(--primary)' : '#444',
                                            color: isMe ? '#000' : '#fff',
                                            fontSize: '0.95rem'
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

                        {/* Input */}
                        <form onSubmit={sendMessage} style={{
                            padding: '20px',
                            background: '#222',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Cevabınızı yazın..."
                                style={{
                                    flex: 1,
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #444',
                                    background: '#111',
                                    color: '#fff',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="btn-primary"
                                style={{
                                    padding: '0 30px',
                                    fontSize: '1rem',
                                    borderRadius: '8px',
                                    cursor: sending ? 'wait' : 'pointer'
                                }}
                            >
                                GÖNDER
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexDirection: 'column' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💬</div>
                        <h3>Bir sohbet seçin</h3>
                        <p>Mesajlarını görmek için soldaki listeden bir sürücü seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
