'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ListingDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    const fetchListing = async () => {
        try {
            const res = await fetch(`/api/marketplace/detail?id=${id}`);
            const data = await res.json();
            setListing(data.listing);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const res = await fetch('/api/marketplace/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id })
            });
            if (res.ok) {
                fetchListing();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        fetchListing();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#050510] flex items-center justify-center text-cyan-500 font-black italic">VERİLER_ALINIYOR...</div>;
    if (!listing) return <div className="min-h-screen bg-[#050510] flex items-center justify-center text-rose-500 font-black italic">İLAN_BULUNAMADI</div>;

    return (
        <main className="min-h-screen bg-[#050510] text-zinc-100 pb-32">
            <div className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
                <button onClick={() => router.back()} className="hud-tag text-zinc-500 hover:text-white transition-colors uppercase italic text-[10px]">{'<<<'} GÖRÜNÜMÜ_KAPAT</button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Visual Node */}
                    <div className="md:col-span-7 space-y-8">
                        <div className="glass-card aspect-video rounded-[32px] overflow-hidden border-white/10 shadow-2xl relative">
                            <img src={listing.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f91cbcf523?q=80&w=800'} className="w-full h-full object-cover" />
                            <div className="scanner-beam bg-cyan-500 opacity-20"></div>
                            {listing.isAiVerified === 1 && (
                                <div className="absolute top-6 left-6 hud-tag bg-cyan-500 text-black font-black italic border-none shadow-[0_0_25px_#22d3ee]">ALPHA_ONAYLI_VARLIK</div>
                            )}
                        </div>

                        <div className="glass-card p-8 space-y-6">
                            <div className="hud-tag text-zinc-500">TEKNİK_ÖZELLİKLER</div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">MARKA</div>
                                    <div className="text-sm font-black text-white italic">{listing.brand}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">MODEL</div>
                                    <div className="text-sm font-black text-white italic">{listing.model}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">YIL</div>
                                    <div className="text-sm font-black text-white italic">{listing.year}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black text-zinc-600 uppercase mb-1">KİLOMETRE</div>
                                    <div className="text-sm font-black text-white italic">{listing.kilometers} KM</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 space-y-4">
                            <div className="hud-tag text-zinc-500">İLAN_AÇIKLAMASI</div>
                            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                                {listing.description}
                            </p>
                        </div>
                    </div>

                    {/* Meta Node */}
                    <div className="md:col-span-5 space-y-8">
                        <div className="glass-card p-10 bg-gradient-to-br from-cyan-600/10 to-transparent border-cyan-500/20 text-center relative overflow-hidden">
                            <div className="scanner-beam opacity-10"></div>
                            <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4">İSTENEN_BEDEL</div>
                            <div className="text-5xl font-black italic text-white mb-2 tabular-nums">₺{listing.price.toLocaleString('tr-TR')}</div>
                            <div className="hud-tag text-[8px] bg-white/5 border-none p-0 inline-block uppercase text-zinc-500">Para Birimi // Türk Lirası</div>
                        </div>

                        {listing.isAiVerified === 1 ? (
                            <div className="glass-card p-8 border-cyan-500/40 bg-cyan-500/5 relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-shimmer" />
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black text-lg">🤖</div>
                                    <div className="hud-tag text-cyan-400">M.E.C.H_BİRİMİ_ANALİZİ</div>
                                </div>
                                <p className="text-zinc-200 text-xs italic leading-relaxed font-bold border-l-2 border-cyan-500/30 pl-4 relative z-10">
                                    "{listing.aiAnalysis}"
                                </p>
                            </div>
                        ) : (
                            <div className="glass-card p-8 border-amber-500/20 bg-amber-500/5 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">⚡</div>
                                    <div className="hud-tag text-amber-500">ALPHA_PRESTİJ_SERVİSİ</div>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                                    İlanını M.E.C.H_UNIT yapay zekasına analiz ettir. Satış hızını %80 artır ve Alpha-Verified rozeti kazan.
                                </p>
                                <button
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black font-black italic rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-30 active:scale-95"
                                >
                                    {verifying ? 'VARLIK_ANALİZ_EDİLİYOR...' : 'AI_DOĞRULAMA_TALEBİ (50 ₺)'}
                                </button>
                            </div>
                        )}

                        <div className="glass-card p-8 space-y-6">
                            <div className="hud-tag text-zinc-500">SATICI_KİMLİĞİ</div>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden p-1">
                                    <div className="w-full h-full rounded-xl overflow-hidden">
                                        {listing.sellerImage ? <img src={listing.sellerImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center">👤</div>}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-lg font-black italic text-white uppercase">{listing.sellerName}</div>
                                    <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">RÜTBE: PİLOT_SEVİYE_14</div>
                                </div>
                            </div>
                            <button className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black italic rounded-[20px] text-[10px] uppercase tracking-[0.3em] border border-white/10 transition-all active:scale-95">
                                ŞİFRELİ_MESAJ_GÖNDER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
