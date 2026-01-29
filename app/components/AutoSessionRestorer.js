'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { restoreSession } from '../actions';

/**
 * AutoSessionRestorer: Automatically restores user session on app load
 * if localStorage has cached credentials and no active cookie session exists.
 */
export default function AutoSessionRestorer() {
    const router = useRouter();

    useEffect(() => {
        const attemptAutoRestore = async () => {
            try {
                // Check if we have an active session (client-readable auth_session cookie)
                const hasActiveSession = document.cookie.includes('auth_session=');
                if (hasActiveSession) {
                    console.log('[AutoSessionRestorer] Active session detected, skipping restore');
                    return;
                }

                // Try to restore from localStorage
                const userStr = localStorage.getItem('moto_user');
                if (!userStr) {
                    console.log('[AutoSessionRestorer] No cached user data found');
                    return;
                }

                const user = JSON.parse(userStr);

                // Check if cached data is too old (more than 30 days)
                if (user.cachedAt) {
                    const cachedDate = new Date(user.cachedAt);
                    const now = new Date();
                    const daysDiff = (now - cachedDate) / (1000 * 60 * 60 * 24);

                    if (daysDiff > 30) {
                        console.log('[AutoSessionRestorer] Cached data expired, clearing');
                        localStorage.removeItem('moto_user');
                        return;
                    }
                }

                // Attempt session restoration
                if (user.phoneNumber && user.sessionToken) {
                    console.log('[AutoSessionRestorer] Attempting to restore session...');
                    const result = await restoreSession(user.phoneNumber, user.sessionToken);

                    if (result.success) {
                        console.log('[AutoSessionRestorer] ✅ Session restored successfully!');

                        // Redirect to dashboard if we're on login page
                        if (window.location.pathname === '/' || window.location.pathname === '/login') {
                            router.push('/dashboard');
                            router.refresh();
                        }
                    } else {
                        console.log('[AutoSessionRestorer] ❌ Session restore failed, clearing cache');
                        localStorage.removeItem('moto_user');
                    }
                } else {
                    console.log('[AutoSessionRestorer] Incomplete user data, missing phone or token');
                }
            } catch (error) {
                console.error('[AutoSessionRestorer] Error during restoration:', error);
                // Don't clear localStorage on error, might be temporary network issue
            }
        };

        // Run restoration attempt after a short delay to ensure page is loaded
        const timeoutId = setTimeout(attemptAutoRestore, 500);

        return () => clearTimeout(timeoutId);
    }, [router]);

    return null; // This is a logic-only component
}
