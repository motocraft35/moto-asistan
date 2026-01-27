'use client';

import LoginForm from '../components/LoginForm';
import HeroBackground from '../components/HeroBackground';
import styles from './page.module.css';

export default function LoginPage() {
    return (
        <div className={styles.container}>
            {/* Dynamic Background */}
            <HeroBackground />

            {/* Content Container - Ghost Panel Wrapper */}
            <div className={styles['glass-card']}>
                {/* Logo / Branding */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '-2px',
                        marginBottom: '0',
                        color: '#fff',
                        fontStyle: 'italic',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                    }}>
                        MOTO<span style={{ color: '#FFFF00' }}>CRAFT</span>
                    </h1>
                    <p style={{
                        fontSize: '0.8rem',
                        letterSpacing: '5px',
                        color: '#fff',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginTop: '-5px',
                        opacity: 0.9
                    }}>
                        BAĞLAN. SÜR. PAYLAŞ.
                    </p>
                </div>

                {/* Unified Login Form Component */}
                <LoginForm />
            </div>

            {/* Footer Legal/Info */}
            <div style={{ position: 'absolute', bottom: '20px', zIndex: 10, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                © 2026 MOTO-ASİSTAN | TÜM HAKLARI SAKLIDIR
            </div>
        </div>
    );
}
