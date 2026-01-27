'use client';

import { useState } from 'react';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function GarageCard({ bike, onEdit, isMe }) {
    const getImages = (str) => {
        if (!str) return [];
        if (str.includes('|')) return str.split('|');
        if (str.startsWith('data:')) return [str]; // Single base64 image, do not split by comma!
        return str.split(',').filter(u => u.trim() !== ''); // Fallback for legacy URL-based images
    };
    const images = getImages(bike.imageUrls || bike.imageUrl);
    const { showAlert, showConfirm } = useNotifications();
    const [activeImg, setActiveImg] = useState(0);

    const handleDelete = async () => {
        const confirmed = await showConfirm('Bu motosikleti garajdan kaldırmak istediğine emin misin?');
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/bikes?id=${bike.id}`, { method: 'DELETE' });
            if (res.ok) {
                window.location.reload(); // Simple refresh for now or use prop
            } else {
                showAlert('Silme işlemi başarısız.');
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="glass-card mb-8 group relative overflow-hidden border-white/10 bg-[#0a0a14]/60 shadow-2xl transition-all hover:border-cyan-500/30">
            <div className="scanner-beam bg-cyan-500 opacity-20"></div>

            {/* Tactical Header */}
            <div className="p-6 flex justify-between items-start relative z-10 border-b border-white/5">
                <div>
                    <div className="hud-tag text-cyan-500 bg-cyan-500/10 border-cyan-400/20 mb-2">ARAÇ SINIFI // {bike.brand.toUpperCase()} {bike.year}</div>
                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">{bike.nickname || bike.model}</h3>
                </div>

                {isMe && (
                    <div className="flex gap-3">
                        <button onClick={() => onEdit(bike)} className="glass-card px-4 py-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-400 font-black italic text-[10px] uppercase tracking-widest transition-all active:scale-95">
                            DÜZENLE
                        </button>
                        <button onClick={handleDelete} className="glass-card px-4 py-2 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 font-black italic text-[10px] uppercase tracking-widest transition-all active:scale-95">
                            SİL
                        </button>
                    </div>
                )}
            </div>

            {/* Visual Intel (Image) */}
            <div className="relative h-64 bg-black overflow-hidden group-hover:bg-[#050510] transition-colors">
                {images.length > 0 ? (
                    <img
                        src={images[activeImg]}
                        alt={bike.model}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/40">
                        <span className="text-5xl mb-4 opacity-50">🏍️</span>
                        <div className="hud-tag text-zinc-600 border-none">GÖRSEL VERİ YOK</div>
                    </div>
                )}

                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImg(idx)}
                                className={`h-1 rounded-full transition-all ${activeImg === idx ? 'w-8 bg-cyan-500 shadow-[0_0_10px_#22d3ee]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}
                <div className="absolute top-0 right-0 p-8 opacity-5 text-6xl font-black italic tracking-tighter pointer-events-none uppercase">{bike.brand}</div>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-3 border-b border-white/5 relative z-10">
                <div className="p-6 border-r border-white/5 text-center group/stat">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1 group-hover/stat:text-cyan-500 transition-colors">MESAFE KAYDI</div>
                    <div className="text-lg font-black italic text-white leading-none">
                        {(bike.kilometers || 0).toLocaleString()} <span className="text-[8px] text-zinc-500">KM</span>
                    </div>
                </div>
                <div className="p-6 border-r border-white/5 text-center group/stat">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1 group-hover/stat:text-emerald-500 transition-colors">SÜRÜŞ SAYISI</div>
                    <div className="text-lg font-black italic text-pink-500 leading-none">
                        {bike.tripsCount || 0}
                    </div>
                </div>
                <div className="p-6 text-center group/stat">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1 group-hover/stat:text-cyan-500 transition-colors">MODEL SERİSİ</div>
                    <div className="text-lg font-black italic text-white leading-none truncate px-2">
                        {bike.model ? bike.model.split(' ')[0].toUpperCase() : 'ASSET'}
                    </div>
                </div>
            </div>

            {/* Tech Specs (Accessories) */}
            {bike.accessories && (
                <div className="p-6 bg-white/[0.02] relative z-10 border-b border-white/5">
                    <div className="hud-tag text-zinc-500 border-none p-0 mb-3 text-[9px] scale-90 origin-left uppercase font-black tracking-widest">EKSTRA DONANIMLAR</div>
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed italic opacity-80">
                        {bike.accessories}
                    </p>
                </div>
            )}

            {/* Footer Status */}
            <div className="p-4 flex justify-between items-center opacity-30 relative z-10">
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                    MOTO-ASİSTAN // ARAÇ KAYDI // V3.1.0
                </div>
                <div className="text-cyan-500 text-xs animate-pulse">
                    ● AKTİF
                </div>
            </div>
        </div>
    );
}
