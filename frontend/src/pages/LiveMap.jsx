import { useState, useEffect, useCallback, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getFlights, predictDelay, getWeather, getAircraftFlights, getFlightTrack } from '../services/api';
import { useRetroSound } from '../components/SoundProvider';
import 'leaflet/dist/leaflet.css';

// We use the native WebSocket API as a fallback if socket.io connection fails
// The backend is running FastAPI WebSocket, not Socket.IO native server
// Therefore we must use standard WebSockets
const WS_URL = "ws://localhost:8000/ws/flights";

// Airline Dispatch Radar Icon - Glowing Green Phosphor Plane
const _iconCache = {};

function createRadarIcon(heading = 90) {
    const h = Math.round(heading);
    if (_iconCache[h]) {
        return _iconCache[h];
    }

    const size = 24;
    const icon = L.divIcon({
        className: 'radar-icon-wrapper',
        html: `<div style="
            transform: rotate(${h}deg); 
            display:flex; align-items:center; justify-content:center; 
            width:${size}px; height:${size}px;
            filter: drop-shadow(0 0 5px var(--crt-green));
        ">
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="var(--crt-green)" stroke="var(--crt-green)" stroke-width="0">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <div style="
                position: absolute;
                bottom: -15px;
                width: 2px;
                height: 15px;
                background: linear-gradient(to top, transparent, rgba(0,255,65,0.5));
                transform: rotate(180deg);
            "></div>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });

    _iconCache[h] = icon;
    return icon;
}

// Recenter Map Helper
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true, duration: 0.5 });
    }, [center, zoom, map]);
    return null;
}

export default function LiveMap() {
    const [flights, setFlights] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [weather, setWeather] = useState(null);
    const [aircraftHistory, setAircraftHistory] = useState([]);
    const [flightTrack, setFlightTrack] = useState(null);
    const [aircraftMetadata, setAircraftMetadata] = useState(null);
    const [openSkyStatus, setOpenSkyStatus] = useState("CONNECTING...");
    const [view, setView] = useState('global');
    const navigate = useNavigate();
    const { playClick, playAlert, playType } = useRetroSound();

    // Weather Toggles
    const [showPrecip, setShowPrecip] = useState(false);
    const [showClouds, setShowClouds] = useState(false);

    // Socket Connection for Real-time open sky data
    useEffect(() => {
        let ws;
        let reconnectTimer;

        const connect = () => {
            console.log("Connecting to flight radar stream...");
            ws = new WebSocket(WS_URL);

            ws.onopen = () => console.log("Radar stream connected.");

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "flights_update" && Array.isArray(data.flights)) {
                        setFlights(data.flights);
                        if (data.status) {
                            setOpenSkyStatus(data.status);
                        }
                    }
                } catch (e) {
                    console.error("Radar telemetry error", e);
                }
            };

            ws.onclose = () => {
                console.log("Radar stream disconnected. Retrying...");
                reconnectTimer = setTimeout(connect, 5000);
            };
        };

        connect();

        return () => {
            if (ws) ws.close();
            clearTimeout(reconnectTimer);
        };
    }, []);

    // Load static data initially acting as fallback while socket boots
    const loadFallbackFlights = useCallback(async () => {
        if (flights.length > 0) return;
        try {
            const res = await getFlights(80);
            setFlights(res.data.flights || []);
        } catch (e) {
            console.error('Map fallback load error:', e);
        }
    }, [flights]);

    useEffect(() => {
        loadFallbackFlights();
    }, [loadFallbackFlights]);

    useEffect(() => {
        if (!selectedFlight) { setPrediction(null); setWeather(null); setAircraftHistory([]); setFlightTrack(null); return; }
        let cancelled = false;
        async function analyze() {
            try {
                // Determine origin if parsing OpenSky
                const origin = selectedFlight.origin || "UNK";
                const [predRes, wxRes, historyRes, trackRes, metaRes] = await Promise.all([
                    predictDelay({
                        flight_id: selectedFlight.id, airline: selectedFlight.airline || "UNK",
                        airline_code: selectedFlight.callsign?.substring(0, 2) || "XX", origin: origin,
                        destination: selectedFlight.destination || "UNK",
                    }),
                    getWeather(origin),
                    getAircraftFlights(selectedFlight.id).catch(() => ({ data: { flights: [] } })),
                    getFlightTrack(selectedFlight.id).catch(() => ({ data: null })),
                    getAircraftMetadata(selectedFlight.id).catch(() => ({ data: { metadata: null } }))
                ]);
                if (!cancelled) {
                    setPrediction(predRes.data);
                    setWeather(wxRes.data);
                    setAircraftHistory(historyRes?.data?.flights || []);
                    setFlightTrack(trackRes?.data);
                    setAircraftMetadata(metaRes?.data?.metadata);
                    playType();
                }
            } catch (e) { console.error(e); }
        }
        analyze();
        return () => { cancelled = true; };
    }, [selectedFlight, playType]);

    // Manual Re-center Views
    const handleViewChange = (v) => {
        playClick();
        setView(v);
        setSelectedFlight(null);
    };

    const getViewCenter = () => {
        if (selectedFlight && selectedFlight.lat && selectedFlight.lon) {
            return [selectedFlight.lat, selectedFlight.lon];
        }
        if (view === 'india') return [22, 79];
        // Global view
        return [20, 0];
    };

    const getViewZoom = () => {
        if (selectedFlight) return 5;
        if (view === 'india') return 5;
        return 3;
    };

    return (
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>

            {/* Main Radar Scope */}
            <div className="hardware-panel" style={{ flex: selectedFlight ? 2 : 1, position: 'relative', overflow: 'hidden', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h3 className="blink" style={{ margin: 0 }}>AEROSTREAM GLOBAL RADAR_</h3>
                        <span style={{
                            color: openSkyStatus === 'ONLINE' ? 'var(--crt-green)' : (openSkyStatus === 'OFFLINE' ? 'var(--crt-red)' : 'var(--crt-amber)'),
                            textShadow: '0 0 5px currentColor',
                            fontSize: '0.9rem'
                        }}>
                            [ OPENSKY: {openSkyStatus} ]
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className={`btn ${view === 'global' ? 'btn-active' : ''}`} onClick={() => handleViewChange('global')}>[ GLOBAL ]</button>
                        <button className={`btn ${view === 'india' ? 'btn-active' : ''}`} onClick={() => handleViewChange('india')}>[ SECTOR IN ]</button>

                        <div style={{ width: '2px', backgroundColor: 'var(--crt-green)', margin: '0 10px' }}></div>

                        <button className={`btn ${showPrecip ? 'btn-active' : ''}`} onClick={() => { playClick(); setShowPrecip(!showPrecip); }}>[ WX: PRECIP ]</button>
                        <button className={`btn ${showClouds ? 'btn-active' : ''}`} onClick={() => { playClick(); setShowClouds(!showClouds); }}>[ WX: CLOUD ]</button>
                    </div>
                </div>

                <div style={{ height: 'calc(100% - 40px)', border: '2px solid var(--crt-green)', position: 'relative', backgroundColor: '#000' }}>

                    {/* The sweeping radar line CSS animation overlay */}
                    <div className="radar-sweep"></div>

                    <MapContainer
                        center={getViewCenter()}
                        zoom={getViewZoom()}
                        style={{ height: '100%', width: '100%', backgroundColor: '#000' }}
                        zoomControl={false}
                        attributionControl={false}
                    >
                        {/* Custom Dark Theme Base Map with CSS filter mimicking green phosphor grid */}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            className="crt-map"
                        />

                        {/* OpenWeather Overlays tinting to CRT Green */}
                        {showPrecip && (
                            <TileLayer
                                url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=8b3e8c973a5a75661665bc758c0c451"
                                opacity={0.6}
                                className="crt-weather"
                            />
                        )}
                        {showClouds && (
                            <TileLayer
                                url="https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=8b3e8c973a5a75661665bc758c0c451"
                                opacity={0.4}
                                className="crt-weather"
                            />
                        )}

                        <ChangeView center={getViewCenter()} zoom={getViewZoom()} />

                        {flights.map((f, i) => {
                            // Backend handles lat/lon or origin_lat depending on mock vs opensky
                            const lat = f.lat || f.origin_lat;
                            const lon = f.lon || f.origin_lon;
                            if (!lat || !lon) return null;

                            return (
                                <Marker
                                    key={`${f.id}-${i}`}
                                    position={[lat, lon]}
                                    icon={createRadarIcon(f.heading || 0)}
                                    eventHandlers={{
                                        click: () => {
                                            playAlert();
                                            setSelectedFlight(f);
                                        },
                                    }}
                                />
                            );
                        })}

                        {/* Historical Track Rendering */}
                        {flightTrack && flightTrack.path && (
                            <Polyline
                                positions={flightTrack.path.map(p => [p.lat, p.lon])}
                                color="var(--crt-green)"
                                weight={2}
                                opacity={0.5}
                                dashArray="4, 8"
                            />
                        )}
                    </MapContainer>
                </div>
            </div>

            {/* Target Details Panel (Aircraft Monitor #12 style) */}
            {selectedFlight && (
                <div className="hardware-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--crt-green)', paddingBottom: '10px' }}>
                        <h3>AIRCRAFT MONITOR #12</h3>
                        <button className="btn" onClick={() => { playClick(); setSelectedFlight(null); }}>[ CLOSE ]</button>
                    </div>

                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 5px #fff' }}>
                        ID: {selectedFlight.callsign || selectedFlight.flight_number}
                    </div>

                    <div className="bg-panel">
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr><td style={{ padding: '5px 0', borderBottom: '1px dashed #333' }}>AIRLINE:</td><td style={{ color: '#fff' }}>{selectedFlight.airline || 'UNK'}</td></tr>
                                <tr><td style={{ padding: '5px 0', borderBottom: '1px dashed #333' }}>ROUTE:</td><td style={{ color: '#fff' }}>{selectedFlight.origin} → {selectedFlight.destination}</td></tr>
                                {aircraftMetadata && (
                                    <>
                                        <tr><td style={{ padding: '5px 0', borderBottom: '1px dashed #333' }}>REG/TAG:</td><td style={{ color: '#fff' }}>{aircraftMetadata.registration || 'UNK'}</td></tr>
                                        <tr><td style={{ padding: '5px 0', borderBottom: '1px dashed #333' }}>A/C TYPE:</td><td style={{ color: '#fff' }}>{aircraftMetadata.model || aircraftMetadata.typecode || 'UNK'}</td></tr>
                                        <tr><td style={{ padding: '5px 0', borderBottom: '1px dashed #333' }}>OWNER:</td><td style={{ color: 'var(--crt-amber)', fontSize: '12px' }}>{aircraftMetadata.owner || aircraftMetadata.operator || 'UNK'}</td></tr>
                                    </>
                                )}
                                <tr><td style={{ padding: '5px 0', borderBottom: '1px dashed #333' }}>ALTITUDE:</td><td style={{ color: '#fff' }}>{selectedFlight.altitude || '35000'} FT</td></tr>
                                <tr><td style={{ padding: '5px 0', borderBottom: '1px dashed #333' }}>SPEED:</td><td style={{ color: '#fff' }}>{selectedFlight.velocity || '450'} KTS</td></tr>
                                <tr><td style={{ padding: '5px 0' }}>HEADING:</td><td style={{ color: '#fff' }}>{selectedFlight.heading || '0'}°</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Gauges section mimicking Risk Intel */}
                    <h3 style={{ marginTop: '10px' }}>TELEMETRY & RISK</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {prediction && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                                <AnalogGauge title="DELAY PROB" value={`${Math.round(prediction.delay_probability)}%`} percent={prediction.delay_probability / 100} colors={['#00ff41', '#ffaa00', '#ff0000']} />
                                <AnalogGauge title="RISK LEVEL" value={prediction.risk_level} percent={prediction.risk_level === 'HIGH' ? 0.9 : prediction.risk_level === 'MEDIUM' ? 0.5 : 0.2} colors={['#00ff41', '#ffaa00', '#ff0000']} />
                            </div>
                        )}
                    </div>

                    {prediction && (
                        <div className="bg-panel">
                            <div className="text-amber" style={{ marginBottom: '10px' }}>AI FACTORS:</div>
                            {Object.entries(prediction.key_factors).map(([factor, impact], idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                    <span style={{ textTransform: 'uppercase' }}>{factor.replace(/_/g, ' ')}</span>
                                    <span>
                                        [{impact > 0.05 ? '+' : ''}{Math.round(impact * 100)}%]
                                        <div style={{ display: 'inline-block', width: '50px', height: '6px', backgroundColor: '#333', marginLeft: '10px' }}>
                                            <div style={{ width: `${Math.min(100, Math.abs(impact * 500))}%`, height: '100%', backgroundColor: impact > 0.05 ? 'var(--crt-red)' : 'var(--crt-green)' }}></div>
                                        </div>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {aircraftHistory.length > 0 && (
                        <div className="bg-panel" style={{ marginTop: '10px' }}>
                            <div className="text-amber" style={{ marginBottom: '5px', fontSize: '13px' }}>AIRCRAFT LOG (30D):</div>
                            <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '12px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <tbody>
                                        {aircraftHistory.slice(0, 15).map((h, i) => (
                                            <tr key={i} style={{ borderBottom: '1px dashed var(--crt-green)' }}>
                                                <td style={{ padding: '4px 0', width: '60px' }}>{h.origin}-{h.destination}</td>
                                                <td>{new Date(h.departure_time * 1000).toISOString().substring(5, 10)}</td>
                                                <td style={{ textAlign: 'right' }}>[{h.callsign}]</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {weather && (
                        <div className="bg-panel" style={{ marginTop: '10px' }}>
                            <div className="text-amber" style={{ marginBottom: '10px' }}>ORIGIN WX [{weather.airport_code}]:</div>
                            <div>TEMP: {weather.temperature_celsius}°C</div>
                            <div>WIND: {weather.wind_speed_kmh}km/h {weather.wind_direction}</div>
                            <div>VISIBILITY: {weather.visibility_km}km</div>
                            <div style={{ marginTop: '5px', fontWeight: 'bold' }}>COND: {weather.condition}</div>
                        </div>
                    )}

                    <button
                        className="btn"
                        style={{ marginTop: 'auto', textAlign: 'center' }}
                        onClick={() => { playClick(); navigate('/risk', { state: { flight: selectedFlight } }); }}
                    >
                        [&gt; INITIATE MITIGATION PROTOCOL &lt;]
                    </button>
                </div>
            )}

        </div>
    );
}

// Re-using the manual pure CSS gauge we built for Dashboard & Risk Intel
function AnalogGauge({ title, value, percent, colors }) {
    const radius = 40;
    const cx = 50;
    const cy = 45;
    const strokeWidth = 10;
    const circumference = Math.PI * radius;
    const dashoffset = circumference * (1 - percent);
    const angle = percent * 180;

    return (
        <div className="hardware-panel bg-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <h4 style={{ margin: 0, marginBottom: '5px', fontSize: '14px', color: 'var(--crt-amber)', textAlign: 'center' }}>{title}</h4>
            <div style={{ width: '100%', height: '70px', position: 'relative', overflow: 'hidden' }}>
                <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="#222" strokeWidth={strokeWidth} />
                    <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke={colors[Math.floor(percent * (colors.length - 1))] || 'var(--crt-green)'} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={dashoffset} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                    <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.5s ease-in-out' }}>
                        <polygon points={`${cx - 2},${cy} ${cx + 2},${cy} ${cx},${cy - radius + 5}`} fill="var(--crt-amber)" />
                        <circle cx={cx} cy={cy} r="3" fill="#000" stroke="var(--crt-amber)" strokeWidth="1" />
                    </g>
                </svg>
            </div>
            <div style={{
                marginTop: '10px',
                backgroundColor: '#000',
                border: '1px solid #333',
                padding: '2px 8px',
                fontFamily: 'Courier Prime, monospace',
                fontSize: '18px',
                fontWeight: 'bold',
                color: percent > 0.7 ? 'var(--crt-red)' : 'var(--crt-green)',
            }}>
                {value}
            </div>
        </div>
    );
}
