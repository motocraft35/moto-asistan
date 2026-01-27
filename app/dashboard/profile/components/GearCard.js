
export default function GearCard({ gear }) {
    return (
        <div className="glass-card mb-4 group relative overflow-hidden border-white/10 bg-[#0a0a14]/60 shadow-2xl transition-all hover:border-cyan-500/30 flex h-24">
            <div className="scanner-beam bg-cyan-500 opacity-10"></div>

            {/* Visual Intel (Image) */}
            <div className="w-24 shrink-0 bg-black relative overflow-hidden border-r border-white/5">
                {gear.imageUrl ? (
                    <img src={gear.imageUrl} alt={gear.model} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900/40">
                        <span className="text-3xl opacity-50 grayscale group-hover:grayscale-0 transition-all">
                            {gear.type === 'helmet' ? '🪖' : '📻'}
                        </span>
                    </div>
                )}
            </div>

            {/* Tactical Info */}
            <div className="p-4 flex-1 flex flex-col justify-center relative z-10">
                <div className="hud-tag text-[7px] text-cyan-500 border-none p-0 mb-1 tracking-widest uppercase font-black">
                    MODULE // {gear.brand.toUpperCase()}
                </div>
                <div className="text-lg font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-cyan-400 transition-colors">
                    {gear.model}
                </div>
            </div>

            {/* Status Indicator */}
            <div className="w-12 flex items-center justify-center opacity-10 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            </div>
        </div>
    );
}
