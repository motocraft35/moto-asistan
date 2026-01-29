'use client';

import { useEffect } from 'react';
import { restoreSession } from '../actions';

/**
 * SessionRestorer: A client-side component that attempts to restore 
 * the user session from localStorage if the cookie is missing.
 * Especially useful for WebViews and mobile environments.
 */
export default function SessionRestorer() {
    useEffect(() => {
        const attemptRestoration = async () => {
            // Only attempt if not already explicitly logged out in this session
            const userStr = localStorage.getItem('moto_user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    // If we have a phone and a token cached (from a previous successful login)
                    // we can try to restore the session cookie.
                    // Note: sessionToken is ideally what's stored in moto_user for this purpose.
                    if (user.phoneNumber && user.sessionToken) {
                        const result = await restoreSession(user.phoneNumber, user.sessionToken);
                        if (result.success) {
                            console.log('[SessionRestorer] Session restored from local cache.');
                            // Optionally redirect if we are on the login page
                            if (window.location.pathname === '/login') {
                                window.location.href = '/dashboard';
                            }
                        }
                    }
                } catch (e) {
                    console.error('[SessionRestorer] Restoration failed:', e);
                }
            }
        };

        attemptRestoration();
    }, []);

    return null; // This is a logic-only component
}
