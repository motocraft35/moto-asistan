'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ClanRankingPage() {
    const [clans, setClans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClans = async () => {
            try {
                const res = await fetch('/api/clans');
                const data = await res.json();
                if (data.success) {
                    setClans(data.clans);
                }
            } catch (error) {
                console.error('Error fetching ranking:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClans();
    }, []);

    return (
        <div className="min-h-screen bg-[#050510] text-white p-5 pb-32 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-amber-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/5 rounded-full blur-[120px]" />
            </div>
            <header className="mb-10 text-center relative z-10">
                <div className="text-tactical-label text-amber-500 mb-2">RANKING PROTOCOL // ELITE</div>
                <h1 className="text-neon-title text-3xl md:text-4xl text-white italic">
                    KLAN <span className="text-amber-500 text-neon-amber">SIRALAMASI</span>
                </h1>
                <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mt-2 opacity-60">En güçlü topluluklar burada yarışıyor.</p>
            </header>

            <div className="max-w-2xl mx-auto relative z-10">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                        <span className="text-tactical-label text-amber-500">VERİLER ALINIYOR...</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {clans.map((clan, index) => {
                            const isClanPremium = clan.leaderTier === 'Clan';
                            return (
                                <motion.div
                                    key={clan.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`glass-card p-4 flex items-center gap-5 relative group transition-all hover:bg-white/5 ${isClanPremium ? 'border-red-500/30 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5'
                                        }`}
                                >
                                    <div className="scanner-beam bg-white opacity-0 group-hover:opacity-5"></div>

                                    {/* Rank Number */}
                                    <div className={`text-2xl font-black italic italic-display w-10 shrink-0 ${index === 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                                            index === 1 ? 'text-zinc-400' :
                                                index === 2 ? 'text-amber-700' : 'text-zinc-800'
                                        }`}>
                                        #{index + 1}
                                    </div>

                                    {/* Logo */}
                                    <div className={`w-14 h-14 rounded-xl glass-card bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden ${isClanPremium ? 'border-red-500/50' : 'border-white/10'
                                        }`}>
                                        {clan.logoUrl ? (
                                            <img src={clan.logoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                        ) : <span className="text-2xl">🛡️</span>}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-neon-title text-base text-white hover:text-cyan-400 transition-colors truncate">{clan.name}</h3>
                                            {isClanPremium && (
                                                <span className="text-tactical-label text-[7px] text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded bg-red-500/10">VIP</span>
                                            )}
                                        </div>
                                        <div className="text-micro-data flex items-center gap-3">
                                            <span>👤 {clan.memberCount} ÜYE</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                            <span>✨ {clan.xp || 0} XP</span>
                                        </div>
                                    </div>

                                    {/* City Badge */}
                                    <div className="text-tactical-label text-[8px] text-zinc-600 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                        {clan.city || 'GENEL'}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Link href="/dashboard/clans" className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-card px-10 py-4 bg-amber-500 border-none text-black text-tactical-label shadow-[0_10px_30px_rgba(245,158,11,0.4)] z-[100] hover:bg-amber-400 active:scale-95 transition-all">
                KLANLARA DÖN
            </Link>
        </div>
    );
}
