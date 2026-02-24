import { useState, useEffect } from 'react';
import { getHealth, getCacheStats, clearCache, getModelInfo } from '../services/api';
import { useRetroSound } from '../components/SoundProvider';

export default function SettingsPage() {
    const [health, setHealth] = useState(null);
    const [cache, setCache] = useState(null);
    const [model, setModel] = useState(null);
    const [clearing, setClearing] = useState(false);

    // Physical Toggle States
    const [crtEnabled, setCrtEnabled] = useState(true);
    const [scanlines, setScanlines] = useState(true);
    const [role, setRole] = useState(localStorage.getItem('AERO_ROLE') || 'DISPATCH');

    const { playClick } = useRetroSound();

    useEffect(() => {
        async function load() {
            try {
                const [hRes, cRes, mRes] = await Promise.all([getHealth(), getCacheStats(), getModelInfo()]);
                setHealth(hRes.data);
                setCache(cRes.data);
                setModel(mRes.data);
            } catch (e) { console.error(e); }
        }
        load();
    }, []);

    const handleClearCache = async () => {
        setClearing(true);
        playClick();
        try {
            await clearCache();
            const cRes = await getCacheStats();
            setCache(cRes.data);
        } catch (e) { console.error(e); }
        setClearing(false);
    };

    const handleRoleSwitch = (newRole) => {
        setRole(newRole);
        localStorage.setItem('AERO_ROLE', newRole);
        playClick();
        // Option: we could window.location.reload() here to force UI redraw 
        // for demo purposes so the 'Manager' Financial view dynamically shows up.
        window.location.reload();
    };

    const toggleCRT = () => {
        setCrtEnabled(!crtEnabled);
        playClick();
        // In a real app we'd toggle a top level class on the <body/> tag here
        document.body.classList.toggle('crt-disabled');
    };

    const toggleScanlines = () => {
        setScanlines(!scanlines);
        playClick();
        document.body.classList.toggle('scanlines-disabled');
    };

    // Helper for Physical Flip Switch CSS
    const Switch = ({ checked, onChange, label }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div
                onClick={onChange}
                style={{
                    width: '40px', height: '80px',
                    backgroundColor: '#111',
                    border: '2px solid #333',
                    borderRadius: '5px',
                    position: 'relative',
                    cursor: 'pointer',
                    boxShadow: 'inset 0 0 10px #000, 2px 2px 5px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{
                    position: 'absolute',
                    width: '36px', height: '40px',
                    left: '0px',
                    top: checked ? '0px' : '36px',
                    backgroundColor: checked ? 'var(--crt-green)' : '#444',
                    border: '2px solid #222',
                    borderRadius: '3px',
                    transition: 'top 0.1s ease',
                    boxShadow: checked ? '0 0 10px var(--crt-green)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ width: '80%', height: '2px', backgroundColor: '#000', margin: '2px 0' }}></div>
                </div>
            </div>
            <span style={{ fontSize: '14px', color: checked ? 'var(--crt-green)' : '#666' }}>{label}</span>
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dotted var(--crt-green)', paddingBottom: '10px', marginBottom: '20px' }}>
                <div>
                    <h1>SYSTEM CONFIGURATION PANEL</h1>
                    <div className="text-amber">MAINTENANCE & CALIBRATION</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Physical Controls Row */}
                <div className="hardware-panel" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '40px 20px' }}>

                    <Switch checked={crtEnabled} onChange={toggleCRT} label="CRT BEAM" />

                    <Switch checked={scanlines} onChange={toggleScanlines} label="SCANLINES" />

                    {/* Big red reset button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginLeft: '40px' }}>
                        <button
                            onMouseDown={handleClearCache}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                backgroundColor: 'var(--crt-red)', border: 'none',
                                boxShadow: clearing ? 'inset 2px 2px 10px #000' : '2px 2px 10px rgba(255,0,0,0.3)',
                                cursor: 'pointer',
                                transform: clearing ? 'scale(0.95)' : 'scale(1)',
                                transition: 'all 0.1s'
                            }}
                        />
                        <span className="text-red" style={{ fontSize: '14px' }}>PURGE DUCKDB MEMORY</span>
                    </div>

                </div>

                {/* Role Switcher */}
                <div className="hardware-panel bg-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 style={{ marginBottom: '20px' }}>ACCESS LEVEL OVERRIDE</h3>

                    <div style={{ display: 'flex', alignItems: 'center', width: '200px', height: '60px', backgroundColor: '#111', border: '3px solid #333', borderRadius: '30px', position: 'relative', cursor: 'pointer' }}
                        onClick={() => handleRoleSwitch(role === 'DISPATCH' ? 'MANAGER' : 'DISPATCH')}>

                        <div style={{
                            position: 'absolute', width: '90px', height: '48px',
                            backgroundColor: role === 'DISPATCH' ? 'var(--crt-green)' : 'var(--crt-amber)',
                            borderRadius: '24px',
                            left: role === 'DISPATCH' ? '6px' : '100px',
                            transition: 'left 0.2s',
                            boxShadow: `0 0 10px ${role === 'DISPATCH' ? 'var(--crt-green)' : 'var(--crt-amber)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#000', fontWeight: 'bold'
                        }}>
                            {role}
                        </div>
                    </div>
                </div>

                {/* API & Telemetry Screen */}
                <div className="hardware-panel" style={{ gridColumn: '1 / span 2', padding: '20px', fontFamily: 'Courier Prime, monospace', fontSize: '16px', color: 'var(--crt-green)' }}>
                    <h3 style={{ borderBottom: '1px solid var(--crt-green)', paddingBottom: '5px', marginBottom: '15px' }}>TELEMETRY & STATUS</h3>

                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '30%', paddingBottom: '10px' }}>SYSTEM HEALTH:</td>
                                <td style={{ paddingBottom: '10px', color: health?.status === 'healthy' ? 'var(--crt-green)' : 'var(--crt-red)' }}>[{health?.status || 'OFFLINE'}]</td>
                            </tr>
                            <tr>
                                <td style={{ paddingBottom: '10px' }}>CUDA DEVICE:</td>
                                <td style={{ paddingBottom: '10px' }}>[{health?.cuda?.device || 'CPU FALLBACK'}]</td>
                            </tr>
                            <tr>
                                <td style={{ paddingBottom: '10px' }}>DUCKDB TOTAL ROWS:</td>
                                <td style={{ paddingBottom: '10px' }}>{(cache?.flights_master_rows || 0).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style={{ paddingBottom: '10px' }}>AVIATION_STACK API:</td>
                                <td style={{ paddingBottom: '10px' }}>[CONNECTED: KEY ********82X]</td>
                            </tr>
                            <tr>
                                <td style={{ paddingBottom: '10px' }}>OPENWEATHER API:</td>
                                <td style={{ paddingBottom: '10px' }}>[CONNECTED: KEY ********WQ1]</td>
                            </tr>
                            <tr>
                                <td style={{ paddingBottom: '10px' }}>GEMINI 2.0 FLASH:</td>
                                <td style={{ paddingBottom: '10px' }}>[CONNECTED: KEY ********GZX]</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
