'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalChat({ isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000); // 5 sec poll
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current && isOpen) {
            const scroll = () => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            };
            scroll();
            const timeout = setTimeout(scroll, 100);
            return () => clearTimeout(timeout);
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/chat/community/read');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Fetch messages error:', err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || cooldown > 0 || loading) return;

        setLoading(true);
        try {
            const res = await fetch('/api/chat/community/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });

            const data = await res.json();
            if (res.ok) {
                setNewMessage('');
                setCooldown(60);
                fetchMessages();
            } else if (res.status === 429) {
                setCooldown(data.remaining || 60);
            } else {
                alert(data.error || 'Mesaj gönderilemedi.');
            }
        } catch (err) {
            console.error('Send error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-x-0 bottom-0 z-[2000] p-4 md:p-10 pointer-events-none"
            >
                <div className="max-w-2xl mx-auto h-[80vh] bg-[#050510]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto overflow-hidden relative">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-500/10 via-transparent to-pink-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">GENEL SOHBET</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
                    >
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-cyan-400 italic leading-none">{msg.fullName}</span>
                                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm font-medium text-white/80 bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 leading-relaxed break-words">
                                    {msg.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-6 border-t border-white/5 bg-black/40">
                        <div className="relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={cooldown > 0 ? `Bekleyin... ${cooldown}s` : "Mesajınızı buraya yazın..."}
                                disabled={cooldown > 0 || loading}
                                className="w-full bg-[#0a0a14] border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-white/20 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || cooldown > 0 || loading}
                                className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black italic rounded-xl transition-all uppercase tracking-tighter text-xs"
                            >
                                {loading ? '...' : cooldown > 0 ? cooldown : 'GÖNDER'}
                            </button>
                        </div>
                        {cooldown > 0 && (
                            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: cooldown, ease: 'linear' }}
                                    className="h-full bg-cyan-500/50"
                                />
                            </div>
                        )}
                    </form>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
