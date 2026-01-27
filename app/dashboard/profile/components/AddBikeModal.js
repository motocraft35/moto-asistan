'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/app/components/NotificationProvider';

export default function AddBikeModal({ onClose, onBikeAdded, initialData = null }) {
    const { showAlert } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        brand: initialData?.brand || '',
        model: initialData?.model || '',
        year: initialData?.year || new Date().getFullYear(),
        nickname: initialData?.nickname || '',
        kilometers: initialData?.kilometers || 0,
        accessories: initialData?.accessories || ''
    });

    const getInitialImages = (str) => {
        if (!str) return [];
        if (str.includes('|')) return str.split('|');
        if (str.startsWith('data:')) return [str];
        return str.split(',').filter(u => u.trim() !== '');
    };
    const [imageFiles, setImageFiles] = useState(getInitialImages(initialData?.imageUrls)); // Array of base64 strings

    useEffect(() => {
        fetch('/api/users/me').then(res => res.json()).then(data => setUser(data));
    }, []);

    const isPremium = user?.subscriptionStatus && user.subscriptionStatus !== 'Passive';
    const maxImages = isPremium ? 10 : 3;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const remainingSlot = maxImages - imageFiles.length;
        const filesToAdd = files.slice(0, remainingSlot);

        if (files.length > remainingSlot) {
            showAlert(`Sınır: En fazla ${maxImages} fotoğraf ekleyebilirsiniz.`);
        }

        const compressImage = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800; // Better quality for garage
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        };

        filesToAdd.forEach(async (file) => {
            if (file.size > 15 * 1024 * 1024) {
                showAlert(`${file.name} çok büyük (Maks 15MB)`);
                return;
            }
            const compressed = await compressImage(file);
            setImageFiles(prev => [...prev, compressed]);
        });
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const submissionData = {
            ...formData,
            imageUrls: imageFiles.join('|')
        };

        if (initialData?.id) {
            submissionData.id = initialData.id;
        }

        try {
            const res = await fetch('/api/bikes', {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });

            if (res.ok) {
                onBikeAdded();
                onClose();
            } else {
                const err = await res.json();
                showAlert('Hata: ' + (err.error || 'İşlem başarısız.'));
            }
        } catch (error) {
            console.error(error);
            showAlert('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', background: '#0a0a0f', border: '1px solid #1a1a2e', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--primary)', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-1px' }}>
                    GHOST GARAJ: {initialData ? 'ARAÇ GÜNCELLE' : 'ARAÇ EKLE'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="minimal-input-group">
                            <input name="brand" placeholder="Marka" required
                                className="minimal-input" value={formData.brand} onChange={handleChange}
                            />
                        </div>
                        <div className="minimal-input-group">
                            <input name="model" placeholder="Model" required
                                className="minimal-input" value={formData.model} onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="minimal-input-group">
                            <input name="year" type="number" placeholder="Yıl" required
                                className="minimal-input" value={formData.year} onChange={handleChange}
                            />
                        </div>
                        <div className="minimal-input-group">
                            <input name="kilometers" type="number" placeholder="Kilometre" required
                                className="minimal-input" value={formData.kilometers} onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="minimal-input-group">
                        <input name="nickname" placeholder="Motosiklet Takma Adı"
                            className="minimal-input" value={formData.nickname} onChange={handleChange}
                        />
                    </div>

                    <div className="minimal-input-group">
                        <textarea
                            name="accessories"
                            placeholder="Donanımlar & Aksesuarlar (Egzoz, Koruma Demiri vs.)"
                            className="minimal-input"
                            style={{ minHeight: '80px', paddingTop: '10px' }}
                            value={formData.accessories}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Real Image Upload Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">FOTOĞRAFLAR ({imageFiles.length}/{maxImages})</label>
                            {imageFiles.length < maxImages && (
                                <>
                                    <label
                                        htmlFor="bike-photo-upload"
                                        style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '900', cursor: 'pointer', background: 'rgba(34,211,238,0.1)', padding: '5px 10px', borderRadius: '6px' }}
                                    >
                                        + FOTOĞRAF SEÇ
                                    </label>
                                    <input
                                        id="bike-photo-upload"
                                        type="file"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </>
                            )}
                        </div>

                        {/* Previews */}
                        <div className="grid grid-cols-3 gap-2">
                            {imageFiles.map((src, index) => (
                                <div key={index} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <img src={src} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', width: '20px', height: '20px', borderRadius: '50%', color: '#fff', fontSize: '12px', border: 'none' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                        <button type="button" onClick={onClose} className="btn-outline flex-1" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                            KAPAT
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading ? 'İSLEM SÜRÜYOR...' : (initialData ? 'GÜNCELLE' : 'GARAJA EKLE')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
