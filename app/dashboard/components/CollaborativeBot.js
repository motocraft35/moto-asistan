'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollaborativeBot() {
    const [log, setLog] = useState({ history: [], last_insight: null });
    const [isMinimized, setIsMinimized] = useState(true);
    const [status, setStatus] = useState('syncing'); // syncing, thinking, intervention
    const scrollRef = useRef(null);

    // Poll the coordination API
    useEffect(() => {
        const fetchLog = async () => {
            try {
                const res = await fetch('/api/ai/coordinate');
                if (res.ok) {
                    const data = await res.json();
                    setLog(data);
                    setStatus('idle');
                }
            } catch (err) {
                console.error('Coordination sync failed:', err);
                setStatus('error');
            }
        };

        const interval = setInterval(fetchLog, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current && !isMinimized) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [log, isMinimized]);

    return (
        <div className="fixed top-20 right-4 z-[3000] pointer-events-none">
            <AnimatePresence>
                {isMinimized ? (
                    <motion.button
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        onClick={() => setIsMinimized(false)}
                        className="w-16 h-16 glass-card flex items-center justify-center pointer-events-auto border-cyan-500/50 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] group relative overflow-hidden"
                    >
                        <div className="scanner-beam"></div>
                        <div className="relative z-10">
                            <svg className="w-8 h-8 text-cyan-400 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#050510] animate-ping" />
                        </div>
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className="w-80 glass-card border-cyan-500/30 flex flex-col pointer-events-auto shadow-[0_0_80px_rgba(0,0,0,0.8)]"
                    >
                        <div className="scanner-beam"></div>

                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-cyan-500/5 relative">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping" />
                                <div className="hud-tag text-cyan-400 text-[10px]">GHOST LINK AKTİF</div>
                            </div>
                            <button onClick={() => setIsMinimized(true)} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                                ✕
                            </button>
                        </div>

                        {/* Agents Status */}
                        <div className="px-5 py-4 flex gap-3 border-b border-white/5">
                            <div className="flex-1 p-3 rounded-2xl bg-zinc-900/50 border border-white/5 relative group">
                                <div className="hud-tag text-[9px] mb-1">YARDIMCI ASİSTAN</div>
                                <p className="text-[10px] text-zinc-300 font-black italic uppercase">UYKU MODU</p>
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-zinc-500"></div>
                            </div>
                            <div className="flex-1 p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 relative">
                                <div className="hud-tag text-[7px] text-cyan-500 mb-1">GHOST</div>
                                <p className="text-[10px] text-cyan-300 font-black italic uppercase">AKTİF KONTROL</p>
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                            </div>
                        </div>

                        {/* Shared Stream */}
                        <div className="h-72 overflow-y-auto p-5 space-y-4 custom-scrollbar" ref={scrollRef}>
                            {log.history && log.history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30 italic">
                                    <div className="w-10 h-10 border-2 border-dashed border-zinc-500 rounded-full animate-spin"></div>
                                    <p className="hud-tag">Düşünce Akışı Senkronize Ediliyor...</p>
                                </div>
                            ) : (
                                (log.history || []).map((item, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx}
                                        className={`p-4 rounded-2xl border text-[11px] leading-relaxed relative ${item.agent === 'Ghost'
                                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100'
                                            : 'bg-white/5 border-white/10 text-zinc-300'
                                            }`}
                                    >
                                        <div className="flex justify-between mb-2 border-b border-white/5 pb-1">
                                            <span className="hud-tag text-[7px]">{item.agent || 'SİSTEM'}</span>
                                            <span className="text-[7px] text-zinc-600 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="font-medium tracking-tight whitespace-pre-wrap">{item.content}</div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Intervention Button */}
                        <div className="p-5 bg-black/20 border-t border-white/5">
                            <button className="w-full py-4 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-[9px] font-black uppercase tracking-[0.3em] text-red-500 hover:text-white rounded-2xl transition-all active:scale-95 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                KRİTİK MÜDAHALE
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
