'use client';

import { useState, useEffect } from 'react';

export default function DynamicServiceCode({ user }) {
    const [seconds, setSeconds] = useState(60);
    const [code, setCode] = useState(user.dynamicCode || '----');

    const fetchNewCode = async () => {
        try {
            const res = await fetch('/api/users/service-code', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setCode(data.code);
            }
        } catch (error) {
            console.error('Failed to fetch service code:', error);
        }
    };

    useEffect(() => {
        // Initial fetch if code is placeholder
        if (code === '----') {
            fetchNewCode();
        }

        const timer = setInterval(() => {
            setSeconds(prev => {
                if (prev <= 1) {
                    fetchNewCode();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={fetchNewCode}>
                <div className="absolute inset-0 bg-magenta-500/20 blur-2xl group-hover:bg-magenta-500/30 transition-all rounded-full" />
                <div className="relative px-8 py-4 bg-black/40 border-2 border-magenta-500/50 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <span className="text-3xl sm:text-5xl font-black text-white tracking-[0.2em] italic tabular-nums">
                        {code}
                    </span>
                </div>
            </div>

            <div className="w-full max-w-[200px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-magenta-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-1000 ease-linear"
                    style={{ width: `${(seconds / 60) * 100}%` }}
                />
            </div>

            <div className="flex items-center gap-4">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-magenta-500 animate-pulse" />
                    Yenileniyor: {seconds}s
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        fetchNewCode();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-magenta-500/10 hover:bg-magenta-500/20 border border-magenta-500/30 rounded-full transition-all group/btn active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                    title="Kodu Hemen Yenile"
                >
                    <span className="text-[10px] font-black text-magenta-400 uppercase tracking-tighter">MANUEL YENİLE</span>
                    <span className="text-magenta-400 group-hover/btn:rotate-180 transition-transform duration-500">🔄</span>
                </button>
            </div>
        </div>
    );
}
