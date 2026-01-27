'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function PartyHUD({ party, user, talkingMembers = {}, isBarMode = false }) {
    if (!party || !party.members || !user) return null;

    const membersToShow = party.members.filter(member => {
        const mId = String(member.id);
        const uId = String(user?.id);
        return talkingMembers[mId] || mId === uId;
    });

    if (isBarMode) {
        return (
            <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                    {membersToShow.map((member) => {
                        const mId = String(member.id);
                        const isTalking = talkingMembers[mId];
                        const isMe = mId === String(user?.id);
                        const isOnline = Date.now() - new Date(member.lastHeartbeat).getTime() < 60000;

                        return (
                            <motion.div
                                key={member.id}
                                layout
                                initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5, x: -10 }}
                                className="relative group"
                            >
                                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl bg-zinc-900 border transition-all overflow-hidden
                                    ${isTalking ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-white/10'}`}>
                                    {member.profileImage ? (
                                        <img src={member.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[12px] bg-zinc-800">👤</div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${isOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>

                                {isTalking && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <span className="text-[8px] text-black font-bold">!</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        );
    }

    // Default vertical layout (fallback)
    return (
        <div className="fixed left-4 top-32 z-[10002] flex flex-col gap-2 max-w-[150px] md:max-w-[220px] md:left-6 md:top-1/2 md:-translate-y-1/2 pointer-events-none">
            {/* Same vertical layout as before... */}
        </div>
    );
}
