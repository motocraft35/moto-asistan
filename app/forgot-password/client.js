'use client';

import { useState } from 'react';
import { getSafeSecurityQuestion, resetPassword } from '../actions';
import Link from 'next/link';

export default function ForgotPasswordClient() {
    const [step, setStep] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const questionMap = {
        'ilkokul': 'İlkokul öğretmeninizin adı?',
        'anne_kizlik': 'Annenizin kızlık soyadı?',
        'ilk_evcil': 'İlk evcil hayvanınızın adı?',
        'dogum_yeri': 'Doğduğunuz şehir?'
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const qKey = await getSafeSecurityQuestion(phoneNumber);
        setLoading(false);

        if (qKey) {
            setQuestion(questionMap[qKey] || qKey);
            setStep(2);
        } else {
            setError('Bu numara ile kayıtlı ve gizli sorusu olan bir kullanıcı bulunamadı.');
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await resetPassword(phoneNumber, answer, newPassword);
        setLoading(false);

        if (res.success) {
            setStep(3);
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{
            display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center',
            background: 'url(/bg.png) no-repeat center center/cover', padding: '20px'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>ŞİFRE SIFIRLAMA</h2>

                {step === 1 && (
                    <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Lütfen kayıtlı telefon numaranızı girin.</p>
                        <input
                            type="tel"
                            className="input-field"
                            placeholder="05xxxxxxxxx"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'KONTROL EDİLİYOR...' : 'DEVAM ET'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '5px' }}>GİZLİ SORUNUZ:</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{question}</span>
                        </div>

                        <input
                            type="text"
                            className="input-field"
                            placeholder="Cevabınız"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            className="input-field"
                            placeholder="Yeni Şifreniz (En az 6 hane)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'SIFIRLANIYOR...' : 'ŞİFREYİ KAYDET'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                        <h3 style={{ color: 'var(--success)', marginBottom: '10px' }}>BAŞARILI!</h3>
                        <p style={{ color: '#ccc', marginBottom: '20px' }}>Şifreniz başarıyla güncellendi.</p>
                        <Link href="/login">
                            <button className="btn-primary" style={{ width: '100%' }}>GİRİŞ YAP</button>
                        </Link>
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: '15px', color: 'var(--error)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                {step !== 3 && (
                    <div style={{ marginTop: '20px' }}>
                        <Link href="/login" style={{ color: '#aaa', fontSize: '0.8rem' }}>Geri Dön</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
