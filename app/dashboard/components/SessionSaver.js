'use client';

import { useEffect } from 'react';

export default function SessionSaver({ user }) {
    useEffect(() => {
        if (user && user.phoneNumber && user.sessionToken) {
            try {
                const sessionData = {
                    phone: user.phoneNumber,
                    token: user.sessionToken,
                    timestamp: Date.now()
                };
                localStorage.setItem('moto_session_backup', JSON.stringify(sessionData));
                console.log('Session secured in local storage.');
            } catch (e) {
                console.error('Failed to save session backup:', e);
            }
        }
    }, [user]);

    return null; // Invisible component
}
