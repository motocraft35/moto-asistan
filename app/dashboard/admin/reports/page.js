'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports');
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        const interval = setInterval(fetchReports, 30000); // 30 sec auto-refresh
        return () => clearInterval(interval);
    }, []);

    const filteredReports = filter === 'all'
        ? reports
        : reports.filter(r => r.type === filter);

    return (
        <main className="min-h-screen bg-[#050510] text-zinc-100 p-6 pb-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
                    <div>
                        <Link href="/dashboard" className="text-[10px] font-black text-cyan-500/60 hover:text-cyan-400 transition-colors mb-2 block tracking-widest uppercase italic">
                            « DASHBOARD_RETURN
                        </Link>
                        <h1 className="text-neon-title text-3xl text-white">
                            NEURAL <span className="text-cyan-400">FEED</span>
                        </h1>
                        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider font-medium">Kullanıcı geri bildirimleri ve hata raporları komuta merkezi.</p>
                    </div>

                    <div className="flex gap-2">
                        {['all', 'bug', 'suggestion', 'idea'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${filter === f
                                        ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                        : 'bg-zinc-900 border-white/10 text-zinc-500 hover:border-white/20'
                                    }`}
                            >
                                {f === 'all' ? 'HEPSİ' : f === 'bug' ? 'HATA' : f === 'suggestion' ? 'ÖNERİ' : 'FİKİR'}
                            </button>
                        ))}
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest animate-pulse italic">Veri akışı senkronize ediliyor...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-20 glass-card border-dashed border-white/5 opacity-50">
                        <p className="text-zinc-500 text-xs italic">Henüz rapor bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredReports.map((report, i) => (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`glass-card p-5 border-l-4 transition-all hover:scale-[1.01] ${report.type === 'bug' ? 'border-l-red-500' :
                                            report.type === 'suggestion' ? 'border-l-cyan-500' :
                                                'border-l-emerald-500'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${report.type === 'bug' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    report.type === 'suggestion' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}>
                                                {report.type === 'bug' ? 'HATA' : report.type === 'suggestion' ? 'ÖNERİ' : 'FİKİR'}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 font-bold uppercase">
                                                {report.fullName} <span className="text-zinc-600 ml-1">[{report.licensePlate}]</span>
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-zinc-600 font-medium tabular-nums">
                                            {new Date(report.timestamp).toLocaleString('tr-TR')}
                                        </div>
                                    </div>

                                    <p className="text-zinc-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                        {report.content}
                                    </p>

                                    {report.pageUrl && (
                                        <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                                            <span className="font-black uppercase tracking-widest">KAYNAK:</span>
                                            <a href={report.pageUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-500 transition-colors italic">
                                                {report.pageUrl.replace(window.location.origin, '') || '/'}
                                            </a>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    );
}
