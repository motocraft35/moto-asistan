'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';

export default function FeedbackTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-4 glass-card bg-cyan-500/5 border-dashed border-cyan-500/30 group hover:border-cyan-500 hover:bg-cyan-500/10 transition-all active:scale-95"
            >
                <div className="flex items-center justify-center gap-3">
                    <div className="text-xl group-hover:rotate-12 transition-transform">💬</div>
                    <div className="text-left">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">PROTOKOL: GERİ BİLDİRİM</div>
                        <div className="text-[8px] text-zinc-500 uppercase font-medium">SİSTEM HATASI BİLDİR VEYA FİKİR PAYLAŞ</div>
                    </div>
                </div>
            </button>

            <ReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
