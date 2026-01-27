'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function MessagesClient({ user }) {
    const { showAlert } = useNotifications();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialOtherUserId = searchParams.get('chatWith');

    const [view, setView] = useState(initialOtherUserId ? 'chat' : 'list'); // 'list', 'search', 'chat'
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null); // The user we are chatting with
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const pollingRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (initialOtherUserId) {
            // Fetch details of the user we want to chat with, then switch to chat view
            // For simplicity, we might just need to rely on the list or search. 
            // But if we clicked a notification, we need a way to load 'otherUser' info.
            // Let's implement a quick fetch for specific user details if needed, or just handle it via flow.
            // For now, let's stick to list view unless we have object.
        }
        fetchConversations();
    }, []);

    // Polling for List View
    useEffect(() => {
        if (view === 'list') {
            const interval = setInterval(fetchConversations, 5000);
            return () => clearInterval(interval);
        }
    }, [view]);

    // Polling for Chat View
    useEffect(() => {
        if (view === 'chat' && otherUser) {
            fetchMessages(otherUser.id);
            const interval = setInterval(() => fetchMessages(otherUser.id), 2000); // Faster polling for chat
            return () => clearInterval(interval);
        }
    }, [view, otherUser]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, view]);

    const fetchConversations = async () => {
        try {
            const res = await fetch(`/api/chat/private/list?userId=${user.id}`);
            const data = await res.json();
            if (data.conversations) {
                setConversations(data.conversations);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMessages = async (partnerId) => {
        try {
            const res = await fetch(`/api/chat/private?userId=${user.id}&otherUserId=${partnerId}`);
            const data = await res.json();
            if (data.messages) {
                // If we have new messages, update state
                setMessages(data.messages);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/users/search?plate=${searchText}`);
            const data = await res.json();
            setSearchResults(data.users || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const startChat = (partner) => {
        if (partner.id === user.id) {
            showAlert("Kendinizle konuşamazsınız!");
            return;
        }
        setOtherUser(partner);
        setMessages([]); // Clear previous
        fetchMessages(partner.id);
        setView('chat');
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !otherUser) return;

        const tempMsg = {
            id: Date.now(),
            senderId: user.id,
            receiverId: otherUser.id,
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        // Optimistic UI
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        try {
            await fetch('/api/chat/private', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: user.id,
                    receiverId: otherUser.id,
                    content: tempMsg.content
                })
            });
            fetchMessages(otherUser.id); // Sync
        } catch (e) {
            console.error(e);
            showAlert('Mesaj gönderilemedi');
        }
    };

    // --- VIEWS ---

    if (view === 'list') {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>💬 MESAJLARIN</h2>
                        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.5rem' }}>✕</button>
                    </div>

                    <button
                        onClick={() => setView('search')}
                        className="btn-primary"
                        style={{ width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        <span>🔍</span> YENİ SOHBET BAŞLAT
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {conversations.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px' }}>
                            <p>Henüz mesajın yok.</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.otherUserId}
                                onClick={() => startChat({ id: conv.otherUserId, fullName: conv.fullName, licensePlate: conv.licensePlate })}
                                style={{
                                    padding: '15px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                    👤
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{conv.licensePlate}</h4>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {conv.senderId === user.id ? 'Siz: ' : ''}{conv.lastMessage}
                                    </p>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#666' }}>
                                    {new Date(conv.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (view === 'search') {
        return (
            <div style={{ padding: '20px', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>←</button>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Kullanıcı Ara</h2>
                </div>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Plaka Girin (Örn: 34...)"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ margin: 0 }}
                    />
                    <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0 20px', margin: 0 }}>Ara</button>
                </form>

                <div>
                    {searchResults.map(result => (
                        <div
                            key={result.id}
                            onClick={() => startChat(result)}
                            style={{
                                padding: '15px',
                                background: '#222',
                                borderRadius: '8px',
                                marginBottom: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                border: '1px solid #333'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{result.licensePlate}</div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{result.fullName}</div>
                            </div>
                            <button style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '5px 10px', borderRadius: '5px' }}>MESAJ AT</button>
                        </div>
                    ))}
                    {searchResults.length === 0 && !loading && searchText && (
                        <p style={{ textAlign: 'center', color: '#aaa' }}>Kullanıcı bulunamadı.</p>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'chat' && otherUser) {
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
                    <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>←</button>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{otherUser.licensePlate}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{otherUser.fullName}</span>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {messages.map(msg => {
                        const isMe = msg.senderId === user.id;
                        return (
                            <div key={msg.id} style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '75%',
                            }}>
                                <div style={{
                                    padding: '10px 15px',
                                    borderRadius: '15px',
                                    background: isMe ? 'var(--primary)' : '#333',
                                    color: isMe ? '#000' : '#fff',
                                    borderRadiusTopRight: isMe ? '2px' : '15px',
                                    borderRadiusTopLeft: isMe ? '15px' : '2px',
                                }}>
                                    {msg.content}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '3px', textAlign: isMe ? 'right' : 'left' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} style={{
                    padding: '15px',
                    background: '#222',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    gap: '10px'
                }}>
                    <input
                        className="input-field"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Mesaj yaz..."
                        style={{ margin: 0, flex: 1 }}
                    />
                    <button type="submit" className="btn-primary" style={{ margin: 0, padding: '0 20px' }}>➤</button>
                </form>
            </div>
        );
    }

    return <div>Yükleniyor...</div>;
}
