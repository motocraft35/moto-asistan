'use client';

import { useState, useEffect } from 'react';

export default function OnlineCounter({ initialCount = 0 }) {
    const [count, setCount] = useState(initialCount);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch('/api/stats/online');
                const data = await res.json();
                if (data && typeof data.count === 'number') {
                    setCount(data.count);
                }
            } catch (error) {
                console.error('Online counter update failed:', error);
            }
        };

        // Update every 30 seconds
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-1.5 md:gap-3 bg-black/40 px-2 md:px-4 py-1 md:py-1.5 rounded-lg border border-cyan-500/20 relative overflow-hidden group shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <div className="absolute inset-0 bg-cyan-500/10" />
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-500 animate-pulse" />
            <div className="flex flex-col">
                <span className="text-[5px] md:text-[7px] font-black text-cyan-500/60 leading-none tracking-widest uppercase">AKTİF PİLOTLAR</span>
                <span className="text-sm md:text-lg font-black text-white relative z-10 tabular-nums leading-tight">
                    {count} <span className="text-[8px] md:text-[10px] text-zinc-500 ml-0.5">KİŞİ</span>
                </span>
            </div>
            <div className="absolute right-1 text-sm md:text-xl opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-500">📡</div>
        </div >
    );
}
