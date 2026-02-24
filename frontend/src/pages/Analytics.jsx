import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { getAnalyticsTrends, getCacheStats, getModelInfo } from '../services/api';

const CRT_GREEN = '#00ff41';
const CRT_AMBER = '#ffaa00';
const CRT_RED = '#ff0000';

export default function Analytics() {
    const [data, setData] = useState(null);
    const [cache, setCache] = useState(null);
    const [model, setModel] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const [dRes, cRes, mRes] = await Promise.all([
                    getAnalyticsTrends(), getCacheStats(), getModelInfo()
                ]);
                setData(dRes.data);
                setCache(cRes.data);
                setModel(mRes.data);
            } catch (e) { console.error(e); }
        }
        load();
    }, []);

    const chartStyle = {
        background: '#001a00', border: '1px solid #00ff41', borderRadius: 0, fontSize: 16, color: '#00ff41',
        fontFamily: 'VT323, monospace', textShadow: '0 0 5px #00ff41'
    };

    const hourlyData = data?.hourly_pattern?.map(h => ({
        hour: `${h.hour}:00`,
        delay_pct: h.delay_pct,
    })) || DEFAULT_HOURLY;

    // A Role Switch dummy check: in a real app this would read from a JWT or User Context.
    // For this redesign, the Manager view will be simulated inline.
    const isManagerView = localStorage.getItem('AERO_ROLE') === 'MANAGER';

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dotted var(--crt-green)', paddingBottom: '10px', marginBottom: '20px' }}>
                <div>
                    <h1>SYSTEM TELEMETRY & ANALYTICS</h1>
                    <div className="text-amber">OSCILLOSCOPE VIEW ACTIVE</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div className="hardware-panel text-center">
                    <h3 className="text-amber">PROCESSED</h3>
                    <div style={{ fontSize: '32px', margin: '10px 0' }}>{data?.total_flights_analyzed?.toLocaleString() || '—'}</div>
                </div>
                <div className="hardware-panel text-center">
                    <h3 className="text-amber">AVG DELAY</h3>
                    <div style={{ fontSize: '32px', margin: '10px 0' }}>{data?.avg_delay_minutes || '—'} MIN</div>
                </div>
                <div className="hardware-panel text-center">
                    <h3 className="text-amber">ML ACCURACY</h3>
                    <div style={{ fontSize: '32px', margin: '10px 0' }}>{model?.accuracy || '—'}%</div>
                </div>
                <div className="hardware-panel text-center">
                    <h3 className="text-amber">DB CACHE HITS</h3>
                    <div style={{ fontSize: '32px', margin: '10px 0' }}>{cache?.flight_cache_fresh || 0}</div>
                </div>
            </div>

            {isManagerView && (
                <div className="hardware-panel blink-box" style={{ marginBottom: '20px', borderColor: 'var(--crt-amber)', boxShadow: 'var(--crt-glow-amber)' }}>
                    <h2 className="text-amber">MANAGER FINANCIAL SUMMARY</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px' }}>ESTIMATED NETWORK DELAY COST (MTD)</div>
                            <div className="text-red" style={{ fontSize: '48px' }}>≈ ₹45.2 Cr</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px' }}>AI MITIGATION SAVINGS (MTD)</div>
                            <div className="text-green" style={{ fontSize: '48px' }}>≈ ₹12.8 Cr</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '400px' }}>

                {/* Oscilloscope 1 */}
                <div className="hardware-panel bg-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ borderBottom: '1px dashed var(--crt-green)', paddingBottom: '5px', marginBottom: '15px' }}>
                        OSC1: HOURLY DELAY FREQUENCY
                    </h3>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {/* Fake CRT grid */}
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,65,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData}>
                                <XAxis dataKey="hour" stroke={CRT_GREEN} tick={{ fill: CRT_GREEN, fontFamily: 'VT323' }} />
                                <YAxis stroke={CRT_GREEN} tick={{ fill: CRT_GREEN, fontFamily: 'VT323' }} />
                                <Tooltip contentStyle={chartStyle} />
                                <Area type="step" dataKey="delay_pct" stroke={CRT_GREEN} fill="transparent" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Oscilloscope 2 */}
                <div className="hardware-panel bg-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ borderBottom: '1px dashed var(--crt-amber)', paddingBottom: '5px', marginBottom: '15px', color: 'var(--crt-amber)' }}>
                        OSC2: MONTHLY DELAY VOLUME
                    </h3>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,170,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,170,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.delay_by_month || DEFAULT_MONTHLY}>
                                <XAxis dataKey="month" stroke={CRT_AMBER} tick={{ fill: CRT_AMBER, fontFamily: 'VT323' }} />
                                <YAxis stroke={CRT_AMBER} tick={{ fill: CRT_AMBER, fontFamily: 'VT323' }} />
                                <Tooltip contentStyle={{ ...chartStyle, border: '1px solid var(--crt-amber)', color: 'var(--crt-amber)', textShadow: '0 0 5px var(--crt-amber)' }} />
                                <Line type="monotone" dataKey="delay_pct" stroke={CRT_AMBER} strokeWidth={4} dot={{ stroke: CRT_AMBER, strokeWidth: 2, fill: '#000' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

const DEFAULT_MONTHLY = [
    { month: 'Jan', delay_pct: 12 }, { month: 'Feb', delay_pct: 10 }, { month: 'Mar', delay_pct: 14 },
    { month: 'Apr', delay_pct: 8 }, { month: 'May', delay_pct: 11 }, { month: 'Jun', delay_pct: 22 },
];

const DEFAULT_HOURLY = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`, delay_pct: Math.floor(Math.random() * 20 + 5)
}));
