'use client';

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';

export default function BackgroundTracker() {
    const watchIdRef = useRef(null);
    const isBackgroundRef = useRef(false);

    useEffect(() => {
        const startBackgroundWatch = async () => {
            // Clear existing watch if any
            if (watchIdRef.current) {
                await Geolocation.clearWatch({ id: watchIdRef.current });
            }

            // Start Geolocation watch
            watchIdRef.current = await Geolocation.watchPosition(
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                },
                async (position) => {
                    if (position) {
                        // Sadece arka planda veya ekran kapalıyken bile veri göndermeye çalış
                        // UI üzerindeki MapClient zaten aktifken gönderiyor, 
                        // bu bileşen "ölümsüz" bir yedek görevi görecek.
                        try {
                            await fetch('/api/users/location', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    heading: position.coords.heading
                                })
                            });
                        } catch (err) {
                            console.error('Background update failed:', err);
                        }
                    }
                }
            );
        };

        const setupAppStateListener = async () => {
            const listener = await App.addListener('appStateChange', async ({ isActive }) => {
                isBackgroundRef.current = !isActive;
                console.log('App state changed. IsActive:', isActive);

                if (!isActive) {
                    // Uygulama arka plana geçtiğinde watch'u tazele veya modu değiştir
                    // Not: Android'de foreground service olmadan bu uzun sürmeyebilir
                    console.log('--- GHOST MODE ACTIVATED: BACKGROUND SYNCING ---');
                }
            });

            return listener;
        };

        const appStateListenerPromise = setupAppStateListener();
        startBackgroundWatch();

        return () => {
            if (watchIdRef.current) {
                Geolocation.clearWatch({ id: watchIdRef.current });
            }
            appStateListenerPromise.then(l => l.remove());
        };
    }, []);

    return null;
}
