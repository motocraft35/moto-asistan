'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MechanicClient() {
    const [messages, setMessages] = useState([
        {
            role: 'model',
            parts: [{ text: "GHOST GEAR // GHOST AI ÇEVRİMİÇİ.\n\nTaktiksel teşhis bağlantısı kuruldu. 2026 Moto-Asistan teknik arşivlerine tam erişimim var. Neon ışıkları altında teknik onarım çözümleri için sorunuzu tarayın. Nasıl devam edelim, operatör? 🏍️" }]
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const quickQuestions = [
        "ARIZA: MOTOR ARIZA LAMBASI",
        "SENKRON: YAĞ DEĞİŞİM ARALIKLARI",
        "VERİ: LASTİK BASINCI",
        "DURUM: ÇALIŞTIRMA HATASI",
        "PROSEDÜR: ZİNCİR BAKIMI"
    ];

    const handleSend = async (textOverride = null) => {
        const userText = textOverride || inputText;
        if (!userText.trim()) return;

        if (!textOverride) setInputText('');

        const newHistory = [...messages, { role: 'user', parts: [{ text: userText }] }];
        setMessages(newHistory);
        setIsTyping(true);

        try {
            let apiHistory = newHistory.slice(0, -1).map(m => ({
                role: m.role,
                parts: m.parts
            }));

            if (apiHistory.length > 0 && apiHistory[0].role === 'model') {
                apiHistory = apiHistory.slice(1);
            }

            const res = await fetch('/api/chat/mechanic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: apiHistory,
                    message: userText
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'API Error');
            }
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `KRİTİK HATA: ${error.message} // SİSTEMİ YENİDEN BAŞLAT (SAYFAYI YENİLE)` }] }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-200px)]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-40 scrollbar-hide">
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] relative group`}>
                                <div className={`hud-tag mb-1 ${msg.role === 'user' ? 'justify-end text-cyan-500' : 'text-cyan-400'}`}>
                                    {msg.role === 'user' ? 'OPERATÖR GİRİŞİ' : 'NÖRAL YANIT'}
                                </div>
                                <div className={`
                                    glass-card p-5 px-6 font-medium text-sm leading-relaxed whitespace-pre-wrap shadow-xl
                                    ${msg.role === 'user'
                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-50'
                                        : 'bg-zinc-900/60 border-white/10 text-zinc-100'}
                                `}>
                                    {msg.role === 'model' && (
                                        <div className="scanner-beam opacity-5" />
                                    )}
                                    {msg.parts[0].text}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="glass-card bg-zinc-900/40 border-cyan-500/20 px-6 py-4 flex gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_10px_#22d3ee]" />
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100 shadow-[0_0_10px_#22d3ee]" />
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-200 shadow-[0_0_10px_#22d3ee]" />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input & Quick Actions Container */}
            <div className="fixed bottom-0 left-0 right-0 px-6 pb-12 pt-10 bg-gradient-to-t from-[#050510] via-[#050510]/95 to-transparent pointer-events-none">
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pointer-events-auto">
                    {/* Quick Questions Chips */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {quickQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(q)}
                                className="hud-tag whitespace-nowrap glass-card px-4 py-2 border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-[9px] transition-all active:scale-95"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Command Input Bar */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500 to-cyan-500 rounded-[32px] opacity-20 blur-sm group-focus-within:opacity-40 transition-opacity" />
                        <div className="relative glass-card bg-black/60 border-white/10 p-1 flex items-center shadow-2xl overflow-hidden rounded-[32px]">
                            <div className="pl-6 text-cyan-500/60 font-black italic tracking-tighter text-xs">SYS REQ {'>'}</div>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="GHOST AI ÜNİTESİNE KOMUT GÖNDER..."
                                className="flex-1 bg-transparent border-none py-5 px-4 text-white font-black italic text-xs uppercase tracking-widest placeholder:text-zinc-700 outline-none"
                            />
                            <button
                                onClick={() => handleSend()}
                                className="w-14 h-14 bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center rounded-full transition-all active:scale-90 shadow-[0_0_20px_rgba(34,211,238,0.4)] mr-1 group/btn"
                            >
                                <span className="text-xl group-hover:translate-x-0.5 transition-transform italic font-black">⚙️</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
