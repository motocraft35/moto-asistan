'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Geolocation } from '@capacitor/geolocation';
import { useNotifications } from '@/app/components/NotificationProvider';
import { speak } from '@/app/components/VoiceNotification';
import MapSearch from './MapSearch';

const API_BASE_URL = '';
const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// Optimized MapController
function MapController({ onMapReady, onBoundsChange, userLocation, isLockMode }) {
    const map = useMap();
    const lastLocation = useRef(null);
    const streetZoom = 18; // Street level zoom

    useEffect(() => {
        if (map && userLocation) {
            if (!lastLocation.current) {
                map.setView(userLocation, 14);
                lastLocation.current = userLocation;
            } else if (isLockMode) {
                const dist = Math.sqrt(
                    Math.pow(userLocation[0] - lastLocation.current[0], 2) +
                    Math.pow(userLocation[1] - lastLocation.current[1], 2)
                );
                // Pan and zoom in if lock mode is active
                if (dist > 0.0001 || map.getZoom() < streetZoom) {
                    map.setView(userLocation, streetZoom, { animate: true, duration: 1.0 });
                    lastLocation.current = userLocation;
                }
            }
        }
    }, [map, userLocation, isLockMode]);

    useEffect(() => {
        if (map) {
            onMapReady(map);
            const handleMove = () => {
                const bounds = map.getBounds();
                onBoundsChange({
                    south: bounds.getSouth(),
                    west: bounds.getWest(),
                    north: bounds.getNorth(),
                    east: bounds.getEast()
                });
            };
            map.on('moveend', handleMove);
            handleMove();
            setTimeout(() => { map.invalidateSize(); }, 500);
            return () => { map.off('moveend', handleMove); };
        }
    }, [map, onMapReady, onBoundsChange]);
    return null;
}

// Map Click Handler Component
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

const createDivIcon = (html, size, anchor) => L.divIcon({
    className: 'custom-div-icon',
    html,
    iconSize: size,
    iconAnchor: anchor
});

