'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialChatId = searchParams.get('chatId');

    const [userId, setUserId] = useState(null);
    const [view, setView] = useState('list'); // 'list' | 'chat' | 'search'
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Initial load: Get current user ID and initial chat if any
    useEffect(() => {
        fetch('/api/users/heartbeat').then(res => res.json()).then(data => {
            if (data.userId) setUserId(data.userId);
        });

        if (initialChatId) {
            fetchUserInfo(initialChatId);
        }
    }, [initialChatId]);

    // Polling for updates
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(() => {
            fetchConversations();
            if (view === 'chat' && activeChat) fetchMessages(activeChat.otherUserId);
        }, 5000);
        return () => clearInterval(interval);
    }, [view, activeChat]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current && view === 'chat') {
            // Use a slight timeout or requestAnimationFrame to ensure DOM is rendered
            const scroll = () => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            };

            // Execute immediately and also after a short delay for safety
            scroll();
            const timeout = setTimeout(scroll, 100);
            return () => clearTimeout(timeout);
        }
    }, [messages, view, activeChat]);

    const fetchUserInfo = async (id) => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const user = await res.json();
                startChat(user);
            }
        } catch (err) { console.error('Fetch user info error:', err); }
    };

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
        if ((!newMessage.trim() && !imageFile) || !activeChat || loading) return;

        setLoading(true);
        try {
            const res = await fetch('/api/chat/private/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: activeChat.otherUserId,
                    content: newMessage,
                    imageUrl: imageFile // Using Base64 for simplicity in this prototype
                })
            });
            if (res.ok) {
                setNewMessage('');
                setImagePreview(null);
                setImageFile(null);
                fetchMessages(activeChat.otherUserId);
            }
        } catch (err) { console.error('Send PM error:', err); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#050510] text-white flex flex-col relative overflow-hidden pb-40">
            {/* Background Aesthetics */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-1/2 h-1/2 bg-amber-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-1/2 h-1/2 bg-cyan-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Header Hook */}
            <header className="px-4 pt-6 flex flex-wrap items-center justify-between gap-4 relative z-20">
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                    <button onClick={() => router.push('/dashboard')} className="w-9 h-9 md:w-10 md:h-10 glass-card flex items-center justify-center text-white/40 hover:text-amber-400 transition-colors border-white/5 active:scale-90">
                        <span className="text-xl">←</span>
                    </button>
                    <div>
                        <div className="text-[7px] md:text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-0.5 animate-pulse">İLETİŞİM HATTI</div>
                        <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter leading-none">MESAJLAR</h3>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <button
                        onClick={() => router.push('/dashboard/messages?globalChat=true')}
                        className="hud-tag px-3 md:px-4 py-1.5 md:py-2 border-cyan-500/20 bg-cyan-500/5 text-cyan-500 text-[8px] md:text-[9px] flex items-center gap-1.5 md:gap-2 hover:bg-cyan-500/10 transition-colors"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                        <span className="hidden xs:inline">WARZONE AĞI</span>
                        <span className="xs:hidden">AĞ</span>
                    </button>
                    {view === 'list' && (
                        <button
                            onClick={() => setView('search')}
                            className="flex items-center gap-1.5 md:gap-2 group active:scale-95 transition-all"
                        >
                            <div className="flex flex-col items-end select-none">
                                <div className="text-[6px] md:text-[7px] font-black text-red-500/50 leading-none tracking-tighter uppercase">SİNYAL</div>
                                <div className="text-[8px] md:text-[9px] font-black text-white italic uppercase leading-none mt-0.5">YENİ</div>
                            </div>
                            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl glass-card bg-red-600 border-none text-white flex items-center justify-center hover:bg-red-500 transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="text-xl md:text-2xl font-black relative z-10 translate-y-[-1px] shadow-sm">+</span>
                            </div>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 px-4 pt-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    {view === 'list' && (
                        <motion.div
                            key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="flex-1 overflow-y-auto space-y-4 pb-20 scrollbar-hide"
                        >
                            {conversations.length > 0 ? conversations.map((convo) => (
                                <button
                                    key={convo.otherUserId}
                                    onClick={() => startChat({ id: convo.otherUserId, fullName: convo.otherUserName, profileImage: convo.otherUserImage })}
                                    className="w-full glass-card p-4 border-white/5 bg-[#0a0a14]/40 hover:bg-[#0a0a14]/80 hover:border-amber-500/30 transition-all group flex items-center gap-4 relative overflow-hidden"
                                >
                                    <div className="scanner-beam bg-amber-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>

                                    <div className="w-14 h-14 rounded-2xl glass-card bg-zinc-900 border-white/10 overflow-hidden shrink-0 relative p-0.5">
                                        {convo.otherUserImage ? (
                                            <img src={convo.otherUserImage} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl bg-zinc-800 rounded-xl opacity-40">👤</div>
                                        )}
                                        <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a14] rounded-full shadow-[0_0_8px_#10b981]" />
                                    </div>

                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-sm font-black italic text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">{convo.otherUserName}</span>
                                            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{new Date(convo.lastTimestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-[10px] truncate italic font-medium ${convo.unreadCount > 0 ? 'text-white' : 'text-zinc-500 opacity-60'}`}>
                                                {convo.lastMessage || 'DOSYA AKTARIMI BEKLENİYOR...'}
                                            </p>
                                            {convo.unreadCount > 0 && (
                                                <div className="min-w-[18px] h-[18px] px-1.5 bg-amber-500 rounded-lg flex items-center justify-center text-[9px] font-black text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] ml-2 animate-bounce">
                                                    {convo.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20">
                                    <div className="text-6xl mb-6">📟</div>
                                    <div className="hud-tag border-none p-0 text-[10px] text-zinc-500 tracking-[0.4em] font-black">İSTASYON SESSİZ // SİNYAL YOK</div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === 'search' && (
                        <motion.div
                            key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="relative mb-8">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="PİLOTLARI TARA..."
                                    className="w-full glass-card bg-black/40 border-white/10 rounded-2xl px-12 py-5 text-sm font-black italic text-white uppercase tracking-widest outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-700"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">🔍</div>
                                {searchTerm && (
                                    <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">✕</button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pb-20 scrollbar-hide">
                                {searchResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => startChat(user)}
                                        className="w-full glass-card p-4 border-white/5 bg-[#0a0a14]/40 hover:bg-[#0a0a14]/80 hover:border-amber-500/30 transition-all group flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-xl glass-card bg-zinc-900 border-white/10 overflow-hidden shrink-0 p-0.5">
                                            {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover rounded-lg" /> : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">👤</div>}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="text-sm font-black italic text-white uppercase tracking-tight group-hover:text-amber-400">{user.fullName}</div>
                                            <div className="hud-tag text-[8px] text-zinc-600 border-none p-0">{user.licensePlate || 'KAYITSIZ BİRİM'}</div>
                                        </div>
                                        <span className="text-xl text-amber-500 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">→</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {view === 'chat' && (
                        <motion.div
                            key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col h-full overflow-hidden"
                        >
                            {/* Messages List Area */}
                            <div className="flex-1 overflow-y-auto space-y-8 p-4 scrollbar-hide" ref={scrollRef}>
                                <div className="text-center py-6">
                                    <div className="hud-tag border-amber-500/10 bg-amber-500/5 text-amber-500/40 text-[7px] tracking-[0.4em] py-2 mx-auto">
                                        PROTOKOL A3: VERİ İMHA SÜRESİ 24 SAAT
                                    </div>
                                </div>

                                {messages.map((msg, i) => {
                                    const isMe = msg.senderId === userId;
                                    const showTime = i === messages.length - 1 || messages[i + 1]?.senderId !== msg.senderId;

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg`}>
                                            <div className={`max-w-[85%] relative overflow-hidden transition-all duration-300
                                                ${isMe
                                                    ? 'bg-amber-500 text-black rounded-3xl rounded-tr-none shadow-[0_10px_30px_rgba(245,158,11,0.2)]'
                                                    : 'glass-card bg-[#0a0a14]/80 text-white/90 border-white/10 rounded-3xl rounded-tl-none shadow-xl'
                                                }`}>
                                                {msg.imageUrl && (
                                                    <div className="p-1">
                                                        <img src={msg.imageUrl} className="w-full max-h-72 object-cover rounded-2xl cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')} />
                                                    </div>
                                                )}
                                                {msg.content && (
                                                    <div className="p-4 px-6 text-sm font-medium leading-relaxed italic">
                                                        {msg.content}
                                                    </div>
                                                )}
                                            </div>
                                            {showTime && (
                                                <div className={`mt-2 flex items-center gap-2 px-2 transition-all opacity-40 group-hover/msg:opacity-100 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className="text-[7px] font-black uppercase text-zinc-600 tracking-widest">
                                                        {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                    <span className="text-[7px] font-black uppercase text-zinc-700 tracking-[0.2em]">{isMe ? 'UPLINK' : 'DOWNLINK'}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chat Controls Area */}
                            <div className="p-6 pb-24 border-t border-white/5 bg-[#0a0a14]/60 backdrop-blur-2xl relative z-30">
                                {imagePreview && (
                                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6 relative w-24 h-24 glass-card bg-zinc-900 border-amber-500/50 p-1 group">
                                        <img src={imagePreview} className="w-full h-full object-cover rounded-xl" />
                                        <button onClick={() => { setImagePreview(null); setImageFile(null); }} className="absolute -top-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-xs shadow-xl text-white hover:text-red-500 transition-colors">✕</button>
                                    </motion.div>
                                )}
                                <form onSubmit={handleSend} className="flex gap-4 items-center">
                                    <label className="w-14 h-14 rounded-2xl glass-card border-white/10 bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-all shrink-0 group active:scale-95 shadow-xl">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => { setImagePreview(reader.result); setImageFile(reader.result); };
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                        <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
                                        <span className="text-[6px] font-black uppercase mt-1 text-zinc-600 group-hover:text-amber-500 transition-colors tracking-widest">EKLE</span>
                                    </label>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="VERİ AKTAR..."
                                            className="w-full glass-card bg-black/40 border-white/10 rounded-2xl px-6 py-4 text-sm font-medium italic text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-800"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={(!newMessage.trim() && !imageFile) || loading}
                                        className="w-14 h-14 rounded-full bg-amber-500 border border-amber-400 text-black flex items-center justify-center hover:bg-amber-400 active:scale-90 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.4)] disabled:opacity-20 disabled:scale-100 disabled:shadow-none"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0.5 -translate-y-0.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
