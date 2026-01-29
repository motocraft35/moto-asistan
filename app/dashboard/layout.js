'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import GlobalChat from './components/GlobalChat';
import WeatherBar from './components/WeatherBar';
import OnlineCounter from './components/OnlineCounter';
import PartyHUD from './components/PartyHUD';
import IntercomControl from './components/IntercomControl';
import PartyManager from './components/PartyManager';
import PermissionGuard from './components/PermissionGuard';
import AutoSessionRestorer from '../components/AutoSessionRestorer';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = '';

export default function DashboardLayout({ children }) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [talkingMembers, setTalkingMembers] = useState({});
    const [intercomStatus, setIntercomStatus] = useState('READY');
    const [intercomMessage, setIntercomMessage] = useState('TELSİZ BEKLEMEDE');
    const [talkingMemberName, setTalkingMemberName] = useState(null);
    const [user, setUser] = useState(null);
    const [isPartyOpen, setIsPartyOpen] = useState(false);
    const [currentParty, setCurrentParty] = useState(null);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const isMapPage = pathname === '/dashboard/map' || pathname?.startsWith('/dashboard/map/');

    // Persistence Guard: Sync Session & Storage
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);

                    // Sync to storage for offline persistence
                    const cached = localStorage.getItem('moto_user');
                    if (cached) {
                        const cachedData = JSON.parse(cached);
                        // Preserve sessionToken during sync
                        const hasChanged = JSON.stringify(data.user) !== JSON.stringify({ ...cachedData, sessionToken: undefined, cachedAt: undefined });
                        if (hasChanged || !cachedData.cachedAt) {
                            localStorage.setItem('moto_user', JSON.stringify({
                                ...data.user,
                                sessionToken: cachedData.sessionToken,
                                cachedAt: new Date().toISOString()
                            }));
                            console.log('[Dashboard] localStorage synced (preserved token)');
                        }
                    } else {
                        // No cache exists, create it
                        localStorage.setItem('moto_user', JSON.stringify({
                            ...data.user,
                            cachedAt: new Date().toISOString()
                        }));
                    }
                } else {
                    // No server session - check if we should attempt restore
                    const cached = localStorage.getItem('moto_user');
                    if (cached) {
                        console.log('[Dashboard] No server session but cache exists, AutoSessionRestorer will handle');
                        setUser(JSON.parse(cached));
                    } else {
                        console.log('[Dashboard] No session found, redirecting to login');
                        window.location.href = '/';
                    }
                }
            } catch (err) {
                console.error('Persistence Guard Failure:', err);
                const cached = localStorage.getItem('moto_user');
                if (cached) setUser(JSON.parse(cached));
            }
        };
        fetchUser();

        // Load Party Cache
        const cachedParty = localStorage.getItem('moto_party');
        if (cachedParty) {
            try {
                setCurrentParty(JSON.parse(cachedParty));
            } catch (err) { console.error('Party Cache Load Failure:', err); }
        }
    }, []);

    // Sync Party to Storage
    useEffect(() => {
        if (currentParty) {
            // Tactical Failover Guard: Ensure leader is always an active member
            const memberIds = currentParty.members.map(m => m.id);
            if (memberIds.length > 0 && !memberIds.includes(currentParty.leaderId)) {
                setCurrentParty(prev => ({ ...prev, leaderId: memberIds[0] }));
                return;
            }
            localStorage.setItem('moto_party', JSON.stringify(currentParty));
        } else {
            localStorage.removeItem('moto_party');
        }
    }, [currentParty]);

    // Signal States
    const [incomingSignal, setIncomingSignal] = useState(null);
    const [isTransmittingSignal, setIsTransmittingSignal] = useState(false);

    // Signal Listener (Simulated for now, would use Ably/Socket)
    useEffect(() => {
        // This will be triggered by API calls later
        if (incomingSignal) {
            const timer = setTimeout(() => setIncomingSignal(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [incomingSignal]);

    const handleSendSignal = () => {
        if (!user) return;
        setIncomingSignal({
            id: Date.now(),
            senderName: user.fullName || 'PİLOT',
            message: 'ACİL DURUM // KONVOY DURDU'
        });
        // In real app, this hits /api/ai/sos or socket
    };

    const handleSendEcho = () => {
        if (!isPremium) return alert("ECHO PROTOCOL // PREMIUM ÜYELİK GEREKİR");
        alert("📡 ECHO ÇAĞRISI BAŞLATILIYOR... (Tüm Müfreze Telsizleri Aktif)");
    };

    const isPremium = user?.subscriptionStatus && ['Gold', 'Silver', 'Bronze', 'Clan', 'Premium', 'Active'].includes(user.subscriptionStatus);

    // Unified Party Sync: Polling the server instead of just local cache
    useEffect(() => {
        const syncParty = async () => {
            try {
                const res = await fetch('/api/parties');
                if (res.ok) {
                    const data = await res.json();
                    if (data.party) {
                        setCurrentParty(data.party);
                    } else {
                        setCurrentParty(null);
                    }
                }
            } catch (err) { console.error('Party Sync Failure:', err); }
        };

        syncParty();
        const interval = setInterval(syncParty, 5000); // 5s sync pulse
        return () => clearInterval(interval);
    }, []);

    const partyData = currentParty;

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

    // Handle Global Chat & Party Manager modals via URL params
    useEffect(() => {
        if (searchParams.get('globalChat') === 'true') {
            setIsChatOpen(true);
        }
        if (searchParams.get('partyOpen') === 'true') {
            setIsPartyOpen(true);
        }
    }, [searchParams]);

    // Fetch unread count for the notification badge
    useEffect(() => {
        const checkUnread = async () => {
            try {
                const res = await fetch(API_BASE_URL + '/api/chat/private/unread');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadCount);
                }
            } catch (err) { console.error('Unread check failed:', err); }
        };

        checkUnread();
        const interval = setInterval(checkUnread, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col">
            {/* Auto Session Restorer */}
            <AutoSessionRestorer />

            {/* Tactical Permission Shield */}
            <PermissionGuard onGranted={() => console.log('Systems Operational')} />

            {/* Global Chat Modal (Warzone Public Chat) */}
            <GlobalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

            {/* Tactical Squad Manager */}
            <PartyManager
                isOpen={isPartyOpen}
                onClose={() => setIsPartyOpen(false)}
                user={user}
                currentParty={currentParty}
                onPartyUpdate={setCurrentParty}
                onSendSignal={handleSendSignal}
                onSendEcho={handleSendEcho}
                onOpenIntercom={() => setIsPartyOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={children.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="h-full w-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Fixed Bottom Tactical Command & Navigation Bar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-[9999] pointer-events-none">
                <div className="flex flex-col gap-2">

                    {/* 1. Status Overlay */}
                    <AnimatePresence>
                        {incomingSignal && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                            >
                                {/* Red Signal Pulse */}
                                <div className="absolute inset-0 bg-red-600/20 backdrop-blur-sm animate-pulse" />
                                <div className="relative glass-card border-red-500 bg-red-600/10 p-12 text-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                                    <div className="text-8xl mb-6">⚠️</div>
                                    <h2 className="text-4xl font-black italic text-white tracking-widest uppercase mb-2"> ACİL SİNYAL</h2>
                                    <p className="text-red-400 font-bold uppercase tracking-widest animate-pulse">
                                        {incomingSignal.senderName} // {incomingSignal.message}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                        {(intercomStatus !== 'READY' || talkingMemberName) && !incomingSignal && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="px-4 py-1 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl flex items-center gap-3 mx-auto"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${intercomStatus === 'TRANSMITTING' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                                <span className="text-[9px] font-black text-white italic uppercase">{intercomMessage}</span>
                                {talkingMemberName && <span className="text-[9px] font-black text-cyan-400 uppercase italic">/ {talkingMemberName}</span>}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 2. Unified Bar */}
                    <nav className="pointer-events-auto glass-card border-white/10 bg-[#0a0a14]/90 backdrop-blur-3xl py-2.5 md:py-4 px-3 md:px-6 shadow-2xl relative overflow-hidden flex items-center justify-center gap-4 md:gap-12">
                        <div className="scanner-beam bg-cyan-500 opacity-5 pointer-events-none"></div>

                        {/* NAV AREA - Compact and Balanced */}
                        <div className="flex items-center gap-2 md:gap-8">
                            <Link href="/dashboard" className="flex flex-col items-center group">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg border border-white/5 flex items-center justify-center transition-all group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30">
                                    <svg className="w-5 h-5 text-cyan-400 opacity-60 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                </div>
                                <span className="text-[7px] font-black text-zinc-500 mt-1 group-hover:text-cyan-500 transition-colors uppercase tracking-widest hidden sm:inline">MERKEZ</span>
                            </Link>

                            {/* Tactical Party Button (Internal Modal Trigger) */}
                            <button onClick={() => setIsPartyOpen(true)} className="flex flex-col items-center group ring-0 outline-none">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg border border-white/5 flex items-center justify-center transition-all group-hover:bg-amber-500/10 group-hover:border-amber-500/30">
                                    <svg className="w-5 h-5 text-amber-400 opacity-60 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <span className="text-[7px] font-black text-zinc-500 mt-1 group-hover:text-amber-500 transition-colors uppercase tracking-widest hidden sm:inline">MÜFREZE</span>
                            </button>

                            <Link href="/dashboard/messages" className="flex flex-col items-center group relative">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg border border-white/5 flex items-center justify-center transition-all group-hover:bg-pink-500/10 group-hover:border-pink-500/30 relative">
                                    <svg className="w-5 h-5 text-pink-400 opacity-60 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    {unreadCount > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-black animate-pulse" />}
                                </div>
                                <span className="text-[7px] font-black text-zinc-500 mt-1 group-hover:text-pink-500 transition-colors uppercase tracking-widest hidden sm:inline">MESAJ</span>
                            </Link>

                            <Link href="/dashboard/mechanic" className="flex flex-col items-center group">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg border border-white/5 flex items-center justify-center transition-all group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30">
                                    <svg className="w-5 h-5 text-emerald-400 opacity-60 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                    </svg>
                                </div>
                                <span className="text-[7px] font-black text-zinc-500 mt-1 group-hover:text-emerald-500 transition-colors uppercase tracking-widest hidden sm:inline">GARAJ</span>
                            </Link>

                            <Link href="/dashboard/profile/me" className="flex flex-col items-center group">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg border border-white/5 flex items-center justify-center transition-all group-hover:bg-slate-500/10 group-hover:border-slate-500/30">
                                    <svg className="w-5 h-5 text-slate-400 opacity-60 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <span className="text-[7px] font-black text-zinc-500 mt-1 group-hover:text-slate-500 transition-colors uppercase tracking-widest hidden sm:inline">PROFİL</span>
                            </Link>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 mx-1 hidden md:block" />

                        {/* TELSİZ / INTERCOM AREA */}
                        <div className="flex-shrink-0">
                            <IntercomControl
                                user={user}
                                externalStatus={{
                                    status: intercomStatus,
                                    message: intercomMessage,
                                    talkingMember: Object.keys(talkingMembers).length > 0 ? Object.keys(talkingMembers)[0] : null
                                }}
                                isMuted={(currentParty?.broadcastMode && user?.id !== currentParty?.leaderId)}
                                isLocked={!isPremium}
                                onTransmitStart={() => handleTransmissionStart(true)}
                                onTransmitEnd={() => handleTransmissionEnd(true)}
                                isBarMode={true}
                                isDual={true}
                            />
                        </div>
                    </nav>
                </div >
            </div >
        </div >
    );
}
