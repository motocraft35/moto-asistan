'use client';

import { registerUser } from '../actions';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleFormAction = async (formData) => {
        setError('');
        const pw = formData.get('password');
        const cpw = formData.get('confirmPassword');

        if (pw !== cpw) {
            setError('Şifreler uyuşmuyor!');
            return;
        }

        const result = await registerUser(formData);

        if (result?.success && result?.user) {
            // Success! Client-Side Backup & Redirect
            try {
                localStorage.setItem('moto_session_backup', JSON.stringify({
                    phone: result.user.phone,
                    token: result.user.token,
                    timestamp: Date.now()
                }));
                // Force Redirect
                window.location.href = `/dashboard?phone=${result.user.phone}&token=${result.user.token}`;
            } catch (e) {
                console.error("Backup failed", e);
                setError('Kayıt başarılı ama yönlendirme hatası. Lütfen giriş yapın.');
            }
        } else if (result?.message) {
            setError(result.message);
        } else {
            setError('Bir hata oluştu.');
        }
    };

    return (
        <div style={{
            position: 'relative',
            flex: 1,
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: '#050510'
        }}>
            {/* Background Scanner Effects */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="scanner-beam" style={{ background: 'linear-gradient(90deg, transparent, #ff003c, transparent)', boxShadow: '0 0 15px #ff003c' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 md:p-12 w-full max-w-lg relative overflow-hidden group border-red-500/20 bg-black/80 shadow-[0_0_50px_rgba(255,0,60,0.15)]"
            >
                <div className="bracket-corner bracket-tl" style={{ borderColor: '#ff003c', boxShadow: '-2px -2px 10px rgba(255,0,60,0.4)' }}></div>
                <div className="bracket-corner bracket-tr" style={{ borderColor: '#ff003c', boxShadow: '2px -2px 10px rgba(255,0,60,0.4)' }}></div>

                <div className="text-center mb-10">
                    <div className="hud-tag justify-center mb-2 text-red-500/60 border-red-500/30">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-2" />
                        KRİTİK KAYIT PROTOKOLÜ
                    </div>
                    <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase mb-2">SİSTEME KATIL</h1>
                    <div className="h-[2px] w-12 bg-red-600 mx-auto opacity-70 shadow-[0_0_10px_#ff003c]"></div>
                </div>

                <form action={handleFormAction} className="space-y-5">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[11px] font-black uppercase text-center tracking-widest"
                            >
                                ⚠ {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">KİMLİK BİLGİSİ</label>
                            <input name="fullName" type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold tracking-tighter focus:border-red-500/50 outline-none transition-all placeholder:text-white/10" placeholder="AD SOYAD" required />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">İLETİŞİM HATTI</label>
                            <input name="phoneNumber" type="tel" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold tracking-tighter focus:border-red-500/50 outline-none transition-all placeholder:text-white/10" placeholder="05XXXXXXXXX" required />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">ARAÇ PLAKASI</label>
                        <div className="relative">
                            <input name="licensePlate" type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold tracking-tighter focus:border-red-500/50 outline-none transition-all placeholder:text-white/10 uppercase" placeholder="34 ABC 123" required />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-red-500/60 uppercase">DOGUMSAL_VERİ</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">ERİŞİM ŞİFRESİ</label>
                            <input
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold tracking-tighter focus:border-red-500/50 outline-none transition-all placeholder:text-white/10"
                                placeholder="******"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">ŞİFRE TEYİT</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full bg-white/5 border p-4 rounded-xl text-white font-bold tracking-tighter outline-none transition-all placeholder:text-white/10 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-white/10 focus:border-red-500/50'}`}
                                placeholder="******"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase ml-1">GÜVENLİK PROTOKOLÜ</label>
                        <div className="space-y-3">
                            <select name="secretQuestion" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white font-bold tracking-tighter focus:border-red-500/50 outline-none transition-all appearance-none" required>
                                <option value="" className="bg-zinc-900">SORU SEÇİN...</option>
                                <option value="ilkokul" className="bg-zinc-900">İlkokul öğretmeninizin adı?</option>
                                <option value="anne_kizlik" className="bg-zinc-900">Annenizin kızlık soyadı?</option>
                                <option value="ilk_evcil" className="bg-zinc-900">İlk evcil hayvanınızın adı?</option>
                                <option value="dogum_yeri" className="bg-zinc-900">Doğduğunuz şehir?</option>
                            </select>
                            <input name="secretAnswer" type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold tracking-tighter focus:border-red-500/50 outline-none transition-all placeholder:text-white/10" placeholder="CEVAP" required />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-5 bg-red-600 text-white font-black italic rounded-xl hover:bg-red-500 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(239,68,68,0.3)] text-lg uppercase tracking-wider mt-4">
                        KAYDI TAMAMLA
                    </button>
                </form>

                <div className="mt-8 text-center text-zinc-500 font-bold text-[10px] tracking-[0.3em]">
                    SİSTEMDE MEVCUT MUSUNUZ? <Link href="/login" className="text-red-500 hover:text-white ml-2 transition-colors">GİRİŞ YAP</Link>
                </div>
            </motion.div >
        </div >
    );
}
