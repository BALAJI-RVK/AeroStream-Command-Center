import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRetroSound } from '../components/SoundProvider';

export default function OpsStrategy() {
    const location = useLocation();
    const [flights, setFlights] = useState([]);
    const [selected, setSelected] = useState(location.state?.flight || null);

    // What-If Simulator states
    const [simWind, setSimWind] = useState(15);
    const [simAircraft, setSimAircraft] = useState('A320');
    const [simCrew, setSimCrew] = useState('STANDARD');

    const [mitigation, setMitigation] = useState(null);
    const [loading, setLoading] = useState(false);

    // Typewriter effect state
    const [typedText, setTypedText] = useState('');
    const { playType } = useRetroSound();

    useEffect(() => {
        // Mock loading 
        const mockFlights = [
            { id: 1, flight_number: '6E-205', origin: 'DEL', destination: 'BOM', delay_probability: 82, risk_level: 'HIGH', airline: 'IndiGo' },
            { id: 2, flight_number: 'AI-101', origin: 'BOM', destination: 'JFK', delay_probability: 45, risk_level: 'MEDIUM', airline: 'Air India' },
            { id: 3, flight_number: 'UK-956', origin: 'BLR', destination: 'DEL', delay_probability: 12, risk_level: 'LOW', airline: 'Vistara' }
        ];
        setFlights(mockFlights);
        if (!selected) setSelected(mockFlights[0]);
    }, []);

    const runSimulation = async () => {
        if (!selected) return;
        setLoading(true);
        setMitigation(null);
        setTypedText('');

        try {
            // Simulated call to /api/simulate
            await new Promise(r => setTimeout(r, 1500));

            // Adjust mock data based on simulation params
            let baseProb = selected.delay_probability;
            if (simWind > 30) baseProb += 20;
            if (simAircraft === 'B777') baseProb -= 10;
            if (simCrew === 'RESERVE') baseProb += 15;

            const finalProb = Math.min(Math.max(baseProb, 5), 99);

            const rawText = `
DIRECTIVE: AI MITIGATION PROTOCOL ENGAGED
TARGET: ${selected.flight_number} // ${selected.origin} -> ${selected.destination}
ANALYSIS ENGINE: GEMINI 2.0 FLASH + XGBOOST

SIMULATED CONDITIONS:
- WIND SHEAR: ${simWind} KTS
- AIRCRAFT TYPE: ${simAircraft}
- CREW STATUS: ${simCrew}

PREDICTED DELAY PROBABILITY SHIFT: ${selected.delay_probability}% -> ${finalProb}%

RECOMMENDED ACTIONS:
[ ] DISPATCH RESERVE CREW TO ${selected.origin}
[ ] UPLOAD +2.5T EXTRA FUEL FOR HOLDING PATTERNS
[ ] PRE-ACKNOWLEDGE ATC REROUTE VIA SECTOR 4
[ ] ISSUE PASSENGER VOUCHERS PREEMPTIVELY

ESTIMATED COST SAVINGS: ≈ ₹${(finalProb * 0.1).toFixed(2)} Cr
AI CONFIDENCE: 94.2%
            `.trim();

            setMitigation({ text: rawText, finalProb });

            // Typewriter effect
            let i = 0;
            const interval = setInterval(() => {
                if (i < rawText.length) {
                    setTypedText(prev => prev + rawText.charAt(i));
                    if (i % 3 === 0) playType();
                    i++;
                } else {
                    clearInterval(interval);
                    setLoading(false);
                }
            }, 10);

        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dotted var(--crt-green)', paddingBottom: '10px', marginBottom: '20px' }}>
                <div>
                    <h1>OPERATIONAL STRATEGY & SIMULATION</h1>
                    <div className="text-amber">WHAT-IF SCENARIO GENERATOR</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>

                {/* Left Column: Flight Select & Sim Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div className="hardware-panel">
                        <h3 style={{ borderBottom: '1px solid var(--crt-green)', paddingBottom: '5px' }}>TARGET FLIGHT</h3>
                        <div style={{ marginTop: '10px' }}>
                            {flights.map((f, i) => (
                                <div
                                    key={i}
                                    className="clickable"
                                    onClick={() => { setSelected(f); setMitigation(null); setTypedText(''); }}
                                    style={{
                                        padding: '5px',
                                        cursor: 'crosshair',
                                        backgroundColor: selected?.id === f.id ? 'var(--crt-green)' : 'transparent',
                                        color: selected?.id === f.id ? '#000' : 'var(--crt-green)',
                                        marginBottom: '2px',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <span>{f.flight_number}</span>
                                    <span>{f.delay_probability}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hardware-panel bg-panel">
                        <h3 style={{ borderBottom: '1px dashed var(--crt-green)', paddingBottom: '5px' }}>SIMULATION PARAMS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>WIND SPEED (KTS): {simWind}</label>
                                <input
                                    type="range"
                                    min="0" max="60"
                                    value={simWind}
                                    onChange={(e) => setSimWind(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'ew-resize' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>AIRCRAFT SWAP:</label>
                                <select
                                    value={simAircraft}
                                    onChange={(e) => setSimAircraft(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="A320">A320 (STANDARD)</option>
                                    <option value="A321">A321 (HIGH CAP)</option>
                                    <option value="B777">B777 (HEAVY)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>CREW ALLOCATION:</label>
                                <select
                                    value={simCrew}
                                    onChange={(e) => setSimCrew(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="STANDARD">STANDARD ROSTER</option>
                                    <option value="RESERVE">RESERVE CREW ACTIVATED</option>
                                </select>
                            </div>

                            <button
                                className="btn"
                                onClick={runSimulation}
                                disabled={loading}
                                style={{ marginTop: '10px', border: '2px solid var(--crt-amber)', color: 'var(--crt-amber)' }}
                            >
                                {loading ? '[ SIMULATING... ]' : '[ RUN GEMINI SIMULATION ]'}
                            </button>

                        </div>
                    </div>
                </div>

                {/* Right Column: Output Paper / Typewriter */}
                <div className="hardware-panel" style={{ backgroundColor: '#eeeeee', color: '#000', textShadow: 'none', border: '4px solid #fff', position: 'relative', overflow: 'hidden' }}>
                    {/* Fake tractor feed holes on the sides */}
                    <div style={{ position: 'absolute', top: 0, left: '5px', height: '100%', width: '15px', borderRight: '1px dotted #ccc', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                        {[...Array(20)].map((_, i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #ddd' }}></div>)}
                    </div>
                    <div style={{ position: 'absolute', top: 0, right: '5px', height: '100%', width: '15px', borderLeft: '1px dotted #ccc', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                        {[...Array(20)].map((_, i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #ddd', marginLeft: 'auto' }}></div>)}
                    </div>

                    <div style={{ padding: '30px 40px', fontFamily: 'Courier Prime, monospace', fontSize: '18px', fontWeight: 'bold', minHeight: '500px' }}>
                        {!mitigation && !loading && (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>
                                AWAITING SIMULATION PARAMETERS...
                            </div>
                        )}

                        {(mitigation || loading) && (
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                {typedText}
                                {loading && <span className="blink">_</span>}
                            </div>
                        )}

                        {mitigation && !loading && (
                            <div style={{ marginTop: '40px', borderTop: '2px dashed #000', paddingTop: '20px' }}>
                                <button className="btn" style={{ backgroundColor: '#000', color: 'var(--crt-green)', border: 'none', padding: '10px 20px' }}>
                                    [ EXECUTE DIRECTIVE & COMMIT TO DUCKDB ]
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
