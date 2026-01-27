'use client';
import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./components/MapClient'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-magenta-500/10 border-t-magenta-500 rounded-full animate-spin shadow-[0_0_15px_magenta]" />
                <span className="text-[10px] font-black text-magenta-500 tracking-[0.3em] uppercase animate-pulse italic">NEURAL LINK SYNC...</span>
            </div>
        </div>
    )
});

export default function MapPage() {
    return (
        <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden relative">
            <div className="flex-1 relative overflow-hidden">
                <MapClient />

                {/* Forensic Pill Positioning (Bottom Left Floating) */}
                <div className="absolute bottom-24 left-6 z-[2001] pointer-events-none">
                    <div className="px-5 py-2.5 bg-[#050505]/80 backdrop-blur-3xl rounded-[2rem] border border-white/10 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                        <span className="text-[9px] font-black text-zinc-100 uppercase tracking-[0.2em] italic pr-2">SEKTÖR: DİKİLİ_AKTİF</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
