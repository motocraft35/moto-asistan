'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function RaffleTicketsList({ isOpen, onClose, tickets }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm glass-card border-white/10 bg-zinc-950 p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                <div className="scanner-beam bg-amber-500 opacity-10"></div>

                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div className="flex flex-col">
                        <span className="text-tactical-label text-amber-500 mb-1">DATA :: TICKETS</span>
                        <h2 className="text-neon-title text-xl text-white">ÇEKİLİŞ BİLETLERİM</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {tickets.length > 0 ? (
                        tickets.map((ticket, i) => (
                            <div key={ticket.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />

                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className="text-tactical-label text-amber-500/60 uppercase text-[8px]">KOD: {ticket.code}</div>
                                    <div className="text-[7px] font-black text-white/20 uppercase tracking-widest">#{tickets.length - i}</div>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-white font-black text-sm uppercase tracking-tight">{ticket.campaignName}</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                                        MEKAN: <span className="text-amber-400/80">{ticket.venueName || 'GENEL KATILIM'}</span>
                                    </p>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center relative z-10">
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                        TARİH: {new Date(ticket.scannedAt).toLocaleDateString('tr-TR')}
                                    </span>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                        <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center">
                            <div className="text-3xl mb-4 opacity-20 italic">🎫</div>
                            <p className="text-tactical-label text-zinc-600">HENÜZ AKTİF BİLETİNİZ BULUNMUYOR</p>
                            <p className="text-[8px] text-zinc-700 uppercase mt-2">ANLAŞMALI MEKANLARDA HİZMET KODUNUZU KULLANIN</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-tactical-label hover:bg-amber-600 hover:text-white transition-all uppercase italic"
                    >
                        SİSTEMDEN ÇIK
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
