'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function AddGearModal({ onClose, onGearAdded, defaultType = 'helmet' }) {
    const { showAlert } = useNotifications();
    const { id: userId } = useParams();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        type: defaultType,
        brand: '',
        model: '',
        imageUrl: ''
    });

    useEffect(() => {
        fetch('/api/users/me').then(res => res.json()).then(data => setUser(data));
    }, []);

    const isPremium = user?.subscriptionStatus && user.subscriptionStatus !== 'Passive';
    const isRestricted = (formData.type === 'helmet' || formData.type === 'intercom') && !isPremium;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isRestricted) return;
        setLoading(true);

        try {
            const res = await fetch('/api/gear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, userId })
            });

            if (res.ok) {
                onGearAdded();
                onClose();
            } else {
                showAlert('Eklenirken bir hata oluştu');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: '#0a0a0f',
                width: '100%', maxWidth: '400px',
                borderRadius: '32px',
                padding: '30px',
                border: '1px solid #1a1a2e',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>

                <h3 style={{ color: 'var(--primary)', marginTop: 0, marginBottom: '20px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-1px' }}>
                    EKİPMAN EKLE
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Selector to switch types */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['helmet', 'intercom'].map(t => (
                            <button key={t} type="button"
                                onClick={() => setFormData({ ...formData, type: t })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)',
                                    background: formData.type === t ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                    color: formData.type === t ? '#000' : '#888',
                                    fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px',
                                    transition: 'all 0.2s'
                                }}>
                                {t === 'helmet' ? '🪖 KASK' : '📻 İNTERKOM'}
                            </button>
                        ))}
                    </div>

                    {isRestricted && (
                        <div style={{ padding: '15px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '16px', textAlign: 'center' }}>
                            <p style={{ color: '#fb7185', fontSize: '10px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                ⚠️ BU EKİPMAN TÜRÜ SADECE <br /> PREMIUM ÜYELER İÇİNDİR
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <input
                            placeholder="Marka (Örn: Shoei, Cardo)"
                            className="minimal-input"
                            value={formData.brand}
                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            required
                        />

                        <input
                            placeholder="Model (Örn: Packtalk Edge)"
                            className="minimal-input"
                            value={formData.model}
                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                            required
                        />

                        <input
                            placeholder="Görsel URL (İsteğe bağlı)"
                            className="minimal-input"
                            value={formData.imageUrl}
                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} className="btn-outline flex-1" style={{ color: '#555', border: '1px solid rgba(255,255,255,0.05)' }}>
                            KAPAT
                        </button>
                        <button disabled={loading || isRestricted} type="submit" className="btn-primary flex-1">
                            {loading ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
