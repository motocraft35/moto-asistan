'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function PartsFinderPage() {
    const { showAlert } = useNotifications();
    const [brand, setBrand] = useState('Yamaha'); // Default for demo speed
    const [model, setModel] = useState('MT-07');
    const [year, setYear] = useState('2023');
    const [category, setCategory] = useState('Mekanik');
    const [part, setPart] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Hardcoded categories for hierarchical selection
    const categories = {
        'Mekanik': ['Debriyaj Balatası', 'Piston Seti', 'Eksantrik Zinciri', 'Yağ Pompası'],
        'Elektrik': ['Statör (Sargı)', 'Konjektör', 'Akü', 'Marş Motoru', 'Buji'],
        'Fren & Yürüyen': ['Fren Balatası', 'Zincir Dişli Seti', 'Ön Amortisör Keçesi', 'Teker Rulmanı'],
        'Kaporta': ['Ön Çamurluk', 'Kafa Grenajı', 'Sinyal', 'Ayna Takımı']
    };

    // Brand Models Data (Common Models)
    const brandModels = {
        'Yamaha': ['MT-07', 'MT-25', 'R25', 'XMAX 250', 'NMAX 155', 'Tenere 700'],
        'Honda': ['PCX 125', 'Dio', 'CBR 250R', 'NC 750X', 'Africa Twin', 'Forza 250'],
        'CF Moto': ['250 NK', '250 SR', '450 SR', '650 MT', 'CL-X 700'],
        'Mondial': ['Drift L', 'Vulture', 'Rx3i Evo', 'X-Treme Max'],
        'Kuba': ['Blueberry', 'Chia 125', 'Superlight 200', 'TK-03'],
        'RKS': ['Wildcat 125', 'Spontini', 'TNT 202', 'Bitter 50'],
        'Bajaj': ['Pulsar NS 200', 'Dominar 400', 'Pulsar RS 200'],
        'KTM': ['Duke 250', 'Duke 390', 'RC 390', 'Adventure 390'],
        'Kawasaki': ['Ninja 250', 'Ninja 400', 'Z900', 'Versys 650'],
        'Suzuki': ['V-Strom 650', 'GSX-R 125', 'Address 110']
    };

    // Generate years from 2010 to current year + 1
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: (currentYear + 1) - 2010 }, (_, i) => 2010 + i).reverse();

    const handleSearch = async () => {
        if (!part) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/mechanic/parts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand, model, year, category, part })
            });

            if (res.status === 403) {
                setShowLimitModal(true);
                return;
            }

            const data = await res.json();
            if (res.ok && data.success) {
                setResult(data.data);
            } else {
                const errorMsg = data.error || 'Bilinmeyen bir hata oluştu.';
                const details = data.details ? `\n\nDetay: ${data.details}` : '';
                showAlert(`Hata: ${errorMsg}${details}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Bağlantı hatası! Lütfen internetinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12 pb-24 relative min-h-screen">
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-magenta-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-pink-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Premium Limit Modalı */}
            <AnimatePresence>
                {showLimitModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-card p-10 max-w-md w-full relative border-amber-500/30 overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.1)]"
                        >
                            <div className="scanner-beam bg-amber-500"></div>
                            <div className="absolute top-0 right-0 p-8 opacity-5 text-7xl font-black italic">LIMIT</div>

                            <div className="relative z-10 text-center">
                                <div className="mx-auto w-20 h-20 glass-card bg-amber-500/10 rounded-[32px] flex items-center justify-center mb-8 border-amber-500/50 shadow-2xl">
                                    <span className="text-4xl animate-float">👑</span>
                                </div>

                                <h3 className="text-3xl font-black italic text-white mb-3 tracking-tighter uppercase">ERİŞİM_ENGELLENDİ</h3>
                                <div className="hud-tag justify-center text-amber-500 mb-6">HAFTALIK ANALİZ KOTASI DOLDU</div>

                                <p className="text-zinc-400 mb-8 text-sm leading-relaxed font-medium">
                                    Mevcut bağlantı protokolünüz haftalık yapay zeka parça teşhisini 2 adet ile sınırlandırmaktadır. Sınırsız taktiksel veri için Premium senkronizasyonunu başlatın.
                                </p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => window.location.href = '/payment'}
                                        className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-black italic py-4 rounded-2xl transition-all shadow-[0_15px_40px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs hover:scale-[1.02] border border-amber-400/30"
                                    >
                                        PROTOKOLÜ_YÜKSELT
                                        <span className="text-lg">→</span>
                                    </button>
                                    <button
                                        onClick={() => setShowLimitModal(false)}
                                        className="w-full bg-white/5 hover:bg-white/10 text-zinc-500 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest"
                                    >
                                        İŞLEMİ_İPTAL_ET
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="mb-12 flex justify-between items-start relative z-10">
                <div className="space-y-2 max-w-full overflow-hidden">
                    <div className="hud-tag text-magenta-400 mb-2">SİSTEM_X_44 // TEŞHİS_ARAYÜZÜ</div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-magenta-400 drop-shadow-[0_0_20px_rgba(255,0,255,0.3)] leading-tight break-words">
                        PARÇA_ANALİZ_MERKEZİ
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase pl-1 opacity-70">
                        Nöral Ağ Fiyat ve Uyumluluk Sentezi
                    </p>
                </div>
                <div className="glass-card px-4 py-2 border-white/5 opacity-50">
                    <span className="text-[10px] font-black text-magenta-500/60 tracking-widest">B-v1.7.2</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                {/* Left Column: Search Controls */}
                <div className="lg:col-span-1 space-y-6 glass-card p-8 border-white/5 bg-[#0a0a14]/60 h-fit">
                    <div className="scanner-beam opacity-10"></div>
                    <h2 className="text-white font-black italic flex items-center gap-3 mb-6 uppercase tracking-widest text-xs">
                        <span className="w-2 h-2 bg-magenta-500 rounded-full animate-pulse shadow-[0_0_10px_#ff00ff]" />
                        Taktiksel Seçim
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="hud-tag text-[7px] mb-2 pl-1">ÜRETİCİ_ID</label>
                            <select
                                value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-magenta-500/50 outline-none transition-all cursor-pointer hover:bg-black/60"
                            >
                                {Object.keys(brandModels).map(b => (
                                    <option key={b} value={b} className="bg-[#050510]">{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="hud-tag text-[7px] mb-2 pl-1">MODEL_SPESİFİKASYONU</label>
                                <select
                                    value={model} onChange={(e) => setModel(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-magenta-500/50 outline-none transition-all cursor-pointer hover:bg-black/60"
                                >
                                    <option value="" className="bg-[#050510]">SEÇİNİZ</option>
                                    {brandModels[brand]?.map(m => (
                                        <option key={m} value={m} className="bg-[#050510]">{m}</option>
                                    ))}
                                    <option value="Diğer" className="bg-[#050510]">ÖZEL</option>
                                </select>
                            </div>
                            <div>
                                <label className="hud-tag text-[7px] mb-2 pl-1">ÜRETİM_YILI</label>
                                <select
                                    value={year} onChange={(e) => setYear(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-magenta-500/50 outline-none transition-all cursor-pointer hover:bg-black/60"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y} className="bg-[#050510]">{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {model === 'Diğer' && (
                            <input
                                type="text"
                                placeholder="ÖZEL MODEL GİRİNİZ"
                                className="w-full bg-magenta-500/5 border border-magenta-500/30 rounded-xl p-4 text-white text-xs font-bold uppercase placeholder:text-magenta-900/40 outline-none focus:border-magenta-500"
                                onChange={(e) => setModel(e.target.value)}
                            />
                        )}

                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <div>
                                <label className="hud-tag text-[7px] mb-2 pl-1">SİSTEM_KATEGORİSİ</label>
                                <select
                                    value={category} onChange={(e) => { setCategory(e.target.value); setPart(''); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-magenta-500/50 outline-none transition-all cursor-pointer hover:bg-black/60"
                                >
                                    {Object.keys(categories).map(cat => (
                                        <option key={cat} value={cat} className="bg-[#050510]">{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="hud-tag text-[7px] mb-2 pl-1">BİLEŞEN_DÜĞÜMÜ</label>
                                <select
                                    value={part} onChange={(e) => setPart(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm focus:border-magenta-500/50 outline-none transition-all cursor-pointer hover:bg-black/60"
                                >
                                    <option value="" className="bg-[#050510]">PARÇA_SEÇİN</option>
                                    {categories[category]?.map(p => (
                                        <option key={p} value={p} className="bg-[#050510]">{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={!part || loading}
                        className="w-full mt-8 bg-gradient-to-r from-magenta-600 via-blue-600 to-magenta-600 text-white font-black italic py-5 rounded-[22px] transition-all shadow-[0_15px_35px_rgba(34,211,238,0.2)] disabled:opacity-30 flex justify-center items-center gap-3 uppercase tracking-[0.3em] text-[11px] relative overflow-hidden group border border-magenta-400/30 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-shimmer pointer-events-none" />
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>ANALİZ_YAPILIYOR</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xl">⚡</span>
                                <span>ANALİZİ_BAŞLAT</span>
                            </>
                        )}
                    </button>

                    <p className="text-[8px] text-zinc-600 text-center font-black tracking-widest uppercase mt-4">
                        *Nöral tahminler gerçek zamanlı piyasa dalgalanmalarına tabidir.
                    </p>
                </div>

                {/* Right Column: Results Table */}
                <div className="lg:col-span-2 space-y-8">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="glass-card p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0a14]/60">
                                    <div className="scanner-beam"></div>
                                    <div className="p-8 border-b border-white/5 bg-gradient-to-r from-magenta-500/10 via-transparent to-transparent flex justify-between items-center">
                                        <div className="max-w-[calc(100%-120px)]"> {/* Added max-width to prevent overflow with the right-aligned div */}
                                            <div className="hud-tag text-magenta-400 mb-2">SENTEZLENMİŞ_HEDEF</div>
                                            <h3 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none break-words">{result.partName}</h3>
                                            <p className="text-[10px] text-zinc-500 mt-3 font-black tracking-widest uppercase italic">
                                                UYUMLULUK_DURUMU: <span className="text-magenta-400">{result.compatibility}</span>
                                            </p>
                                        </div>
                                        <div className="glass-card px-5 py-2.5 bg-magenta-500/10 border-magenta-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                            <span className="text-[10px] font-black text-magenta-400 tracking-[0.3em] uppercase animate-pulse">AI_SENTEZ_AKTİF</span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-black/40 border-b border-white/5">
                                                <tr>
                                                    <th className="px-8 py-5 hud-tag text-[8px] text-zinc-500">VARYANT_TİPİ</th>
                                                    <th className="px-8 py-5 hud-tag text-[8px] text-zinc-500">TAHMİNİ_BEDEL</th>
                                                    <th className="px-8 py-5 hud-tag text-[8px] text-zinc-500 text-right">VEKTÖR_VERİSİ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {/* Zero Original */}
                                                <tr className="group hover:bg-emerald-500/5 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 glass-card bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-lg">💎</div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black italic text-white uppercase tracking-wider">FABRİKA_ORİJİNAL</span>
                                                                <span className="text-[8px] text-emerald-500/60 font-black uppercase">MAKSİMUM_UYUM</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xl font-black italic text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] tabular-nums">
                                                            ₺{result.prices.zero_original.min.toLocaleString()} - {result.prices.zero_original.max.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-[10px] text-zinc-500 font-bold italic leading-tight block max-w-[150px] ml-auto">
                                                            {result.prices.zero_original.notes}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Zero Aftermarket */}
                                                <tr className="group hover:bg-amber-500/5 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 glass-card bg-amber-500/10 border-amber-500/30 text-amber-400 text-lg">🛠️</div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black italic text-white uppercase tracking-wider">YAN_SANAYİ_SENKRONU</span>
                                                                <span className="text-[8px] text-amber-500/60 font-black uppercase">TAKTİKSEL_MUADİL</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xl font-black italic text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] tabular-nums">
                                                            ₺{result.prices.zero_aftermarket.min.toLocaleString()} - {result.prices.zero_aftermarket.max.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex flex-wrap gap-1 justify-end">
                                                            {result.prices.zero_aftermarket.brands.split(',').map((b, i) => (
                                                                <span key={i} className="text-[8px] bg-white/5 border border-white/10 px-2 py-0.5 rounded font-black text-zinc-400 uppercase tracking-tighter">{b.trim()}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Second Hand */}
                                                <tr className="group hover:bg-blue-500/5 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 glass-card bg-blue-500/10 border-blue-500/30 text-blue-400 text-lg">♻️</div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black italic text-white uppercase tracking-wider">ÇIKMA_PARÇA</span>
                                                                <span className="text-[8px] text-blue-500/60 font-black uppercase">PAZAR_ARTİĞI</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xl font-black italic text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] tabular-nums">
                                                            ₺{result.prices.second_hand.min.toLocaleString()} - {result.prices.second_hand.max.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="inline-flex items-center gap-2 glass-card px-3 py-1 border-blue-500/30 bg-blue-500/5">
                                                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                                                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{result.prices.second_hand.availability}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-8 bg-zinc-950/40 border-t border-white/5">
                                        <div className="hud-tag text-magenta-400/60 mb-4">TAKTİKSEL_TAVSİYE</div>
                                        <div className="glass-card p-6 bg-white/5 border-white/5 border-l-magenta-500 border-l-4">
                                            <p className="text-sm font-medium italic text-zinc-300 leading-relaxed">
                                                "{result.recommendation}"
                                            </p>
                                        </div>

                                        {result.alternatives && result.alternatives.length > 0 && (
                                            <div className="mt-6 flex flex-wrap gap-2 items-center">
                                                <span className="hud-tag text-[7px] mr-2">BİLİNEN_DİĞER_ADLAR:</span>
                                                {result.alternatives.map((alt, i) => (
                                                    <span key={i} className="glass-card px-3 py-1 bg-white/5 border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:text-magenta-400 hover:border-magenta-500/30 transition-all cursor-default">
                                                        {alt}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-10 bg-gradient-to-t from-emerald-500/10 via-transparent to-transparent flex justify-center">
                                        <a
                                            href={`https://wa.me/905414684047?text=PROTOKOL_ID: ${Date.now().toString().slice(-6)}\nARAÇ: ${brand} ${model} (${year})\nBİLEŞEN: ${part}\nDURUM: TEDARİK_BEKLENİYOR`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/wa flex items-center gap-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black italic py-5 px-12 rounded-[32px] transition-all shadow-[0_20px_50px_rgba(37,211,102,0.3)] scale-100 hover:scale-[1.05] active:scale-95 border border-emerald-400/40"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 group-hover/wa:rotate-[360deg] transition-transform duration-1000">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                            <div className="flex flex-col items-start leading-none pr-2">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">TEDARİK_SÜRECİNİ_BAŞLAT</span>
                                                <span className="text-lg uppercase tracking-tighter">WHATSAPP İLE GÜVENE AL</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // Empty State / Welcome State
                            !loading && (
                                <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center glass-card border-white/5 bg-[#0a0a14]/40 border-dashed">
                                    <div className="relative mb-10">
                                        <div className="w-32 h-32 glass-card rounded-[40px] flex items-center justify-center text-6xl opacity-20 border-white/10 animate-pulse">🔍</div>
                                        <div className="absolute inset-0 scanner-beam bg-magenta-400 h-1"></div>
                                    </div>
                                    <h3 className="text-3xl font-black italic text-zinc-400 mb-4 uppercase tracking-tighter">BAĞLANTI_BEKLENİYOR</h3>
                                    <p className="text-zinc-600 max-w-sm text-xs font-bold leading-relaxed uppercase tracking-widest">
                                        Nöral fiyat sentezini başlatmak için kenar çubuğundan taktiksel araç parametrelerini ve bileşen düğümünü seçin.
                                    </p>
                                </div>
                            )
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
