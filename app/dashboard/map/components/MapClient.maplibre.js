'use client';

import Map, { Marker, Popup, Source, Layer, useControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Geolocation } from '@capacitor/geolocation';
import { useNotifications } from '@/app/components/NotificationProvider';
import { speak } from '@/app/components/VoiceNotification';
import MapSearch from './MapSearch';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapClient() {
    const { showAlert } = useNotifications();
    const [locations, setLocations] = useState([]);
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

    const locationsSource = useMemo(() => ({
        type: 'FeatureCollection',
        features: (Array.isArray(locations) ? locations : [])
            .filter(l => activeFilters.includes(l.type))
            .map(l => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [l.longitude, l.latitude]
                },
                properties: {
                    id: l.id,
                    name: l.name,
                    type: l.type,
                    logo_url: l.logo_url
                }
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
            const data = await res.json();
            setParty(data.party);
        } catch (err) { }
    }, []);

    const fetchLocs = useCallback(async () => {
        if (!mapRef.current) return;
        const bounds = mapRef.current.getBounds();
        try {
            let url = `/api/map/locations?south=${bounds.getSouth()}&west=${bounds.getWest()}&north=${bounds.getNorth()}&east=${bounds.getEast()}`;
            const res = await fetch(url);
            const data = await res.json();
            setLocations(Array.isArray(data) ? data : []);
        } catch (err) {
            setLocations([]);
        } finally { setLoading(false); }
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
                    setViewState(prev => ({ ...prev, latitude: currentLoc[0], longitude: currentLoc[1], zoom: 18 }));
                    showAlert("📡 ROTA OLUŞTURULDU.");
                    try { speak(route.legs[0].steps[0].maneuver.instruction); } catch (e) { }
                }
            }
        } catch (e) {
            showAlert("❌ NAVİGASYON BAĞLANTI HATASI.");
        }
    };

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

                if (isLockMode && mapRef.current) {
                    setViewState(prev => ({
                        ...prev,
                        latitude: c[0],
                        longitude: c[1],
                        bearing: isRotationMode ? pos.coords.heading || 0 : prev.bearing
                    }));
                }

                const { navigationSteps: steps, currentStepIndex: idx, lastAnnouncedStep: announced } = navStateRef.current;
                if (steps.length > 0 && idx < steps.length) {
                    if (activeRouteRef.current && getDistanceToRoute(c, activeRouteRef.current) > rerouteThreshold) {
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
                        }
                    }
                }
            });
        };
        startWatching();

        // Load locations immediately even if map isn't "fully" loaded if mapRef is available
        const loadCheck = setInterval(() => {
            if (mapRef.current && !mapReady) {
                fetchLocs();
            }
        }, 2000);

        const intv = setInterval(() => { fetchSOS(); fetchParty(); fetchLocs(); }, 30000);
        return () => {
            if (watchId) Geolocation.clearWatch({ id: watchId });
            clearInterval(intv);
            clearInterval(loadCheck);
        };
    }, [isLockMode, isRotationMode, mapReady]);

    const filteredLocations = useMemo(() => (Array.isArray(locations) ? locations : []).filter(l => activeFilters.includes(l.type)), [locations, activeFilters]);

    return (
        <div className="relative h-full w-full bg-black overflow-hidden text-white pb-20">
            <MapSearch onLocationSelect={(loc) => {
                setSearchedLocation(loc);
                setViewState(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng, zoom: 17 }));
            }} />

            <div className="h-[calc(100%-80px)] w-full relative">
                {!mapReady && (
                    <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-[#050510] gap-4">
                        <div className="w-16 h-16 border-4 border-magenta-500/20 border-t-magenta-500 rounded-full animate-spin shadow-[0_0_20px_rgba(0,255,255,0.2)]" />
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-magenta-500 tracking-[0.3em] uppercase animate-pulse">Neural Link Bağlanıyor...</span>
                            <span className="text-[8px] text-zinc-600 font-bold uppercase mt-1 tracking-widest">Sinyal Stabilize Ediliyor</span>
                        </div>
                    </div>
                )}
                <Map
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    onLoad={() => {
                        setMapReady(true);
                        fetchLocs();
                    }}
                    ref={mapRef}
                    mapStyle={MAP_STYLE}
                    style={{ width: '100%', height: '100%' }}
                    onClick={e => setSearchedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng, name: 'İŞARETLENEN NOKTA' })}
                >
                    {/* Optimized POI GL Layers with Clustering */}
                    <Source
                        id="locations-source"
                        type="geojson"
                        data={locationsSource}
                        cluster={true}
                        clusterMaxZoom={14}
                        clusterRadius={50}
                    >
                        <Layer
                            id="clusters"
                            type="circle"
                            filter={['has', 'point_count']}
                            paint={{
                                'circle-color': '#00ffff',
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
                                'circle-stroke-color': '#00ffff',
                                'circle-opacity': 0.6
                            }}
                        />
                    </Source>

                    {activeRoute && (
                        <Source id="route-source" type="geojson" data={activeRoute}>
                            <Layer
                                id="route-layer"
                                type="line"
                                layout={{
                                    'line-cap': 'round',
                                    'line-join': 'round'
                                }}
                                paint={{
                                    'line-color': '#00ffff',
                                    'line-width': 6
                                }}
                            />
                        </Source>
                    )}

                    {userLocation && (
                        <Marker latitude={userLocation[0]} longitude={userLocation[1]} anchor="center">
                            <div className="relative w-12 h-12 flex items-center justify-center transition-transform duration-500" style={{ transform: `rotate(${isRotationMode ? 0 : userHeading}deg)` }}>
                                <div className="absolute inset-0 bg-magenta-500/20 rounded-full animate-ping"></div>
                                <div className="w-1 h-6 bg-magenta-400 absolute bottom-1/2 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_10px_magenta]"></div>
                                <div className="w-4 h-4 bg-white rounded-full border-2 border-magenta-500 shadow-[0_0_15px_magenta] z-10"></div>
                            </div>
                        </Marker>
                    )}

                    {searchedLocation && (
                        <Popup latitude={searchedLocation.lat} longitude={searchedLocation.lng} closeOnClick={false} anchor="bottom" onClose={() => setSearchedLocation(null)}>
                            <div className="p-4 text-white text-center min-w-[200px] bg-[#0a0a14]/95 backdrop-blur-2xl border border-magenta-500/40 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-8 h-8 bg-magenta-500/10 -rotate-45 translate-x-4 -translate-y-4 border-b border-magenta-500/30"></div>
                                <div className="text-[10px] font-black text-magenta-400 uppercase tracking-[0.2em] mb-2 border-b border-magenta-500/20 pb-1">KONUM_VERİSİ</div>
                                <div className="font-black italic mb-2 uppercase text-base text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{searchedLocation.name}</div>

                                {searchedLocation.ownerName && (
                                    <div className="mb-4 py-2 px-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col items-start">
                                            <span className="text-[8px] text-zinc-500 font-bold uppercase">SAHİBİ KLAN</span>
                                            <span className="text-[10px] font-black text-magenta-400 uppercase">{searchedLocation.ownerName}</span>
                                        </div>
                                        <div className="text-2xl animate-float">🚩</div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <button onClick={() => fetchNeuralPath(searchedLocation.lat, searchedLocation.lng)}
                                        className="w-full py-2.5 bg-magenta-600 hover:bg-magenta-500 text-white font-black rounded-lg text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.4)] border border-white/10">
                                        ROTA OLUŞTUR
                                    </button>

                                    {searchedLocation.id && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/map/checkin', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            locationId: searchedLocation.id,
                                                            latitude: userLocation?.[0],
                                                            longitude: userLocation?.[1]
                                                        })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        showAlert(`✅ ${data.message}`);
                                                        fetchLocs(); // Refresh to show new owner
                                                    } else {
                                                        showAlert(`⚠️ ${data.error}`);
                                                    }
                                                } catch (e) {
                                                    showAlert("❌ BAĞLANTI HATASI");
                                                }
                                            }}
                                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/5 transition-all"
                                        >
                                            📍 CHECK-IN YAP
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    )}

                    {party?.members?.map(m => m.latitude && (
                        <Marker key={m.id} latitude={m.latitude} longitude={m.longitude} anchor="center">
                            <div className="w-3 h-3 bg-amber-500 rounded-full border border-white shadow-[0_0_8px_amber]"></div>
                        </Marker>
                    ))}

                    {sosSignals.map(s => s.id && s.latitude && (
                        <Marker key={s.id} latitude={s.latitude} longitude={s.longitude} anchor="center">
                            <div className="w-10 h-10 bg-red-600 rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-lg text-lg">🆘</div>
                        </Marker>
                    ))}

                    {/* Optimized POI Markers (Rendered only on high zoom to maintain interactivity) */}
                    {viewState.zoom > 13 && filteredLocations.map(l => l.latitude && (
                        <Marker key={l.id} latitude={l.latitude} longitude={l.longitude} anchor="center">
                            <div
                                onClick={(e) => { e.stopPropagation(); setSearchedLocation({ ...l, lat: l.latitude, lng: l.longitude }); }}
                                className={`w-10 h-10 flex items-center justify-center bg-zinc-900/80 rounded-xl border transition-all cursor-pointer group overflow-hidden ${l.ownerName ? 'border-magenta-500 shadow-[0_0_15px_rgba(255,0,255,0.3)]' : 'border-white/10 shadow-2xl'}`}
                            >
                                <img
                                    src={
                                        (l.type === 'fuel' && l.logo_url) ? l.logo_url :
                                            getCategoryIcon(l.type, l.name) || l.logo_url || '/assets/coffee_icon.png'
                                    }
                                    alt={l.name}
                                    className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110"
                                    onError={(e) => {
                                        const fallback = getCategoryIcon(l.type, l.name) || '/assets/coffee_icon.png';
                                        if (e.target.src !== window.location.origin + fallback) {
                                            e.target.src = fallback;
                                        }
                                    }}
                                />
                                {l.ownerName && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-magenta-500 rounded-full flex items-center justify-center border border-white text-[8px] font-black z-20">🚩</div>
                                )}
                            </div>
                        </Marker>
                    ))}
                </Map>
            </div>

            {navigationSteps.length > 0 && navigationSteps[currentStepIndex] && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-[400px]">
                    <div className="bg-black/90 backdrop-blur-xl border border-magenta-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                        <div className="w-16 h-16 bg-magenta-500 rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,255,0.3)] text-2xl">
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
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-magenta-500/20 transition-all">🏠</div>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-magenta-400 transition-colors">Ana Ekran</span>
                </Link>
                <button onClick={() => document.getElementById('map-search-input')?.focus()} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-magenta-500/20 transition-all">🔍</div>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-magenta-400 transition-colors">Arama</span>
                </button>
                <button onClick={() => setIsLockMode(!isLockMode)} className={`flex flex-col items-center gap-1 group ${isLockMode ? 'text-magenta-400' : 'text-zinc-500'}`}>
                    <div className={`w-12 h-12 -mt-6 rounded-2xl flex items-center justify-center transition-all shadow-2xl border-2 ${isLockMode ? 'bg-magenta-500 border-white text-black scale-110 shadow-magenta-500/40' : 'bg-black/80 border-magenta-500/20 text-magenta-500 hover:border-magenta-500'}`}>📍</div>
                    <span className={`text-[7px] font-black uppercase tracking-widest ${isLockMode ? 'text-magenta-400' : 'text-zinc-500'}`}>Takip Modu</span>
                </button>
                <Link href="/dashboard/master" className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-magenta-500/20 transition-all">⚙️</div>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-magenta-400 transition-colors">Master Panel</span>
                </Link>
            </div>

            <div className="absolute left-4 top-32 z-[1000] flex flex-col gap-1">
                <button
                    onClick={() => {
                        setIsRotationMode(!isRotationMode);
                        if (!isRotationMode) {
                            setIsLockMode(true);
                            setViewState(prev => ({ ...prev, pitch: 60 }));
                        } else {
                            setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }));
                        }
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
                .maplibregl-popup-tip { border-top-color: rgba(255, 0, 255, 0.4) !important; }
                .maplibregl-canvas { outline: none !important; }
                .maplibregl-popup-close-button { color: white !important; font-size: 18px !important; padding: 8px !important; }
            `}</style>
        </div>
    );
}
