'use client';

export default function Loading() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-[#050510] relative overflow-hidden z-[9999]">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />

            {/* Minimalist Scanline overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-10" />

            <div className="flex flex-col items-center gap-6 relative z-20">
                {/* Advanced Neon Spinner */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                    <div className="absolute inset-4 border-2 border-pink-500/20 rounded-full" />
                    <div className="absolute inset-4 border-2 border-b-pink-500 border-t-transparent border-r-transparent border-l-transparent rounded-full [animation-duration:1s] animate-spin-reverse shadow-[0_0_15px_rgba(236,72,153,0.4)]" />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                        SİSTEM BAĞLANTISI
                    </span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em] italic">
                        PROTOCOL NEON_V1.7 GEN:LOAD
                    </span>
                </div>
            </div>
        </div>
    );
}
