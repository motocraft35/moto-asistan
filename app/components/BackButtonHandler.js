'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function BackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const { showAlert } = useNotifications();

    useEffect(() => {
        let lastTime = 0;
        let exitTriggered = false;

        const setupListener = async () => {
            // Capacitor backButton listener
            const backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
                const currentTime = Date.now();

                // Throttle back button (500ms)
                if (currentTime - lastTime < 500) return;
                lastTime = currentTime;

                if (pathname === '/dashboard') {
                    if (!exitTriggered) {
                        exitTriggered = true;
                        showAlert('Kapatmak için geri tuşuna tekrar basın.');
                        setTimeout(() => { exitTriggered = false; }, 2000);
                    } else {
                        App.exitApp();
                    }
                } else {
                    // Modern Next.js navigation
                    router.back();
                }
            });

            return backButtonListener;
        };

        const listenerPromise = setupListener();

        return () => {
            listenerPromise.then(l => l.remove());
        };
    }, [router, pathname, showAlert]);

    return null;
}

