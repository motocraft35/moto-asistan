'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntercomControl({ user, externalStatus, onTransmitStart, onTransmitEnd, isBarMode = false, isMuted = false, isLocked = false, isMinimal = false, isDual = false }) {
    const status = externalStatus?.status || 'READY';
    const message = isLocked ? 'SESLİ TELSİZ // PREMIUM GEREKİR' : (isMuted ? 'LİDER YAYINI: SUSTURULDU' : (externalStatus?.message || 'TELSİZ BEKLEMEDE'));
    const talkingMember = externalStatus?.talkingMember;

    const [isAutoMode, setIsAutoMode] = useState(false);
    const [isToggledOn, setIsToggledOn] = useState(false);

    const handleStart = (e) => {
        if (isMuted || isLocked) return;
        if (isAutoMode) {
            if (isToggledOn) {
                setIsToggledOn(false);
                onTransmitEnd();
            } else {
                setIsToggledOn(true);
                onTransmitStart(e);
            }
        } else {
            onTransmitStart(e);
        }
    };

    const handleEnd = () => {
        if (isAutoMode) return; // In auto mode, only toggle on tap
        onTransmitEnd();
    };

    const toggleMode = (e) => {
        e.stopPropagation();
        if (isToggledOn) {
            setIsToggledOn(false);
            onTransmitEnd();
        }
        setIsAutoMode(!isAutoMode);
    };

    if (isBarMode) {
        if (isDual) {
            return (
                <div className={`flex items-center gap-2 transition-opacity ${isMuted ? 'opacity-50' : ''}`}>
                    {/* MODE TOGGLE */}
                    <button
                        onClick={toggleMode}
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all active:scale-90 shadow-lg
                            ${isAutoMode
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                                : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
                        title={isAutoMode ? "Otomatik Mod (Dokun-Konuş)" : "Bas-Konuş Modu"}
                    >
                        <span className="text-sm font-black">{isAutoMode ? '⚡' : '🔘'}</span>
                    </button>

                    {/* MAIN MIC */}
                    <button
                        onMouseDown={handleStart}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchEnd={handleEnd}
                        disabled={isMuted || isLocked}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-xl relative overflow-hidden group border-2
                            ${isLocked
                                ? 'bg-zinc-900/50 border-amber-500/20 grayscale'
                                : isMuted
                                    ? 'bg-zinc-900 border-zinc-800'
                                    : (status === 'TRANSMITTING' || isToggledOn)
                                        ? 'bg-red-600 border-red-400 animate-pulse'
                                        : isAutoMode
                                            ? 'bg-zinc-900 border-amber-500/40 text-amber-500'
                                            : 'bg-cyan-500 border-cyan-400'}`}
                    >
                        <span className={`text-xl ${(isMuted || isLocked) ? 'opacity-40' : (status === 'TRANSMITTING' || isToggledOn) ? 'text-white' : isAutoMode ? 'text-amber-500' : 'text-black'}`}>
                            {isLocked ? '🔒' : isMuted ? '🔇' : '🎤'}
                        </span>
                        {(isMuted || isLocked) && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className={`w-full h-[1px] rotate-12 ${isLocked ? 'bg-amber-500/20' : 'bg-red-500/50'}`} />
                            </div>
                        )}
                    </button>
                </div>
            );
        }

        if (isMinimal) {
            return (
                <div className={`flex items-center transition-opacity ${isMuted ? 'opacity-50' : ''}`}>
                    <button
                        onMouseDown={handleStart}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchEnd={handleEnd}
                        disabled={isMuted || isLocked}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl relative overflow-hidden group border-2
                            ${isLocked
                                ? 'bg-zinc-900/50 border-amber-500/20 grayscale opacity-70'
                                : isMuted
                                    ? 'bg-zinc-900 border-zinc-800 cursor-not-allowed'
                                    : (status === 'TRANSMITTING' || isToggledOn)
                                        ? 'bg-red-600 border-red-400 animate-pulse'
                                        : isAutoMode
                                            ? 'bg-zinc-900 border-amber-500/40 text-amber-500'
                                            : 'bg-cyan-500 border-cyan-400'}`}
                        title={isLocked ? "Premium Gerekir" : "PTT / TELSİZ"}
                    >
                        <span className={`text-2xl ${(isMuted || isLocked) ? 'opacity-40' : (status === 'TRANSMITTING' || isToggledOn) ? 'text-white' : isAutoMode ? 'text-amber-500' : 'text-black'}`}>
                            {isLocked ? '🔒' : isMuted ? '🔇' : '🎤'}
                        </span>
                        {(isMuted || isLocked) && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className={`w-full h-[1px] rotate-12 ${isLocked ? 'bg-amber-500/20' : 'bg-red-500/50'}`} />
                            </div>
                        )}
                        {/* Status Glow */}
                        {(status === 'TRANSMITTING' || isToggledOn) && (
                            <div className="absolute inset-0 bg-white/10 animate-ping pointer-events-none" />
                        )}
                    </button>
                </div>
            );
        }

        return (
            <div className={`flex items-center gap-1 md:gap-2 flex-1 justify-center transition-opacity ${isMuted ? 'opacity-50' : ''}`}>
                {/* COMPACT TACTICAL STACK - LEFT */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleMode}
                        className={`w-9 h-9 md:w-11 md:h-11 rounded-lg border flex items-center justify-center transition-all active:scale-90
                            ${isAutoMode
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-zinc-900 border-white/5 text-zinc-500 opacity-60'}`}
                        title={isAutoMode ? "Otomatik Mod Aktif" : "Bas-Konuş Modu"}
                    >
                        <span className="text-xs md:text-sm font-black">{isAutoMode ? '⚡' : '🔘'}</span>
                    </button>

                    <button
                        onClick={() => {
                            alert("ACİL SİNYAL GÖNDERİLİYOR! (Konvoy Güvenliği)");
                        }}
                        className="w-9 h-9 md:w-11 md:h-11 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                        title="ACİL SİNYAL GÖNDER (ÜCRETSİZ)"
                    >
                        <span className="text-xs md:text-sm font-black">🆘</span>
                    </button>
                </div>

                <button
                    onMouseDown={handleStart}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchEnd={handleEnd}
                    disabled={isMuted || isLocked}
                    className={`flex-1 max-w-[120px] md:max-w-none px-2 md:px-6 h-11 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center gap-1 md:gap-3 transition-all active:scale-95 shadow-xl relative overflow-hidden group border-2
                        ${isLocked
                            ? 'bg-zinc-900/50 border-amber-500/20 grayscale opacity-70'
                            : isMuted
                                ? 'bg-zinc-900 border-zinc-800 cursor-not-allowed'
                                : (status === 'TRANSMITTING' || isToggledOn)
                                    ? 'bg-red-600 border-red-400 animate-pulse'
                                    : isAutoMode
                                        ? 'bg-zinc-900 border-amber-500/40 text-amber-500'
                                        : 'bg-cyan-500 border-cyan-400'}`}
                >
                    <span className={`text-lg md:text-xl ${(isMuted || isLocked) ? 'opacity-40' : (status === 'TRANSMITTING' || isToggledOn) ? 'text-white' : isAutoMode ? 'text-amber-500' : 'text-black'}`}>
                        {isLocked ? '🔒' : isMuted ? '🔇' : '🎤'}
                    </span>
                    <span className={`text-[8px] md:text-[11px] font-black uppercase italic tracking-tighter ${(isLocked || isAutoMode) ? 'text-amber-500' : isMuted ? 'text-zinc-600' : (status === 'TRANSMITTING' || isToggledOn) ? 'text-white' : 'text-black'} hidden sm:inline`}>
                        {isLocked ? 'PREMIUM' : isMuted ? 'KİLİTLİ' : (status === 'TRANSMITTING' || isToggledOn) ? (isAutoMode ? 'AÇIK' : 'AKTİF') : isAutoMode ? 'OTO' : 'TELSİZ'}
                    </span>
                    {(isMuted || isLocked) && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className={`w-full h-[1px] rotate-12 ${isLocked ? 'bg-amber-500/20' : 'bg-red-500/50'}`} />
                        </div>
                    )}
                </button>

                {/* ECHO PROTOCOL (PREMIUM) */}
                <button
                    disabled={isLocked}
                    onClick={() => {
                        if (isLocked) return;
                        alert("ECHO PROTOCOL BAŞLATILIYOR... (Grup Araması)");
                    }}
                    className={`w-9 h-9 md:w-11 md:h-11 rounded-lg border flex items-center justify-center transition-all active:scale-90
                        ${isLocked
                            ? 'bg-zinc-900 border-white/5 text-zinc-700 opacity-40 cursor-not-allowed'
                            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'}`}
                    title="ECHO ÇAĞRI BAŞLAT (PREMIUM)"
                >
                    <span className="text-xs md:text-sm font-black">📡</span>
                </button>
            </div>
        );
    }

    // Default floating layout (fallback)
    return (
        <div className="fixed bottom-24 right-4 z-[10001] flex flex-col items-end gap-3 pointer-events-none">
            {/* Same floating layout as before... */}
        </div>
    );
}
