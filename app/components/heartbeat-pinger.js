'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const API_BASE_URL = 'https://moto-asistan.vercel.app';

export default function HeartbeatPinger() {
    const pathname = usePathname();

    useEffect(() => {
        // Ping every 60 seconds
        const interval = setInterval(async () => {
            if (typeof window === 'undefined') return;

            try {
                const userStr = localStorage.getItem('moto_user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    await fetch(API_BASE_URL + '/api/users/heartbeat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id })
                    });
                }
            } catch (e) {
                console.warn('Heartbeat fetch or storage failed:', e);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [pathname]);

    return null;
}
