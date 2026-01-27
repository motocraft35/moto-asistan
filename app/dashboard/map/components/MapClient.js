'use client';

import Map, { Marker, Popup, Source, Layer, useControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Geolocation } from '@capacitor/geolocation';
import { useNotifications } from '@/app/components/NotificationProvider';
import { speak } from '@/app/components/VoiceNotification';
import MapSearch from './MapSearch';

// Cyberpunk Map Style (Dark Matter is good base, but we will enhance it with overlay)
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapClient() {
    const router = useRouter();
    const pathname = usePathname();
    const { showAlert } = useNotifications();
    const [locations, setLocations] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('ghost_map_locations');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);
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
    const [user, setUser] = useState(null);
    const [searchedLocation, setSearchedLocation] = useState(null);
    const rerouteThreshold = 50;
    const [viewState, setViewState] = useState({
        longitude: 26.88,
        latitude: 39.07,
        zoom: 13,
        pitch: 0,
        bearing: 0
    });
    const [mapReady, setMapReady] = useState(false);
    const [isRedAlert, setIsRedAlert] = useState(false);
    const [isDeviated, setIsDeviated] = useState(false);
    const [isDrivingMode, setIsDrivingMode] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // REFS FOR LISTENERS (To avoid closure issues)
    const isRotationModeRef = useRef(false);
    const isDrivingModeRef = useRef(false);
    const isLockModeRef = useRef(false);

    useEffect(() => {
        isRotationModeRef.current = isRotationMode;
        isDrivingModeRef.current = isDrivingMode;
        isLockModeRef.current = isLockMode;
    }, [isRotationMode, isDrivingMode, isLockMode]);

    // SERVICE WORKER REGISTRATION (TILE CACHING)
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/map-sw.js').then(reg => {
                    console.log('--- NEURAL SW: MAP CACHE ACTIVE ---', reg.scope);
                }).catch(err => {
                    console.log('--- NEURAL SW: MAP CACHE FAILED ---', err);
                });
            });
        }
    }, []);

    const locationsSource = useMemo(() => ({
        type: 'FeatureCollection',
        features: (Array.isArray(locations) ? locations : [])
            .filter(l => activeFilters.includes(l.type))
            .map(l => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [l.longitude, l.latitude] },
                properties: { id: l.id, name: l.name, type: l.type, logo_url: l.logo_url }
            }))
    }), [locations, activeFilters]);

    const categories = useMemo(() => [
        { id: 'fuel', label: 'AKARYAKIT', icon: '⛽' },
        { id: 'mechanic', label: 'ATÖLYE', icon: '🔧' },
        { id: 'cafe', label: 'KAFE/BAR', icon: '☕' },
        { id: 'beer', label: 'BAR/PUB', icon: '🍺' },
        { id: 'meetup', label: 'BULUŞMA', icon: '📍' }
    ], []);

    const getCategoryIcon = (type, name = '') => {
        const lowerName = name.toLowerCase();
        if (type === 'cafe') {
            if (lowerName.includes('bar') || lowerName.includes('pub') || lowerName.includes('beer') || lowerName.includes('taphouse')) {
                return '/assets/beer_icon.png';
            }
            return '/assets/coffee_icon.png';
        }
        if (type === 'beer') return '/assets/beer_icon.png';
        if (type === 'mechanic') return '/assets/wrench_icon.png';
        if (type === 'fuel') return '/assets/fuel_icon.png';
        return null;
    };

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
            if (res.ok) {
                const data = await res.json();
                console.log("📡 NEULA_SYNC // FETCH:", data);
                if (data.party) {
                    setParty(data.party);

                    // MISSION SYNC: If leader cleared destination, member also clears
                    const isLeader = String(user?.id) === String(data.party.leaderId);
                    if (!isLeader && !data.party.destLatitude && activeRouteRef.current) {
                        console.log("🏁 MISSION ABORTED BY LEADER");
                        showAlert("🏁 GÖREV LİDER TARAFINDAN İPTAL EDİLDİ");
                        setActiveRoute(null);
                        activeRouteRef.current = null;
                        setNavigationSteps([]);
                    }

                    // RED ALERT DETECTION
                    if (data.party.destName) {
                        const dangerKeywords = ['KAZA', 'DİKKAT', 'BUZ', 'TEHLİKE', 'ALERT', 'WARNING'];
                        const text = data.party.destName.toUpperCase();
                        setIsRedAlert(dangerKeywords.some(k => text.includes(k)));
                    } else {
                        setIsRedAlert(false);
                    }
                } else {
                    setParty(null);
                    setIsRedAlert(false);
                }
            }
        } catch (err) { }
    }, [user, activeRoute]);

    // ... (Keep existing fetchSOS, fetchParty, fetchLocs, getDistance, navigation logic) ...
    // Re-implementing critical parts for clarity
    const fetchLocs = useCallback(async () => {
        if (!mapRef.current) return;
        const bounds = mapRef.current.getBounds();
        try {
            let url = `/api/map/locations?south=${bounds.getSouth()}&west=${bounds.getWest()}&north=${bounds.getNorth()}&east=${bounds.getEast()}`;
            const res = await fetch(url);
            const data = await res.json();
            const locs = Array.isArray(data) ? data : [];
            setLocations(locs);
            if (locs.length > 0) {
                localStorage.setItem('ghost_map_locations', JSON.stringify(locs.slice(0, 100))); // En yakın 100'ü önbellekle
            }
        } catch (err) { } finally { setLoading(false); }
    }, []);

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
            const dist = getDistance(point[0], point[1], polyline[i][1], polyline[i][0]);
            if (dist < minDistance) minDistance = dist;
            if (minDistance < 5) break;
        }
        return minDistance;
    };

    const userLocRef = useRef(null);
    const activeRouteRef = useRef(null);
    const targetLocRef = useRef(null);
    const navStateRef = useRef({ navigationSteps: [], currentStepIndex: 0, lastAnnouncedStep: -1 });

    useEffect(() => {
        navStateRef.current = { navigationSteps, currentStepIndex, lastAnnouncedStep };
    }, [navigationSteps, currentStepIndex, lastAnnouncedStep]);

    const fetchNeuralPath = async (targetLat, targetLng, silent = false) => {
        const currentLoc = userLocRef.current;
        if (!currentLoc) return showAlert("⚠️ KONUMUNUZ BEKLENİYOR...");

        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${currentLoc[1]},${currentLoc[0]};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 'Ok' && data.routes?.length > 0) {
                const route = data.routes[0];
                const geojson = {
                    type: 'Feature',
                    geometry: route.geometry,
                    properties: {}
                };

                setActiveRoute(geojson);
                activeRouteRef.current = route.geometry.coordinates;
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
                    setIsDrivingMode(true);
                    setViewState(prev => ({
                        ...prev,
                        latitude: currentLoc[0],
                        longitude: currentLoc[1],
                        zoom: 18,
                        pitch: 60
                    }));
                    requestCompassPermission();
                    showAlert("📡 ROTA OLUŞTURULDU // SÜRÜŞ MODU AKTİF");
                    try { speak(route.legs[0].steps[0].maneuver.instruction); } catch (e) { }
                }
            }
        } catch (e) {
            showAlert("❌ NAVİGASYON BAĞLANTI HATASI.");
        }
    };

    const [distanceToNext, setDistanceToNext] = useState(0);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (data.user) setUser(data.user);
            } catch (err) { }
        };
        fetchUser();

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

                if (isLockMode && mapRef.current) {
                    // HARİTA ROTASYONU: Sadece Sürüş Modunda (isDrivingMode) harita dönsün
                    // Pusula modu (isRotationMode) sadece marker'ı döndürür
                    const effectiveBearing = isDrivingMode ? (pos.coords.heading || 0) : 0;

                    setViewState(prev => ({
                        ...prev,
                        latitude: c[0],
                        longitude: c[1],
                        bearing: effectiveBearing,
                        pitch: isDrivingMode ? 60 : 0,
                        zoom: isDrivingMode ? 18 : prev.zoom
                    }));
                }

                const { navigationSteps: steps, currentStepIndex: idx, lastAnnouncedStep: announced } = navStateRef.current;
                if (steps.length > 0 && idx < steps.length) {
                    const deviation = activeRouteRef.current ? getDistanceToRoute(c, activeRouteRef.current) : 0;

                    // GHOST ESCORT: Deviation Alert (100m+)
                    if (deviation > 100) {
                        setIsDeviated(true);
                        // In real app, we might trigger a special voice alert too
                    } else {
                        setIsDeviated(false);
                    }

                    if (deviation > rerouteThreshold) {
                        if (targetLocRef.current) {
                            showAlert("🔄 ROTA YENİLENİYOR...");
                            fetchNeuralPath(targetLocRef.current.lat, targetLocRef.current.lng, true);
                        }
                    }

                    const distToTurn = getDistance(c[0], c[1], steps[idx].location[0], steps[idx].location[1]);
                    setDistanceToNext(distToTurn);

                    if (distToTurn < 30) {
                        const next = idx + 1;
                        if (next < steps.length) {
                            setCurrentStepIndex(next);
                            if (announced < next) {
                                try { speak(steps[next].instruction); setLastAnnouncedStep(next); } catch (e) { }
                            }
                        } else {
                            showAlert("🏁 HEDEFE VARILDI.");
                            speak("Hedefe vardınız.");
                            setActiveRoute(null); activeRouteRef.current = null; setNavigationSteps([]);
                            setIsDrivingMode(false);
                        }
                    }
                }
            });
        };
        startWatching();

        const loadCheck = setInterval(() => {
            if (mapRef.current && !mapReady) {
                fetchLocs();
            }
        }, 2000);

        return () => {
            if (watchId) Geolocation.clearWatch({ id: watchId });
            clearInterval(loadCheck);
        };
    }, [isLockMode, isRotationMode, mapReady, fetchLocs, showAlert]);

    // COMPASS / ORIENTATION SYNC (STABLE REFERENCE)
    const handleOrientation = useCallback((e) => {
        let heading = 0;
        if (e.webkitCompassHeading) {
            heading = e.webkitCompassHeading;
        } else if (e.absolute && e.alpha !== null) {
            heading = 360 - e.alpha;
        } else {
            return;
        }

        setUserHeading(heading);

        // HARİTA ROTASYONU: Kullanıcı talebi üzerine sadece SÜRÜŞ MODUNDA harita döner
        if (isDrivingModeRef.current) {
            setViewState(prev => ({
                ...prev,
                bearing: heading
            }));
        } else {
            // Sürüş modu kapalıysa harita her zaman 0 (Kuzey) kalmalı
            setViewState(prev => ({
                ...prev,
                bearing: 0
            }));
        }
    }, []); // Ref kullanıldığı için bağımlılık yok

    const requestCompassPermission = async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    showAlert("🧭 PUSULA ERİŞİMİ SAĞLANDI");
                }
            } catch (e) {
                showAlert("⚠️ PUSULA İZNİ ALINAMADI");
            }
        }
    };

    useEffect(() => {
        if (isRotationMode || isDrivingMode) {
            console.log("🧭 NEURAL_SYNC // COMPASS_START");
            window.addEventListener('deviceorientation', handleOrientation, true);
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);

            return () => {
                window.removeEventListener('deviceorientation', handleOrientation, true);
                window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
                setViewState(prev => ({ ...prev, bearing: 0 }));
            };
        } else {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
            setViewState(prev => ({ ...prev, bearing: 0 }));
        }
    }, [isRotationMode, isDrivingMode, handleOrientation]);

    // NEURAL POLLING: SOS, Party, Locations
    useEffect(() => {
        const intv = setInterval(() => {
            fetchSOS();
            fetchParty();
            fetchLocs();
        }, 5000);
        return () => clearInterval(intv);
    }, [fetchSOS, fetchParty, fetchLocs]);

    // NEURAL SYNC: Auto-sync leader's destination
    useEffect(() => {
        if (!party || !user || !mapReady) return;
        const isLeader = String(user.id) === String(party.leaderId);

        // If I am a member and leader has set a destination I don't have active
        if (!isLeader && party.destLatitude && party.destLongitude) {
            const hasExistingRoute = activeRoute && targetLocRef.current &&
                targetLocRef.current.lat === party.destLatitude &&
                targetLocRef.current.lng === party.destLongitude;

            if (!hasExistingRoute) {
                console.log("📡 NEURAL LINK // SYNCING SQUAD DESTINATION:", party.destName);
                showAlert(`📡 MÜFREZE KONUMU ALINDI: ${party.destName}`);
                fetchNeuralPath(party.destLatitude, party.destLongitude, false);
            }
        }
    }, [party, user, mapReady, activeRoute, showAlert]);

    useEffect(() => {
        console.log("🧩 NEULA_SYNC // STATE_UPDATE:", { party, user, navigationSteps: navigationSteps.length });
    }, [party, user, navigationSteps]);

    const filteredLocations = useMemo(() => (Array.isArray(locations) ? locations : []).filter(l => activeFilters.includes(l.type)), [locations, activeFilters]);

    return (
        <div className="relative h-full w-full bg-[#050505] overflow-hidden text-magenta-50 font-mono selection:bg-magenta-500/30">
            {/* Cyberpunk Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-10"
                style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>


            <MapSearch onLocationSelect={(loc) => {
                setSearchedLocation(loc);
                setViewState(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng, zoom: 17 }));
            }} />

            <div className="h-full w-full relative z-10">
                {!mapReady && (
                    <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-[#000000] gap-6 backdrop-blur-md">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-magenta-500/30 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 border-4 border-t-magenta-400 border-r-transparent border-b-magenta-600 border-l-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-4 bg-magenta-900/20 rounded-full shadow-[0_0_30px_magenta]"></div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <h2 className="text-xl font-black text-magenta-400 tracking-[0.5em] uppercase animate-pulse">SYSTEM LINK</h2>
                            <span className="text-[10px] text-zinc-500 font-bold tracking-widest border border-zinc-800 px-2 py-1 rounded">ESTABLISHING NEURAL CONNECTION</span>
                        </div>
                    </div>
                )}

                <Map
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    onLoad={() => { setMapReady(true); fetchLocs(); }}
                    ref={mapRef}
                    mapStyle={MAP_STYLE}
                    style={{ width: '100%', height: '100%' }}
                    onClick={e => setSearchedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng, name: 'İŞARETLENEN NOKTA' })}
                >
                    {/* Optimized POI GL Layers (Clustering Disabled for Cleaner View) */}
                    <Source
                        id="locations-source"
                        type="geojson"
                        data={locationsSource}
                        cluster={false}
                        clusterMaxZoom={14}
                        clusterRadius={50}
                    >
                        {/* Clusters removed, showing all points individually or handled by zoom logic */}
                        <Layer
                            id="clusters"
                            type="circle"
                            filter={['has', 'point_count']}
                            paint={{
                                'circle-color': '#ff00ff',
                                'circle-radius': 18,
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#fff',
                                'circle-opacity': 0.8
                            }}
                        />
                        <Layer
                            id="cluster-count"
                            type="symbol"
                            filter={['has', 'point_count']}
                            layout={{
                                'text-field': '{point_count}',
                                'text-size': 12,
                                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold']
                            }}
                            paint={{
                                'text-color': '#000'
                            }}
                        />
                        <Layer
                            id="unclustered-point"
                            type="circle"
                            filter={['!', ['has', 'point_count']]}
                            paint={{
                                'circle-color': '#111',
                                'circle-radius': 12,
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#ff00ff',
                                'circle-opacity': 0.6
                            }}
                        />
                    </Source>

                    {/* Cybervisuals: Neon Route Line */}
                    {activeRoute && (
                        <Source id="route-source" type="geojson" data={activeRoute}>
                            <Layer id="route-layer" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                paint={{
                                    'line-color': '#ff00ff',
                                    'line-width': 8,
                                    'line-blur': 1,
                                    'line-opacity': 0.9
                                }}
                            />
                            <Layer id="route-glow" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                                paint={{
                                    'line-color': '#ff00ff',
                                    'line-width': 16,
                                    'line-blur': 10,
                                    'line-opacity': 0.4
                                }}
                            />
                        </Source>
                    )}

                    {/* Cybervisuals: User Marker */}
                    {userLocation && (
                        <Marker latitude={userLocation[0]} longitude={userLocation[1]} anchor="center">
                            <div className="relative flex items-center justify-center">
                                {/* Enhanced Pulse Effects */}
                                <div className="absolute w-20 h-20 bg-magenta-500/10 rounded-full animate-ping"></div>
                                <div className="absolute w-12 h-12 bg-magenta-400/5 rounded-full animate-pulse"></div>

                                {/* Navigation Arrow (Google Style) */}
                                {/* Dynamic Marker: Arrow (Active) vs Circle (Inactive) */}
                                <div className="relative z-20 transition-all duration-500 ease-in-out"
                                    style={{ transform: (isRotationMode || isDrivingMode) ? `rotate(${userHeading}deg)` : 'rotate(0deg)' }}>

                                    {isRotationMode || isDrivingMode ? (
                                        <>
                                            {/* Arrow Shadow */}
                                            <div className="absolute inset-0 blur-[4px] opacity-50 scale-110 translate-y-1">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="black">
                                                    <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                                                </svg>
                                            </div>
                                            {/* Arrow Main Body */}
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="filter drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]">
                                                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="#ff00ff" />
                                                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="url(#arrow-gradient)" />
                                                <defs>
                                                    <linearGradient id="arrow-gradient" x1="12" y1="2" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                                                        <stop stopColor="#ffffff" stopOpacity="0.4" />
                                                        <stop offset="1" stopColor="#ff00ff" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </>
                                    ) : (
                                        <div className="w-8 h-8 bg-magenta-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,0,255,0.6)] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                                            <div className="absolute inset-0 animate-pulse bg-white/10"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Cone of vision - Subtle and wider in driving mode */}
                                <div className="absolute w-40 h-40 bg-gradient-to-t from-magenta-400/20 to-transparent -translate-y-1/2 pointer-events-none transition-all duration-500"
                                    style={{
                                        transform: `rotate(${userHeading}deg) translateY(-50%)`,
                                        opacity: isDrivingMode ? 0.3 : 0.6,
                                        clipPath: 'polygon(50% 100%, -20% 0, 120% 0)'
                                    }}>
                                </div>
                            </div>
                        </Marker>
                    )}

                    {searchedLocation && (
                        <Popup latitude={searchedLocation.lat} longitude={searchedLocation.lng} closeOnClick={false} anchor="bottom" onClose={() => setSearchedLocation(null)}>
                            <div className="p-4 text-white text-center min-w-[180px] bg-[#0a0a14]/95 backdrop-blur-2xl border border-magenta-500/40 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                                {/* Corner Accent */}
                                <div className="absolute top-0 right-0 w-8 h-8 bg-magenta-500/10 -rotate-45 translate-x-4 -translate-y-4 border-b border-magenta-500/30"></div>

                                <div className="text-[10px] font-black text-magenta-400 uppercase tracking-[0.2em] mb-2 border-b border-magenta-500/20 pb-1">HEDEF_VERİSİ</div>
                                <div className="font-black italic mb-4 uppercase text-base text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{searchedLocation.name}</div>

                                <div className="flex flex-col gap-2 relative z-10">
                                    <button onClick={() => fetchNeuralPath(searchedLocation.lat, searchedLocation.lng)}
                                        className="w-full py-2.5 bg-magenta-600 hover:bg-magenta-500 text-white font-black rounded-lg text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.4)] border border-white/10">
                                        ROTA OLUŞTUR
                                    </button>

                                    {/* NEURAL SYNC BROADCAST BUTTON (LEADER ONLY) */}
                                    {party && user && String(user.id) === String(party.leaderId) && (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch('/api/parties', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                partyId: party.id,
                                                                destLatitude: searchedLocation.lat,
                                                                destLongitude: searchedLocation.lng,
                                                                destName: searchedLocation.name
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            showAlert("📡 NEURAL LINK // KONUM MÜFREZEYE AKTARILDI");
                                                            fetchNeuralPath(searchedLocation.lat, searchedLocation.lng, true);
                                                        }
                                                    } catch (e) {
                                                        showAlert("❌ SENKRONİZASYON HATASI");
                                                    }
                                                }}
                                                className="px-4 py-2 bg-magenta-500 text-black font-black rounded-lg text-[10px] uppercase tracking-[0.15em] animate-pulse shadow-lg shadow-magenta-500/30"
                                            >
                                                📡 MÜFREZE İLE PAYLAŞ
                                            </button>

                                            {/* ABORT MISSION BUTTON */}
                                            {party.destLatitude && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch('/api/parties', {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    partyId: party.id,
                                                                    destLatitude: null,
                                                                    destLongitude: null,
                                                                    destName: null
                                                                })
                                                            });
                                                            if (res.ok) {
                                                                showAlert("🏴 GÖREV İPTAL EDİLDİ");
                                                                setActiveRoute(null);
                                                                activeRouteRef.current = null;
                                                                setNavigationSteps([]);
                                                            }
                                                        } catch (e) { }
                                                    }}
                                                    className="px-4 py-1.5 bg-red-600/20 border border-red-500/50 text-red-500 font-black rounded-lg text-[8px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    🏴 GÖREVİ SONLANDIR
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    )}

                    {/* SQUAD OBJECTIVE MARKER (Member View) */}
                    {party?.destLatitude && party?.destLongitude && user && String(user.id) !== String(party.leaderId) && (
                        <Marker latitude={party.destLatitude} longitude={party.destLongitude} anchor="bottom">
                            <div className="relative group cursor-pointer flex flex-col items-center">
                                <div className="absolute -top-12 px-2 py-1 bg-magenta-500 text-black text-[8px] font-black uppercase tracking-tighter rounded border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    MÜFREZE HEDEFİ: {party.destName}
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-magenta-500/20 rounded-full animate-ping"></div>
                                    <div className="absolute inset-2 bg-magenta-400/40 rounded-full animate-pulse"></div>
                                    <div className="text-3xl filter drop-shadow-[0_0_10px_magenta]">🚩</div>
                                </div>
                                <div className="w-[1px] h-6 bg-gradient-to-t from-magenta-500 to-transparent"></div>
                            </div>
                        </Marker>
                    )}

                    {party?.members?.map(m => m.latitude && (
                        <Marker key={m.id} latitude={m.latitude} longitude={m.longitude} anchor="center">
                            <div className="w-3 h-3 bg-amber-500 rounded-full border border-white shadow-[0_0_8px_amber]"></div>
                        </Marker>
                    ))}

                    {sosSignals.map(s => s.latitude && (
                        <Marker key={s.id} latitude={s.latitude} longitude={s.longitude} anchor="center">
                            <div className="w-10 h-10 bg-red-600 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-lg text-lg">🆘</div>
                        </Marker>
                    ))}

                    {/* Optimized POI Markers (Rendered only on high zoom to maintain interactivity) */}
                    {viewState.zoom > 13 && filteredLocations.map(l => l.latitude && (
                        <Marker key={l.id} latitude={l.latitude} longitude={l.longitude} anchor="center">
                            <div
                                onClick={(e) => { e.stopPropagation(); setSearchedLocation({ lat: l.latitude, lng: l.longitude, name: l.name }); }}
                                className="w-10 h-10 flex items-center justify-center bg-zinc-900/80 rounded-xl border border-white/10 shadow-2xl cursor-pointer group overflow-hidden"
                            >
                                <img
                                    src={
                                        (l.type === 'fuel' && l.logo_url) ? l.logo_url :
                                            getCategoryIcon(l.type, l.name) || l.logo_url || '/assets/coffee_icon.png'
                                    }
                                    alt={l.name}
                                    className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110"
                                    onError={(e) => {
                                        // Fallback to custom icon if external logo fails
                                        const fallback = getCategoryIcon(l.type, l.name) || '/assets/coffee_icon.png';
                                        if (e.target.src !== window.location.origin + fallback) {
                                            e.target.src = fallback;
                                        }
                                    }}
                                />
                            </div>
                        </Marker>
                    ))}
                </Map>
            </div>

            {navigationSteps.length > 0 && navigationSteps[currentStepIndex] && (
                <div className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-[400px] overflow-hidden rounded-2xl">
                    <div className="bg-black/95 backdrop-blur-2xl border border-magenta-500/50 p-4 flex items-center gap-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
                        <div className="scanner-beam opacity-20"></div>
                        <div className="w-16 h-16 bg-magenta-500 rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,255,0.3)] text-2xl relative z-10">
                            {navigationSteps[currentStepIndex].modifier?.includes('left') ? '⬅️' : navigationSteps[currentStepIndex].modifier?.includes('right') ? '➡️' : '⬆️'}
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] text-magenta-400 font-bold uppercase tracking-widest">NAVİGASYON</div>
                            <div className="text-lg font-black italic uppercase leading-tight">{navigationSteps[currentStepIndex].instruction}</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm text-emerald-400 font-bold">{routeStats?.duration} dk | {routeStats?.distance} km</span>
                                <span className="text-[10px] text-zinc-400 font-black italic">Dönüşe: {distanceToNext > 1000 ? (distanceToNext / 1000).toFixed(1) + ' km' : Math.round(distanceToNext) + ' m'}</span>
                            </div>
                        </div>
                        <button onClick={() => { setActiveRoute(null); setNavigationSteps([]); }} className="p-2 text-red-500 font-bold bg-red-500/10 rounded-lg">X</button>
                    </div>
                </div>
            )}

            {/* TACTICAL OVERLAYS (Top-Left Info) - Positioned under MapSearch */}
            <div
                onClick={() => router.push(`${pathname}?partyOpen=true`)}
                className="absolute top-20 left-6 z-[2000] flex flex-col items-start gap-2 pointer-events-auto w-44 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
            >
                {/* SQD STATS - COMPACT & INTEGRATED */}
                <div className={`px-2 py-1 bg-black/40 backdrop-blur-sm rounded border ${party ? 'border-emerald-500/30' : 'border-magenta-500/10'} shadow-lg w-full`}>
                    <div className="text-[6px] font-black text-magenta-500/40 leading-none mb-0.5 tracking-widest uppercase">SYSLINK // {party ? 'ESTABLISHED' : 'STANDBY'}</div>
                    <span className={`text-[8px] font-black ${party ? 'text-emerald-400' : 'text-magenta-400'} uppercase tracking-tighter italic flex items-center gap-1.5`}>
                        <span className={`w-1 h-1 rounded-full ${party ? 'bg-emerald-500' : 'bg-magenta-500'} animate-pulse`} />
                        {party ? 'NEURAL_LINK_ACTIVE' : 'DIKILI_SECTOR'}
                    </span>
                </div>

                {/* SQUAD OBJECTIVE HUD - COMPACT */}
                {party?.destLatitude && (
                    <div className="px-2 py-1.5 bg-magenta-950/20 backdrop-blur-md border-l-2 border-magenta-400/60 shadow-xl animate-in slide-in-from-right duration-500 w-full">
                        <div className="flex justify-between items-start mb-0.5">
                            <div className="text-[6px] font-black text-magenta-300/40 tracking-widest uppercase">OBJ_SYNC</div>
                            {user && String(user.id) === String(party.leaderId) && (
                                <span className="text-[6px] bg-amber-500/80 text-black px-1 rounded font-black">LDR</span>
                            )}
                        </div>
                        <div className="text-[10px] font-black text-white italic uppercase tracking-tighter truncate">{party.destName}</div>

                        <div className="flex items-center gap-1.5 my-1">
                            <div className="flex -space-x-1">
                                {party.members.slice(0, 3).map(m => (
                                    <div key={m.id} className="w-3 h-3 rounded-full border border-black bg-zinc-800 overflow-hidden">
                                        {m.profileImage ? <img src={m.profileImage} className="w-full h-full object-cover" /> : <span className="text-[4px] flex items-center justify-center h-full">👤</span>}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[6px] font-black text-white/30 uppercase">{party.members.length} PLT</span>
                        </div>
                    </div>
                )}

                {/* SQUAD MEMBER LIST - INTEGRATED */}
                {party && party.members && party.members.length > 0 && (
                    <div className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-left duration-500 mt-1 pointer-events-auto">
                        <div className="flex items-center gap-1.5 mb-0.5 px-2 border-l border-magenta-500/20">
                            <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.4)]"></div>
                            <span className="text-[8px] font-black text-white/40 tracking-widest font-mono uppercase">SQD_LOG</span>
                        </div>

                        <div className="flex flex-col gap-1 bg-black/30 backdrop-blur-sm p-1.5 rounded-xl border border-white/5 shadow-lg">
                            {party.members.map(m => (
                                <div key={m.id} className="group flex items-center gap-2 p-1.5 bg-zinc-900/40 border border-white/5 rounded-lg hover:bg-magenta-500/10 transition-all duration-300">
                                    <div className="relative shrink-0">
                                        <div className="w-6 h-6 rounded-full border border-white/10 overflow-hidden bg-zinc-800">
                                            {m.profileImage ? (
                                                <img src={m.profileImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                                            ) : (
                                                <span className="text-[8px] flex items-center justify-center h-full opacity-30">👤</span>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500/60 border border-black italic shadow-lg"></div>
                                    </div>
                                    <div className="flex flex-col min-w-0 leading-none">
                                        <div className="flex items-center gap-1 overflow-hidden">
                                            <span className="text-[9px] font-black text-white/60 group-hover:text-white truncate uppercase tracking-tighter">
                                                {(m.fullName || 'PLT').split(' ')[0]}
                                            </span>
                                            {String(m.id) === String(party.leaderId) && (
                                                <span className="text-[7px] text-amber-500/60 animate-pulse">★</span>
                                            )}
                                        </div>
                                        <span className="text-[6px] font-bold text-magenta-500/40 uppercase tracking-widest truncate">SECTOR_ONLINE</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Navigation & Controls Area (Right Side) */}
            <div className="absolute right-6 bottom-32 z-[1500] flex flex-col gap-4">
                <button onClick={() => setIsLockMode(!isLockMode)}
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all duration-300 shadow-2xl backdrop-blur-xl
                        ${isLockMode ? 'bg-magenta-500/20 border-magenta-400 text-magenta-400 shadow-[0_0_20px_magenta]' : 'bg-black/60 border-white/10 text-zinc-500 hover:border-white/20'}`}>
                    <span className={`text-2xl transition-transform duration-500 ${isLockMode ? 'scale-110 drop-shadow-[0_0_10px_magenta]' : ''}`}>
                        📍
                    </span>
                    {isLockMode && <div className="absolute inset-0 rounded-2xl border border-magenta-500 animate-ping opacity-40"></div>}
                </button>

                <button onClick={() => {
                    const newMode = !isRotationMode;
                    setIsRotationMode(newMode);
                    if (newMode) {
                        requestCompassPermission();
                    } else {
                        setViewState(prev => ({ ...prev, bearing: 0 }));
                    }
                }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border backdrop-blur-xl shadow-2xl
                        ${isRotationMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400 shadow-[0_0_20px_emerald]' : 'bg-black/60 text-zinc-500 border-white/10'}`}>
                    🧭
                </button>

                <button onClick={() => {
                    const newMode = !isDrivingMode;
                    setIsDrivingMode(newMode);
                    if (newMode) {
                        setIsLockMode(true);
                        setViewState(prev => ({ ...prev, pitch: 60, zoom: 18 }));
                        requestCompassPermission();
                    } else {
                        setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
                    }
                }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border backdrop-blur-xl shadow-2xl relative overflow-hidden
                        ${isDrivingMode ? 'bg-magenta-500/20 text-magenta-400 border-magenta-400 shadow-[0_0_20px_magenta]' : 'bg-black/60 text-zinc-500 border-white/10'}`}>
                    <span className="text-2xl">🏎️</span>
                    {isDrivingMode && <div className="absolute bottom-0 left-0 w-full h-1 bg-magenta-400 animate-pulse"></div>}
                </button>
            </div>

            {/* Cyberpunk HUD: Filter Fab (Collapsible) */}
            <div className="absolute right-6 top-32 z-[1500] flex flex-col items-end gap-2 pointer-events-auto">
                {/* Toggle Button */}
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border backdrop-blur-xl shadow-2xl
                        ${isFilterOpen ? 'bg-magenta-500/20 border-magenta-400 text-magenta-400 shadow-[0_0_20px_magenta]' : 'bg-black/80 border-white/20 text-magenta-500/80 shadow-[0_0_10px_rgba(255,0,255,0.2)]'}`}
                >
                    <span className={`text-xl transition-transform duration-500 ${isFilterOpen ? 'rotate-180' : ''}`}>
                        {isFilterOpen ? '✖' : '🔍'}
                    </span>
                    {!isFilterOpen && <div className="absolute -top-1 -right-1 w-3 h-3 bg-magenta-500 rounded-full animate-pulse shadow-[0_0_10px_magenta]"></div>}
                </button>

                {/* Categories List (Animate Open/Close) */}
                <div className={`flex flex-col gap-2 transition-all duration-500 ease-in-out overflow-hidden ${isFilterOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    {categories.map(c => (
                        <div key={c.id} className="group relative">
                            <button
                                onClick={() => setActiveFilters(prev => prev.includes(c.id) ? prev.filter(f => f !== c.id) : [...prev, c.id])}
                                className={`w-12 h-10 rounded-xl flex items-center justify-center text-sm border transition-all backdrop-blur-md
                                ${activeFilters.includes(c.id)
                                        ? 'bg-magenta-500/30 border-magenta-500/60 text-magenta-400 shadow-[0_0_15px_rgba(255,0,255,0.3)]'
                                        : 'bg-black/60 border-white/5 text-zinc-400'}`}
                            >
                                {c.icon}
                            </button>
                            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/90 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
                                {c.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TACTICAL OVERLAYS: Red Alert Vignette */}
            {isRedAlert && (
                <div className="fixed inset-0 pointer-events-none z-[9999] shadow-[inset_0_0_150px_rgba(239,68,68,0.4)] animate-pulse border-[20px] border-red-500/10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-black text-6xl opacity-20 rotate-12 tracking-[2em] whitespace-nowrap">RED_ALERT</div>
                </div>
            )}

            {/* TACTICAL OVERLAYS: Deviation Alert (Ghost Escort) */}
            {isDeviated && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] px-6 py-2 bg-red-600 text-white font-black italic rounded-full shadow-[0_0_30px_red] animate-bounce flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[10px] opacity-70">GHOST_ESCORT // WARNING</span>
                        <span className="text-sm tracking-widest">ROTADAN SAPILDI - MÜFREZEYE DÖN</span>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes scan { 0% { width: 0; opacity: 0; left: 0; } 50% { width: 100%; opacity: 1; } 100% { width: 0; opacity: 0; left: 100%; } }
                @keyframes glow { 
                    0% { box-shadow: 0 0 10px rgba(0, 243, 255, 0.2); }
                    50% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.6); }
                    100% { box-shadow: 0 0 10px rgba(0, 243, 255, 0.2); }
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                .maplibregl-popup-content {
                    background: rgba(10, 10, 20, 0.95) !important;
                    backdrop-filter: blur(16px) !important;
                    color: white !important;
                    border: 1px solid rgba(255, 0, 255, 0.4) !important;
                    border-radius: 12px !important;
                    padding: 0 !important;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important;
                    font-family: 'Inter', sans-serif !important;
                    animation: fadeIn 0.4s ease-out;
                    overflow: hidden;
                }
                .maplibregl-popup-content:hover {
                    border-color: rgba(255, 0, 255, 0.7) !important;
                    box-shadow: 0 0 30px rgba(236, 72, 153, 0.2) !important;
                }
                .maplibregl-popup-tip { border-top-color: rgba(255, 0, 255, 0.4) !important; }
                .maplibregl-popup-close-button {
                  color: white !important;
                  font-size: 18px !important;
                  padding: 8px !important;
                  z-index: 20;
                }
                .maplibregl-canvas { outline: none !important; }
                
                /* Mapping MapLibre controls to TOP to clear humanity HUD */
                .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left {
                    bottom: auto !important;
                    top: 10px !important;
                    transition: all 0.3s ease;
                }
                .maplibregl-ctrl-logo {
                    margin-bottom: 0 !important;
                    margin-top: 10px !important;
                }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
