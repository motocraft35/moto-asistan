'use client';
import { useState } from 'react';
import SearchModal from './SearchModal';

export default function SearchTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-11 h-11 md:w-16 md:h-16 glass-card bg-zinc-900 border-white/10 flex items-center justify-center hover:border-cyan-500/50 transition-all group overflow-hidden relative shadow-2xl active:scale-95"
            >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 text-white opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all group-hover:text-cyan-400 md:w-6 md:h-6">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <div className="scanner-beam bg-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>

            {isOpen && <SearchModal onClose={() => setIsOpen(false)} />}
        </>
    );
}
