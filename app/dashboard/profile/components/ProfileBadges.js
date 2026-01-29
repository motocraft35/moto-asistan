import { motion } from 'framer-motion';

const BADGES = {
    'early_adopter': { icon: '🚀', label: 'ERKENCİ_KUŞ', desc: 'Sisteme katılan ilk 100 pilottan biri.', color: 'from-amber-400 to-orange-600' },
    'mechanic_master': { icon: '🔧', label: 'USTA_TAMİRCİ', desc: '10+ Başarılı parça analizi tamamlandı.', color: 'from-cyan-400 to-blue-600' },
    'route_explorer': { icon: '🗺️', label: 'ROTA_KAŞİFİ', desc: '5 farklı bölgede sürüş kaydı.', color: 'from-emerald-400 to-green-600' },
    'social_butterfly': { icon: '🦋', label: 'AĞ_LİDERİ', desc: '50+ Takipçi ağına ulaşıldı.', color: 'from-purple-400 to-pink-600' },
    'night_rider': { icon: '🌙', label: 'GECE_SÜRÜCÜSÜ', desc: 'Gece 00:00 - 05:00 arası sistem kullanımı.', color: 'from-indigo-400 to-violet-600' }
};

export default function ProfileBadges({ badges = ['early_adopter', 'mechanic_master'] }) {
    // Fallback if badges is empty or undefined, showing some locked ones for visual appeal
    const displayBadges = badges.length > 0 ? badges : ['early_adopter'];

    return (
        <div className="glass-card p-6 border-white/5 bg-[#0a0a14]/60 relative overflow-hidden">
            <div className="scanner-beam opacity-10"></div>
            <h3 className="text-white font-black italic flex items-center gap-3 mb-6 uppercase tracking-widest text-xs">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
                BAŞARIM_ROZETLERİ
            </h3>

            <div className="flex flex-wrap gap-4">
                {displayBadges.map((badgeKey, index) => {
                    const badge = BADGES[badgeKey];
                    if (!badge) return null;

                    return (
                        <motion.div
                            key={badgeKey}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative"
                        >
                            <div className={`w-16 h-16 rounded-xl glass-card border-white/10 bg-gradient-to-br ${badge.color} p-[1px] relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/80 group-hover:bg-black/40 transition-colors duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                                    {badge.icon}
                                </div>
                            </div>

                            {/* Tooltip */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                <div className="glass-card bg-black/90 p-3 border-white/10 text-center relative">
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-l border-t border-white/10 transform rotate-45" />
                                    <div className={`text-[9px] font-black bg-gradient-to-r ${badge.color} bg-clip-text text-transparent uppercase tracking-widest mb-1`}>
                                        {badge.label}
                                    </div>
                                    <div className="text-[8px] text-zinc-400 font-medium leading-tight">
                                        {badge.desc}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Locked Badge Placeholder */}
                <div className="w-16 h-16 rounded-xl glass-card border-white/5 bg-white/5 opacity-30 flex items-center justify-center grayscale">
                    <span className="text-2xl opacity-50">🔒</span>
                </div>
            </div>
        </div>
    );
}
