
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLAN_FLAGS } from '../../../../lib/ClanFlags';

export default function CreateClanPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', description: '', city: '', logoUrl: '', flagId: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/clans/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/dashboard/clans/${data.clanId}`);
            } else {
                setError(data.error || 'Bir hata oluştu.');
            }
        } catch (err) {
            setError('Bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
            <h1 className="text-3xl font-bold text-white mb-8">🛡️ Yeni Klan Kur</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                {error && <div className="p-3 bg-red-900/30 text-red-400 rounded-lg text-sm">{error}</div>}

                <div>
                    <label className="block text-sm text-gray-400 mb-2">Klan İsmi</label>
                    <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={30}
                        className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">Açıklama (Slogan)</label>
                    <textarea
                        className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none h-24"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Şehir (Opsiyonel)</label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                            value={form.city}
                            onChange={e => setForm({ ...form, city: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Logo URL (Opsiyonel)</label>
                        <input
                            type="text"
                            placeholder="https://..."
                            className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                            value={form.logoUrl}
                            onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-4">Klan Sancağı (Bayrak Seçimi)</label>
                    <div className="grid grid-cols-5 gap-3">
                        {CLAN_FLAGS.map((flag) => (
                            <button
                                key={flag.id}
                                type="button"
                                onClick={() => setForm({ ...form, flagId: flag.id })}
                                className={`aspect-square rounded-lg border-2 transition-all p-1 ${form.flagId === flag.id ? 'border-amber-500 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-zinc-800 hover:border-zinc-600'}`}
                            >
                                <div
                                    className="w-full h-full rounded-md shadow-inner"
                                    style={{ background: flag.pattern }}
                                    title={flag.name}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-3 uppercase font-black tracking-widest text-center">
                        Seçilen: <span className="text-amber-500">{CLAN_FLAGS.find(f => f.id === form.flagId)?.name}</span>
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-900/20 transition-all disabled:opacity-50"
                >
                    {loading ? 'Oluşturuluyor...' : 'Klanı Kur (Lider Ol)'}
                </button>
            </form>
        </div>
    );
}
