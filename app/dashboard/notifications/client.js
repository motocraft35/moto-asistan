'use client';

import { useState, useEffect } from 'react';

// Public VAPID Key (Must match server)
const PUBLIC_VAPID_KEY = 'BFANdFfLMx1GYoPzS_gEwMrjDxRvQsC2d3fw_RPUr5U4qowBQAO49fIYEWKsi87mvmLEKAfPejr1OVCFqiNYJtQ';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationManager({ userId }) {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const register = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('Service Worker registered');

            const sub = await register.pushManager.getSubscription();
            setSubscription(sub);
        } catch (e) {
            console.error('SW Register failed:', e);
        }
    };

    const subscribeToPush = async () => {
        setLoading(true);
        setMessage('');
        try {
            const register = await navigator.serviceWorker.ready;
            const sub = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({
                    userId: userId,
                    subscription: sub,
                    userAgent: navigator.userAgent
                }),
                headers: {
                    'content-type': 'application/json'
                }
            });

            setSubscription(sub);
            setMessage('Bildirimler başarıyla açıldı! 🎉');
        } catch (e) {
            console.error(e);
            setMessage('Hata: Bildirim izni verilmedi veya desteklenmiyor.');
        } finally {
            setLoading(false);
        }
    };

    if (!isSupported) return null;

    return (
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>🔔 Bildirim Ayarları</h3>

            {subscription ? (
                <div>
                    <p style={{ color: 'var(--success)', marginBottom: '10px', fontSize: '0.9rem' }}>
                        ✅ Bildirimler Açık
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                        Yeni mesajlar ve kampanyalardan haberdar olacaksınız.
                    </p>
                </div>
            ) : (
                <div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#ccc' }}>
                        Uygulama kapalıyken de mesaj almak ister misiniz?
                    </p>
                    <button
                        onClick={subscribeToPush}
                        disabled={loading}
                        className="btn-secondary"
                        style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                    >
                        {loading ? 'Açılıyor...' : 'BİLDİRİMLERİ AÇ'}
                    </button>
                    {message && <p style={{ color: 'var(--error)', marginTop: '10px', fontSize: '0.8rem' }}>{message}</p>}
                </div>
            )}
            {message && subscription && <p style={{ color: 'var(--success)', marginTop: '10px', fontSize: '0.8rem' }}>{message}</p>}
        </div>
    );
}
