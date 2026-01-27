'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrivateMessages({ userId }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [view, setView] = useState('list'); // 'list' | 'chat' | 'search'
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const initialId = new URLSearchParams(window.location.search).get('chatId');
        if (initialId && !activeChat) {
            fetchUserInfo(initialId);
            setIsExpanded(true);
        }
    }, []);

    const fetchUserInfo = async (id) => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const user = await res.json();
                startChat(user);
            }
        } catch (err) { console.error('Fetch user info error:', err); }
    };

    useEffect(() => {
        if (isExpanded) {
            fetchConversations();
            const interval = setInterval(() => {
                fetchConversations();
                if (view === 'chat' && activeChat) fetchMessages(activeChat.otherUserId);
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [isExpanded, view, activeChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/chat/private/list');
            if (res.ok) setConversations(await res.json());
        } catch (err) { console.error('Fetch convo error:', err); }
    };

    const fetchMessages = async (otherId) => {
        try {
            const res = await fetch(`/api/chat/private/messages?otherUserId=${otherId}`);
            if (res.ok) setMessages(await res.json());
        } catch (err) { console.error('Fetch msgs error:', err); }
    };

    const handleSearch = async (val) => {
        setSearchTerm(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/users/search?q=${val}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.users || []);
            }
        } catch (err) { console.error('Search error:', err); }
    };

    const startChat = (user) => {
        const chatData = {
            otherUserId: user.id,
            otherUserName: user.fullName,
            otherUserImage: user.profileImage
        };
        setActiveChat(chatData);
        setView('chat');
        fetchMessages(user.id);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || loading) return;

        setLoading(true);
        try {
            const res = await fetch('/api/chat/private/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: activeChat.otherUserId,
                    content: newMessage
                })
            });
            if (res.ok) {
                setNewMessage('');
                fetchMessages(activeChat.otherUserId);
            }
        } catch (err) { console.error('Send PM error:', err); }
        finally { setLoading(false); }
    };

    return (
        <section className={`bg-zinc-900/60 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden ${isExpanded ? 'h-[450px]' : 'h-[76px]'}`}>
            {/* Header / Trigger */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-amber-500/10 to-transparent hover:bg-amber-500/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">🤫</span>
                    <div>
                        <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-0.5">İletişim Paneli</h4>
                        <h3 className="text-sm font-black text-white italic uppercase tracking-tighter">Dijital Fısıltılar</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {conversations.length > 0 && !isExpanded && (
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-black text-black animate-pulse">
                            {conversations.length}
                        </div>
                    )}
                    <span className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </div>

            {isExpanded && (
                <div className="h-[374px] flex flex-col">
                    {/* Navigation Header */}
                    <div className="px-5 py-2 border-b border-white/5 flex justify-between items-center bg-black/20">
                        {view !== 'list' ? (
                            <button onClick={() => setView('list')} className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1 hover:text-white transition-colors">
                                ← Geri
                            </button>
                        ) : (
                            <button onClick={() => setView('search')} className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 hover:text-amber-400 transition-all">
                                ➕ Yeni Mesaj
                            </button>
                        )}
                        {view === 'chat' && (
                            <span className="text-[10px] font-black text-white italic truncate max-w-[120px]">
                                {activeChat?.otherUserName}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {view === 'list' && (
                                <motion.div
                                    key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-full overflow-y-auto p-4 space-y-2 custom-scrollbar"
                                >
                                    {conversations.length > 0 ? conversations.map((convo) => (
                                        <button
                                            key={convo.otherUserId}
                                            onClick={() => startChat({ id: convo.otherUserId, fullName: convo.otherUserName, profileImage: convo.otherUserImage })}
                                            className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-zinc-800 shrink-0">
                                                {convo.otherUserImage ? <img src={convo.otherUserImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <span className="text-[11px] font-black text-white truncate">{convo.otherUserName}</span>
                                                    <span className="text-[7px] text-zinc-500 font-bold">{new Date(convo.lastTimestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-[9px] text-zinc-400 truncate italic">"{convo.lastMessage}"</p>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-4">
                                            <span className="text-3xl mb-2">📟</span>
                                            <p className="text-[10px] uppercase font-black tracking-widest leading-loose">Yeni bir fısıltı başlatmak için<br />yukarıdaki butonu kullanın.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {view === 'search' && (
                                <motion.div
                                    key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="h-full flex flex-col p-4"
                                >
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="İsim veya plaka ara..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs mb-4 focus:border-amber-500/50 outline-none"
                                    />
                                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                        {searchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => startChat(user)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                    {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <div className="text-[10px] font-black text-white">{user.fullName}</div>
                                                    <div className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">{user.licensePlate}</div>
                                                </div>
                                            </button>
                                        ))}
                                        {searchTerm.length >= 2 && searchResults.length === 0 && (
                                            <div className="text-center p-4 opacity-30 text-[10px] uppercase font-black">Pilot bulunamadı.</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {view === 'chat' && (
                                <motion.div
                                    key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar" ref={scrollRef}>
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[85%] p-3 rounded-2xl text-[10px] font-medium leading-relaxed ${msg.senderId === userId ? 'bg-amber-500 text-black rounded-tr-none shadow-[0_4px_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 text-white/80 border border-white/5 rounded-tl-none'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[6px] text-zinc-600 font-bold uppercase mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/40">
                                        <div className="relative">
                                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Bir şey söyle..." className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-[11px] outline-none focus:border-amber-500/50" />
                                            <button type="submit" disabled={!newMessage.trim() || loading} className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-amber-500 text-black font-black italic rounded-lg text-[9px]">GÖNDER</button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Security Footer */}
                    <div className="p-3 bg-amber-500/5 border-t border-white/5 text-center">
                        <p className="text-[7px] text-amber-500/60 font-black uppercase tracking-[0.2em]">
                            VERİ TASARRUFU AKTİF: MESAJLAR 24 SAAT SONRA SİLİNİR
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}
