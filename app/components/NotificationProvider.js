
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speak as speakHelper } from './VoiceNotification';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};

export function NotificationProvider({ children }) {
    const [alert, setAlert] = useState(null); // { message, type }
    const [confirm, setConfirm] = useState(null); // { message, resolve }

    const showAlert = useCallback((message) => {
        setAlert({ message });
        // Auto-speak alerts with safety
        try {
            speakHelper(message);
        } catch (e) {
            console.error('Speech error:', e);
        }
    }, []);

    const speak = useCallback((message) => {
        try {
            speakHelper(message);
        } catch (e) {
            console.error('Speech error:', e);
        }
    }, []);

    const showConfirm = useCallback((message) => {
        return new Promise((resolve) => {
            setConfirm({ message, resolve });
        });
    }, []);

    const closeAlert = () => setAlert(null);
    const handleConfirm = (value) => {
        confirm.resolve(value);
        setConfirm(null);
    };

    return (
        <NotificationContext.Provider value={{ showAlert, showConfirm, speak }}>
            {children}

            {/* Global Alert Modal */}
            <AnimatePresence>
                {alert && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-sm bg-[#0a0a14] border-2 border-amber-500/30 rounded-[32px] p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl italic font-black text-white">GHOST</div>

                            <div className="text-4xl mb-4">📢</div>
                            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter mb-4 leading-tight">
                                {alert.message}
                            </h2>
                            <button
                                onClick={closeAlert}
                                className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all"
                            >
                                ANLADIM
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Confirm Modal */}
            <AnimatePresence>
                {confirm && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-sm bg-[#0a0a14] border-2 border-red-500/30 rounded-[32px] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl italic font-black text-white">⚠️</div>

                            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter mb-6 leading-tight">
                                {confirm.message}
                            </h2>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleConfirm(true)}
                                    className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all"
                                >
                                    EVET, ONAYLIYORUM
                                </button>
                                <button
                                    onClick={() => handleConfirm(false)}
                                    className="w-full py-4 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-all"
                                >
                                    VAZGEÇ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
}
