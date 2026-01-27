import MechanicClient from './client';

export default function MechanicPage() {
    return (
        <main className="min-h-screen bg-[#050510] relative overflow-hidden flex flex-col">
            {/* Background Aesthetics */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-1/2 h-1/2 bg-pink-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-1/2 h-1/2 bg-cyan-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Tactical Header */}
            <div className="px-6 pt-12 pb-6 relative z-10">
                <div className="flex items-center gap-6 max-w-2xl mx-auto">
                    <a href="/dashboard" className="w-12 h-12 glass-card flex items-center justify-center text-white/60 hover:text-cyan-400 transition-colors border-white/10 hover:border-cyan-500/50 group">
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    </a>
                    <div className="flex flex-col">
                        <div className="hud-tag text-pink-500 mb-1">ROSE_UNIT // TEŞHİS_BAĞLANTISI_AKTİF</div>
                        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
                            ROSERA<span className="text-pink-400 drop-shadow-[0_0_15px_rgba(255,0,127,0.5)]">_AI</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative z-10 max-w-2xl w-full mx-auto flex flex-col">
                <MechanicClient />
            </div>

            <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none opacity-20 z-50">
                <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">
                    GHOST_OS // NEURAL_REPAIR_HEURISTICS // V2.0.4
                </span>
            </div>
        </main>
    );
}
