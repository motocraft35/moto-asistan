'use client';
import { useState, useEffect } from 'react';
import IntercomControl from './IntercomControl';
import PartyHUD from './PartyHUD';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceLayer({ user }) {
    const [talkingMembers, setTalkingMembers] = useState({});
    const [intercomStatus, setIntercomStatus] = useState('READY');
    const [intercomMessage, setIntercomMessage] = useState('TELSİZ BEKLEMEDE');
    const [talkingMemberName, setTalkingMemberName] = useState(null);

    const party = {
        id: 'party_1',
        name: 'ALPHA SQUAD',
        leaderId: user.id,
        members: [
            { id: user.id, fullName: user.fullName, profileImage: user.profileImage, lastHeartbeat: new Date().toISOString() },
            { id: 'm2', fullName: 'Eagle 1', profileImage: null, lastHeartbeat: new Date().toISOString() }
        ]
    };

    const handleTransmissionStart = (isLocal = false) => {
        if (isLocal && user?.id) {
            setTalkingMembers(prev => ({ ...prev, [String(user.id)]: true }));
            setIntercomStatus('TRANSMITTING');
            setIntercomMessage('AKTİF...');
        }
    };

    const handleTransmissionEnd = (isLocal = false) => {
        if (isLocal && user?.id) {
            setTalkingMembers(prev => {
                const next = { ...prev };
                delete next[String(user.id)];
                return next;
            });
            setIntercomStatus('READY');
            setIntercomMessage('TELSİZ BEKLEMEDE');
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[10001] pointer-events-none">
            {/* Background Gradient for visibility */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

            <div className="relative p-4 md:p-6 flex flex-col items-center gap-4">

                {/* 1. Status Overlay (Floating slightly above the bar) */}
                <AnimatePresence>
                    {(intercomStatus !== 'READY' || talkingMemberName) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={`px-4 py-1.5 rounded-full border backdrop-blur-xl shadow-2xl flex items-center gap-3
                                ${intercomStatus === 'TRANSMITTING' ? 'bg-red-500/20 border-red-500/50' :
                                    intercomStatus === 'RECEIVING' ? 'bg-emerald-500/20 border-emerald-500/50' :
                                        'bg-zinc-900/80 border-white/10'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${intercomStatus === 'TRANSMITTING' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                            <span className="text-[10px] font-black text-white uppercase italic tracking-widest">{intercomMessage}</span>
                            {talkingMemberName && <span className="text-[10px] font-black text-cyan-400 uppercase italic">/ {talkingMemberName}</span>}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. Unified Tactical Bar */}
                <div className="w-full max-w-[600px] pointer-events-auto bg-zinc-950/90 border border-white/10 rounded-3xl p-2 backdrop-blur-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] flex items-center gap-4 border-b-4 border-b-cyan-500/20">

                    {/* SQUAD AREA */}
                    <div className="pl-2 pr-4 border-r border-white/5 flex items-center gap-3">
                        <div className="flex flex-col items-start mr-2">
                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] leading-none mb-1">SQUAD</span>
                            <div className="flex items-center gap-1">
                                <div className="w-1 h-3 bg-cyan-500"></div>
                                <span className="text-[9px] font-black text-white/50 italic">ALPHA</span>
                            </div>
                        </div>
                        <PartyHUD
                            user={user}
                            party={party}
                            talkingMembers={talkingMembers}
                            isBarMode={true}
                        />
                    </div>

                    {/* INTERCOM AREA */}
                    <IntercomControl
                        user={user}
                        externalStatus={{ status: intercomStatus, message: intercomMessage, talkingMember: talkingMemberName }}
                        onTransmitStart={() => handleTransmissionStart(true)}
                        onTransmitEnd={() => handleTransmissionEnd(true)}
                        isBarMode={true}
                    />

                    {/* SETTINGS / STATUS AREA */}
                    <div className="pr-2 pl-2 border-l border-white/5 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                            ⚙️
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
