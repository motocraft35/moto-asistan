'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchModal({ onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data.users || []);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-6 pt-24 bg-black/60 backdrop-blur-xl">
            <div className="w-full max-w-md bg-[#0a0a14] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Search Bar */}
                <div className="p-6 border-b border-white/5 bg-zinc-900/40">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">MOTO-ASİSTAN</span>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            autoFocus
                            type="text"
                            placeholder="İsim, Plaka veya ID Ara..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-all font-bold italic text-sm"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {loading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        router.push(`/dashboard/profile/${u.id}`);
                                        onClose();
                                    }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 overflow-hidden group-hover:border-cyan-500/50 transition-colors">
                                        {u.profileImage ? (
                                            <img src={u.profileImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-white truncate">{u.fullName}</span>
                                            <span className="text-[9px] font-black text-zinc-500 bg-white/5 px-2 py-0.5 rounded leading-none uppercase">ID:{String(u.id).padStart(5, '0')}</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{u.licensePlate || 'PLAKA YOK'}</div>
                                    </div>
                                    <div className="text-zinc-600 transform group-hover:translate-x-1 transition-transform">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 && !loading ? (
                        <div className="py-12 text-center text-zinc-500">
                            <div className="text-4xl mb-4">🛸</div>
                            <p className="text-[10px] font-black uppercase tracking-widest italic">Pilot Bulunamadı</p>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-zinc-600">
                            <p className="text-[10px] font-black uppercase tracking-widest italic opacity-40">Keşif İçin Yazmaya Başlayın...</p>
                        </div>
                    )}
                </div>

                {/* Footer Decor */}
                <div className="p-4 bg-zinc-950/50 text-center">
                    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em]">MOTO-ASİSTAN KEŞİF v1.0</span>
                </div>
            </div>
        </div>
    );
}
