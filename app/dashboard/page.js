import Link from 'next/link';
import { auth } from '../../auth';
import { cookies } from 'next/headers';
import db from '../../lib/db';
import DynamicServiceCode from './components/DynamicServiceCode';
import NotificationManager from './notifications/client';
import WeatherBar from './components/WeatherBar';
import LogoutButton from './components/LogoutButton';
import { getDashboardData } from '../actions';
import SearchTrigger from './components/SearchTrigger';
import SOSButton from './components/SOSButton';
import OnlineCounter from './components/OnlineCounter';
import RaffleTracker from './components/RaffleTracker';
import FeedbackTrigger from './components/FeedbackTrigger';

export default async function DashboardPage() {
    let user = null;
    const session = await auth();

    // Auth logic: Try NextAuth first, then fallback to custom cookie auth
    if (session?.user) {
        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE email = ?',
            args: [session.user.email]
        });
        user = result.rows[0];
    }

    if (!user) {
        user = await getDashboardData();
    }

    // Sanitize user object for serialization
    if (user) {
        user = JSON.parse(JSON.stringify(user));
        // Explicit BigInt to Number conversion just in case
        if (user.id) user.id = Number(user.id);
        if (user.partsUsageCount) user.partsUsageCount = Number(user.partsUsageCount);
    }

    // Real Statistics fetching
    let totalUsers = 0;
    try {
        const totalUsersRes = await db.execute('SELECT COUNT(*) as count FROM users');
        if (totalUsersRes.rows?.[0]) {
            totalUsers = totalUsersRes.rows[0].count || 0;
        }
    } catch (e) {
        console.error("Total users fetch failed:", e);
    }

    // Heartbeat logic for online pilots (last 5 minutes)
    let onlinePilotsCount = 0;
    try {
        const res = await db.execute({
            sql: "SELECT COUNT(*) as count FROM users WHERE lastHeartbeat > datetime('now', '-5 minutes')",
            args: []
        });
        onlinePilotsCount = Number(res.rows[0]?.count || 0);
    } catch (e) {
        console.error("Online pilots fetch failed:", e);
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#050510] relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-magenta-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-magenta-500/10 rounded-full blur-[120px]" />

                <div className="bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 text-center shadow-2xl relative z-10">
                    <div className="text-6xl mb-6">🚫</div>
                    <h1 className="text-3xl font-black mb-4 tracking-tighter text-white uppercase italic">Erişim Engellendi</h1>
                    <p className="text-zinc-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">Şehir nabzını hissetmek için önce sisteme giriş yapmalısın.</p>
                    <Link href="/login" className="block w-full py-4 bg-magenta-500 text-black font-black uppercase italic rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                        Sisteme Bağlan
                    </Link>
                </div>
            </div>
        );
    }

    const isPremium = user.subscriptionStatus && ['Gold', 'Silver', 'Bronze', 'Clan', 'Premium', 'Active'].includes(user.subscriptionStatus);
    const tierColors = {
        'Gold': 'from-yellow-400 to-amber-600',
        'Silver': 'from-slate-300 to-slate-500',
        'Bronze': 'from-orange-500 to-amber-800',
        'Clan': 'from-red-500 to-red-700 shadow-[0_0_25px_rgba(220,38,38,0.4)]',
        'Premium': 'from-magenta-400 to-emerald-600',
        'Active': 'from-magenta-400 to-emerald-600'
    };

    return (
        <main className="min-h-screen bg-[#050510] text-zinc-100 pb-32 relative overflow-hidden scroll-smooth">
            {/* Optimized BG Elements - Simplified for high-fps scrolling */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-magenta-600/5 rounded-full blur-[40px] pointer-events-none z-0 gpu-boost" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-magenta-600/5 rounded-full blur-[40px] pointer-events-none z-0 gpu-boost" />
            <div className="fixed top-[30%] right-[0%] w-[25%] h-[25%] bg-emerald-600/5 rounded-full blur-[30px] pointer-events-none z-0 gpu-boost" />

            {/* Dashboard Container - Isolated for performance */}
            <div className="max-w-md mx-auto px-4 md:px-5 pt-2 md:pt-4 space-y-3 md:space-y-6 relative z-10 contain-layout">

                <header className="flex items-center justify-between pb-4 border-b border-white/5 relative">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="text-tactical-label text-magenta-500/60 mb-1">MOTO-ASİSTAN // V3.1.0</div>
                        </div>
                        <h1 className="text-neon-title text-xl md:text-2xl text-white leading-none">
                            MOTORCU: <span className="text-magenta-400 text-neon-magenta">{user.fullName ? user.fullName.split(' ')[0] : 'GHOST'}</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <OnlineCounter initialCount={onlinePilotsCount} />
                            {user.isMaster === 1 && (
                                <div className="flex items-center gap-2">
                                    <Link href="/dashboard/admin/reports" className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">NEURAL_FEED</span>
                                    </Link>
                                    <Link href="/dashboard/master" className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-magenta-500/10 border border-magenta-500/20 hover:bg-magenta-500/20 transition-all group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-magenta-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-magenta-500 uppercase tracking-widest">MASTER_PANEL</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 self-center">
                        <SearchTrigger />
                        <Link href={`/dashboard/profile/${user.id}`} className="relative group block">
                            <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl glass-card border-white/10 bg-zinc-900 overflow-hidden shadow-2xl transition-all group-hover:scale-105 active:scale-95 group-hover:border-magenta-500/50 p-0.5">
                                <div className="w-full h-full rounded-[10px] md:rounded-[14px] overflow-hidden border border-white/5 bg-black/40">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl bg-zinc-800 opacity-40 uppercase font-black italic">
                                            {user.fullName ? user.fullName[0] : 'P'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isPremium && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full border-2 border-[#050510] flex items-center justify-center text-[9px] md:text-[10px] shadow-lg animate-float z-20">👑</div>
                            )}
                        </Link>
                    </div>
                </header>

                <div>
                    <WeatherBar />
                </div>

                {/* 2. Premium Status Card */}
                <Link href="/payment" className={`glass-card p-6 transition-all hover:scale-[1.01] active:scale-95 block relative overflow-hidden group ${isPremium ? 'border-magenta-500/30' : 'border-white/5'}`}>
                    <div className="bracket-corner bracket-tl"></div>
                    <div className="bracket-corner bracket-tr"></div>

                    <div className="flex items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${isPremium ? tierColors[user.subscriptionStatus] : 'from-zinc-800 to-zinc-900'} border border-white/10 shadow-2xl group-hover:rotate-6 transition-transform flex-shrink-0`}>
                                <span className="text-xl animate-float">🛡️</span>
                            </div>
                            <div className="min-w-0">
                                <div className="text-tactical-label text-zinc-600 mb-1">YETKİ PROTOKOLÜ</div>
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-neon-title text-base text-white group-hover:text-magenta-400 transition-colors uppercase truncate">
                                        {isPremium ? `${user.subscriptionStatus} SEVİYE` : 'STANDART SÜRÜŞ'}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[7px] font-black text-magenta-500/60 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                                            {isPremium ? '● SINIRSIZ ANALİZ AKTİF' : `○ ANALİZ HAKKI: ${2 - (user.partsUsageCount || 0)} / 2`}
                                        </p>
                                        {isPremium && (
                                            <p className="text-[7px] font-black text-amber-500/60 uppercase tracking-widest border-l border-white/10 pl-3 whitespace-nowrap">
                                                SİSTEM SORGUSU: {user.partsUsageCount || 0}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {!isPremium && <span className="text-magenta-500 font-black text-[9px] animate-pulse flex-shrink-0">YÜKSELT {'>>'}</span>}
                    </div>
                </Link>

                {/* 3. Core Actions Grid */}
                <section className="space-y-3">
                    <div className="hover:scale-[1.01] transition-transform">
                        <SOSButton />
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative">
                        {/* Strategy Map (Full Width) */}
                        <Link href="/dashboard/map" className="col-span-2 glass-card h-[160px] md:h-[200px] group shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] overflow-hidden border-magenta-500/20">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]/40 z-10" />
                            <div className="bracket-corner bracket-tl"></div>
                            <div className="bracket-corner bracket-tr"></div>
                            <img
                                src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=800"
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 grayscale opacity-40 group-hover:opacity-100 brightness-[0.6] group-hover:brightness-[1] scale-105 group-hover:scale-100"
                                alt=""
                            />

                            <div className="relative z-20 h-full p-6 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="text-tactical-label text-magenta-400 bg-magenta-400/10 px-2 py-1 rounded border border-magenta-400/20">STRATEJİK RADAR AKTİF</div>
                                    <div className="text-micro-data text-white/40">SEKTÖR: 01</div>
                                </div>
                                <div>
                                    <h3 className="text-neon-title text-xl text-white group-hover:text-magenta-400 transition-colors">GHOST HARİTA <span className="text-magenta-400 font-light ml-1">v3.1</span></h3>
                                    <div className="flex items-center gap-2 mt-1.5 opacity-80">
                                        <div className="w-1 h-1 rounded-full bg-magenta-400" />
                                        <span className="text-[8px] font-black text-magenta-100 uppercase tracking-widest">SİSTEM TARANIYOR...</span>
                                    </div>
                                </div>
                            </div>
                        </Link>


                        {/* Price Query */}
                        <Link href="/dashboard/mechanic/parts" className="glass-card p-4 md:p-6 flex flex-col justify-between group transition-all hover:border-magenta-500/50 hover:bg-magenta-500/5 overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-magenta-500/10 rounded-full blur-2xl group-hover:bg-magenta-500/20" />
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-magenta-500/10 border border-magenta-500/20 flex items-center justify-center text-2xl md:text-3xl group-hover:border-magenta-500/50 transition-all">
                                <span className="animate-magnifier-scan inline-block">🔍</span>
                            </div>
                            <div className="relative z-10 leading-none">
                                <div className="text-tactical-label text-magenta-400 mb-1">YAPAY ZEKA</div>
                                <h3 className="text-neon-title text-lg text-white group-hover:text-magenta-400 transition-colors">Fiyat Sorgu</h3>
                            </div>
                        </Link>

                        {/* Clans */}
                        <Link href="/dashboard/clans" className="glass-card p-4 md:p-6 flex flex-col justify-between group transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20" />
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl md:text-3xl group-hover:border-emerald-500/50 transition-all">
                                <span className="animate-3d-rotate inline-block">🛡️</span>
                            </div>
                            <div className="relative z-10 leading-none">
                                <div className="text-tactical-label text-emerald-500 mb-1">DÜNYA AĞI</div>
                                <h3 className="text-neon-title text-lg text-white group-hover:text-emerald-400 transition-colors">Klan Konseyi</h3>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Marketplace */}
                <Link href="/dashboard/market" className="col-span-2 glass-card card-small p-4 md:p-6 flex flex-col justify-between group transition-all hover:border-amber-500/50 hover:bg-amber-500/5 overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl md:text-2xl group-hover:scale-110 transition-transform">
                            <span className="animate-market-glow inline-block">🛒</span>
                        </div>
                        <div className="text-right">
                            <div className="hud-tag text-[6px] md:text-[7px] text-amber-500/60 mb-0.5">İLAN TAKİBİ</div>
                            <div className="text-[7px] md:text-[8px] font-black text-amber-500/40 uppercase">P2P AKTİF</div>
                        </div>
                    </div>
                    <div className="relative z-10 leading-none">
                        <div className="text-tactical-label text-amber-600 mb-1">TİCARET</div>
                        <h3 className="text-neon-title text-lg text-white group-hover:text-amber-400 transition-colors">Pazar Yeri</h3>
                    </div>
                </Link>

                {/* 4. Dynamic Service Code */}
                <section className="glass-card p-4 md:p-8 group border-t-2 border-amber-500/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />

                    <div className="flex items-center justify-between mb-4 md:mb-8 relative z-10">
                        <div>
                            <div className="text-tactical-label text-amber-500 mb-1">KİMLİK DOĞRULAMA</div>
                            <h3 className="text-neon-title text-lg text-white italic">HİZMET KODU</h3>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl md:text-2xl animate-spin-slow">
                            <span>⚡</span>
                        </div>
                    </div>

                    <DynamicServiceCode user={user} />

                    <div className="mt-4 md:mt-8 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center relative overflow-hidden group/btn">
                        <div className="absolute inset-0 bg-amber-500/10 translate-x-[-100%] group-hover/btn:translate-x-[0%] transition-transform duration-500" />
                        <p className="text-[7px] md:text-[8px] text-zinc-500 font-black uppercase tracking-widest leading-none relative z-10">
                            BU KODU <span className="text-amber-500">KOMUTA MERKEZİ</span> İÇİN KULLANIN
                        </p>
                    </div>
                </section>

                {/* 5. Raffle Tracker */}
                <RaffleTracker />

                {/* 6. Quick Tools */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="text-[6px] md:text-[7px] font-black text-zinc-700 uppercase tracking-widest">HIZLI MODÜLLER</div>
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                        {[
                            { icon: '🤖', label: 'YAPAY ZEKA', href: '/dashboard/mechanic' },
                            { icon: 'garaj', label: 'GARAJ', href: `/dashboard/profile/${user.id}` },
                            { icon: '🏁', label: 'SIRALAMA', href: '/dashboard/clans/ranking' },
                        ].map((tool, i) => (
                            <Link key={i} href={tool.href} className="glass-card p-3 md:p-5 text-center group transition-all hover:bg-white/5 active:scale-95 border-b-2 border-transparent hover:border-magenta-500/30 overflow-hidden relative">
                                <div className="text-lg md:text-2xl mb-1 md:mb-2 group-hover:scale-125 transition-transform duration-500">
                                    <span className="inline-block animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                                        {tool.icon === 'garaj' ? '🏍️' : tool.icon}
                                    </span>
                                </div>
                                <div className="text-[6px] md:text-[8px] font-black text-zinc-500 group-hover:text-white transition-colors">{tool.label}</div>
                            </Link>
                        ))}
                    </div>
                </section>

                <NotificationManager userId={user.id} />

                {/* 7. Feedback Loop Trigger */}
                <div className="pt-4">
                    <FeedbackTrigger />
                </div>


                {/* 6. System Termination Footer */}
                <div className="pt-8 pb-12 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/5 rounded-full blur-[80px]" />

                    <div className="inline-block px-6 py-2 bg-zinc-900/60 rounded-full border border-white/5">
                        <div className="text-[7px] font-black text-zinc-500 flex items-center gap-2">
                            AĞ ERİŞİM SÜRESİ: <span className="text-white italic">
                                {user.subscriptionEndDate && !isNaN(new Date(user.subscriptionEndDate).getTime()) ? new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.') : 'SONSUZ'}
                            </span>
                        </div>
                    </div>

                    <LogoutButton />

                    <div className="text-[8px] text-zinc-800 font-black uppercase tracking-[1em] opacity-40">
                        MOTO-ASİSTAN // V3.1.0
                    </div>
                </div>
            </div>
        </main>
    );
}
