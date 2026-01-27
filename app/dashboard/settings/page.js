'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function SettingsPage() {
    const { showAlert } = useNotifications();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [bio, setBio] = useState('');

    useEffect(() => {
        // Fetch current bio
        fetch('/api/users/me').then(res => res.json()).then(data => {
            if (data.bio) setBio(data.bio);
        }).catch(err => console.log(err));
    }, []);

    const saveBio = async () => {
        setUploading(true);
        try {
            const res = await fetch('/api/users/profile/image', { // Using same endpoint as generic update
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio })
            });
            if (res.ok) {
                showAlert('Bio güncellendi!');
                router.back();
            }
        } catch (e) {
            showAlert('Hata oluştu');
        } finally {
            setUploading(false);
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            showAlert("Resim çok büyük (Maks 15MB). Lütfen daha küçük bir dosya seçin.");
            return;
        }

        setUploading(true);

        try {
            // Compress/Resize Image Client Side
            const compressedBase64 = await resizeImage(file);

            const res = await fetch('/api/users/profile/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: compressedBase64 })
            });

            if (res.ok) {
                showAlert('Profil fotoğrafı güncellendi! ✅');
                router.back(); // Go back to profile after update
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error(error);
            showAlert('Yükleme başarısız. Lütfen tekrar deneyin.');
        } finally {
            setUploading(false);
        }
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 150;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // High compression
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    return (
        <div style={{ padding: '0', maxWidth: '100%', margin: '0', minHeight: '100dvh', backgroundColor: '#000', color: '#fff' }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '15px 20px',
                paddingTop: 'calc(15px + env(safe-area-inset-top))',
                borderBottom: '1px solid #222',
                background: '#111',
            }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
                    ⬅
                </button>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Profil Düzenle</h1>
            </div>

            <div style={{ padding: '20px' }}>
                <div style={{ background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #222' }}>

                    {/* Image Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '30px' }}>
                        <h3 style={{ margin: 0, color: '#888', fontSize: '1rem' }}>Profil Fotoğrafı</h3>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: '#222',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                border: '2px solid #333',
                                position: 'relative'
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>📷</span>
                            {uploading && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                    ...
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                width: '100%',
                                background: '#333',
                                color: '#fff',
                                border: '1px solid #444',
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                opacity: uploading ? 0.7 : 1
                            }}
                        >
                            {uploading ? 'Yükleniyor...' : 'Fotoğrafı Değiştir'}
                        </button>
                    </div>

                    {/* Bio Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h3 style={{ margin: 0, color: '#888', fontSize: '1rem' }}>Hakkımda (Bio)</h3>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Motorun, senin, hayatın..."
                            rows={4}
                            maxLength={150}
                            style={{
                                width: '100%',
                                padding: '15px',
                                borderRadius: '10px',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                color: '#fff',
                                resize: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#666' }}>{bio.length}/150</div>
                        <button
                            onClick={saveBio}
                            disabled={uploading}
                            className="btn-primary" // Use global class
                            style={{
                                width: '100%',
                                background: 'var(--primary)',
                                color: '#000',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                opacity: uploading ? 0.7 : 1
                            }}
                        >
                            {uploading ? 'Kaydediliyor...' : 'Bio Kaydet'}
                        </button>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>
            </div>
        </div>
    );
}
