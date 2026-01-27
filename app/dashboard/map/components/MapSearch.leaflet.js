'use client';
import { useState, useEffect, useRef } from 'react';

export default function MapSearch({ onLocationSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

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
                    // Using Nominatim for free-text search
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=tr`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data);
                        setShowResults(true);
                    }
                } catch (e) {
                    console.error("Geocoding error:", e);
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

    return (
        <div ref={searchRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] w-[90%] md:w-[400px]">
            <div className="relative group">
                <div className="absolute inset-0 bg-magenta-500/20 blur-xl group-focus-within:bg-magenta-500/40 transition-all rounded-2xl" />
                <div className="relative bg-[#0a0a14]/90 backdrop-blur-2xl border border-white/10 group-focus-within:border-magenta-500/50 rounded-2xl overflow-hidden shadow-2xl transition-all">
                    <div className="flex items-center px-4 py-3">
                        <svg className="w-5 h-5 text-magenta-500 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Hedef Ara (Market, Kafe, Sokak...)"
                            id="map-search-input"
                            className="bg-transparent border-none outline-none text-white text-sm font-bold italic w-full placeholder:text-zinc-600"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => query.length >= 3 && setShowResults(true)}
                        />
                        {loading && (
                            <div className="w-4 h-4 border-2 border-magenta-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        {query && !loading && (
                            <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {showResults && results.length > 0 && (
                        <div className="border-t border-white/5 max-h-[300px] overflow-y-auto">
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
                                    className="w-full text-left px-4 py-3 hover:bg-magenta-500/10 border-b border-white/5 last:border-none flex flex-col gap-0.5"
                                >
                                    <span className="text-white text-xs font-bold truncate">{res.display_name.split(',')[0]}</span>
                                    <span className="text-zinc-500 text-[9px] truncate">{res.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
