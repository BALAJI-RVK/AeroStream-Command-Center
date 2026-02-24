import { useState, useEffect, useCallback, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { getFlights, predictDelay, getWeather } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Airline Dispatch Radar Icon 
function createRadarIcon(riskLevel, heading = 90) {
    const color = riskLevel === 'HIGH' ? '#ff0000' : riskLevel === 'MEDIUM' ? '#ffaa00' : '#00ff41';
    const size = riskLevel === 'HIGH' ? 30 : 20;

    return L.divIcon({
        className: 'radar-icon-wrapper',
        html: `<div style="
            transform: rotate(${heading}deg); 
            display:flex; align-items:center; justify-content:center; 
            width:${size}px; height:${size}px;
            filter: drop-shadow(0 0 5px ${color});
            animation: ${riskLevel === 'HIGH' ? 'blink 1s infinite' : 'none'};
        ">
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#000" stroke-width="1">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
}

function calcBearing(lat1, lon1, lat2, lon2) {
    const toRad = d => d * Math.PI / 180;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true, duration: 0.5 });
    }, [center, zoom, map]);
    return null;
}

export default function LiveMap() {
    const [flights, setFlights] = useState([]);
    const [filter, setFilter] = useState('all');
    const [view, setView] = useState('global');
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [weather, setWeather] = useState(null);
    const navigate = useNavigate();

    const loadFlights = useCallback(async () => {
        try {
            const res = await getFlights(80);
            setFlights(res.data.flights || []);
        } catch (e) {
            console.error('Map load error:', e);
        }
    }, []);

    useEffect(() => {
        loadFlights();
        const timer = setInterval(loadFlights, 60000);
        return () => clearInterval(timer);
    }, [loadFlights]);

    useEffect(() => {
        if (!selectedFlight) { setPrediction(null); setWeather(null); return; }
        let cancelled = false;
        async function analyze() {
            try {
                const [predRes, wxRes] = await Promise.all([
                    predictDelay({
                        flight_id: selectedFlight.id, airline: selectedFlight.airline,
                        airline_code: selectedFlight.airline_code, origin: selectedFlight.origin,
                        destination: selectedFlight.destination,
                    }),
                    getWeather(selectedFlight.origin),
                ]);
                if (!cancelled) {
                    setPrediction(predRes.data);
                    setWeather(wxRes.data);
                }
            } catch (e) { console.error(e); }
        }
        analyze();
        return () => { cancelled = true; };
    }, [selectedFlight]);

    const center = view === 'india' ? [20.5937, 78.9629] : view === 'us' ? [39.8, -98.5] : [20, 0];
    const zoom = view === 'india' ? 5 : view === 'us' ? 4 : 2;

    const filtered = flights.filter(f => {
        if (filter === 'all') return true;
        return f.risk_level?.toLowerCase() === filter;
    });

    return (
        <div style={{ position: 'relative', height: 'calc(100vh - 120px)', border: '2px solid var(--crt-green)' }}>

            {/* Dark green overlay to make the map look like a radar scope */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 40, 0, 0.5)', zIndex: 400, pointerEvents: 'none',
                mixBlendMode: 'multiply'
            }}></div>

            {/* Sweep Animation */}
            <div className="radar-sweep" style={{
                position: 'absolute', top: '50%', left: '50%', width: '100vw', height: '2px',
                background: 'linear-gradient(90deg, rgba(0,255,65,0) 0%, rgba(0,255,65,0.8) 100%)',
                zIndex: 401, pointerEvents: 'none', transformOrigin: '0 0',
                animation: 'sweep 4s linear infinite'
            }}></div>

            <style>{`
                @keyframes sweep {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .radar-icon-wrapper { background: none !important; border: none !important; }
                .leaflet-popup-content-wrapper { 
                    background: var(--crt-bg-panel) !important; 
                    color: var(--crt-green) !important; 
                    border: 2px solid var(--crt-green) !important; 
                    border-radius: 0 !important;
                    font-family: 'VT323', monospace !important;
                    text-shadow: var(--crt-glow) !important;
                }
                .leaflet-popup-tip { background: var(--crt-bg-panel) !important; }
                .leaflet-container { background: #000 !important; cursor: crosshair !important; }
            `}</style>

            {/* Top Left Controls */}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="hardware-panel" style={{ padding: '10px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--crt-amber)' }}>SECTOR FOCUS</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn" onClick={() => setView('global')}>GLOB</button>
                        <button className="btn" onClick={() => setView('us')}>NAMER</button>
                        <button className="btn" onClick={() => setView('india')}>APAC</button>
                    </div>
                </div>

                <div className="hardware-panel" style={{ padding: '10px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--crt-amber)' }}>FILTER BY RISK</div>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <button className="btn" onClick={() => setFilter('all')}>[ ALL ]</button>
                        <button className="btn btn-danger" onClick={() => setFilter('high')}>[ HIGH ]</button>
                    </div>
                </div>
            </div>

            {/* Map */}
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ width: '100%', height: '100%', zIndex: 1 }}
                zoomControl={false}
            >
                <ChangeView center={center} zoom={zoom} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                />

                {filtered.map((f, i) => {
                    const oLat = f.origin_lat || 20;
                    const oLon = f.origin_lon || 78;
                    const dLat = f.dest_lat || 21;
                    const dLon = f.dest_lon || 79;
                    const midLat = (oLat + dLat) / 2 + (Math.sin(i * 7) * 1.5);
                    const midLon = (oLon + dLon) / 2 + (Math.cos(i * 7) * 1.5);
                    const heading = calcBearing(oLat, oLon, dLat, dLon);
                    const color = f.risk_level === 'HIGH' ? '#ff0000' : f.risk_level === 'MEDIUM' ? '#ffaa00' : '#00ff41';

                    return (
                        <Fragment key={`flight-${i}`}>
                            <Polyline
                                positions={[[oLat, oLon], [dLat, dLon]]}
                                pathOptions={{ color, weight: f.risk_level === 'HIGH' ? 2 : 1, opacity: 0.5, dashArray: '4 4' }}
                            />
                            <Marker
                                position={[midLat, midLon]}
                                icon={createRadarIcon(f.risk_level, heading)}
                                eventHandlers={{ click: () => setSelectedFlight(f) }}
                            >
                                <Popup>
                                    <div style={{ fontSize: '18px', lineHeight: 1.2 }}>
                                        <div style={{ borderBottom: '1px solid var(--crt-green)', marginBottom: '5px' }}>ID: {f.flight_number}</div>
                                        <div>RTE: {f.origin}-{f.destination}</div>
                                        <div style={{ color }}>RSK: {f.delay_probability}% ({f.risk_level})</div>
                                        <div style={{ marginTop: '10px' }}>
                                            <button className="btn" style={{ padding: '2px 8px', fontSize: '14px' }} onClick={() => setSelectedFlight(f)}>
                                                [ DETAILS ]
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        </Fragment>
                    );
                })}
            </MapContainer>

            {/* Right Side Flight Detail Panel */}
            {selectedFlight && (
                <div className="hardware-panel" style={{
                    position: 'absolute', top: 0, right: 0, width: '400px', height: '100%',
                    zIndex: 1002, overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--crt-green)', paddingBottom: '10px', marginBottom: '15px' }}>
                        <h2>TARGET: {selectedFlight.flight_number}</h2>
                        <button className="btn" onClick={() => setSelectedFlight(null)}>[ X ]</button>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div><strong>CARRIER:</strong> {selectedFlight.airline}</div>
                        <div><strong>ROUTE:</strong> {selectedFlight.origin} &gt; {selectedFlight.destination}</div>
                        <div><strong>STATUS:</strong> {selectedFlight.status}</div>
                    </div>

                    <div className="bg-panel" style={{ padding: '10px', marginBottom: '20px' }}>
                        <h3 style={{ color: selectedFlight.risk_level === 'HIGH' ? 'var(--crt-red)' : 'var(--crt-amber)' }}>
                            DELAY PROBABILITY: {prediction?.delay_probability || selectedFlight.delay_probability}%
                        </h3>
                        {prediction && (
                            <div style={{ marginTop: '10px' }}>
                                <strong>PRIMARY FACTORS:</strong>
                                <ul style={{ listStyleType: 'none', paddingLeft: '10px', marginTop: '5px' }}>
                                    {prediction.contributing_factors.slice(0, 3).map((f, i) => (
                                        <li key={i}>- {f.factor} ({f.impact_pct}%)</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {weather && (
                        <div className="bg-panel" style={{ padding: '10px', marginBottom: '20px' }}>
                            <h3 style={{ color: 'var(--crt-amber)' }}>WX at {selectedFlight.origin}</h3>
                            <div>TEMP: {weather.temperature_celsius}C</div>
                            <div>WIND: {weather.wind_speed_kmh}km/h {weather.wind_direction}</div>
                            <div>VIS: {weather.visibility_km}km</div>
                            <div>COND: {weather.condition.toUpperCase()}</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <button className="btn" onClick={() => navigate('/risk', { state: { flight: selectedFlight } })}>
                            [ OPEN RISK PROFILE ]
                        </button>
                        <button className="btn btn-danger" onClick={() => navigate('/strategy', { state: { flight: selectedFlight } })}>
                            [ INITIATE MITIGATION ]
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
