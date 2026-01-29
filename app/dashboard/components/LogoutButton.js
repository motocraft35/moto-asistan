'use client';

import { logoutUser } from '../../actions';

export default function LogoutButton() {
    const handleLogout = async () => {
        // Clear localStorage before logout
        localStorage.removeItem('moto_user');
        localStorage.removeItem('moto_party');
        console.log('[Logout] localStorage cleared');

        // Call server action
        await logoutUser();
    };

    return (
        <button
            onClick={handleLogout}
            type="button"
            className="w-full py-3 bg-red-600/5 border border-red-500/20 text-red-500 rounded-xl text-[8px] font-black uppercase italic tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all overflow-hidden relative group/logout"
        >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/logout:translate-y-0 transition-transform" />
            <span className="relative z-10">OTURUMU SONLANDIR</span>
        </button>
    );
}
