
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ClansPage() {
    const [clans, setClans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClans();
    }, []);

    const fetchClans = async () => {
        try {
            const res = await fetch('/api/clans');
            const data = await res.json();
            if (data.success) {
                setClans(data.clans);
            }
        } catch (error) {
            console.error('Error fetching clans:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-12 pb-32 relative min-h-screen">
            {/* Background Aesthetics */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-amber-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-zinc-600/5 rounded-full blur-[120px]" />
            </div>

            <header className="flex justify-between items-end relative z-10">
                <div className="space-y-2">
                    <div className="text-tactical-label text-amber-500 mb-2">AĞ PROTOKOLÜ // KLAN KARDEŞLİĞİ</div>
                    <h1 className="text-neon-title text-3xl md:text-5xl text-white italic leading-none">
                        KLAN MERKEZİ <span className="text-amber-500 text-neon-amber">İŞLEMLERİ</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase pl-1 opacity-70">
                        Ekibinle senkronize ol. Fetihlere liderlik et.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href="/dashboard/clans/ranking"
                        className="glass-card px-6 py-3 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5 group transition-all active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-amber-500 text-lg group-hover:rotate-12 transition-transform">🏆</span>
                            <span className="text-tactical-label text-white whitespace-nowrap">ELİT SIRALAMA</span>
                        </div>
                    </Link>
                    <Link
                        href="/dashboard/clans/create"
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black italic px-8 py-3 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center gap-3 border border-amber-400/30 uppercase tracking-widest text-xs"
                    >
                        <span className="text-lg">+</span>
                        <span className="text-tactical-label text-white">KLAN KUR</span>
                    </Link>
                </div>
            </header>

            {/* Clans List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                {loading ? (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                        <span className="hud-tag text-amber-500">BİRLİK VERİLERİ YÜKLENİYOR...</span>
                    </div>
                ) : clans.length > 0 ? (
                    clans.map(clan => (
                        <Link key={clan.id} href={`/dashboard/clans/${clan.id}`} className="group">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="glass-card p-6 border-white/5 bg-[#0a0a14]/60 hover:bg-amber-500/5 hover:border-amber-500/40 transition-all shadow-[0_15px_35px_rgba(0,0,0,0.4)] overflow-hidden"
                            >
                                <div className="scanner-beam bg-amber-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 glass-card bg-zinc-900 border-white/10 p-1 flex items-center justify-center overflow-hidden group-hover:border-amber-500/50 transition-colors">
                                            {clan.logoUrl ? (
                                                <img src={clan.logoUrl} alt={clan.name} className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
                                            ) : (
                                                <span className="text-4xl group-hover:scale-110 transition-transform">🛡️</span>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-[10px] font-black text-black shadow-lg border border-black/20">
                                            {clan.level || 1}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-neon-title text-xl md:text-2xl text-white italic group-hover:text-amber-400 transition-colors">{clan.name}</h3>
                                        <div className="flex flex-col gap-2">
                                            <div className="hud-tag text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                                <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full group-hover:animate-ping" />
                                                BÖLGE: {clan.city || 'KÜRESEL AĞ'}
                                            </div>
                                            <div className="hud-tag text-cyan-500/60 uppercase text-[8px] md:text-[9px]">
                                                LİDER: <span className="text-white ml-2">{clan.leaderName}</span>
                                            </div>
                                            <div className="hud-tag text-zinc-600 uppercase text-[8px] md:text-[9px]">
                                                BİRLİK GÜCÜ: <span className="text-zinc-400 ml-2">{clan.memberCount} ÜYE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full h-80 flex flex-col items-center justify-center p-12 text-center glass-card border-white/5 bg-[#0a0a14]/40 border-dashed">
                        <div className="w-24 h-24 glass-card rounded-full flex items-center justify-center text-5xl opacity-20 border-white/10 mb-8 animate-pulse">🛡️</div>
                        <h3 className="text-2xl font-black italic text-zinc-400 mb-2 uppercase tracking-tighter">KLAN BULUNAMADI</h3>
                        <p className="text-zinc-600 max-w-sm text-[10px] font-black leading-relaxed uppercase tracking-widest mb-10">
                            Radar boş. İlk taktiksel birliği sen kur ve bölgeye hükmet.
                        </p>
                        <Link href="/dashboard/clans/create" className="hud-tag text-amber-500 hover:text-amber-400 border-b border-amber-500/30 pb-1">
                            İLK BİRLİĞİ KUR
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
