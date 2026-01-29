import { motion } from 'framer-motion';

export default function ActivityHeatmap() {
    // Generate a mock activity grid (last 52 days roughly)
    // In a real app, this would come from analytics data
    const generateMockData = () => {
        return Array.from({ length: 91 }, (_, i) => { // 13 weeks x 7 days
            const level = Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0; // 0-4 intensity
            return { date: i, level };
        });
    };

    const data = generateMockData();

    const getColor = (level) => {
        switch (level) {
            case 0: return 'bg-white/5';
            case 1: return 'bg-cyan-900/40';
            case 2: return 'bg-cyan-700/60';
            case 3: return 'bg-cyan-500/80';
            case 4: return 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]';
            default: return 'bg-white/5';
        }
    };

    return (
        <div className="glass-card p-6 border-white/5 bg-[#0a0a14]/60">
            <h3 className="text-white font-black italic flex items-center gap-3 mb-6 uppercase tracking-widest text-xs">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
                NÖRAL_AKTİVİTE_LOGLARI
            </h3>

            <div className="flex gap-1 overflow-hidden">
                <div className="grid grid-rows-7 grid-flow-col gap-1 w-full">
                    {data.map((day, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.005 }}
                            className={`w-full h-2 sm:h-3 rounded-sm ${getColor(day.level)}`}
                            title={`Aktivite Seviyesi: ${day.level}`}
                        />
                    ))}
                </div>
            </div>

            <div className="flex justify-end items-center gap-2 mt-4 text-[8px] text-zinc-500 uppercase font-bold tracking-wider">
                <span>RÖLANTİ</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-sm bg-white/5" />
                    <div className="w-2 h-2 rounded-sm bg-cyan-900/40" />
                    <div className="w-2 h-2 rounded-sm bg-cyan-700/60" />
                    <div className="w-2 h-2 rounded-sm bg-cyan-500/80" />
                    <div className="w-2 h-2 rounded-sm bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
                </div>
                <span>REDLINE</span>
            </div>
        </div>
    );
}