export default function MapClient() {
    const { showAlert } = useNotifications();
    const [locations, setLocations] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapInstance, setMapInstance] = useState(null);
    const [sosSignals, setSosSignals] = useState([]);
    const [party, setParty] = useState(null);
    const [activeRoute, setActiveRoute] = useState(null);
    const [navigationSteps, setNavigationSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [routeStats, setRouteStats] = useState(null);
    const [lastAnnouncedStep, setLastAnnouncedStep] = useState(-1);
    const [activeFilters, setActiveFilters] = useState(['fuel', 'mechanic', 'cafe', 'meetup']);
    const [isLockMode, setIsLockMode] = useState(false);
    const [isRotationMode, setIsRotationMode] = useState(false);
    const [userHeading, setUserHeading] = useState(0);
    const [searchedLocation, setSearchedLocation] = useState(null);
    const rerouteThreshold = 50;

    const categories = useMemo(() => [
        { id: 'fuel', label: 'AKARYAKIT', icon: '⛽' },
        { id: 'mechanic', label: 'ATÖLYE', icon: '🔧' },
        { id: 'cafe', label: 'KAFE/BAR', icon: '☕' },
        { id: 'meetup', label: 'BULUŞMA', icon: '📍' }
    ], []);

    // Icons
    const userMarkerIcon = useMemo(() => createDivIcon(`
        <div class="relative w-12 h-12 flex items-center justify-center transition-transform duration-500" style="transform: rotate(${isRotationMode ? 0 : userHeading}deg)">
            <div class="absolute inset-0 bg-magenta-500/20 rounded-full animate-ping"></div>
            <div class="w-1 h-6 bg-magenta-400 absolute bottom-1/2 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_10px_magenta]"></div>
            <div class="w-4 h-4 bg-white rounded-full border-2 border-magenta-500 shadow-[0_0_15px_magenta] z-10"></div>
        </div>
    `, [48, 48], [24, 24]), [userHeading, isRotationMode]);

    const searchMarkerIcon = useMemo(() => createDivIcon(`
        <div class="relative w-10 h-10 flex items-center justify-center transition-transform duration-500" style="transform: rotate(${isRotationMode ? userHeading : 0}deg)">
            <div class="w-4 h-4 bg-pink-500 rounded-full border-2 border-white shadow-[0_0_15px_pink] z-10"></div>
        </div>
    `, [40, 40], [20, 20]), [userHeading, isRotationMode]);

    const partyMarkerIcon = useMemo(() => createDivIcon(`
        <div class="w-3 h-3 bg-amber-500 rounded-full border border-white shadow-[0_0_8px_amber] transition-transform duration-500" style="transform: rotate(${isRotationMode ? userHeading : 0}deg)"></div>
    `, [32, 32], [16, 16]), [userHeading, isRotationMode]);

    const sosMarkerIcon = useMemo(() => createDivIcon(`
        <div class="w-10 h-10 bg-red-600 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-lg text-lg transition-transform duration-500" style="transform: rotate(${isRotationMode ? userHeading : 0}deg)">🆘</div>
    `, [40, 40], [20, 20]), [userHeading, isRotationMode]);

    const iconMarkers = useMemo(() => ({
        fuel: createDivIcon(`<div class="w-10 h-10 flex items-center justify-center bg-zinc-900/80 rounded-xl border border-white/10 shadow-2xl transition-transform duration-500" style="transform: rotate(${isRotationMode ? userHeading : 0}deg)">⛽</div>`, [40, 40], [20, 20]),
        mechanic: createDivIcon(`<div class="w-10 h-10 flex items-center justify-center bg-zinc-900/80 rounded-xl border border-white/10 shadow-2xl transition-transform duration-500" style="transform: rotate(${isRotationMode ? userHeading : 0}deg)">🔧</div>`, [40, 40], [20, 20]),
        cafe: createDivIcon(`<div class="w-10 h-10 flex items-center justify-center bg-zinc-900/80 rounded-xl border border-white/10 shadow-2xl transition-transform duration-500" style="transform: rotate(${isRotationMode ? userHeading : 0}deg)">☕</div>`, [40, 40], [20, 20]),
        meetup: createDivIcon(`<div class="w-10 h-10 flex items-center justify-center bg-zinc-900/80 rounded-xl border border-white/10 shadow-2xl transition-transform duration-500" style="transform: rotate(${isRotationMode ? userHeading : 0}deg)">📍</div>`, [40, 40], [20, 20]),
    }), [userHeading, isRotationMode]);

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
    };

    const getDistanceToRoute = (point, polyline) => {
        if (!polyline || polyline.length < 2) return 0;
        let minDistance = Infinity;
        for (let i = 0; i < polyline.length; i++) {
            const dist = getDistance(point[0], point[1], polyline[i][0], polyline[i][1]);
            if (dist < minDistance) minDistance = dist;
            if (minDistance < 5) break;
        }
        return minDistance;
    };

    const userLocRef = useRef(null);
    const activeRouteRef = useRef(null);
    const targetLocRef = useRef(null);

    const fetchNeuralPath = async (targetLat, targetLng, silent = false) => {
        const currentLoc = userLocRef.current;
        if (!currentLoc) {
            console.error("Navigation Error: currentLoc is null");
            return showAlert("⚠️ KONUMUNUZ BEKLENİYOR...");
        }

        console.log(`Routing from: ${currentLoc[1]},${currentLoc[0]} to: ${targetLng},${targetLat}`);

        try {
            // Priority: Robust URL
            const url = `https://router.project-osrm.org/route/v1/driving/${currentLoc[1]},${currentLoc[0]};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`;
            const res = await fetch(url);

            // Check if response is JSON (position 97 error usually means it returned HTML)
            if (!res.ok) {
                throw new Error(`OSRM API Status: ${res.status}`);
            }

            const data = await res.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

                setActiveRoute(coords);
                activeRouteRef.current = coords;
                setNavigationSteps(route.legs[0].steps.map(s => ({
                    instruction: s.maneuver.instruction,
                    modifier: s.maneuver.modifier,
                    distance: s.distance,
                    location: [s.maneuver.location[1], s.maneuver.location[0]]
                })));
                setCurrentStepIndex(0);
                setLastAnnouncedStep(-1);
                targetLocRef.current = { lat: targetLat, lng: targetLng };
                setRouteStats({ distance: (route.distance / 1000).toFixed(1), duration: Math.round(route.duration / 60) });

                if (!silent) {
                    setIsLockMode(true);
                    if (mapInstance) mapInstance.setView(currentLoc, 18, { animate: true });
                    showAlert("📡 ROTA OLUŞTURULDU.");
                    try { speak(route.legs[0].steps[0].maneuver.instruction); } catch (e) { }
                }
            } else {
                console.warn("OSRM Route Error:", data.code);
                showAlert(`❌ ROTA HATASI: ${data.message || 'Yol bulunamadı'}`);
            }
        } catch (e) {
            console.error("Routing Fetch Error, attempting fallback:", e);
            try {
                // Secondary Fallback: Simple URL without extra parameters
                const simpleUrl = `https://router.project-osrm.org/route/v1/driving/${currentLoc[1]},${currentLoc[0]};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`;
                const resFallback = await fetch(simpleUrl);
                if (resFallback.ok) {
                    const dataFallback = await resFallback.json();
                    if (dataFallback.routes && dataFallback.routes[0]) {
                        const route = dataFallback.routes[0];
                        setActiveRoute(route.geometry.coordinates.map(c => [c[1], c[0]]));
                        showAlert("📡 ROTA OLUŞTURULDU (Yedek Hat).");
                        return;
                    }
                }
            } catch (fallbackErr) {
                console.error("Full navigation failure:", fallbackErr);
            }
            showAlert("❌ NAVİGASYON BAĞLANTI HATASI.");
        }
    };

    const fetchLocs = useCallback(async (bounds = null) => {
        try {
            let url = '/api/map/locations';
            if (bounds) url += `?south=${bounds.south}&west=${bounds.west}&north=${bounds.north}&east=${bounds.east}`;
            const res = await fetch(url);
            const data = await res.json();
            setLocations(data || []);
        } catch (err) { } finally { setLoading(false); }
    }, []);

    const fetchSOS = useCallback(async () => {
        try {
            const res = await fetch('/api/ai/sos');
            const data = await res.json();
            setSosSignals(data.signals || []);
        } catch (err) { }
    }, []);

    const fetchParty = useCallback(async () => {
        try {
            const res = await fetch('/api/parties');
            const data = await res.json();
            setParty(data.party);
        } catch (err) { }
    }, []);

    const navStateRef = useRef({ navigationSteps: [], currentStepIndex: 0, lastAnnouncedStep: -1 });
    useEffect(() => {
        navStateRef.current = { navigationSteps, currentStepIndex, lastAnnouncedStep };
    }, [navigationSteps, currentStepIndex, lastAnnouncedStep]);

    const [distanceToNext, setDistanceToNext] = useState(0);

    useEffect(() => {
        fetchSOS(); fetchParty();
        let watchId = null;
        const startWatching = async () => {
            watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos) => {
                if (!pos) return;
                const c = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(c);
                userLocRef.current = c;
                if (pos.coords.heading !== null && pos.coords.heading !== undefined) {
                    setUserHeading(pos.coords.heading);
                }

                const { navigationSteps: steps, currentStepIndex: idx, lastAnnouncedStep: announced } = navStateRef.current;
                if (steps.length > 0 && idx < steps.length) {
                    // Check for rerouting
                    if (activeRouteRef.current && getDistanceToRoute(c, activeRouteRef.current) > rerouteThreshold) {
                        if (targetLocRef.current) {
                            showAlert("🔄 ROTA YENİLENİYOR...");
                            fetchNeuralPath(targetLocRef.current.lat, targetLocRef.current.lng, true);
                        }
                    }

                    // Update distance to next turn
                    const distToTurn = getDistance(c[0], c[1], steps[idx].location[0], steps[idx].location[1]);
                    setDistanceToNext(distToTurn);

                    if (distToTurn < 30) {
                        const next = idx + 1;
                        if (next < steps.length) {
                            setCurrentStepIndex(next);
                            if (announced < next) {
                                try {
                                    speak(steps[next].instruction);
                                    setLastAnnouncedStep(next);
                                } catch (e) { }
                            }
                        } else {
                            showAlert("🏁 HEDEFE VARILDI.");
                            speak("Hedefe vardınız.");
                            setActiveRoute(null); activeRouteRef.current = null; setNavigationSteps([]);
                        }
                    }
                }
            });
        };
        startWatching();
        const intv = setInterval(() => { fetchSOS(); fetchParty(); fetchLocs(); }, 30000);
        return () => { if (watchId) Geolocation.clearWatch({ id: watchId }); clearInterval(intv); };
    }, []);

    const filteredLocations = useMemo(() => locations.filter(l => activeFilters.includes(l.type)), [locations, activeFilters]);

    return (
        <div className="relative h-full w-full bg-black overflow-hidden text-white pb-20">
            <MapSearch onLocationSelect={(loc) => { setSearchedLocation(loc); mapInstance?.flyTo([loc.lat, loc.lng], 17); }} />

            <div className={`relative h-[calc(100%-80px)] w-full transition-transform duration-700 ease-out ${isRotationMode ? 'origin-center' : ''}`} style={isRotationMode ? { transform: `rotate(${-userHeading}deg)` } : {}}>
                <MapContainer center={[39.07, 26.88]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} preferCanvas={true}>
                    <TileLayer url={darkTiles} />
                    <MapController onMapReady={setMapInstance} onBoundsChange={fetchLocs} userLocation={userLocation} isLockMode={isLockMode} />
                    <MapClickHandler onMapClick={(latlng) => {
                        setSearchedLocation({ lat: latlng.lat, lng: latlng.lng, name: 'İŞARETLENEN NOKTA' });
                    }} />

                    {activeRoute && <Polyline positions={activeRoute} pathOptions={{ color: '#ff00ff', weight: 6, lineCap: 'round' }} />}

                    {userLocation && <Marker position={userLocation} icon={userMarkerIcon} />}

                    {searchedLocation && (
                        <Marker position={[searchedLocation.lat, searchedLocation.lng]} icon={searchMarkerIcon}>
                            <Popup>
                                <div className="p-3 text-white text-center min-w-[140px] bg-[#0a0a14]/90 backdrop-blur-xl border border-magenta-500/30 rounded-xl shadow-2xl" style={{ transform: isRotationMode ? `rotate(${userHeading}deg)` : 'none' }}>
                                    <div className="text-[10px] text-magenta-400 font-bold mb-1 tracking-widest uppercase">İŞARETLENEN NOKTA</div>
                                    <div className="font-black italic mb-3 uppercase text-sm leading-tight">{searchedLocation.name}</div>
                                    <button onClick={() => fetchNeuralPath(searchedLocation.lat, searchedLocation.lng)} className="w-full py-2 bg-magenta-600 hover:bg-magenta-500 text-white font-black rounded-lg text-[10px] tracking-wider uppercase transition-all active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.3)]">ROTA OLUŞTUR</button>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {party?.members?.map(m => m.latitude && <Marker key={m.id} position={[m.latitude, m.longitude]} icon={partyMarkerIcon} />)}
                    {sosSignals.map(s => s.latitude && <Marker key={s.id} position={[s.latitude, s.longitude]} icon={sosMarkerIcon} />)}
                    {filteredLocations.map(l => l.latitude && (
                        <Marker key={l.id} position={[l.latitude, l.longitude]} icon={iconMarkers[l.type]}>
                            <Popup>
                                <div className="p-4 text-white text-center min-w-[170px] bg-[#0a0a14]/95 backdrop-blur-2xl border border-magenta-500/40 rounded-xl shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-magenta-500/10 -rotate-45 translate-x-4 -translate-y-4 border-b border-magenta-500/30"></div>
                                    <div className="text-[10px] font-black text-magenta-400 uppercase tracking-[0.2em] mb-2 border-b border-magenta-500/20 pb-1">HEDEF_VERİSİ</div>
                                    <div className="font-black italic mb-4 uppercase text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{l.name}</div>
                                    <button onClick={() => fetchNeuralPath(l.latitude, l.longitude)}
                                        className="w-full py-2 bg-magenta-600 hover:bg-magenta-500 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-white/5">
                                        ROTA OLUŞTUR
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {navigationSteps.length > 0 && navigationSteps[currentStepIndex] && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-[400px]">
                    <div className="bg-black/90 backdrop-blur-xl border border-magenta-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                        <div className="w-16 h-16 bg-magenta-500 rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                            {navigationSteps[currentStepIndex].modifier?.includes('left') ? '⬅️' : navigationSteps[currentStepIndex].modifier?.includes('right') ? '➡️' : '⬆️'}
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] text-magenta-400 font-bold uppercase tracking-widest">NAVİGASYON</div>
                            <div className="text-lg font-black italic uppercase leading-none">{navigationSteps[currentStepIndex].instruction}</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm text-emerald-400 font-bold">{routeStats?.duration} dk | {routeStats?.distance} km</span>
                                <span className="text-[10px] text-zinc-400 font-black italic">Dönüşe: {distanceToNext > 1000 ? (distanceToNext / 1000).toFixed(1) + ' km' : Math.round(distanceToNext) + ' m'}</span>
                            </div>
                        </div>
                        <button onClick={() => { setActiveRoute(null); setNavigationSteps([]); }} className="p-2 text-red-500 font-bold bg-red-500/10 rounded-lg">X</button>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 w-full h-20 bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/10 z-[2000] px-4 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-magenta-500/50 to-transparent" />

                <Link href="/dashboard" className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-magenta-500/20 transition-all">
                        <span className="text-lg">🏠</span>
                    </div>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-magenta-400 transition-colors">Ana Ekran</span>
                </Link>

                <button onClick={() => document.getElementById('map-search-input')?.focus()} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-magenta-500/20 transition-all">
                        <span className="text-lg">🔍</span>
                    </div>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-magenta-400 transition-colors">Arama</span>
                </button>

                <button
                    onClick={() => setIsLockMode(!isLockMode)}
                    className={`flex flex-col items-center gap-1 group ${isLockMode ? 'text-magenta-400' : 'text-zinc-500'}`}
                >
                    <div className={`w-12 h-12 -mt-6 rounded-2xl flex items-center justify-center transition-all shadow-2xl border-2 ${isLockMode ? 'bg-magenta-500 border-white text-black scale-110 shadow-magenta-500/40' : 'bg-black/80 border-magenta-500/20 text-magenta-500 hover:border-magenta-500'}`}>
                        <span className="text-xl">📍</span>
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-widest ${isLockMode ? 'text-magenta-400' : 'text-zinc-500'}`}>Takip Modu</span>
                </button>

                <Link href="/dashboard/master" className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-magenta-500/20 transition-all">
                        <svg className="w-5 h-5 text-magenta-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a10 10 0 1 0 10 10" />
                            <path d="M12 22a10 10 0 1 0-10-10" />
                            <path d="M12 8a4 4 0 1 0 0 8" />
                            <circle cx="12" cy="12" r="1" />
                        </svg>
                    </div>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-magenta-400 transition-colors">Master Panel</span>
                </Link>
            </div>

            <div className="absolute left-4 top-32 z-[1000] flex flex-col gap-1">
                <button
                    onClick={() => {
                        setIsRotationMode(!isRotationMode);
                        if (!isRotationMode) setIsLockMode(true);
                    }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border-2 ${isRotationMode ? 'bg-magenta-500 border-white text-black shadow-[0_0_15px_magenta]' : 'bg-black/60 border-magenta-500/30 text-magenta-500'}`}
                    title="Yönü Yukarı Al"
                >
                    <span className="text-xl" style={{ transform: isRotationMode ? 'none' : `rotate(${-userHeading}deg)` }}>🧭</span>
                </button>

                <div className="glass-card p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg flex flex-col gap-1 mt-2">
                    {categories.map(c => (
                        <button key={c.id} onClick={() => setActiveFilters(prev => prev.includes(c.id) ? prev.filter(f => f !== c.id) : [...prev, c.id])} className={`px-3 py-2 rounded-lg text-[9px] font-black italic border transition-all ${activeFilters.includes(c.id) ? 'bg-magenta-500/20 border-magenta-500 text-magenta-400' : 'bg-zinc-900 opacity-50 border-white/5 text-zinc-500'}`}>
                            {c.icon} {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .leaflet-popup-content-wrapper { 
                    background: rgba(10, 10, 20, 0.95) !important; 
                    color: white !important; 
                    border: 1px solid rgba(255, 0, 255, 0.4) !important;
                    border-radius: 12px !important; 
                    padding: 0 !important; 
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important;
                    backdrop-filter: blur(16px) !important;
                    overflow: hidden;
                }
                .leaflet-popup-content { margin: 0 !important; width: auto !important; }
                .leaflet-popup-tip { background: rgba(255, 0, 255, 0.4) !important; }
                .leaflet-popup-close-button { 
                    color: white !important; 
                    padding: 8px !important; 
                    font-size: 18px !important;
                    line-height: 1 !important;
                }
            `}</style>
        </div>
    );
}
