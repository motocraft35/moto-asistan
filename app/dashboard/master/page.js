'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MasterConsole() {
    const [status, setStatus] = useState('ACTIVE');
    const [logs, setLogs] = useState([]);
    const [command, setCommand] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [logs]);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/master/bridge');
            const data = await res.json();
            if (data.logs) setLogs(data.logs);
        } catch (err) {
            console.error('Log sync error:', err);
        }
    };

    const clearLogs = async () => {
        if (!confirm('Tüm konuşma geçmişi silinecek. Emin misin?')) return;
        setIsClearing(true);
        try {
            const res = await fetch('/api/master/delete', { method: 'POST' });
            if (res.ok) {
                setLogs([]);
            }
        } catch (err) {
            console.error('Clear error:', err);
        } finally {
            setIsClearing(false);
        }
    };

    const sendCommand = async (e) => {
        e.preventDefault();
        if (!command.trim()) return;

        setIsThinking(true);
        try {
            await fetch('/api/master/bridge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: command })
            });
            setCommand('');
            // Faster immediate refresh
            setTimeout(fetchLogs, 500);
            setTimeout(fetchLogs, 1500);
        } catch (err) {
            console.error('Command dispatch failed:', err);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050510] text-[#00f2ff] font-mono p-4 md:p-8 pb-40 flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="border border-[#00f2ff]/30 bg-[#00f2ff]/5 p-4 rounded-xl mb-6 flex items-center justify-between shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                <div className="flex items-center gap-4">
                    <a href="/dashboard/map" className="p-2 bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-lg hover:bg-[#00f2ff]/20 transition-all text-xs font-bold text-[#00f2ff]">
                        ← GERİ
                    </a>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase">Neural Bridge</h1>
                        <p className="text-xs text-[#00f2ff]/60">V1.0 REMOTE OPERATOR CONSOLE</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={clearLogs}
                        disabled={isClearing}
                        className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-[10px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 uppercase"
                    >
                        {isClearing ? 'TEMİZLENİYOR...' : 'TEMİZLE'}
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
                        <span className="text-sm font-bold tracking-tighter uppercase">{status}</span>
                    </div>
                </div>
            </header>

            {/* Neural Stream (Logs) */}
            <div
                ref={scrollRef}
                className="flex-1 bg-black/40 border border-[#00f2ff]/20 rounded-2xl p-4 overflow-y-auto mb-6 custom-scrollbar"
            >
                <div className="space-y-4">
                    {logs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                            <span className="text-4xl mb-4">📡</span>
                            <p>No neural signals detected.<br />Awaiting master connection...</p>
                        </div>
                    )}
                    {logs.map((log, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={idx}
                            className={`p-3 rounded-lg border flex flex-col gap-1 ${log.type === 'AI'
                                ? 'bg-zinc-900/50 border-zinc-800 self-start max-w-[90%]'
                                : 'bg-cyan-900/20 border-cyan-800 self-end max-w-[90%] text-right ml-auto'
                                }`}
                        >
                            <span className="text-[10px] opacity-40 uppercase tracking-widest">
                                {log.type === 'AI' ? 'Antigravity AI' : 'Master Admin'} — {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {log.content}
                            </div>
                        </motion.div>
                    ))}
                    {isThinking && (
                        <div className="flex gap-2 p-3 text-cyan-500 italic text-sm animate-pulse">
                            Neural processing in progress...
                        </div>
                    )}
                </div>
            </div>

            {/* Command Input - Positioned above the global navigation bar */}
            <form onSubmit={sendCommand} className="fixed bottom-24 left-4 right-4 md:left-8 md:right-8 z-[60]">
                <div className="relative max-w-5xl mx-auto">
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Enter command for the AI environment..."
                        className="w-full bg-[#0a0a1a]/90 backdrop-blur-xl border border-[#00f2ff]/40 rounded-2xl p-5 pr-24 outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/50 transition-all text-sm shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                    />
                    <button
                        type="submit"
                        disabled={isThinking}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#00f2ff] text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                    >
                        {isThinking ? '...' : 'SEND'}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #00f2ff33;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
