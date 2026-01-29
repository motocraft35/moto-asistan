'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GearCard from '../components/GearCard';
import GarageCard from '../components/GarageCard';
import AddBikeModal from '../components/AddBikeModal';
import AddGearModal from '../components/AddGearModal';
import TacticalSettingsModal from '../components/TacticalSettingsModal';
import ProfileBadges from '../components/ProfileBadges';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function ProfilePage({ params: paramsPromise }) {
    console.log("Rendering Gamified Profile Page V2");
    const { showAlert, showConfirm } = useNotifications();
    const params = use(paramsPromise);
    const id = params?.id || 'me';
    const [profile, setProfile] = useState(null);
    const [gear, setGear] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('bikes');
    const [showAddBike, setShowAddBike] = useState(false);
    const [showAddGear, setShowAddGear] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingBike, setEditingBike] = useState(null);
    const [editData, setEditData] = useState({ bio: '', profileImage: '' });
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
        fetchGear();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (!res.ok) throw new Error('Failed to load profile');
            const data = await res.json();
            setProfile(data);
            setEditData({ bio: data.bio || '', profileImage: data.profileImage || '' });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGear = async () => {
        try {
            const res = await fetch(`/api/gear?userId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setGear(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleFollow = async () => {
        try {
            const res = await fetch('/api/users/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId: id })
            });
            if (res.ok) fetchProfile();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveFollower = async (followerId) => {
        const confirmed = await showConfirm('Bu takipçiyi çıkartmak istediğine emin misin?');
        if (!confirmed) return;
        try {
            const res = await fetch('/api/users/follow', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerId })
            });
            if (res.ok) fetchProfile();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading && !profile) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!profile) return <div style={{ padding: '50px', textAlign: 'center' }}>Kullanıcı bulunamadı.</div>;

    const isPremium = profile && ['Gold', 'Silver', 'Bronze', 'Clan'].includes(profile.subscriptionStatus);
    const rank = (profile.xp || 0) > 1000 ? 'EFSANE' : (profile.xp || 0) > 500 ? 'KIDEMLİ' : 'ÇAYLAK';
    const rankColor = rank === 'EFSANE' ? 'text-amber-500' : rank === 'KIDEMLİ' ? 'text-cyan-400' : 'text-zinc-500';

    const tabs = [
        { id: 'bikes', label: 'GARAGE', shortLabel: 'GAR' },
        { id: 'helmets', label: 'HELMETS', shortLabel: 'HLM' },
        { id: 'intercoms', label: 'COMMS', shortLabel: 'COM' },
        { id: 'followers', label: `NETWORK (${profile.followersCount || 0})`, shortLabel: `NET ${profile.followersCount || 0}` }
    ];

    const getFilteredGear = () => {
        if (activeTab === 'helmets') return gear.filter(g => g.type === 'helmet');
        if (activeTab === 'intercoms') return gear.filter(g => g.type === 'intercom');
        return [];
    };

    // Hexagon Stats Visualization Component (Inline for simplicity)
    const HexagonStats = () => (
        <div className="relative w-full h-40 flex items-center justify-center">
            {/* Mock Pentagon/Hexagon graphic */}
            <svg viewBox="0 0 100 100" className="w-full h-full p-2 opacity-80 overflow-visible">
                <polygon points="50,10 90,40 80,90 20,90 10,40" fill="none" stroke="#3f3f46" strokeWidth="1" />
                <polygon points="50,25 70,40 65,65 35,65 30,40" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="2" className="animate-pulse" />
                <circle cx="50" cy="50" r="1" fill="white" />
                <text x="50" y="5" textAnchor="middle" className="text-[6px] fill-zinc-500 font-bold uppercase">Mekanik</text>
                <text x="95" y="40" textAnchor="middle" className="text-[6px] fill-zinc-500 font-bold uppercase">Sosyal</text>
                <text x="80" y="98" textAnchor="middle" className="text-[6px] fill-zinc-500 font-bold uppercase">Rota</text>
                <text x="20" y="98" textAnchor="middle" className="text-[6px] fill-zinc-500 font-bold uppercase">Sürüş</text>
                <text x="5" y="40" textAnchor="middle" className="text-[6px] fill-zinc-500 font-bold uppercase">Koleksiyon</text>
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050510] text-zinc-100 pb-32 relative overflow-x-hidden">
            {/* Background Aesthetics */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[0%] right-[0%] w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[0%] left-[0%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-[0.02]" />
            </div>

            {/* Tactical Header */}
            <header className="sticky top-0 z-50 glass-card mx-0 sm:mx-4 mt-0 sm:mt-6 p-4 border-b sm:border border-white/10 bg-[#0a0a14]/90 backdrop-blur-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 glass-card flex items-center justify-center text-white/40 hover:text-cyan-400 transition-colors border-white/5 active:scale-90">
                        <span className="text-xl">←</span>
                    </button>
                    <div>
                        <div className="text-[10px] font-black italic text-zinc-500 uppercase tracking-widest">PİLOT_PROFİLİ // v2.1</div>
                        <h1 className="text-xl font-black italic text-white uppercase tracking-tighter leading-none">{profile.fullName}</h1>
                    </div>
                </div>

                {profile.isMe && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-10 h-10 glass-card flex items-center justify-center text-white/60 hover:text-cyan-400 transition-colors border-white/5"
                    >
                        ⚙️
                    </button>
                )}
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8 relative z-10">

                {/* ID Card & Rank Section (Top Row) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Character Card */}
                    <div className="lg:col-span-2 glass-card p-0 border-white/10 bg-[#0a0a14]/60 relative overflow-hidden group">
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 via-purple-900/10 to-cyan-900/10 opacity-50 animate-pulse" />
                        {/* Holographic scan line effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-full w-full animate-[scan_3s_ease-in-out_infinite]" style={{
                            backgroundSize: '100% 50px',
                            animation: 'scan 3s ease-in-out infinite'
                        }} />

                        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start text-center sm:text-left">
                            <div className="relative shrink-0">
                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl glass-card bg-zinc-900 border-white/10 p-1 shadow-[0_0_50px_rgba(6,182,212,0.2)] relative z-10 group-hover:shadow-[0_0_80px_rgba(6,182,212,0.4)] transition-all duration-500">
                                    <img src={profile.profileImage || '/default-avatar.png'} className="w-full h-full object-cover rounded-xl" alt={profile.fullName} />
                                    {/* Holographic overlay */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/0 via-cyan-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                                {isPremium && <div className="absolute -top-4 -right-4 text-4xl animate-bounce z-20 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">👑</div>}
                                <div className="absolute -bottom-3 inset-x-0 mx-auto w-max px-4 py-1 glass-card bg-black/90 border-cyan-500/50 text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] rounded-full z-20 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                    LEVEL {Math.floor((profile.xp || 0) / 100) + 1}
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 w-full min-w-0">
                                <div>
                                    <h2 className="text-3xl sm:text-5xl font-black italic text-white uppercase tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] break-words">{profile.fullName}</h2>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
                                        <span className={`text-xs sm:text-sm font-black italic ${rankColor} uppercase tracking-widest drop-shadow-lg`}>{rank} OPERATÖR</span>
                                        {profile.licensePlate && <span className="hud-tag border-white/10 text-zinc-400 text-[9px] sm:text-[10px] truncate max-w-[120px]">{profile.licensePlate}</span>}
                                        <span className="hud-tag border-white/10 text-zinc-500 text-[9px] sm:text-[10px]">ID: {String(profile.id).padStart(5, '0')}</span>
                                    </div>
                                </div>
                                <p className="text-zinc-400 text-xs sm:text-sm italic leading-relaxed max-w-lg mx-auto sm:mx-0 line-clamp-3 sm:line-clamp-none">{profile.bio || "Sistemde biyografi verisi bulunamadı."}</p>

                                {/* XP Bar */}
                                <div className="space-y-1 pt-2">
                                    <div className="flex justify-between text-[8px] font-bold uppercase text-zinc-500 tracking-wider">
                                        <span>XP İLERLEMESİ</span>
                                        <span>{(profile.xp || 0) % 100} / 100</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(profile.xp || 0) % 100}%` }}
                                            className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-600 shadow-[0_0_15px_#22d3ee] relative overflow-hidden"
                                        >
                                            {/* Animated shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" style={{
                                                animation: 'shimmer 2s infinite'
                                            }} />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Hexagon Column */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 border-white/5 bg-[#0a0a14]/60 relative overflow-hidden group">
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2 relative z-10">NÖRAL_ANALİZ</h3>
                            <div className="flex items-center relative z-10">
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-center group/stat cursor-help">
                                        <span className="text-xs font-bold text-zinc-400 group-hover/stat:text-amber-400 transition-colors">SAYGINLIK</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black italic text-amber-500 tabular-nums drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{profile.respectPoints || 0}</span>
                                            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_#f59e0b]" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center group/stat cursor-help">
                                        <span className="text-xs font-bold text-zinc-400 group-hover/stat:text-cyan-400 transition-colors">YAKIT</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black italic text-cyan-500 tabular-nums drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">{profile.fuelPoints || 0}</span>
                                            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_#06b6d4]" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center group/stat cursor-help">
                                        <span className="text-xs font-bold text-zinc-400 group-hover/stat:text-purple-400 transition-colors">GÖREVLER</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black italic text-purple-500 tabular-nums drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">0</span>
                                            <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse shadow-[0_0_5px_#a855f7]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="w-32 shrink-0">
                                    <HexagonStats />
                                </div>
                            </div>
                        </div>

                        {/* Quick Action - Share Profile */}
                        <button className="w-full py-4 glass-card bg-gradient-to-r from-white/5 to-white/10 hover:from-cyan-500/10 hover:to-purple-500/10 border-white/5 hover:border-cyan-500/30 text-zinc-400 hover:text-white font-black italic text-xs uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <span className="relative z-10">PROFİL_KARTINI_PAYLAŞ</span>
                        </button>
                    </div>
                </div>

                {/* Badges & Heatmap Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProfileBadges badges={profile.badges || ['early_adopter', 'social_butterfly']} />
                    <ActivityHeatmap />
                </div>

                {/* Inventory/Garage Section */}
                <div className="pt-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <h3 className="text-xl sm:text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
                            <span className="w-6 sm:w-8 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent inline-block shadow-[0_0_10px_#06b6d4]"></span>
                            <span className="hidden sm:inline">ENVANTER_YÖNETİMİ</span>
                            <span className="sm:hidden">ENVANTER</span>
                        </h3>
                        <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
                            <div className="flex bg-black/40 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 shadow-[0_0_30px_rgba(6,182,212,0.1)] min-w-max">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                                            ${activeTab === tab.id
                                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105'
                                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                                    >
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        <span className="sm:hidden">{tab.shortLabel}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTab === 'bikes' && (
                            <>
                                {profile.bikes?.map(bike => (
                                    <GarageCard key={bike.id} bike={bike} isMe={profile.isMe} onEdit={setEditingBike} />
                                ))}
                                {profile.isMe && (
                                    <button
                                        onClick={() => setShowAddBike(true)}
                                        className="min-h-[300px] glass-card border-dashed border-2 border-white/10 hover:border-cyan-500/50 bg-white/0 hover:bg-cyan-500/5 flex flex-col items-center justify-center gap-4 group transition-all"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">＋</div>
                                        <span className="text-xs font-black text-zinc-500 group-hover:text-cyan-400 uppercase tracking-[0.2em]">Yeni Araç Ekle</span>
                                    </button>
                                )}
                            </>
                        )}

                        {(activeTab === 'helmets' || activeTab === 'intercoms') && (
                            <>
                                {getFilteredGear().map(g => (
                                    <GearCard key={g.id} gear={g} />
                                ))}
                                {profile.isMe && (
                                    <button
                                        onClick={() => setShowAddGear(true)}
                                        className="col-span-full py-8 glass-card border-dashed border-white/10 hover:bg-white/5 text-zinc-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                                    >
                                        + Yeni Ekipman Kaydı
                                    </button>
                                )}
                            </>
                        )}

                        {activeTab === 'followers' && (
                            <>
                                {profile.followers?.length > 0 ? (
                                    profile.followers.map(f => (
                                        <div key={f.id} className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-all duration-300 group">
                                            <div className="relative">
                                                <img src={f.profileImage || '/default-avatar.png'} className="w-12 h-12 rounded-lg object-cover bg-zinc-800 border border-white/10" alt={f.fullName} />
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0a0a14] shadow-[0_0_5px_#22c55e]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-black italic text-white uppercase truncate group-hover:text-cyan-400 transition-colors">{f.fullName}</div>
                                                <div className="text-[9px] text-cyan-500 font-bold uppercase tracking-wider">MÜTTEFİK</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full glass-card p-12 text-center">
                                        <div className="text-4xl mb-4 opacity-30">👥</div>
                                        <p className="text-zinc-500 text-sm italic">Henüz takipçi yok</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>

            {/* Floating Mobile Actions */}
            {!profile.isMe && (
                <div className="fixed bottom-6 left-6 right-6 z-50 flex gap-4">
                    <button
                        onClick={handleFollow}
                        className={`flex-1 py-4 glass-card font-black italic uppercase tracking-[0.2em] backdrop-blur-xl shadow-2xl ${profile.isFollowing ? 'border-green-500/50 text-green-400' : 'border-cyan-500/50 text-cyan-400 bg-cyan-900/20'}`}
                    >
                        {profile.isFollowing ? '• BAĞLANTI AKTİF' : '+ BAĞLANTI KUR'}
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/messages?chatId=${id}`)}
                        className="py-4 px-6 glass-card bg-amber-500 text-black font-black text-xl shadow-[0_0_20px_#f59e0b]"
                    >
                        ✉
                    </button>
                </div>
            )}

            {isEditing && (
                <TacticalSettingsModal
                    profile={profile}
                    onClose={() => setIsEditing(false)}
                    onSave={() => fetchProfile()}
                />
            )}

            {showAddBike && (
                <AddBikeModal
                    isOpen={showAddBike}
                    onClose={() => setShowAddBike(false)}
                    onAdd={() => fetchProfile()}
                />
            )}

            {showAddGear && (
                <AddGearModal
                    isOpen={showAddGear}
                    onClose={() => setShowAddGear(false)}
                    onAdd={() => fetchGear()}
                    userId={profile.id}
                />
            )}
        </div>
    );
}
