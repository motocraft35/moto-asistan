'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function SOSButton() {
    const { showAlert } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [activeSignal, setActiveSignal] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [sosType, setSosType] = useState('mechanical');
    const [sosMessage, setSosMessage] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const SOS_TYPES = [
        { id: 'mechanical', label: 'MEKANİK', icon: '🔧' },
        { id: 'accident', label: 'KAZA', icon: '💥' },
        { id: 'medical', label: 'TIBBİ', icon: '🚑' },
    ];

    const triggerSOS = async () => {
        setLoading(true);
        setShowModal(false);

        if (!navigator.geolocation) {
            showAlert('Tarayıcınız konum özelliğini desteklemiyor.');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const res = await fetch('/api/ai/sos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        type: sosType,
                        message: sosMessage || 'Yardıma ihtiyacım var!'
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    setActiveSignal(data.id);
                    showAlert('🚨 SOS SİNYALİ GÖNDERİLDİ! \nKonumun haritada işaretlendi. Sabırlı ol, bir dost elbet gelecektir.');
                } else {
                    showAlert('Sinyal gönderilemedi: ' + data.error);
                }
            } catch (error) {
                showAlert('Sistem hatası.');
            } finally {
                setLoading(false);
            }
        }, (err) => {
            showAlert('Konum izni verilmediği için SOS gönderilemedi.');
            setLoading(false);
        });
    };

    const handleSOS = async () => {
        if (activeSignal) {
            if (confirm('Yardım ulaştı mı? SOS sinyalini kapatmak istiyor musun?')) {
                setLoading(true);
                try {
                    const res = await fetch('/api/ai/sos', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ signalId: activeSignal })
                    });
                    if (res.ok) {
                        setActiveSignal(null);
                        showAlert('✅ SOS Durumu: ÇÖZÜLDÜ. Geçmiş olsun!');
                    }
                } catch (e) {
                    showAlert('Hata oluştu.');
                } finally {
                    setLoading(false);
                }
            }
            return;
        }

        setShowModal(true);
    };

    return (
        <>
            <button
                onClick={handleSOS}
                disabled={loading}
                className={`w-full py-4 md:py-6 rounded-[20px] md:rounded-[32px] border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 md:gap-2 overflow-hidden relative group shadow-2xl ${activeSignal
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
                    }`}
            >
                <div className={`absolute inset-0 bg-gradient-to-br transition-opacity ${activeSignal ? 'from-emerald-500/10 to-transparent' : 'from-red-500/10 to-transparent'
                    }`} />

                {!activeSignal && (
                    <div className="absolute top-0 right-0 p-3 md:p-4">
                        <div className="hud-tag text-[9px] md:text-[10px] border-red-500/30 bg-red-500/10 uppercase">ACİL DURUM BAĞLANTISI</div>
                    </div>
                )}

                <span className="text-2xl md:text-4xl group-hover:scale-125 transition-transform duration-500">
                    {activeSignal ? '✅' : '🚨'}
                </span>

                <div className="text-center flex flex-col items-center gap-0.5 md:gap-1">
                    <p className="text-lg md:text-xl font-black italic uppercase tracking-tighter leading-tight">
                        {activeSignal ? 'YARDIM GELDİ' : 'YOLDA KALDIM'}
                    </p>
                    <p className={`text-[7.5px] md:text-[8px] font-bold uppercase tracking-[0.15em] opacity-60 leading-none`}>
                        {activeSignal ? 'SİNYALİ SONLANDIR VE BİLDİR' : 'ANLIK KONUM PAYLAŞ VE BAĞLAN'}
                    </p>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </button>

            {showModal && mounted && createPortal(
                <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
                    <div className="glass-card w-full max-w-md p-6 border-red-500/30 relative z-[100002] animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-black italic text-red-500">SOS</div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                                <span className="text-xl">🚨</span>
                            </div>
                            <div>
                                <div className="hud-tag text-red-500 text-[10px]">PROTOKOL // ACİL DURUM</div>
                                <h3 className="text-sm font-black text-white italic tracking-tighter uppercase">SOS Yapılandırması</h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* SOS TYPE SELECTION */}
                            <div>
                                <label className="hud-tag text-[8px] text-zinc-500 mb-2 block">YARDIM TÜRÜ SEÇİN</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {SOS_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setSosType(type.id)}
                                            className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${sosType === type.id
                                                ? 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105'
                                                : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'}`}
                                        >
                                            <span className="text-lg">{type.icon}</span>
                                            <span className="text-[6px] font-black">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* MANUAL MESSAGE INPUT */}
                            <div>
                                <label className="hud-tag text-[8px] text-zinc-500 mb-2 block">DURUM AÇIKLAMASI (OPSİYONEL)</label>
                                <textarea
                                    value={sosMessage}
                                    onChange={(e) => setSosMessage(e.target.value)}
                                    placeholder="Örn: Lastiğim patladı, zincirim koptu..."
                                    className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] text-white focus:outline-none focus:border-red-500/50 transition-colors uppercase italic font-medium placeholder:text-zinc-700"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 glass-card bg-white/5 border-white/10 rounded-xl text-[8px] font-black uppercase text-zinc-500 hover:bg-white/10"
                                >
                                    İPTAL
                                </button>
                                <button
                                    onClick={triggerSOS}
                                    className="flex-2 py-3 bg-red-600 border border-red-500 rounded-xl text-[8px] font-black uppercase text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-500 transition-all"
                                >
                                    SİNYALİ GÖNDER
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
