'use client';

import { useState, useEffect } from 'react';
import { simulatePayment, getDashboardData } from '../actions';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useNotifications } from '@/app/components/NotificationProvider';

import { Suspense } from 'react';

function PaymentContent({ searchParams }) {
    const { showAlert } = useNotifications();
    const [selectedTier, setSelectedTier] = useState('Gold');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [params, setParams] = useState({ phone: '', token: '' });

    useEffect(() => {
        const init = async () => {
            const p = await searchParams;
            setParams(p);
            if (p.phone && p.token) {
                const userData = await getDashboardData(p.phone, p.token);
                setUser(userData);
            }
        };
        init();
    }, [searchParams]);

    const tiers = [
        { id: 'Bronze', name: 'BRONZE', price: '₺99', period: '/ay', color: '#cd7f32', features: ['2x Klan XP Çarpanı', 'Çekiliş Bileti Toplama', '5 AI Parça Analizi / Hafta', '50 AI Tamirci Mesajı / Ay', 'Temel Profil Rozeti'] },
        { id: 'Silver', name: 'SILVER', price: '₺199', period: '/ay', color: '#c0c0c0', features: ['3x Klan XP Çarpanı', 'Çekiliş Bileti Toplama', '20 AI Parça Analizi / Hafta', '200 AI Tamirci Mesajı / Ay', 'Öncelikli Destek'] },
        { id: 'Gold', name: 'GOLD', price: '₺349', period: '/ay', color: '#ffd700', features: ['4x Klan XP Çarpanı', 'Çekiliş Bileti Toplama', 'Sınırsız AI Parça Analizi', 'Sınırsız AI Tamirci Chat', 'Özel Profil Rozeti', '7/24 VIP Destek'] },
        { id: 'Clan', name: 'KLAN PREMIUM', price: '₺499', period: '/ay', color: '#ff4b2b', featured: true, features: ['Klan Üye Limiti +25 (Toplam 50)', 'Klan Listesinde VIP Rozeti', 'Özel Klan Renk Seçimi (RGB)', '5x Klan XP Çarpanı', 'Sınırsız Chat & Analiz', 'Klan Lideri Özel Rozeti'] }
    ];

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await simulatePayment(params.phone, params.token, selectedTier);
        } catch (error) {
            showAlert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #000, #0a0a0a)', color: '#fff', padding: '40px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ maxWidth: '1000px', margin: 'auto' }}>
                <header style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
                    <Link href="/dashboard" style={{ position: 'absolute', left: '0', top: '0', padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        ⬅️ GERİ DÖN
                    </Link>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '10px' }}> PAKETİNİ <span style={{ color: '#ffd700' }}>SEÇ</span> </h1>
                    <p style={{ color: '#888', maxWidth: '500px', margin: 'auto' }}> Deneyiminizi bir üst seviyeye taşıyın. İhtiyacınıza en uygun premium paketi hemen başlatın. </p>
                </header>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    {tiers.map((tier) => (
                        <div key={tier.id} onClick={() => setSelectedTier(tier.id)} style={{ background: 'rgba(255, 255, 255, 0.03)', border: `2px solid ${selectedTier === tier.id ? tier.color : 'rgba(255,255,255,0.05)'}`, borderRadius: '24px', padding: '30px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', transform: selectedTier === tier.id ? 'translateY(-5px)' : 'none', boxShadow: selectedTier === tier.id ? `0 10px 30px ${tier.color}20` : 'none', backdropFilter: 'blur(10px)' }}>
                            {tier.featured && <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: tier.color, color: '#000', fontSize: '0.7rem', fontWeight: '900', padding: '4px 12px', borderRadius: '100px', textTransform: 'uppercase' }}>En Popüler</span>}
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: tier.color, marginBottom: '5px' }}>{tier.name}</h2>
                            <div style={{ marginBottom: '20px' }}> <span style={{ fontSize: '2rem', fontWeight: '900' }}>{tier.price}</span> <span style={{ color: '#666', fontSize: '0.9rem' }}>{tier.period}</span> </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
                                {tier.features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#bbb', fontSize: '0.85rem', marginBottom: '10px' }}> <span style={{ color: tier.color }}>✓</span> {feature} </li>
                                ))}
                            </ul>
                            <div style={{ padding: '12px', borderRadius: '16px', background: user?.subscriptionStatus === tier.id ? 'rgba(255,255,255,0.05)' : tier.color, color: user?.subscriptionStatus === tier.id ? '#666' : '#000', textAlign: 'center', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', opacity: user?.subscriptionStatus === tier.id ? 0.8 : 1 }}>
                                {user?.subscriptionStatus === tier.id ? 'MEVCUT PAKET' : (user?.subscriptionStatus ? 'PAKETE GEÇ' : 'YÜKSELT')}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ maxWidth: '500px', margin: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '30px', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: '700' }}> Seçilen Paket: <span style={{ color: tiers.find(t => t.id === selectedTier)?.color }}>{selectedTier}</span> </h3>
                    <button onClick={handlePayment} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: tiers.find(t => t.id === selectedTier)?.color || '#ffd700', color: '#000', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', transition: 'opacity 0.2s', opacity: loading ? 0.5 : 1 }}> {loading ? 'YÜKLENİYOR...' : 'ABONELİĞİ BAŞLAT'} </button>
                    <p style={{ marginTop: '20px', fontSize: '0.75rem', color: '#666' }}> Iyzico altyapısıyla 256-bit SSL güvencesinde ödeme. <br /> İstediğiniz zaman iptal edebilirsiniz. </p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '40px' }}> <Link href="/dashboard" style={{ color: '#555', textDecoration: 'none', fontSize: '0.9rem' }}> ← Ana Sayfaya Dön </Link> </div>
            </div>
        </div>
    );
}

export default function PaymentPage(props) {
    return (
        <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>YÜKLENİYOR...</div>}>
            <PaymentContent {...props} />
        </Suspense>
    );
}
