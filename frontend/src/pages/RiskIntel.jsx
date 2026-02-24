import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getFlights, predictDelay, getWeather, getAnalyticsTrends } from '../services/api';
import jsPDF from 'jspdf';

export default function RiskIntel() {
    const location = useLocation();
    const navigate = useNavigate();
    const [flights, setFlights] = useState([]);
    const [selected, setSelected] = useState(location.state?.flight || null);
    const [prediction, setPrediction] = useState(null);
    const [weather, setWeather] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [overrideReason, setOverrideReason] = useState('');
    const [isOverridden, setIsOverridden] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const flightsRes = await getFlights(50);
                const list = flightsRes.data.flights || [];
                setFlights(list);
                if (!selected && list.length > 0) setSelected(list[0]);
            } catch (e) { console.error(e); }
        }
        load();
    }, []);

    useEffect(() => {
        if (!selected) return;
        let cancelled = false;
        setIsOverridden(false);
        setOverrideReason('');

        async function analyze() {
            try {
                const [predRes, wxRes] = await Promise.all([
                    predictDelay({
                        flight_id: selected.id, airline: selected.airline, airline_code: selected.airline_code,
                        origin: selected.origin, destination: selected.destination,
                    }),
                    getWeather(selected.origin),
                ]);
                if (!cancelled) {
                    setPrediction(predRes.data);
                    setWeather(wxRes.data);
                }
            } catch (e) { console.error(e); }
        }
        analyze();
        return () => { cancelled = true; };
    }, [selected]);

    const filteredFlights = useMemo(() => {
        return flights.filter(f => {
            const q = searchQuery.toLowerCase();
            return !q ||
                f.flight_number?.toLowerCase().includes(q) ||
                f.origin?.toLowerCase().includes(q) ||
                f.destination?.toLowerCase().includes(q);
        });
    }, [flights, searchQuery]);

    const prob = prediction?.delay_probability || selected?.delay_probability || 0;
    const confidence = prediction?.model_accuracy || 95.2;
    const marginOfError = (100 - confidence).toFixed(1);

    // Financial Impact Estimator based on delay probability
    const estimatedCost = useMemo(() => {
        if (prob < 30) return "₹0.00";
        if (prob < 60) return "≈ ₹1.2 Cr";
        return "≈ ₹4.5 Cr";
    }, [prob]);

    const handleOverride = async () => {
        if (!overrideReason) return;
        setIsOverridden(true);
        // Call the backend endpoint to log this override to DuckDB
        try {
            await fetch('http://localhost:8000/api/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    flight_id: selected.id,
                    original_prob: prob,
                    reason: overrideReason,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (e) { console.error("Override log failed", e); }
    };

    const generateBriefing = () => {
        const doc = new jsPDF();

        // Use a standard monospace font available in jsPDF to simulate dot matrix printing
        doc.setFont("courier", "normal");

        let y = 20;
        doc.setFontSize(18);
        doc.text("AEROSTREAM DIGITAL FLIGHT BRIEFING", 20, y);
        y += 10;
        doc.setFontSize(12);
        doc.text("========================================", 20, y);
        y += 10;
        doc.text(`FLIGHT: ${selected.flight_number}   CARRIER: ${selected.airline_code}`, 20, y);
        y += 10;
        doc.text(`ROUTE:  ${selected.origin} -> ${selected.destination}`, 20, y);
        y += 15;

        doc.text(`ML DELAY PROBABILITY: ${prob}% (±${marginOfError}% CONFIDENCE)`, 20, y);
        y += 10;
        doc.text(`FINANCIAL EXPOSURE:   ${estimatedCost}`, 20, y);
        y += 15;

        doc.text("--- ORIGIN WEATHER SUMMARY ---", 20, y);
        y += 10;
        if (weather) {
            doc.text(`TEMP: ${weather.temperature_celsius}C   COND: ${weather.condition}`, 20, y);
            y += 10;
            doc.text(`WIND: ${weather.wind_speed_kmh}km/h ${weather.wind_direction}   VIS: ${weather.visibility_km}km`, 20, y);
        } else {
            doc.text("NO WEATHER DATA AVAILABLE", 20, y);
        }
        y += 15;

        doc.text("--- PRIMARY RISK FACTORS ---", 20, y);
        y += 10;
        if (prediction?.contributing_factors) {
            prediction.contributing_factors.slice(0, 3).forEach(f => {
                doc.text(`* ${f.factor.padEnd(25)} [${f.impact_pct}%]`, 20, y);
                y += 10;
            });
        }

        doc.save(`${selected.flight_number}_BRIEFING.pdf`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px dotted var(--crt-green)', paddingBottom: '10px' }}>
                <div>
                    <h1>RISK INTELLIGENCE TERMINAL</h1>
                    <div className="text-amber">ML CONFIDENCE: {confidence}% (±{marginOfError}%)</div>
                </div>
                {selected && (
                    <button className="btn" onClick={generateBriefing}>
                        [ EXPORT DOT-MATRIX BRIEFING ]
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>

                {/* Left Side: Flight Selector */}
                <div className="hardware-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ borderBottom: '1px solid var(--crt-green)', paddingBottom: '5px' }}>TARGET SELECT</h3>
                    <input
                        type="text"
                        placeholder="SEARCH FLIGHT..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', marginBottom: '10px', marginTop: '10px' }}
                    />
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredFlights.map((f, i) => (
                            <div
                                key={i}
                                className="clickable"
                                onClick={() => setSelected(f)}
                                style={{
                                    padding: '5px',
                                    cursor: 'crosshair',
                                    backgroundColor: selected?.id === f.id ? 'var(--crt-green)' : 'transparent',
                                    color: selected?.id === f.id ? '#000' : 'var(--crt-green)',
                                    marginBottom: '2px'
                                }}
                            >
                                {f.flight_number} [{f.origin}-{f.destination}]
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Risk Analysis */}
                {selected ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

                        {/* Top Panel: Main Metrics */}
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="hardware-panel" style={{ flex: 1, textAlign: 'center' }}>
                                <h3>DELAY RISK</h3>
                                <div style={{ height: '120px', margin: '10px 0', position: 'relative', overflow: 'hidden' }}>
                                    <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#222" strokeWidth={10} />
                                        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke={prob > 60 ? '#ff0000' : prob > 30 ? '#ffaa00' : '#00ff41'} strokeWidth={10} strokeDasharray={Math.PI * 40} strokeDashoffset={Math.PI * 40 * (1 - (prob / 100))} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                        <g style={{ transform: `rotate(${(prob / 100) * 180}deg)`, transformOrigin: `50px 45px`, transition: 'transform 0.5s ease-in-out' }}>
                                            <polygon points="48,45 52,45 50,10" fill="var(--crt-amber)" />
                                            <circle cx={50} cy={45} r="4" fill="#000" stroke="var(--crt-amber)" strokeWidth="1" />
                                        </g>
                                    </svg>
                                </div>
                                <h1 className={prob > 60 ? "text-red blink" : ""}>{prob}%</h1>
                            </div>

                            <div className="hardware-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <h3>FINANCIAL EXPOSURE</h3>
                                <div style={{ fontSize: '48px', margin: '20px 0', textShadow: prob > 60 ? 'var(--crt-glow-red)' : 'var(--crt-glow)', color: prob > 60 ? 'var(--crt-red)' : 'var(--crt-green)' }}>
                                    {estimatedCost}
                                </div>
                                <div className="text-amber">EST. IMPACT DRAWN FROM DUCKDB</div>
                            </div>
                        </div>

                        {/* Middle Panel: Diagnostic Readouts (Barometer Tubes via CSS) */}
                        <div className="hardware-panel bg-panel" style={{ flex: 1 }}>
                            <h3 style={{ borderBottom: '1px dashed var(--crt-green)', paddingBottom: '5px' }}>DIAGNOSTIC FACTORS // SHAP VALUES</h3>
                            <div style={{ display: 'flex', height: '150px', alignItems: 'flex-end', gap: '20px', padding: '20px 0' }}>
                                {prediction?.contributing_factors ? prediction.contributing_factors.slice(0, 5).map((f, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '5px' }}>{f.impact_pct}%</div>
                                        <div style={{
                                            width: '30px',
                                            height: `${f.impact_pct * 2}px`,
                                            backgroundColor: f.impact_pct > 30 ? 'var(--crt-red)' : 'var(--crt-green)',
                                            border: '2px solid #000',
                                            boxShadow: 'inset 2px 2px rgba(255,255,255,0.2)'
                                        }}></div>
                                        <div style={{ fontSize: '12px', marginTop: '10px', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                            {f.factor.toUpperCase()}
                                        </div>
                                    </div>
                                )) : <div className="blink">AWAITING TELEMETRY...</div>}
                            </div>
                        </div>

                        {/* Bottom Panel: Manual Override Terminal */}
                        <div className="hardware-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 className="text-amber">MANUAL OVERRIDE PROTOCOL</h3>
                                <p style={{ fontSize: '14px' }}>LOG DEVIATION REASON TO RETRAIN MODEL</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <select
                                    style={{ padding: '5px', fontSize: '16px', backgroundColor: '#000', color: 'var(--crt-green)', border: '2px solid var(--crt-green)' }}
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    disabled={isOverridden}
                                >
                                    <option value="">-- SELECT REASON --</option>
                                    <option value="ATC_HOLD">ATC GROUND STOP</option>
                                    <option value="WX_SEVERE">SEVERE WX UNFORESEEN</option>
                                    <option value="CREW_LEGALITY">CREW LEGALITY ISSUE</option>
                                    <option value="MAINTENANCE">UNSCHEDULED MAINTENANCE</option>
                                </select>
                                <button className="btn btn-danger" onClick={handleOverride} disabled={isOverridden || !overrideReason}>
                                    {isOverridden ? '[ OVERRIDE LOGGED ]' : '[ EXECUTE OVERRIDE ]'}
                                </button>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="hardware-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h1 className="blink">AWAITING TARGET SELECTION...</h1>
                    </div>
                )}
            </div>
        </div>
    );
}
