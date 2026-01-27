
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CLAN_FLAGS } from '@/lib/ClanFlags';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function ClanDetailPage({ params }) {
    // Unwrapp params using React.use for Next.js 15
    const { id } = use(params);
    const router = useRouter();
    const { showAlert, showConfirm } = useNotifications();
    const [clan, setClan] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    const [garage, setGarage] = useState([]);

    useEffect(() => {
        if (id) fetchClanDetails();
    }, [id]);

    const fetchClanDetails = async () => {
        try {
            const res = await fetch(`/api/clans/${id}`);
            const data = await res.json();
            if (data.success) {
                setClan(data.clan);
                setMembers(data.members);
                setGarage(data.garage || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        const confirmed = await showConfirm('Bu klana katılma isteği göndermek istediğinize emin misiniz?');
        if (!confirmed) return;
        setJoining(true);
        try {
            const res = await fetch(`/api/clans/${id}/apply`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                showAlert('İsteğiniz başarıyla gönderildi! Lider onayladığında katılmış olacaksınız.');
                fetchClanDetails();
            } else {
                showAlert(data.error);
            }
        } catch (err) {
            showAlert('Hata oluştu.');
        } finally {
            setJoining(false);
        }
    };

    const handleKick = async (memberId) => {
        const confirmed = await showConfirm('Bu üyeyi klandan atmak istediğinize emin misiniz?');
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/clans/${id}/members/${memberId}`, { method: 'DELETE' });
            if (res.ok) {
                showAlert('Üye atıldı.');
                fetchClanDetails();
            } else {
                const data = await res.json();
                showAlert(data.error);
            }
        } catch (err) { showAlert('Hata oluştu.'); }
    };

    const handleRank = async (memberId, newRole) => {
        try {
            const res = await fetch(`/api/clans/${id}/members/${memberId}/role`, {
                method: 'POST',
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                showAlert('Rütbe güncellendi.');
                fetchClanDetails();
            } else {
                const data = await res.json();
                showAlert(data.error);
            }
        } catch (err) { showAlert('Hata oluştu.'); }
    };

    const handleDeleteClan = async () => {
        const confirmed = await showConfirm('KLANI TAMAMEN SİLMEK İSTEDİĞİNİZE EMİN MİSİZ? Bu işlem geri alınamaz.');
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/clans/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showAlert('Klan başarıyla silindi.');
                router.push('/dashboard/clans');
            } else {
                const data = await res.json();
                showAlert(data.error);
            }
        } catch (err) { showAlert('Hata oluştu.'); }
    };

    const handleUpdateFlag = async (flagId) => {
        try {
            const res = await fetch(`/api/clans/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flagId })
            });
            if (res.ok) {
                fetchClanDetails();
            } else {
                const data = await res.json();
                showAlert(data.error);
            }
        } catch (err) { showAlert('Hata oluştu.'); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
    if (!clan) return <div className="p-8 text-center text-red-500">Klan bulunamadı.</div>;

    return (
        <div className="p-6 md:p-10 space-y-12 pb-32 max-w-5xl mx-auto relative min-h-screen">
            {/* Background Aesthetics */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-1/2 h-1/2 bg-amber-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-1/2 h-1/2 bg-zinc-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Header / Tactical HQ Card */}
            <div className="glass-card p-10 relative overflow-hidden text-center border-white/10 bg-[#0a0a14]/60 shadow-2xl z-10">
                <div className="scanner-beam bg-amber-500 opacity-20"></div>

                <div className="relative z-10">
                    <div className="w-32 h-32 mx-auto glass-card bg-zinc-900 border-white/10 p-1.5 flex items-center justify-center rounded-[40px] shadow-2xl mb-8 group overflow-hidden">
                        {clan.logoUrl ? (
                            <img src={clan.logoUrl} alt={clan.name} className="w-full h-full object-cover rounded-[34px] group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <span className="text-5xl group-hover:scale-110 transition-transform">🛡️</span>
                        )}
                    </div>

                    <div className="hud-tag justify-center text-amber-500 mb-2 whitespace-nowrap overflow-hidden text-ellipsis px-2 max-w-full">AKTİF_TAKTİK_BİRLİK // {clan.city || 'KÜRESEL_AĞ'}</div>
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4 px-2 break-words">{clan.name}</h1>
                    <p className="text-zinc-400 max-w-xl mx-auto text-xs md:text-sm font-medium leading-relaxed italic opacity-80 px-4">{clan.description}</p>

                    <div className="mt-10 flex flex-col gap-10">
                        {clan.isLeader ? (
                            <div className="space-y-8">
                                <div className="flex flex-wrap items-center justify-center gap-6">
                                    <Link
                                        href={`/dashboard/clans/${id}/requests`}
                                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black italic px-10 py-4 rounded-2xl shadow-[0_15px_40px_rgba(245,158,11,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center gap-3 border border-amber-400/30 uppercase tracking-widest text-xs"
                                    >
                                        İSTEKLERİ_YÖNET
                                        <span className="text-lg">→</span>
                                    </Link>
                                    <button
                                        onClick={handleDeleteClan}
                                        className="glass-card px-10 py-4 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 font-black italic text-xs uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        KLANI_DAĞIT
                                    </button>
                                </div>

                                <div className="glass-card bg-black/40 border-white/5 p-8 rounded-3xl">
                                    <div className="hud-tag text-zinc-500 mb-6 justify-center">SANCAK_PROTOKOLÜ</div>
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                        {CLAN_FLAGS.map((flag) => (
                                            <button
                                                key={flag.id}
                                                onClick={() => handleUpdateFlag(flag.id)}
                                                className={`aspect-square rounded-xl border-2 transition-all p-1.5 ${clan.flagId === flag.id ? 'border-amber-500 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-zinc-800 hover:border-zinc-700'}`}
                                            >
                                                <div
                                                    className="w-full h-full rounded-lg"
                                                    style={{ background: flag.pattern }}
                                                    title={flag.name}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="hud-tag justify-center text-amber-500/50 mt-6 text-[8px]">AKTİF_DESEN: {CLAN_FLAGS.find(f => f.id === (clan.flagId || 1))?.name}</div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleApply}
                                disabled={joining}
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black italic px-12 py-4 rounded-2xl shadow-[0_15px_40px_rgba(34,211,238,0.3)] hover:scale-105 transition-all active:scale-95 border border-cyan-400/30 uppercase tracking-widest text-xs disabled:opacity-50 mx-auto"
                            >
                                {joining ? 'İŞLENİYOR...' : 'KATILIM_PROTOKOLÜNÜ_BAŞLAT'}
                            </button>
                        )}
                        <div className="hud-tag justify-center text-zinc-500">BİRLİK_KAPASİTESİ: <span className="text-white ml-2">{members.length} / {clan.limit} ÜYE</span></div>
                    </div>
                </div>
            </div>

            {/* Stats / Grid */}
            <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="glass-card p-8 border-white/5 bg-[#0a0a14]/60 text-center relative group overflow-hidden">
                    <div className="scanner-beam bg-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="text-2xl md:text-4xl font-black italic text-white mb-2 tracking-tighter tabular-nums">{members.length} / {clan.limit}</div>
                    <div className="hud-tag justify-center text-magenta-400">SAHADAKİ_OPERATÖRLER</div>
                </div>
                <div className="glass-card p-8 border-white/5 bg-[#0a0a14]/60 text-center relative group overflow-hidden">
                    <div className="scanner-beam bg-amber-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="text-4xl font-black italic text-white mb-2 tracking-tighter tabular-nums">{garage.length}</div>
                    <div className="hud-tag justify-center text-amber-500">TAKTİKSEL_VARLIKLAR</div>
                </div>
            </div>

            {/* Virtual Garage Section */}
            {garage.length > 0 && (
                <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                        <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
                            <span className="text-amber-500">TAKTİKSEL</span> GALERİ
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {garage.map((bike, idx) => (
                            <div key={bike.id} className="glass-card border-white/5 bg-[#0a0a14]/60 overflow-hidden group hover:border-amber-500/30 transition-all shadow-2xl relative">
                                <div className="h-56 bg-zinc-900 relative overflow-hidden">
                                    {bike.imageUrl ? (
                                        <img src={bike.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-black/40">
                                            <span className="text-6xl group-hover:scale-110 transition-transform">🏍️</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 glass-card bg-black/60 backdrop-blur-md px-3 py-1.5 border-white/10 shadow-xl">
                                        <div className="hud-tag text-cyan-400">OPERATÖR: {bike.ownerName}</div>
                                    </div>
                                    <div className="scanner-beam bg-amber-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                </div>
                                <div className="p-8 space-y-2">
                                    <div className="text-2xl font-black italic text-white uppercase tracking-tighter group-hover:text-amber-400 transition-colors">{bike.brand} {bike.model}</div>
                                    <div className="hud-tag text-zinc-500 uppercase italic opacity-70">
                                        MODEL: {bike.nickname || (bike.year ? `${bike.year}_MODEL` : 'BİLİNMEYEN_MODEL')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
                        BİRLİK_<span className="text-cyan-400">VERİTABANI</span>
                    </h3>
                    <div className="hud-tag text-zinc-500 italic uppercase">BAĞLANTI_STABİL</div>
                </div>

                <div className="space-y-4">
                    {members.map(member => (
                        <div key={member.id} className="glass-card p-6 border-white/5 bg-[#0a0a14]/60 flex items-center justify-between hover:bg-white/5 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-14 h-14 glass-card bg-zinc-900 border-white/10 flex items-center justify-center overflow-hidden group-hover:border-white/20 transition-colors">
                                        {member.profileImage ? (
                                            <img src={member.profileImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl opacity-40">👤</span>
                                        )}
                                    </div>
                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#050510] ${member.role === 'leader' ? 'bg-amber-500' : member.role === 'officer' ? 'bg-cyan-500' : 'bg-zinc-500'}`} />
                                </div>
                                <div>
                                    <div className="text-lg font-black italic text-white uppercase tracking-tight mb-1">{member.fullName}</div>
                                    <div className={`hud-tag italic ${member.role === 'leader' ? 'text-amber-400' : member.role === 'officer' ? 'text-cyan-400' : 'text-zinc-500'}`}>
                                        RÜTBE: {member.role === 'leader' ? 'LİDER' : member.role === 'officer' ? 'ZABİT' : 'ÜYE'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                {clan.isLeader && member.role !== 'leader' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleRank(member.userId, member.role === 'officer' ? 'member' : 'officer')}
                                            className="hud-tag px-3 py-1.5 glass-card border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-zinc-500 hover:text-cyan-400 transition-all text-[8px]"
                                        >
                                            {member.role === 'officer' ? 'RÜTBE_DÜŞÜR' : 'TERFİ_ETTİR'}
                                        </button>
                                        <button
                                            onClick={() => handleKick(member.userId)}
                                            className="hud-tag px-3 py-1.5 glass-card border-white/5 hover:border-red-500/40 hover:bg-red-500/5 text-zinc-500 hover:text-red-500 transition-all text-[8px]"
                                        >
                                            İHRAÇ_ET
                                        </button>
                                    </div>
                                )}
                                <div className="hud-tag text-zinc-700 text-[8px] italic pr-2">
                                    KATILIM: {new Date(member.joinedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '/')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
