'use client';

import { useEffect, useState } from 'react';

export default function SessionRestorer() {
    const [status, setStatus] = useState('idle'); // idle, checking, restoring, failed

    useEffect(() => {
        async function attemptRestore() {
            setStatus('checking');

            // Prevent Infinite Loop: If we are here AND url has params, it means server rejected us.
            const params = new URLSearchParams(window.location.search);
            if (params.has('phone') && params.has('token')) {
                console.warn('Session restoration failed (Server rejected params). Stopping loop.');
                setStatus('failed');
                return;
            }

            try {
                const stored = localStorage.getItem('moto_session_backup');
                if (!stored) {
                    setStatus('failed');
                    return;
                }

                const session = JSON.parse(stored);
                // Check if backup is too old (e.g. > 30 days)
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                if (Date.now() - session.timestamp > thirtyDays) {
                    console.log('Backup session expired');
                    setStatus('failed');
                    return;
                }

                setStatus('restoring');
                console.log('Redirecting to restore session...');

                // FORCE RELOAD WITH PARAMS TO TRIGGER COOKIE REFRESH
                window.location.href = `/dashboard?phone=${session.phone}&token=${session.token}`;

            } catch (e) {
                console.error('Session restore error:', e);
                setStatus('failed');
            }
        }

        attemptRestore();
    }, []);

    if (status === 'restoring' || status === 'checking') {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-magenta-500/10 border-t-magenta-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
                </div>
                <h2 className="text-xl font-black text-white italic tracking-tighter mb-2 uppercase">
                    {status === 'checking' ? 'SİSTEM KONTROLÜ' : 'GÜVENLİK PROTOKOLÜ'}
                </h2>
                <div className="text-magenta-500 font-bold text-[10px] tracking-[0.3em] animate-pulse uppercase">
                    {status === 'checking' ? 'OTURUM YEDEĞİ ARANIYOR...' : 'OTURUM GERİ YÜKLENİYOR...'}
                </div>

                {/* Emergency manual backup if stuck */}
                {status === 'checking' && (
                    <div className="mt-8 opacity-20 hover:opacity-100 transition-opacity">
                        <button onClick={() => window.location.reload()} className="text-[8px] text-zinc-500 underline uppercase">Yeniden Dene</button>
                    </div>
                )}
            </div>
        );
    }

    return null; // If failed or idle, show nothing (let parent UI show Access Denied)
}
