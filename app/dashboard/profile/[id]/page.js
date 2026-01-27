'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GearCard from '../components/GearCard';
import GarageCard from '../components/GarageCard';
import AddBikeModal from '../components/AddBikeModal';
import AddGearModal from '../components/AddGearModal';
import TacticalSettingsModal from '../components/TacticalSettingsModal';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function ProfilePage({ params: paramsPromise }) {
    console.log("Rendering New Profile Page V3 (Turkish)"); // Debug log
    const { showAlert, showConfirm } = useNotifications();
    const params = use(paramsPromise);
    const id = params?.id || 'me';
    const [profile, setProfile] = useState(null);
    const [gear, setGear] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('bikes'); // 'bikes', 'helmets', 'intercoms'
    const [showAddBike, setShowAddBike] = useState(false);
    const [showAddGear, setShowAddGear] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingBike, setEditingBike] = useState(null);
    const [editData, setEditData] = useState({ bio: '', profileImage: '' });
    const fileInputRef = useRef(null);
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
            <div style={{
                width: '40px', height: '40px',
                border: '3px solid var(--primary)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style jsx>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    if (!profile) return <div style={{ padding: '50px', textAlign: 'center' }}>Kullanıcı bulunamadı.</div>;

    const isPremium = profile && ['Gold', 'Silver', 'Bronze', 'Clan'].includes(profile.subscriptionStatus);

    const tabs = [
        { id: 'bikes', label: 'Motosikletler' },
        { id: 'helmets', label: 'Kasklar' },
        { id: 'intercoms', label: 'İnterkom' },
        { id: 'followers', label: `Takipçiler (${profile.followersCount || 0})` }
    ];

    const getFilteredGear = () => {
        if (activeTab === 'helmets') return gear.filter(g => g.type === 'helmet');
        if (activeTab === 'intercoms') return gear.filter(g => g.type === 'intercom');
        return [];
    };

    return (
        <div className="min-h-screen bg-[#050510] text-zinc-100 pb-32 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-1/2 h-1/2 bg-cyan-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-1/2 h-1/2 bg-pink-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Tactical Header */}
            <header className="sticky top-0 z-50 glass-card mx-4 mt-6 p-4 border-white/10 bg-[#0a0a14]/80 backdrop-blur-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 glass-card flex items-center justify-center text-white/40 hover:text-cyan-400 transition-colors border-white/5 active:scale-90">
                        <span className="text-xl">←</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl glass-card bg-zinc-900 border-white/10 overflow-hidden shadow-2xl p-0.5">
                            <img src={profile.profileImage || '/default-avatar.png'} alt="user" className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div>
                            <div className="text-sm font-black italic text-white uppercase tracking-tight leading-none mb-1">{profile.fullName}</div>
                            <div className="hud-tag text-cyan-500 bg-none border-none p-0 text-[8px]">Pilot Dosyası // Senkronizasyon Tamam</div>
                        </div>
                    </div>
                </div>

                {profile.isMe && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="hud-tag px-6 py-2 glass-card bg-white text-black font-black italic border-none hover:bg-cyan-400 transition-colors active:scale-95"
                    >
                        Profili Düzenle
                    </button>
                )}
            </header>

            <div className="max-w-2xl mx-auto px-6 pt-10 space-y-10 relative z-10">

                {/* Profile Overview Card */}
                <div className="glass-card p-8 border-white/10 bg-[#0a0a14]/60 shadow-2xl relative overflow-hidden group">
                    <div className="scanner-beam bg-cyan-500 opacity-20"></div>

                    <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
                        <div className="w-32 h-32 glass-card bg-zinc-900 border-white/10 p-2 shadow-2xl relative shrink-0">
                            <img src={profile.profileImage || '/default-avatar.png'} className="w-full h-full object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-700" />
                            {isPremium && (
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center text-lg shadow-xl border-4 border-[#0a0a14] animate-float">👑</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-6 w-full">
                            <div>
                                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">{profile.fullName}</h2>
                                        {profile.licensePlate && (
                                            <div className="hud-tag text-cyan-500/80 border-cyan-500/20 px-3 py-1 scale-90 bg-cyan-500/5">{profile.licensePlate}</div>
                                        )}
                                    </div>
                                    <div className="hud-tag text-zinc-500 border-white/10 px-3 py-1 scale-90">ID: {String(profile.id).padStart(5, '0')}</div>
                                </div>
                                {profile.bio && <p className="text-zinc-400 text-sm italic leading-relaxed opacity-80">{profile.bio}</p>}
                            </div>

                            {/* XP Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic">Pilot Tecrübesi // Level {Math.floor((profile.xp || 0) / 100) + 1}</div>
                                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{(profile.xp || 0) % 100}%</div>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(profile.xp || 0) % 100}%` }}
                                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-card bg-black/40 border-white/5 p-4 flex items-center gap-4 group/stat">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl group-hover/stat:scale-110 transition-transform">🏆</div>
                                    <div>
                                        <div className="text-lg font-black italic text-white leading-none">{profile.respectPoints || 0}</div>
                                        <div className="text-[7px] font-black text-amber-500 uppercase tracking-widest">Saygınlık Seviyesi</div>
                                    </div>
                                </div>
                                <div className="glass-card bg-black/40 border-white/5 p-4 flex items-center gap-4 group/stat">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-xl group-hover/stat:scale-110 transition-transform">⛽</div>
                                    <div>
                                        <div className="text-lg font-black italic text-cyan-400 leading-none">{profile.fuelPoints || 0}</div>
                                        <div className="text-[7px] font-black text-cyan-400/60 uppercase tracking-widest">Yakıt Rezervi</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1 border-b border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`hud-tag px-6 py-3 border-none whitespace-nowrap transition-all relative group
                                ${activeTab === tab.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                        {tab.label.toUpperCase()}
                        {activeTab === tab.id && (
                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_15px_#22d3ee]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <div className="space-y-6">
                {activeTab === 'bikes' ? (
                    <div className="space-y-6">
                        {profile.bikes && profile.bikes.length > 0 ? (
                            profile.bikes.map(bike => (
                                <GarageCard key={bike.id} bike={bike} isMe={profile.isMe} onEdit={setEditingBike} />
                            ))
                        ) : (
                            <div className="glass-card p-16 text-center border-white/5 opacity-40">
                                <div className="text-6xl mb-6">🏍️</div>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-2">Garaj Boş</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">Sektörde Varlık Bulunamadı</p>
                            </div>
                        )}

                        {profile.isMe && (
                            <button
                                onClick={() => setShowAddBike(true)}
                                className="w-full glass-card border-white/10 bg-white text-black py-4 flex items-center justify-center gap-4 font-black italic text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 transition-colors active:scale-[0.98] shadow-2xl"
                            >
                                <span className="text-lg">⊕</span> Yeni Araç Kaydet
                            </button>
                        )}
                    </div>
                ) : activeTab === 'followers' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile.followers && profile.followers.length > 0 ? (
                            profile.followers.map(f => (
                                <div key={f.id} className="glass-card p-4 border-white/5 bg-[#0a0a14]/60 flex items-center gap-4 hover:border-white/20 transition-all group">
                                    <div className="w-12 h-12 rounded-xl glass-card bg-zinc-900 border-white/10 overflow-hidden relative group-hover:scale-105 transition-transform">
                                        <img src={f.profileImage || '/default-avatar.png'} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-black italic text-white uppercase truncate">{f.fullName}</div>
                                        <div className="hud-tag text-[7px] text-zinc-600 border-none p-0">Sistem Operatörü</div>
                                    </div>
                                    {profile.isMe && (
                                        <button
                                            onClick={() => handleRemoveFollower(f.id)}
                                            className="w-8 h-8 rounded-lg glass-card border-red-500/10 hover:border-red-500/50 flex items-center justify-center text-red-500 transition-colors active:scale-90"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full glass-card p-16 text-center border-white/5 opacity-40">
                                <div className="text-6xl mb-6">👥</div>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-2">Takipçi Yok</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">Operatör Yalnız Çalışıyor</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {getFilteredGear().length > 0 ? (
                            getFilteredGear().map(g => (
                                <GearCard key={g.id} gear={g} />
                            ))
                        ) : (
                            <div className="col-span-full glass-card p-16 text-center border-white/5 opacity-40">
                                <div className="text-6xl mb-6">{activeTab === 'helmets' ? '🪖' : '📻'}</div>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-2">Ekipman Bulunamadı</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">Envanter Boş</p>
                            </div>
                        )}

                        {profile.isMe && (
                            <button
                                onClick={() => setShowAddGear(true)}
                                className="col-span-full glass-card border-white/10 bg-white text-black py-4 flex items-center justify-center gap-4 font-black italic text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 transition-colors active:scale-[0.98] shadow-2xl"
                            >
                                <span className="text-lg">⊕</span> Yeni Ekipman Kaydet
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Follow/Message Actions */}
            {!profile.isMe && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex gap-4 w-full max-w-xs px-6">
                    <button
                        onClick={handleFollow}
                        className={`flex-1 h-14 rounded-2xl font-black italic text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl border
                                ${profile.isFollowing
                                ? 'glass-card border-white/20 text-white bg-black/60'
                                : 'bg-white text-black border-white hover:bg-cyan-400'}`}
                    >
                        {profile.isFollowing ? 'Bağlı' : 'Bağlantı Kur'}
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/messages?chatId=${id}`)}
                        className="flex-1 h-14 bg-amber-500 text-black border border-amber-400/50 rounded-2xl font-black italic text-xs uppercase tracking-[0.2em] transition-all hover:bg-amber-400 active:scale-95 shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                    >
                        Direkt Hat
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
        </div>
    );
}
