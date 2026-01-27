'use client';

import { useActionState, useState } from 'react';
import { loginUser } from '../actions';
import Link from 'next/link';

const initialState = {
    message: '',
};

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginUser, initialState);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form action={formAction} className="w-full space-y-8">
            {/* Underlined Phone Input */}
            <div className="relative border-b border-white/30 focus-within:border-white transition-colors py-2">
                <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="05XXXXXXXXX"
                    className="w-full bg-transparent text-white text-xl font-bold tracking-widest outline-none placeholder:text-white/20 px-0"
                    required
                />
            </div>

            {/* Underlined Password Input with Eye Toggle */}
            <div className="relative border-b border-white/30 focus-within:border-white transition-colors py-2">
                <div className="flex items-center">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••••"
                        className="w-full bg-transparent text-white text-xl font-bold tracking-[0.5em] outline-none placeholder:text-white/20 px-0"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-white/40 hover:text-white transition-opacity ml-2"
                    >
                        <span className="text-xl">Q</span>
                    </button>
                </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center text-[11px] font-bold">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-4 h-4 bg-[#FFFF00] rounded-sm flex items-center justify-center text-black">
                        <input type="checkbox" name="remember" className="hidden" defaultChecked />
                        <span className="text-[10px]">✔</span>
                    </div>
                    <span className="text-white tracking-wide">Beni Hatırla</span>
                </label>
                <Link href="/forgot-password" size="sm" className="text-white/80 hover:text-white transition-colors tracking-wide">
                    Şifremi Unuttum?
                </Link>
            </div>

            {/* Skewed Buttons Section */}
            <div className="space-y-4 pt-4 relative z-50">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full relative group z-50 disabled:opacity-50"
                >
                    <div className="absolute inset-0 bg-[#FFFF00] transform -skew-x-12" />
                    <div className="absolute inset-[1px] bg-[#1a1a1a] transform -skew-x-12 transition-colors group-hover:bg-[#252525]" />
                    <span className="relative z-10 block py-4 text-white font-black italic text-lg uppercase tracking-widest">
                        {isPending ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
                    </span>
                </button>

                {/* Facebook Button */}
                <button
                    type="button"
                    onClick={() => { window.location.href = '/api/auth/signin/facebook'; }}
                    className="w-full relative group"
                >
                    <div className="absolute inset-0 bg-[#3b5998] transform -skew-x-12" />
                    <span className="relative z-10 block py-3 text-white font-black italic text-sm uppercase tracking-widest">FACEBOOK İLE BAĞLAN</span>
                </button>

                {/* Google Button */}
                <button
                    type="button"
                    onClick={() => { window.location.href = '/api/auth/signin/google'; }}
                    className="w-full relative group"
                >
                    <div className="absolute inset-0 bg-[#ea4335] transform -skew-x-12" />
                    <span className="relative z-10 block py-3 text-white font-black italic text-sm uppercase tracking-widest">GOOGLE İLE BAĞLAN</span>
                </button>
            </div>

            {state?.message && (
                <div className="mt-4 p-3 bg-red-600 text-white text-[10px] font-black text-center uppercase tracking-widest animate-pulse">
                    {state.message}
                </div>
            )}

            <div className="pt-6 text-center">
                <Link href="/register" className="text-[12px] font-black text-white hover:text-[#FFFF00] transition-colors uppercase tracking-[0.1em]">
                    HESABIN YOK MU? <span className="text-[#FFFF00] ml-1">KAYIT OL</span>
                </Link>
            </div>
        </form>
    );
}
