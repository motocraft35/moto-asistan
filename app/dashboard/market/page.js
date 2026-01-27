'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const categories = [
    { id: 'bike', label: 'Motosiklet', icon: '🏍️' },
    { id: 'part', label: 'Parça', icon: '⚙️' },
    { id: 'gear', label: 'Ekipman', icon: '🛡️' }
];

export default function MarketplacePage() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [activeTab, setActiveTab] = useState('bike');

    const fetchListings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/marketplace?category=${activeTab}`);
            const data = await res.json();
            setListings(data.listings || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [activeTab]);

    return (
        <main className="min-h-screen bg-[#050510] text-zinc-100 pb-32 relative overflow-hidden">
            {/* Background FX */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/5 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/5 rounded-full blur-[150px] pointer-events-none z-0" />

            <div className="max-w-5xl mx-auto px-6 pt-12 space-y-10 relative z-10">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-white">
                    <div className="space-y-4">
                        <div className="hud-tag text-cyan-400">PAZAR_PROTOKOLÜ // TİCARET_MERKEZİ_v1</div>
                        <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            PAZAR_<span className="text-cyan-400">YERI</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase max-w-lg leading-relaxed">
                            Eşten eşe varlık değişim ağı. <br />
                            <span className="text-zinc-400">M.E.C.H_BİRİMİ Yapay Zeka Doğrulama Sistemi ile güçlendirilmiştir.</span>
                        </p>
                    </div>
                    <Link href="/dashboard/market/create" className="glass-card px-8 py-4 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-black italic uppercase text-xs tracking-widest hover:bg-cyan-500 hover:text-black transition-all active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        ILAN_EKLE [+]
                    </Link>
                </header>

                {/* Filter Tabs */}
                <nav className="flex gap-4 p-2 glass-card bg-[#0a0a14]/60 border-white/5 max-w-fit">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase italic tracking-widest transition-all ${activeTab === cat.id ? 'bg-cyan-500 text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </nav>

                {/* Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="glass-card h-96 bg-white/5 border-white/5 animate-pulse" />
                            ))
                        ) : listings.length > 0 ? (
                            listings.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="glass-card bg-[#0a0a14] border-white/10 group overflow-hidden hover:border-cyan-500/50 transition-all flex flex-col shadow-2xl relative"
                                >
                                    {item.isAiVerified === 1 && (
                                        <div className="absolute top-4 left-4 z-20">
                                            <div className="hud-tag bg-cyan-500 text-black font-black italic border-none shadow-[0_0_15px_#22d3ee] animate-glow-pulse">ALPHA_ONAYLI</div>
                                        </div>
                                    )}

                                    {/* Preview Image */}
                                    <div className="h-56 overflow-hidden relative">
                                        <img src={item.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f91cbcf523?q=80&w=800'} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] to-transparent opacity-60" />
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                            <div className="text-3xl font-black text-white italic drop-shadow-lg">
                                                ₺{item.price.toLocaleString('tr-TR')}
                                            </div>
                                            <div className="hud-tag bg-black/60 text-[8px] border-white/10">{item.city.toUpperCase()}</div>
                                        </div>
                                        <div className="scanner-beam bg-cyan-500 opacity-0 group-hover:opacity-20"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                        <div>
                                            <h3 className="text-xl font-black italic text-white leading-none uppercase tracking-tighter group-hover:text-cyan-400 transition-colors mb-2 truncate">
                                                {item.title}
                                            </h3>
                                            <div className="flex gap-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                                <span>{item.brand}</span>
                                                <span className="w-1.5 h-1.5 bg-white/10 rounded-full my-auto" />
                                                <span>{item.model}</span>
                                                <span className="w-1.5 h-1.5 bg-white/10 rounded-full my-auto" />
                                                <span>{item.year || '----'}</span>
                                            </div>
                                        </div>

                                        {item.isAiVerified === 1 && (
                                            <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                                                <p className="text-[10px] text-zinc-400 italic leading-relaxed">
                                                    "{item.aiAnalysis?.substring(0, 100)}..."
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden">
                                                    {item.sellerImage ? <img src={item.sellerImage} className="w-full h-full object-cover" /> : '👤'}
                                                </div>
                                                <div className="text-[10px] font-black italic text-zinc-500 uppercase">{item.sellerName.split(' ')[0]}</div>
                                            </div>
                                            <Link href={`/dashboard/market/listing/${item.id}`} className="text-cyan-500 font-black italic text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform">
                                                DETAYLAR_{'>>>'}
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center opacity-20">
                                <div className="text-6xl mb-6">🏜️</div>
                                <h3 className="text-2xl font-black italic text-zinc-400 uppercase tracking-widest">İLAN_BULUNAMADI</h3>
                            </div>
                        )}
                    </AnimatePresence>
                </section>
            </div>
        </main>
    );
}
