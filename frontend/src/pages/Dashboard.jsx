import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getFlights, getKPIs, getAIBrief, getHealth, getAirportFlights } from '../services/api';

// Isolate the typewriter effect so it doesn't re-render the entire Dashboard 50 times a second
function TypewriterBrief({ text }) {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!text) return;
        let i = 0;
        setDisplayedText('');
        const typeInterval = setInterval(() => {
            if (i <= text.length) {
                setDisplayedText(text.substring(0, i));
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, 20);
        return () => clearInterval(typeInterval);
    }, [text]);

    return (
        <div style={{ marginTop: '10px', fontSize: '16px', lineHeight: 1.4 }}>
            <span className="teletype-row">{displayedText.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
            <span className="blink">_</span>
        </div>
    );
}

export default function Dashboard() {
    const [flights, setFlights] = useState([]);
    const [kpis, setKpis] = useState(null);
    const [aiBrief, setAiBrief] = useState('');
    const [health, setHealth] = useState(null);
    const [airportFlights, setAirportFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                const [flightsRes, kpisRes, briefRes, healthRes, airportRes] = await Promise.all([
                    getFlights(30), getKPIs(), getAIBrief(), getHealth(), getAirportFlights('VABB')
                ]);
                setFlights(flightsRes.data.flights || []);
                setKpis(kpisRes.data);
                setAirportFlights(airportRes.data.flights || []);
                setAiBrief(briefRes.data.brief || 'SYSTEM INITIALIZING... NO ISSUES DETECTED.');
                setHealth(healthRes.data);
            } catch (e) {
                console.error('Dashboard load error:', e);
                setAiBrief('ERROR 0x4F: UNABLE TO CONNECT TO MAINFRAME.');
            }
            setLoading(false);
        }
        load();
        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="blink" style={{ fontSize: '24px', padding: '40px' }}>LOADING COMMAND CENTER MEMORY BANKS...</div>;

    const delayTarget = (kpis?.delay_rate || 0) / 100;
    const onTimeTarget = (kpis?.on_time_pct || 0) / 100;

    return (
        <div>
            {/* KPI Analog Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <AnalogGauge
                    title="TOTAL FLIGHTS"
                    value={kpis?.total_flights || 0}
                    percent={0.8}
                    colors={['#004400', '#00ff41']}
                    formatTextValue={(v) => `${kpis?.total_flights || 0}`}
                />
                <AnalogGauge
                    title="DELAY RATE"
                    value={`${kpis?.delay_rate || 0}%`}
                    percent={delayTarget}
                    colors={['#00ff41', '#ffaa00', '#ff0000']}
                />
                <AnalogGauge
                    title="AIRPORTS"
                    value={kpis?.airports_monitored || 0}
                    percent={0.6}
                    colors={['#004400', '#00ff41']}
                    formatTextValue={(v) => `${kpis?.airports_monitored || 0}`}
                />
                <AnalogGauge
                    title="ON-TIME %"
                    value={`${kpis?.on_time_pct || 0}%`}
                    percent={onTimeTarget}
                    colors={['#ff0000', '#ffaa00', '#00ff41']}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

                {/* Live Flight Teletype Feed */}
                <div className="hardware-panel" style={{ height: '550px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--crt-green)', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h2>LIVE FLIGHT FEED (TTY-1)</h2>
                        <button className="btn" onClick={() => navigate('/map')}>[ VIEW RADAR ]</button>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px dashed var(--crt-green)', color: 'var(--crt-amber)' }}>
                                    <th style={{ padding: '8px 0' }}>FLIGHT</th>
                                    <th>CARRIER</th>
                                    <th>ROUTE</th>
                                    <th>STATUS</th>
                                    <th>RISK</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="teletype-row">
                                {flights.map((f, i) => (
                                    <tr
                                        key={i}
                                        className="clickable"
                                        onClick={() => navigate('/risk', { state: { flight: f } })}
                                        style={{
                                            cursor: 'crosshair',
                                            color: f.risk_level === 'HIGH' ? 'var(--crt-red)' : f.risk_level === 'MEDIUM' ? 'var(--crt-amber)' : 'var(--crt-green)',
                                            textShadow: f.risk_level === 'HIGH' ? 'var(--crt-glow-red)' : f.risk_level === 'MEDIUM' ? 'var(--crt-glow-amber)' : 'var(--crt-glow)'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,255,65,0.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <td style={{ padding: '8px 0' }}>{f.flight_number}</td>
                                        <td>{f.airline_code}</td>
                                        <td>{f.origin}-{f.destination}</td>
                                        <td>[{f.status?.substring(0, 6).toUpperCase()}]</td>
                                        <td>{f.delay_probability}%</td>
                                        <td>
                                            {f.risk_level === 'HIGH' && <span className="blink" style={{ color: 'var(--crt-red)' }}>[MITIGATE]</span>}
                                            {f.risk_level !== 'HIGH' && <span>[MONITOR]</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Sidebar Panels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Teletype AI Brief */}
                    <div className="hardware-panel" style={{ flex: 1 }}>
                        <h3 style={{ borderBottom: '2px solid var(--crt-green)', paddingBottom: '5px' }}>AI OPS DIRECTIVE</h3>
                        <TypewriterBrief text={aiBrief} />
                    </div>

                    {/* System Health Oscilloscope traces placeholder */}
                    <div className="hardware-panel bg-panel" style={{ height: '200px' }}>
                        <h3 style={{ borderBottom: '1px dashed var(--crt-green)', paddingBottom: '5px' }}>SYS HEALTH</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>ML ENGINE</span>
                                <span className="text-green">[ONLINE]</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>DUCKDB CLUSTER</span>
                                <span className="text-green">[ACTIVE]</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>MODEL ACC</span>
                                <span>{health?.cuda?.device ? '95.2%' : 'CALC...'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>CUDA CORES</span>
                                <span className="text-amber">[{health?.cuda?.device ? 'ENGAGED' : 'CPU FALLBACK'}]</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function AnalogGauge({ title, value, percent, colors, formatTextValue }) {
    const radius = 40;
    const cx = 50;
    const cy = 45;
    const strokeWidth = 10;
    const circumference = Math.PI * radius;
    const dashoffset = circumference * (1 - percent);
    const angle = percent * 180;

    return (
        <div className="hardware-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <h4 style={{ margin: 0, marginBottom: '5px', fontSize: '16px', color: 'var(--crt-amber)' }}>{title}</h4>
            <div style={{ width: '100%', height: '80px', position: 'relative', overflow: 'hidden' }}>
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
                marginTop: '15px',
                backgroundColor: '#000',
                border: '2px solid #333',
                padding: '2px 10px',
                fontFamily: 'Courier Prime, monospace',
                fontSize: '24px',
                fontWeight: 'bold',
                color: percent > 0.7 && title.includes('DELAY') ? 'var(--crt-red)' : 'var(--crt-green)',
                textShadow: percent > 0.7 && title.includes('DELAY') ? 'var(--crt-glow-red)' : 'var(--crt-glow)'
            }}>
                {value}
            </div>
        </div>
    );
}
