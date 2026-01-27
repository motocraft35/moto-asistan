'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FairPricePage() {
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [price, setPrice] = useState('');
    const [kilometers, setKilometers] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportStatus, setReportStatus] = useState(null);

    const fetchStats = async () => {
        if (!brand || !model) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ brand, model });
            if (year) params.append('year', year);
            const res = await fetch(`/api/market/stats?${params}`);
            const data = await res.json();
            if (data.stats) setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitReport = async (e) => {
        e.preventDefault();
        setReportStatus('loading');
        try {
            const res = await fetch('/api/market/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand, model, year: parseInt(year),
                    price: parseFloat(price), kilometers: parseInt(kilometers),
                    source_image_url: imageUrl
                })
            });
            if (res.ok) {
                setReportStatus('success');
                fetchStats();
                setPrice(''); setKilometers(''); setImageUrl('');
                setTimeout(() => setReportStatus(null), 3000);
            } else {
                setReportStatus('error');
            }
        } catch (error) { setReportStatus('error'); }
    };

    return (
        <main className="min-h-screen bg-[#050510] text-zinc-100 pb-32 relative overflow-hidden">
            {/* Background FX */}
            <div className="fixed top-[-15%] right-[-10%] w-[50%] h-[50%] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="fixed bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none z-0" />

            <div className="max-w-5xl mx-auto px-6 pt-12 space-y-12 relative z-10">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-4">
                        <div className="hud-tag text-amber-500">MARKET_PROTOCOL // FAIR_INDEX_v2</div>
                        <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            ADİL_FİYAT_<span className="text-amber-500">ENDEX</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase max-w-lg leading-relaxed">
                            Breaking speculative bubbles through collective intelligence. <br />
                            <span className="text-zinc-400">Tactical market data harvested from the community.</span>
                        </p>
                    </div>
                    <div className="glass-card px-6 py-3 border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE_NEURAL_UPLINK</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Input Node */}
                    <section className="lg:col-span-5 space-y-8 h-fit">
                        <div className="glass-card p-8 border-white/5 bg-[#0a0a14]/60 relative group">
                            <div className="scanner-beam opacity-10"></div>
                            <h2 className="text-white font-black italic flex items-center gap-3 mb-8 uppercase tracking-widest text-xs">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                QUERY_PARAMETERS
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="hud-tag text-[7px] pl-1">MANUFACTURER_NODE</label>
                                    <input
                                        type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-amber-500/50 outline-none transition-all uppercase placeholder:opacity-20"
                                        placeholder="E.G. YAMAHA"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="hud-tag text-[7px] pl-1">MODEL_VECTOR</label>
                                    <input
                                        type="text" value={model} onChange={(e) => setModel(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-amber-500/50 outline-none transition-all uppercase placeholder:opacity-20"
                                        placeholder="E.G. MT-07"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="hud-tag text-[7px] pl-1">CHRONOS_YEAR</label>
                                    <input
                                        type="number" value={year} onChange={(e) => setYear(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-amber-500/50 outline-none transition-all uppercase placeholder:opacity-20"
                                        placeholder="2024"
                                    />
                                </div>

                                <button
                                    onClick={fetchStats}
                                    disabled={!brand || !model || loading}
                                    className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black italic py-5 rounded-2xl transition-all shadow-[0_15px_30px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[11px] disabled:opacity-30 active:scale-95"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>INITIALIZE_ANALYSIS</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Feed would go here if we had more space */}
                    </section>

                    {/* Visualizer Node */}
                    <section className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {stats ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card p-10 h-full border-white/10 bg-[#0a0a14]/60 relative overflow-hidden"
                                >
                                    <div className="scanner-beam bg-amber-500 opacity-20"></div>

                                    <div className="flex justify-between items-start mb-12 relative z-10">
                                        <div>
                                            <div className="hud-tag text-amber-400 mb-2">SYNTHESIS_COMPLETE</div>
                                            <h3 className="text-3xl font-black italic text-white leading-none uppercase tracking-tighter shadow-amber-500/20 drop-shadow-lg">
                                                {brand} {model}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-zinc-600 mb-1 uppercase tracking-widest">SAMPLE_SIZE</div>
                                            <div className="text-2xl font-black text-white">{stats.stats.count} <span className="text-[10px] text-zinc-500">SIGNALS</span></div>
                                        </div>
                                    </div>

                                    {stats.stats.count > 0 ? (
                                        <div className="space-y-12 relative z-10">
                                            {/* Neural Synthesis Visualizer */}
                                            <div className="relative py-12 flex justify-center">
                                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                    <svg width="200" height="200" viewBox="0 0 100 100" className="animate-spin-slow">
                                                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" className="text-amber-500" />
                                                        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" className="text-amber-500" />
                                                        <path d="M50 5 L50 15 M95 50 L85 50 M50 95 L50 85 M5 50 L15 50" stroke="currentColor" strokeWidth="2" className="text-amber-500" />
                                                    </svg>
                                                </div>

                                                <div className="text-center relative">
                                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4">NEURAL_PRICE_ESTIMATE</div>
                                                    <div className="text-7xl font-black italic text-white drop-shadow-[0_0_30px_rgba(245,158,11,0.3)] tabular-nums">
                                                        ₺{stats.stats.average.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div className="mt-8 flex justify-center gap-1.5">
                                                        {[...Array(24)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                initial={{ height: 4 }}
                                                                animate={{ height: [4, 16, 4] }}
                                                                transition={{ delay: i * 0.05, repeat: Infinity, duration: 1.5 }}
                                                                className={`w-1 rounded-full ${i < 16 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-white/5'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 pt-12 border-t border-white/5">
                                                <div className="glass-card p-6 bg-emerald-500/5 border-emerald-500/20 text-center relative overflow-hidden group">
                                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                                    <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2">MIN_THRESHOLD</div>
                                                    <div className="text-2xl font-black text-white italic">₺{stats.stats.min.toLocaleString('tr-TR')}</div>
                                                </div>
                                                <div className="glass-card p-6 bg-rose-500/5 border-rose-500/20 text-center relative overflow-hidden group">
                                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-rose-500/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                                    <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-2">MAX_THRESHOLD</div>
                                                    <div className="text-2xl font-black text-white italic">₺{stats.stats.max.toLocaleString('tr-TR')}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                                                <span>DATA_INTEGRITY: HIGH</span>
                                                <span>LATENCY: 14MS</span>
                                                <span>SOURCE: COMMUNITY_MESH</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center space-y-6">
                                            <div className="text-5xl opacity-20 grayscale">📉</div>
                                            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Insufficient data for neural synthesis.</p>
                                            <div className="hud-tag text-amber-500 cursor-default">BE_THE_FIRST_TO_UPLOAD</div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="glass-card border-dashed border-white/5 bg-transparent h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center opacity-30">
                                    <div className="w-24 h-24 glass-card rounded-[32px] flex items-center justify-center text-4xl mb-8 animate-pulse">📡</div>
                                    <h3 className="text-xl font-black italic text-zinc-400 uppercase tracking-tighter">WAITING_FOR_PARAMETERS</h3>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-2">Initialize query vector to begin market analysis.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </section>
                </div>

                {/* Evidence Reporting Node */}
                <section className="relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="glass-card p-12 border-white/10 bg-gradient-to-br from-[#0a0a14] via-[#050510] to-amber-950/20 shadow-2xl relative overflow-hidden"
                    >
                        <div className="scanner-beam bg-amber-500 shadow-[0_0_20px_#f59e0b]"></div>

                        <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
                            <div className="space-y-4">
                                <div className="hud-tag text-amber-500">FIELD_OPS // REPORTING_NODE</div>
                                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">EVIDENCE_PROTOCOL</h2>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-lg leading-relaxed">
                                    Capture and transmit market anomalies. Every transmission contributes to the integrity of the collective index. Gain hierarchy points for verified data.
                                </p>
                            </div>
                            <div className="w-24 h-24 shrink-0 glass-card bg-amber-500/10 border-amber-500/30 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                📸
                            </div>
                        </div>

                        <form onSubmit={submitReport} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            <div className="lg:col-span-2 space-y-2">
                                <label className="hud-tag text-[7px] pl-1">VISUAL_PROOF_LINK</label>
                                <input
                                    type="text" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-[10px] font-bold tracking-widest focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="TRANS_LINK // HTTP://..."
                                />
                                <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Hizliresim or similar image upload link required.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="hud-tag text-[7px] pl-1">CREDITS_DETECTED (TL)</label>
                                <input
                                    type="number" required value={price} onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-black italic text-lg focus:border-amber-500/50 outline-none transition-all tabular-nums"
                                    placeholder="250000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="hud-tag text-[7px] pl-1">VECTOR_KM</label>
                                <input
                                    type="number" value={kilometers} onChange={(e) => setKilometers(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold italic text-sm focus:border-amber-500/50 outline-none transition-all tabular-nums"
                                    placeholder="15000"
                                />
                            </div>

                            <div className="lg:col-span-4 flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={!price || !imageUrl || reportStatus === 'loading'}
                                    className="group relative bg-amber-600 hover:bg-amber-500 text-black font-black italic px-12 py-5 rounded-[22px] transition-all shadow-2xl overflow-hidden active:scale-95 disabled:opacity-30 uppercase tracking-[0.3em] text-[11px] border-b-4 border-amber-800 hover:border-amber-900"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${reportStatus === 'loading' ? 'bg-black animate-ping' : 'bg-black'}`} />
                                        {reportStatus === 'loading' ? 'TRANSMITTING_EVIDENCE...' : reportStatus === 'success' ? 'TRANSMISSION_SECURED' : 'INITIATE_UPLINK'}
                                    </div>
                                </button>
                            </div>
                        </form>

                        {reportStatus === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500 text-[9px] font-black uppercase tracking-widest text-center"
                            >
                                TRANSMISSION_RECEIVED. RECONSTRUCTING_INDEX...
                            </motion.div>
                        )}
                    </motion.div>
                </section>
            </div>
        </main>
    );
}

