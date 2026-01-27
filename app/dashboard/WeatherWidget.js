'use client';

import { useState, useEffect } from 'react';
import { getWeather } from '../actions';
import { Geolocation } from '@capacitor/geolocation';

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                const data = await getWeather(lat, lon);
                setWeather(data);
            } catch (error) {
                console.error('Weather fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        const getLocation = async () => {
            // Check if we already tried in this session to avoid spamming
            if (sessionStorage.getItem('geo_requested')) {
                fetchWeather(); // Just use IP fallback
                return;
            }

            try {
                // 1. Native Capacitor (Best for App)
                const permission = await Geolocation.checkPermissions();

                if (permission.location === 'granted') {
                    const position = await Geolocation.getCurrentPosition({ timeout: 15000, enableHighAccuracy: true });
                    return fetchWeather(position.coords.latitude, position.coords.longitude);
                }

                // If not granted, try requesting
                try {
                    // Mark as requested so we don't ask again this session
                    sessionStorage.setItem('geo_requested', 'true');

                    const request = await Geolocation.requestPermissions();
                    if (request.location === 'granted') {
                        const position = await Geolocation.getCurrentPosition({ timeout: 15000, enableHighAccuracy: true });
                        return fetchWeather(position.coords.latitude, position.coords.longitude);
                    }
                } catch (pe) {
                    console.warn('Native permission request failed:', pe);
                }

                throw new Error('Native GPS unavailable');
            } catch (error) {
                console.warn('Native Geolocation error, failing over to Web/Server:', error.message);

                // 2. Web Standards Fallback
                if ('geolocation' in navigator) {
                    // Check web permission state first if possible, or just try
                    // For web, navigator.permissions.query could be used, but let's just stick to the session flag logic which applies generally.
                    navigator.geolocation.getCurrentPosition(
                        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
                        () => fetchWeather(), // Fallback to Server-Side Detection
                        { timeout: 5000 }
                    );
                } else {
                    fetchWeather(); // Fallback to Server-Side Detection
                }
            }
        };

        getLocation();
    }, []);

    if (loading) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px 20px',
                borderRadius: '15px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: '100px',
                height: '70px',
                fontSize: '0.7rem',
                color: '#666'
            }}>
                Yükleniyor...
            </div>
        );
    }

    if (!weather) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            padding: '12px 20px',
            borderRadius: '15px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: '100px',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div style={{ fontSize: '1.5rem' }}>{weather.icon}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>{weather.temp}°</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center' }}>
                {weather.description}
            </div>
        </div>
    );
}
