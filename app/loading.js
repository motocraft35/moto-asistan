'use client';

export default function Loading() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-[#050510] relative overflow-hidden z-[9999]">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />

            {/* Minimalist Scanline overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-10" />

            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <h1 className="text-4xl font-black italic tracking-tighter text-white animate-pulse">
                        MOTO<span className="text-cyan-400">CRAFT</span>
                    </h1>
                    <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-shimmer" />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 via-cyan-400 to-pink-500 w-1/3 animate-loading-bar" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">
                        SİSTEM BAĞLANTISI KURULUYOR
                    </span>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite linear;
                }
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); width: 30%; }
                    50% { width: 60%; }
                    100% { transform: translateX(300%); width: 30%; }
                }
                .animate-loading-bar {
                    animation: loading-bar 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
