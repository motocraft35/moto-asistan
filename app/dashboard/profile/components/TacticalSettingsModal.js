'use client';

import { useState, useRef } from 'react';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function TacticalSettingsModal({ profile, onClose, onSave }) {
    const { showAlert } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        licensePlate: profile.licensePlate || '',
        profileImage: profile.profileImage || ''
    });
    const fileInputRef = useRef(null);

    const resizeImage = (base64Str) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                } catch (err) { reject(err); }
            };
            img.onerror = (e) => reject(new Error('Resim işlenemedi.'));
            img.src = base64Str;
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 15 * 1024 * 1024) {
                showAlert('Resim çok büyük (Maks 15MB).');
                return;
            }
            setLoading(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const compressed = await resizeImage(reader.result);
                    setFormData(prev => ({ ...prev, profileImage: compressed }));
                } catch (err) {
                    showAlert('Resim boyutlandırılamadı.');
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/users/profile/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: formData.profileImage,
                    bio: formData.bio,
                    fullName: formData.fullName,
                    licensePlate: formData.licensePlate
                })
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const err = await res.json();
                showAlert('Hata: ' + (err.error || 'İşlem başarısız.'));
            }
        } catch (error) {
            console.error(error);
            showAlert('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg bg-[#0a0a0f] border-white/10 overflow-hidden relative">
                <div className="scanner-beam bg-cyan-500 opacity-10"></div>

                <div className="p-8 space-y-8 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div>
                            <div className="hud-tag text-cyan-500 border-none p-0 text-[10px]">PİLOT AYARLARI // VERİ MERKEZİ</div>
                            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">PROFİLİ DÜZENLE</h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 glass-card border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => !loading && fileInputRef.current?.click()}>
                                <div className="w-32 h-32 glass-card bg-zinc-900 border-white/20 p-2 relative overflow-hidden">
                                    <img
                                        src={formData.profileImage || '/default-avatar.png'}
                                        className={`w-full h-full object-cover rounded-2xl transition-all ${loading ? 'opacity-30 blur-sm' : 'opacity-80 group-hover:opacity-100'}`}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white italic tracking-widest uppercase">DEĞİŞTİR</span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-sm shadow-lg border-2 border-[#0a0a0f]">📸</div>
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={loading} />
                            </div>
                        </div>

                        {/* Text Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">PİLOT ADI</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-800"
                                    value={formData.fullName}
                                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    placeholder="Ad Soyad"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">ARAÇ KİMLİĞİ (PLAKA)</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-800"
                                    value={formData.licensePlate}
                                    onChange={e => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                                    placeholder="34 ABC 123"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">MİSYON BİLDİRİSİ (BİYO)</label>
                            <textarea
                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-800 resize-none"
                                value={formData.bio}
                                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="Kendinden bahset..."
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 glass-card border-white/5 py-4 font-black italic text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:border-white/10 transition-all"
                            >
                                İPTAL
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/30 py-4 font-black italic text-[10px] uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(34,211,238,0.2)] hover:shadow-[0_10px_30px_rgba(34,211,238,0.4)] transition-all active:scale-95"
                            >
                                {loading ? 'SENKRONİZE EDİLİYOR...' : 'VERİLERİ KAYDET'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
