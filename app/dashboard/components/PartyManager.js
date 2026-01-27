'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PartyManager({ isOpen, onClose, user, currentParty, onPartyUpdate, onSendSignal, onSendEcho, onOpenIntercom }) {
    const [mode, setMode] = useState('MAIN'); // MAIN, CREATE, JOIN
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleCreate = async () => {
        try {
            const res = await fetch('/api/parties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `${user?.fullName?.split(' ')[0] || 'PILOT'}'S SQUAD` })
            });
            const data = await res.json();
            if (res.ok) {
                // Fetch the full party object to ensure members are loaded
                const partyRes = await fetch('/api/parties');
                const partyData = await partyRes.json();
                onPartyUpdate(partyData.party);
                setMode('MAIN');
            } else {
                setError(data.error || 'KURULUM HATASI');
            }
        } catch (err) { setError('BAĞLANTI HATASI'); }
    };

    const handleJoin = async () => {
        if (joinCode.length !== 6) {
            setError('GEÇERSİZ KOD. 6 HANELİ KODU GİRİN.');
            return;
        }

        try {
            const res = await fetch('/api/parties/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: joinCode })
            });
            const data = await res.json();
            if (res.ok) {
                const partyRes = await fetch('/api/parties');
                const partyData = await partyRes.json();
                onPartyUpdate(partyData.party);
                setJoinCode('');
                setMode('MAIN');
            } else {
                setError(data.error || 'KATILIM HATASI');
            }
        } catch (err) { setError('BAĞLANTI HATASI'); }
    };

    const handleLeave = async () => {
        try {
            const res = await fetch('/api/parties/leave', { method: 'POST' });
            if (res.ok) {
                onPartyUpdate(null);
                setMode('MAIN');
            }
        } catch (err) { console.error('Leave Error:', err); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-sm glass-card border-white/10 bg-zinc-950 p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                <div className="scanner-beam bg-cyan-500 opacity-10"></div>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.3em]">TAC-LINK // SQUADRON</span>
                        <h2 className="text-lg font-black italic text-white uppercase">{currentParty ? 'MÜFREZE YÖNETİMİ' : 'BİRLİK KUR'}</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
                </div>

                <AnimatePresence mode="wait">
                    {currentParty ? (
                        <motion.div key="status" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            {/* TACTICAL COMMUNICATION CENTER */}
                            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl mb-4">
                                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                                    BÖLGESEL TELSİZ KOMUTASI
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={onSendSignal}
                                        className="flex-1 py-3 bg-red-500/20 border border-red-500/40 text-red-500 text-[9px] font-black uppercase italic rounded-xl transition-all active:scale-95 hover:bg-red-500/30"
                                    >
                                        🆘 SİNYAL
                                    </button>
                                    <button
                                        onClick={onSendEcho}
                                        className="flex-1 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-black uppercase italic rounded-xl transition-all active:scale-95 hover:bg-cyan-500/20"
                                    >
                                        📡 ECHO
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center relative overflow-hidden">
                                <span className="text-[10px] font-black text-zinc-500 uppercase block mb-1">ERİŞİM KODU</span>
                                <span className="text-3xl font-black text-white tracking-[0.2em] italic">{currentParty.inviteCode}</span>
                                <div className="mt-2 text-[8px] font-black text-cyan-500/60 uppercase">DİĞER PİLOTLARLA BU KODU PAYLAŞIN</div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">AKTİF PİLOTLAR</span>
                                    <span className="text-[10px] font-black text-cyan-500 uppercase italic">{currentParty.members.length} / 7</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {currentParty.members.map((member, i) => (
                                        <div key={i} className="relative group">
                                            <div className="aspect-square rounded-xl bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center">
                                                {member.profileImage ? <img src={member.profileImage} className="w-full h-full object-cover" /> : <span className="text-lg opacity-40">👤</span>}
                                            </div>
                                            {member.id === currentParty.leaderId ? (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] border-2 border-zinc-950 shadow-lg">👑</div>
                                            ) : (
                                                user?.id === currentParty.leaderId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onPartyUpdate({
                                                                ...currentParty,
                                                                members: currentParty.members.filter(m => m.id !== member.id)
                                                            });
                                                        }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white border-2 border-zinc-950 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-500 active:scale-90"
                                                    >
                                                        ✕
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    ))}
                                    {[...Array(7 - currentParty.members.length)].map((_, i) => (
                                        <div key={i} className="aspect-square rounded-xl border border-dashed border-white/5 flex items-center justify-center opacity-20">
                                            <span className="text-xs">+</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {user?.id === currentParty.leaderId && (
                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-between group hover:bg-amber-500/10 transition-all cursor-pointer"
                                    onClick={() => onPartyUpdate({ ...currentParty, broadcastMode: !currentParty.broadcastMode })}>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">LİDER YAYINI</span>
                                        <span className="text-[8px] text-white/40 uppercase">Sadece lider konuşabilir</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${currentParty.broadcastMode ? 'bg-amber-500' : 'bg-zinc-800'}`}>
                                        <motion.div
                                            animate={{ x: currentParty.broadcastMode ? 22 : 2 }}
                                            className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            <button onClick={handleLeave} className="w-full py-4 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all">
                                MÜFREZEDEN AYRIL / DAĞIT
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                            {mode === 'MAIN' && (
                                <>
                                    <button onClick={() => setMode('CREATE')} className="w-full p-6 bg-cyan-500 border border-cyan-400 rounded-3xl flex flex-col items-center gap-2 group hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(34,211,238,0.2)]">
                                        <span className="text-3xl text-black">🛡️</span>
                                        <span className="text-xs font-black text-black uppercase italic tracking-widest">YENİ MÜFREZE KUR</span>
                                    </button>
                                    <button onClick={() => setMode('JOIN')} className="w-full p-6 bg-zinc-900 border border-white/10 rounded-3xl flex flex-col items-center gap-2 group hover:scale-[1.02] transition-all">
                                        <span className="text-3xl">📡</span>
                                        <span className="text-xs font-black text-zinc-400 uppercase italic tracking-widest">BİR MÜFREZEYE KATIL</span>
                                    </button>
                                </>
                            )}

                            {mode === 'CREATE' && (
                                <div className="space-y-6 text-center">
                                    <p className="text-zinc-400 text-sm">6 kişilik ek müfreze kapasitesiyle yeni bir telsiz birliği kurun.</p>
                                    <button onClick={handleCreate} className="w-full py-4 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-widest italic animate-pulse">
                                        MÜFREZE OLUŞTURUYORUM
                                    </button>
                                    <button onClick={() => setMode('MAIN')} className="text-zinc-600 uppercase font-black text-[10px] tracking-widest">VAZGEÇ</button>
                                </div>
                            )}

                            {mode === 'JOIN' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">ERİŞİM KODU</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-2xl font-black italic tracking-[0.5em] text-cyan-400 outline-none focus:border-cyan-500 transition-all"
                                            placeholder="XXXXXX"
                                        />
                                        {error && <p className="text-red-500 text-[9px] font-black mt-2 uppercase">{error}</p>}
                                    </div>
                                    <button onClick={handleJoin} className="w-full py-4 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-widest italic">
                                        AĞA BAĞLAN
                                    </button>
                                    <button onClick={() => setMode('MAIN')} className="w-full text-zinc-600 uppercase font-black text-[10px] tracking-widest text-center block">GERİ DÖ</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
