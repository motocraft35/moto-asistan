'use client';
import { useState, useEffect, useRef } from 'react';

export default function MapSearch({ onLocationSelect, userStats }) { // Accept userStats
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // ... (keep logic same)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (query.length >= 3) {
                setLoading(true);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=tr`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data);
                        setShowResults(true);
                    }
                } catch (e) {
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    // Format stats safely
    const xp = userStats?.xp || 0;

    return (
        <div ref={searchRef} className="absolute top-6 left-1/2 -translate-x-1/2 z-[1001] w-[95%] md:w-[600px] flex items-stretch gap-3 pointer-events-none">
            {/* 1. Search Bar (Flexible Width) */}
            <div className="relative group flex-1 pointer-events-auto">
                <div className="absolute inset-0 bg-zinc-950/20 blur-2xl group-focus-within:bg-magenta-500/10 transition-all rounded-[2rem]" />
                <div className="relative h-full bg-[#050505]/80 backdrop-blur-3xl border border-white/5 group-focus-within:border-white/10 rounded-[1.5rem] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all">
                    <div className="flex items-center px-5 py-3.5 h-full">
                        <svg className="w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Hedef Ara..."
                            id="map-search-input"
                            className="bg-transparent border-none outline-none text-white text-sm font-bold italic w-full placeholder:text-zinc-600 tracking-tight"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => query.length >= 3 && setShowResults(true)}
                        />
                        {loading && (
                            <div className="w-4 h-4 border-2 border-magenta-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        )}
                        {query && !loading && (
                            <button onClick={() => setQuery('')} className="text-zinc-600 hover:text-white transition-colors flex-shrink-0">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {showResults && results.length > 0 && (
                        <div className="relative border-t border-white/5">
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-black/40">
                                {results.map((res, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            onLocationSelect({
                                                lat: parseFloat(res.lat),
                                                lng: parseFloat(res.lon),
                                                name: res.display_name.split(',')[0],
                                                address: res.display_name
                                            });
                                            setQuery(res.display_name.split(',')[0]);
                                            setShowResults(false);
                                        }}
                                        className="w-full text-left px-6 py-4 hover:bg-magenta-500/5 border-b border-white/5 last:border-none flex flex-col gap-0.5 transition-colors group/item"
                                    >
                                        <span className="text-white text-xs font-black truncate tracking-wide">{res.display_name.split(',')[0]}</span>
                                        <span className="text-zinc-500 text-[9px] truncate tracking-tight uppercase font-bold italic">{res.display_name.split(',').slice(1).join(',')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. XP Bar (Compact & Integrated) */}
            <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-cyan-950/20 blur-xl rounded-[1.5rem]" />
                <div className="relative h-full bg-[#050505]/80 backdrop-blur-3xl border border-cyan-500/20 rounded-[1.5rem] px-5 flex flex-col items-end justify-center shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <span className="text-[8px] font-black text-cyan-600 tracking-[0.2em] uppercase leading-none mb-0.5">LEVEL XP</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white italic tracking-tighter tabular-nums text-shadow-glow leading-none">{xp.toLocaleString()}</span>
                        <span className="text-[10px] text-cyan-500 font-bold leading-none">XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
