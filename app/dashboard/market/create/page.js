'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CreateListingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'bike',
        brand: '',
        model: '',
        year: '',
        kilometers: '',
        imageUrl: '',
        city: 'İzmir',
        district: 'Dikili'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                router.push('/dashboard/market');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050510] text-zinc-100 pb-32">
            <div className="max-w-3xl mx-auto px-6 pt-12 space-y-12">
                <header className="space-y-4">
                    <button onClick={() => router.back()} className="hud-tag text-zinc-500 hover:text-white transition-colors uppercase italic text-[10px]">{'<<<'} PAZARA_DÖN</button>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">YENİ_VERİ_<span className="text-cyan-400">GİRİŞİ</span></h1>
                </header>

                <form onSubmit={handleSubmit} className="glass-card p-10 bg-[#0a0a14]/60 border-white/5 space-y-10 relative overflow-hidden">
                    <div className="scanner-beam opacity-10"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Title & Description */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <label className="hud-tag text-[7px] pl-1">İLAN_BAŞLIĞI</label>
                                <input
                                    required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-cyan-500/50 outline-none transition-all uppercase"
                                    placeholder="ÖRN. TERTEMİZ MT-07 ARANIYOR"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="hud-tag text-[7px] pl-1">TEKNİK_AÇIKLAMA</label>
                                <textarea
                                    required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyan-500/50 outline-none transition-all"
                                    placeholder="Motorun durumu, ekstralar, servis geçmişi..."
                                />
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="space-y-2">
                            <label className="hud-tag text-[7px] pl-1">MARKA</label>
                            <input
                                required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-cyan-500/50 outline-none transition-all uppercase"
                                placeholder="YAMAHA"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="hud-tag text-[7px] pl-1">MODEL_VEKTÖRÜ</label>
                            <input
                                required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-cyan-500/50 outline-none transition-all uppercase"
                                placeholder="MT-07"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="hud-tag text-[7px] pl-1">MODEL_YILI</label>
                            <input
                                type="number" required value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-cyan-500/50 outline-none transition-all"
                                placeholder="2024"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="hud-tag text-[7px] pl-1">KİLOMETRE_VERİSİ (KM)</label>
                            <input
                                type="number" required value={formData.kilometers} onChange={e => setFormData({ ...formData, kilometers: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-cyan-500/50 outline-none transition-all"
                                placeholder="15000"
                            />
                        </div>

                        {/* Financials */}
                        <div className="space-y-2">
                            <label className="hud-tag text-[7px] pl-1">SATIŞ_BEDELİ (TL)</label>
                            <input
                                type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-black italic text-lg focus:border-cyan-500/50 outline-none transition-all"
                                placeholder="350000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="hud-tag text-[7px] pl-1">GÖRSEL_BAĞLANTISI (URL)</label>
                            <input
                                required value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-[10px] font-bold focus:border-cyan-500/50 outline-none transition-all"
                                placeholder="HTTP://..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black italic py-6 rounded-2xl transition-all shadow-[0_15px_30px_rgba(34,211,238,0.2)] uppercase tracking-[0.4em] text-xs disabled:opacity-30 active:scale-95"
                    >
                        {loading ? 'VERİ_İLETİLİYOR...' : 'İLANI_YAYINLA'}
                    </button>
                </form>
            </div>
        </main>
    );
}
