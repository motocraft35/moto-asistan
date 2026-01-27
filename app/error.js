'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('Global Error Boundary:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md glass-card border-red-500/30 p-8 relative overflow-hidden">
                <div className="scanner-beam bg-red-600 opacity-20" />

                <div className="mb-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl border-2 border-red-500/20 flex items-center justify-center mb-4 bg-red-500/5">
                        <span className="text-3xl animate-pulse">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-black italic text-white tracking-widest uppercase mb-2">SİSTEM HATASI</h2>
                    <div className="hud-tag bg-red-500/10 text-red-500 border-red-500/20 text-[10px] uppercase font-black tracking-widest px-4 py-1">
                        NEURAL LINK DISCONNECTED
                    </div>
                </div>

                <div className="bg-black/40 rounded-xl border border-white/5 p-4 mb-8 text-left">
                    <div className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest opacity-60">Hata Detayı // DIAGNOSTICS:</div>
                    <p className="text-xs font-mono text-red-400 break-words leading-relaxed">
                        {error?.message || 'Tanımlanamayan sistem hatası oluştu.'}
                    </p>
                    {error?.digest && (
                        <div className="mt-2 text-[8px] font-mono text-zinc-600 uppercase">
                            Digest ID: {error.digest}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black italic tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-400/50 uppercase"
                    >
                        Sistemi Yeniden Başlat
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="w-full py-3 bg-zinc-900 border border-white/10 text-zinc-400 text-xs font-black tracking-widest rounded-xl hover:bg-zinc-800 transition-all uppercase"
                    >
                        Merkeze Dön (Zorla)
                    </button>
                </div>

                <div className="mt-8 text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] italic leading-relaxed">
                    ANTIGRAVITY OS // V3.1.0 STABLE<br />
                    CORE_ERROR_HANDLE_PROTOCOL_V2
                </div>
            </div>
        </div>
    );
}
