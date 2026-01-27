'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (query.length < 2) return;

        setLoading(true);
        setSearched(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data.users || []);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-search after typing stops
    useEffect(() => {
        const delay = setTimeout(() => {
            if (query.length >= 2) handleSearch();
        }, 500);
        return () => clearTimeout(delay);
    }, [query]);

    return (
        <main className="min-h-screen bg-[#050510] text-zinc-100 pb-32 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-xl mx-auto px-6 pt-6 space-y-8 relative z-10">

                {/* Tactical Header */}
                <header className="flex items-center gap-6 pb-6 border-b border-white/5 relative">
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-cyan-500 shadow-[0_0_15px_#00ffff]" />
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 glass-card flex items-center justify-center hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all active:scale-90"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="hud-tag text-cyan-400 mb-1">MOTO-ASİSTAN // ARAMA MODÜLÜ v4.2</div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">İSTİHBARAT MERKEZİ</h1>
                    </div>
                </header>

                {/* Search Bar Terminal */}
                <section className="glass-card p-2 bg-[#0a0a14]/80 border-cyan-500/20 group focus-within:border-cyan-500/60 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
                    <div className="scanner-beam opacity-40 shadow-[0_0_20px_#00ffff]"></div>
                    <div className="absolute top-0 right-0 p-2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                        <div className="text-[9px] font-black text-cyan-500 animate-pulse">ŞİFRELİ VERİ AKIŞI AKTİF</div>
                    </div>
                    <form onSubmit={handleSearch} className="relative flex items-center gap-4 p-2">
                        <div className="w-10 h-10 flex items-center justify-center text-cyan-500/50 group-focus-within:text-cyan-400">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value.toUpperCase())}
                            placeholder="İSİM, PLAKA VEYA TANIMLAYICI..."
                            className="flex-1 bg-transparent border-none text-white font-bold italic tracking-wider placeholder:text-zinc-700 outline-none uppercase text-lg"
                            autoFocus
                        />
                        {loading && (
                            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-2" />
                        )}
                    </form>
                </section>

                {/* Status bar */}
                <div className="flex items-center gap-4 px-2">
                    <div className="hud-tag text-[9px] bg-white/5 border-white/5 opacity-50">FİLTRE: TÜM PİLOTLAR</div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                        {results.length} SİNYAL BULUNDU
                    </div>
                </div>

                {/* Results Stream */}
                <div className="space-y-6 relative">
                    {/* Vertical Stream Line */}
                    {results.length > 0 && (
                        <div className="absolute left-[39px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-cyan-500/50 via-cyan-500/10 to-transparent z-0" />
                    )}

                    <AnimatePresence mode="popLayout">
                        {results.map((user, idx) => (
                            <motion.button
                                initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 100 }}
                                key={user.id}
                                onClick={() => router.push(`/dashboard/profile/${user.id}`)}
                                className="w-full glass-card p-5 group flex items-center gap-6 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all active:scale-[0.98] relative overflow-hidden text-left z-10"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="hud-tag text-[9px] text-cyan-500">SİNYAL KİLİTLENDİ</div>
                                </div>
                                <div className="scanner-beam opacity-0 group-hover:opacity-20"></div>

                                {/* Avatar Control */}
                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-2xl glass-card border-white/10 p-1 flex items-center justify-center overflow-hidden bg-zinc-900 group-hover:border-cyan-500/70 transition-all group-hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125" />
                                        ) : (
                                            <div className="w-full h-full bg-cyan-950/20 flex items-center justify-center">
                                                <span className="text-3xl opacity-20 group-hover:opacity-50 transition-opacity">👤</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#050510] shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center text-[10px] font-black ${user.rank === 'Altın' ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'}`}>
                                        {user.rank === 'Altın' ? 'G' : 'P'}
                                    </div>
                                    {/* Connection Dot */}
                                    <div className="absolute top-1/2 -left-[14px] w-2 h-2 rounded-full bg-cyan-500 group-hover:scale-150 transition-transform shadow-[0_0_8px_#00ffff]" />
                                </div>

                                {/* Identity Data */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-black italic text-white truncate uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{user.fullName}</h3>
                                        <div className="hud-tag text-[7px] text-zinc-500 border-none p-0 group-hover:text-cyan-500/50 transition-colors">İST_SIRA:{String(user.id).padStart(6, '0')}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20 text-[10px] font-black text-cyan-400 italic tracking-widest">
                                            {user.licensePlate || 'PLAKA YOK'}
                                        </div>
                                        <div className="h-3 w-[1px] bg-white/10" />
                                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
                                            BÜTÜNLÜK ENDEKSİ: 98%
                                        </div>
                                    </div>
                                </div>

                                {/* Interaction Prompt */}
                                <div className="text-zinc-800 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>

                    {searched && results.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="py-24 text-center glass-card border-dashed border-white/5 opacity-40"
                        >
                            <div className="text-6xl mb-6">🛸</div>
                            <h3 className="text-xl font-black italic text-zinc-400 uppercase tracking-tighter">VERİ YOK</h3>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Bu frekansta pilot sinyali tespit edilemedi.</p>
                        </motion.div>
                    )}

                    {!searched && (
                        <div className="py-24 text-center opacity-20">
                            <div className="text-5xl mb-6 grayscale animate-pulse">📡</div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">SİNYALLER TARANIYOR...</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

