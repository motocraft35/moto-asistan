'use client';
import { useState, useEffect } from 'react';

export default function WeatherBar() {
    const [weather, setWeather] = useState({
        temp: '--',
        condition: 'YÜKLENİYOR...',
        icon: '/weather/sunny.png',
        alert: 'BÖLGE TARANIYOR...',
        alertColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
        sector: 'TARANIYOR...'
    });

    useEffect(() => {
        const fetchWeather = async (lat = 39.06, lon = 26.89, city = 'DİKİLİ') => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&windspeed_unit=ms`);
                const data = await res.json();

                if (data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    const windSpeed = data.current_weather.windspeed;

                    const conditionMap = {
                        0: { label: 'Açık Gökyüzü', icon: '/weather/sunny.png' },
                        1: { label: 'Açık', icon: '/weather/sunny.png' },
                        2: { label: 'Parçalı Bulutlu', icon: '/weather/cloudy.png' },
                        3: { label: 'Bulutlu', icon: '/weather/cloudy.png' },
                        45: { label: 'Sisli', icon: '/weather/cloudy.png' },
                        48: { label: 'Sisli', icon: '/weather/cloudy.png' },
                        51: { label: 'Hafif Çisenti', icon: '/weather/rainy.png' },
                        61: { label: 'Hafif Yağmur', icon: '/weather/rainy.png' },
                        71: { label: 'Hafif Kar', icon: '/weather/snowy.png' },
                        95: { label: 'Fırtına', icon: '/weather/rainy.png' }
                    };

                    const condition = conditionMap[code] || { label: 'Aktif', icon: '/weather/sunny.png' };

                    // Dynamic Alert Logic
                    let alert = 'SÜRÜŞE UYGUN';
                    let alertColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';

                    if (temp <= 3) {
                        alert = '⚠️ GİZLİ BUZLANMA RİSKİ';
                        alertColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse';
                    } else if ([51, 61, 95].includes(code)) {
                        alert = '🌧️ ISLAK ZEMİN DİKKAT';
                        alertColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                    } else if (windSpeed > 10) {
                        alert = '🌬️ YÜKSEK RÜZGAR UYARISI';
                        alertColor = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
                    } else if (temp > 35) {
                        alert = '🔥 AŞIRI SICAK DİKKAT';
                        alertColor = 'text-orange-600 bg-orange-600/10 border-orange-600/20';
                    }

                    setWeather({ temp, ...condition, alert, alertColor, sector: city });
                }
            } catch (error) {
                console.error("Hava durumu çekilemedi:", error);
                setWeather(prev => ({ ...prev, temp: '!', condition: 'BAĞLANTI HATASI' }));
            }
        };

        const initWeather = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;

                    // Simple Reverse Geocoding via Nominatim (Free)
                    let cityName = 'BİLİNMİYOR';
                    try {
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
                        const geoData = await geoRes.json();
                        cityName = (geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.province || 'BÖLGE').toUpperCase();
                    } catch (e) {
                        console.warn("Reverse Geocoding failed:", e);
                    }

                    fetchWeather(latitude, longitude, cityName);
                }, (err) => {
                    console.warn("GPS Access denied for weather, using default (Dikili)", err);
                    fetchWeather(); // Fallback to Dikili
                });
            } else {
                fetchWeather(); // Fallback to Dikili
            }
        };

        initWeather();
        const interval = setInterval(initWeather, 600000); // Update every 10 mins
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-card p-2 md:p-4 flex items-center justify-between mb-2 md:mb-4 group relative overflow-hidden border-white/10 bg-[#0a0a14]/60 shadow-2xl">

            <div className="flex items-center gap-2 md:gap-4 relative z-10">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl glass-card border-none flex items-center justify-center overflow-hidden animate-float">
                    <img src={weather.icon} alt={weather.condition} className="w-full h-full object-cover" />
                </div>
                <div>
                    <div className={`hud-tag mb-0.5 px-1 py-0.5 rounded md:rounded-md border text-[6px] md:text-[8px] font-black ${weather.alertColor}`}>
                        {weather.alert}
                    </div>
                    <p className="text-xs md:text-lg font-black text-white italic tracking-tighter uppercase leading-none truncate ml-0.5">
                        {weather.condition}
                    </p>
                </div>
            </div>

            <div className="text-right relative z-10 pl-2">
                <div className="text-lg md:text-2xl font-black text-white italic mb-0.5 drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                    {weather.temp}<span className="text-cyan-400">°C</span>
                </div>
                <div className="hud-tag justify-end text-zinc-500 text-[5px] md:text-[7px] border-none p-0 uppercase">SEKTÖR: {weather.sector}</div>
            </div>
        </div>
    );
}
