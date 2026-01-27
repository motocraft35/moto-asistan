'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportModal({ isOpen, onClose }) {
    const [type, setType] = useState('bug');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // null, 'success', 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    content,
                    pageUrl: window.location.href
                })
            });

            if (res.ok) {
                setStatus('success');
                setTimeout(() => {
                    setContent('');
                    setStatus(null);
                    onClose();
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-md glass-card p-6 border-cyan-500/30 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bracket-corner bracket-tl"></div>
                        <div className="bracket-corner bracket-tr"></div>

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="text-tactical-label text-cyan-500 mb-1">PROTOKOL: GERİ BİLDİRİM</div>
                                <h2 className="text-neon-title text-xl text-white">SİSTEM RAPORU</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                                {['bug', 'suggestion', 'idea'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${type === t
                                                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                : 'text-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        {t === 'bug' ? 'HATA' : t === 'suggestion' ? 'ÖNERİ' : 'FİKİR'}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Mesajınızı buraya bırakın... Sistemsel hataları veya parlak fikirlerinizi bekliyoruz."
                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                                required
                            />

                            <button
                                type="submit"
                                disabled={isSubmitting || status === 'success'}
                                className={`w-full py-4 rounded-xl font-black uppercase italic tracking-widest transition-all ${status === 'success'
                                        ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                        : status === 'error'
                                            ? 'bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                            : 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        GÖNDERİLİYOR...
                                    </span>
                                ) : status === 'success' ? (
                                    'RAPOR İLETİLDİ ✓'
                                ) : status === 'error' ? (
                                    'HATA OLUŞTU!'
                                ) : (
                                    'VERİYİ AKTAR'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-4 border-t border-white/5">
                            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] text-center">
                                GHOST-NET FEEDBACK PIPELINE // SECURE CONNECTION
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
