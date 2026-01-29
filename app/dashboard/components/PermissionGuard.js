'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PermissionGuard({ onGranted }) {
    const [status, setStatus] = useState({
        geolocation: 'prompt',
        microphone: 'prompt'
    });
    const [isVisible, setIsVisible] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    // Dynamic checks
    const checkPermissions = async () => {
        // Ultimate Truth: Check storage first
        let geoState = typeof window !== 'undefined' ? localStorage.getItem('perm_geo') || 'prompt' : 'prompt';
        let micState = typeof window !== 'undefined' ? localStorage.getItem('perm_mic') || 'prompt' : 'prompt';

        try {
            if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
                // GPS Query
                try {
                    const geo = await navigator.permissions.query({ name: 'geolocation' });
                    if (geo.state === 'granted') {
                        geoState = 'granted';
                        localStorage.setItem('perm_geo', 'granted');
                    }
                } catch (e) { /* silent fail */ }

                // Mic Query
                try {
                    const mic = await navigator.permissions.query({ name: 'microphone' });
                    if (mic.state === 'granted') {
                        micState = 'granted';
                        localStorage.setItem('perm_mic', 'granted');
                    }
                } catch (e) { /* Safari doesn't support mic query */ }
            }
        } catch (err) {
            console.warn('Health check failed:', err);
        }

        const currentStatus = { geolocation: geoState, microphone: micState };

        // Prevent constant onGranted trigger if already granted
        const wasAlreadyGranted = status.geolocation === 'granted' && status.microphone === 'granted';
        const isNowGranted = currentStatus.geolocation === 'granted' && currentStatus.microphone === 'granted';

        setStatus(currentStatus);

        if (isNowGranted) {
            setIsVisible(false);
            if (!wasAlreadyGranted && onGranted) {
                onGranted();
            }
        } else {
            setIsVisible(true);
        }
    };

    useEffect(() => {
        checkPermissions();
        // Constant scan for permission changes
        const interval = setInterval(checkPermissions, 2500);
        return () => clearInterval(interval);
    }, [onGranted]);

    const handleGrantAll = async () => {
        setIsRequesting(true);
        try {
            // 1. Force GPS Request
            await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        localStorage.setItem('perm_geo', 'granted');
                        resolve();
                    },
                    () => resolve(),
                    { enableHighAccuracy: true, timeout: 8000 }
                );
            });

            // 2. Force Microphone Request
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop());
                localStorage.setItem('perm_mic', 'granted');
            } catch (e) {
                console.warn("Manual mic access denied:", e);
            }

            // Final Re-scan
            await checkPermissions();
        } catch (err) {
            console.error('Permission Shield Failure:', err);
        } finally {
            setIsRequesting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05),transparent)]" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/50 shadow-[0_0_20px_cyan] animate-[scan_3s_linear_infinite]" />

                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative w-full max-w-md glass-card border-cyan-500/30 p-8 text-center flex flex-col items-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 relative">
                        <span className="text-4xl animate-pulse">🛠️</span>
                        <div className="absolute -inset-2 border border-cyan-500/20 rounded-3xl animate-spin-slow pointer-events-none" />
                    </div>

                    <div className="mb-2">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-1 block">SİSTEM ERİŞİMİ GEREKLİ</span>
                        <h2 className="text-3xl font-black italic text-white tracking-widest uppercase mb-4">GHOST<span className="text-cyan-400">GEAR</span> OS</h2>
                    </div>

                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed font-medium uppercase italic tracking-tighter">
                        Güvenli konvoy sürüşü ve telsiz iletişimi için <span className="text-white">KONUM</span> ve <span className="text-white">MİKROFON</span> protokollerini aktif edin.
                    </p>

                    <div className="w-full space-y-3 mb-8">
                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${status.geolocation === 'granted' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/50 border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📍</span>
                                <div className="text-left">
                                    <div className="text-[10px] font-black text-white uppercase italic">GPS / KONUM</div>
                                    <div className="text-[8px] text-zinc-500 uppercase font-bold">Harita ve Hız Kilidi</div>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black ${status.geolocation === 'granted' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                {status.geolocation === 'granted' ? 'AKTİF' : 'BEKLEMEDE'}
                            </span>
                        </div>

                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${status.microphone === 'granted' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/50 border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🎤</span>
                                <div className="text-left">
                                    <div className="text-[10px] font-black text-white uppercase italic">TELSİZ / SES</div>
                                    <div className="text-[8px] text-zinc-500 uppercase font-bold">Sesli İletişim Ağı</div>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black ${status.microphone === 'granted' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                {status.microphone === 'granted' ? 'AKTİF' : 'BEKLEMEDE'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleGrantAll}
                        disabled={isRequesting}
                        className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-black italic tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:grayscale relative overflow-hidden mb-3"
                    >
                        {isRequesting ? 'PROTOKOLLER YÜKLENİYOR...' : 'SİSTEMLERİ AKTİFLEŞTİR'}
                    </button>

                    <button
                        onClick={() => {
                            localStorage.setItem('perm_geo', 'granted');
                            localStorage.setItem('perm_mic', 'granted');
                            checkPermissions();
                        }}
                        className="w-full py-3 bg-red-600/10 border border-red-500/20 text-red-500 font-black italic tracking-[0.1em] rounded-xl text-[10px] hover:bg-red-500/20 transition-all uppercase"
                    >
                        ⚠ Windows Konum Hatasını Bypass Et (Simülasyon Modu)
                    </button>

                    <div className="mt-6 text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                        GHOST GEAR V3.2.5 SECURITY PROTOCOL
                    </div>
                </motion.div>

                <style jsx>{`
                    @keyframes scan {
                        0% { top: 0; }
                        50% { top: 100%; }
                        100% { top: 0; }
                    }
                    .animate-spin-slow {
                        animation: spin 8s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </motion.div>
        </AnimatePresence>
    );
}
