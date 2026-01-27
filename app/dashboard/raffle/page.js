'use client';
import { useState, useEffect } from 'react';
import { claimRaffleCode, getMyRaffleTickets } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function RafflePage() {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState({ loading: false, error: '', success: '' });
    const [tickets, setTickets] = useState([]);
    const router = useRouter();

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        const data = await getMyRaffleTickets();
        setTickets(data);
    };

    const handleClaim = async (e) => {
        e.preventDefault();
        if (!code) return;

        setStatus({ loading: true, error: '', success: '' });
        try {
            const res = await claimRaffleCode(code);
            if (res.success) {
                setStatus({ loading: false, error: '', success: res.message });
                setCode('');
                loadTickets();
            } else {
                setStatus({ loading: false, error: res.message, success: '' });
            }
        } catch (err) {
            setStatus({ loading: false, error: 'Sistem hatası oluştu.', success: '' });
        }
    };

    return (
        <div className="min-h-screen bg-[#030308] text-white p-6 pb-32">
            <div className="max-w-2xl mx-auto space-y-12">
                {/* Header */}
                <header className="space-y-4 pt-8 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                        <div className="h-[2px] w-8 bg-cyan-500 shadow-[0_0_10px_#00ffff]" />
                        <span className="text-[10px] font-black tracking-[0.4em] text-cyan-500 uppercase italic">LUCKY DRAW // VERİ SİSTEMİ 01</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
                        NEON <span className="text-cyan-500 drop-shadow-[0_0_20px_#00ffff]">ÇEKİLİŞ</span>
                    </h1>
                </header>

                {/* Claim Form */}
                <section className="glass-card p-1 border-white/5 bg-white/[0.02]">
                    <div className="p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-12 h-12 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <path d="M7 12h10M7 8h10M7 16h10" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold tracking-tight uppercase italic text-cyan-400">KODUNU TANIMLA</h2>
                            <p className="text-xs text-zinc-400">Fişindeki 10 haneli kodu gir veya QR tara.</p>
                        </div>

                        <form onSubmit={handleClaim} className="flex flex-col gap-4">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Örn: ANTIGRV123"
                                className="w-full bg-black/50 border border-white/10 p-4 rounded-sm font-black tracking-widest text-center text-xl uppercase focus:border-amber-500 focus:outline-none transition-all placeholder:text-zinc-800"
                                maxLength={10}
                            />

                            <button
                                type="submit"
                                disabled={status.loading || !code}
                                className="w-full py-4 bg-cyan-600 text-white font-black uppercase tracking-tighter italic hover:bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 transition-all active:scale-95"
                            >
                                {status.loading ? 'İŞLENİYOR...' : 'BİLETİ AKTİF ET'}
                            </button>
                        </form>

                        {status.error && <p className="text-red-500 text-xs text-center font-bold tracking-widest uppercase">{status.error}</p>}
                        {status.success && <p className="text-amber-500 text-xs text-center font-bold tracking-widest uppercase">{status.success}</p>}
                    </div>
                </section>

                {/* My Tickets List */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h2 className="text-lg font-black italic uppercase tracking-tight">BİLETLERİM <span className="text-zinc-500">({tickets.length})</span></h2>
                        <div className="h-[1px] flex-1 mx-4 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {tickets.length > 0 ? tickets.map((t, i) => (
                            <div key={i} className="glass-card p-4 border-white/5 flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                <div className="space-y-1">
                                    <p className="text-xs font-black tracking-widest text-amber-500/80 uppercase">#{t.code}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase">{new Date(t.scannedAt).toLocaleDateString('tr-TR')} // {t.campaignName}</p>
                                </div>
                                <div className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 border border-amber-500/20 font-black italic">
                                    ONAYLANDI
                                </div>
                            </div>
                        )) : (
                            <div className="py-12 text-center space-y-2 opacity-30">
                                <p className="text-xs font-bold uppercase tracking-widest italic">Henüz biletin yok</p>
                                <p className="text-[8px] uppercase">Alışveriş fişindeki kodları buraya tanımla</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
