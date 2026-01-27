'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RaffleTicketsList from './RaffleTicketsList';

export default function RaffleTracker() {
    const [tickets, setTickets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await fetch('/api/raffle/my-tickets');
                const data = await res.json();
                if (data.success) {
                    setTickets(data.tickets);
                }
            } catch (err) {
                console.error('Failed to fetch tickets:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    return (
        <>
            <section
                onClick={() => setIsModalOpen(true)}
                className="glass-card p-6 transition-all hover:scale-[1.01] active:scale-95 block relative overflow-hidden group border-amber-500/20 cursor-pointer"
            >
                <div className="bracket-corner bracket-tl border-amber-500/50"></div>
                <div className="bracket-corner bracket-tr border-amber-500/50"></div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 shadow-2xl group-hover:rotate-6 transition-transform">
                            <span className="text-xl animate-float">🎟️</span>
                        </div>
                        <div>
                            <div className="text-tactical-label text-amber-500 mb-1">MÜKAFAT PROTOKOLÜ</div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-neon-title text-base text-white group-hover:text-amber-400 transition-colors uppercase">
                                    BİLETLERİM
                                </p>
                                <p className="text-[7px] font-black text-amber-500/60 uppercase tracking-widest flex items-center gap-1">
                                    {loading ? '○ VERİ SENKRONİZE EDİLİYOR...' : `● AKTİF KATILIM: ${tickets.length} ADET`}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-amber-500 font-black text-[9px] group-hover:animate-pulse">DETAY {'>>'}</span>
                        <div className="mt-1 flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${i < tickets.length ? 'bg-amber-500' : 'bg-white/5'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {isModalOpen && (
                    <RaffleTicketsList
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        tickets={tickets}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
