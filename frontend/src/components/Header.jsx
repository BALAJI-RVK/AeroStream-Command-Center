import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    // Time formatter for the ZULU timestamp
    const [time, setTime] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const hrs = String(now.getUTCHours()).padStart(2, '0');
            const mins = String(now.getUTCMinutes()).padStart(2, '0');
            setTime(`${hrs}:${mins}Z`);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const routes = [
        { path: '/dashboard', label: 'F1: DASH' },
        { path: '/map', label: 'F2: MAP' },
        { path: '/risk', label: 'F3: RISK' },
        { path: '/strategy', label: 'F4: OPS' },
        { path: '/analytics', label: 'F5: PRFM' },
        { path: '/search', label: 'F6: SRCH' },
        { path: '/crew', label: 'F7: CREW' },
        { path: '/settings', label: 'F8: CFG' },
    ];

    // Global keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F1') { e.preventDefault(); navigate('/dashboard'); }
            if (e.key === 'F2') { e.preventDefault(); navigate('/map'); }
            if (e.key === 'F3') { e.preventDefault(); navigate('/risk'); }
            if (e.key === 'F4') { e.preventDefault(); navigate('/strategy'); }
            if (e.key === 'F5') { e.preventDefault(); navigate('/analytics'); }
            if (e.key === 'F6') { e.preventDefault(); navigate('/search'); }
            if (e.key === 'F7') { e.preventDefault(); navigate('/crew'); }
            if (e.key === 'F8') { e.preventDefault(); navigate('/settings'); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return (
        <header className="hardware-panel" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '2px solid var(--crt-green)'
        }}>
            {/* LEFT: Branding & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', textShadow: 'var(--crt-glow-strong)' }}>
                    AEROSTREAM LEGACY v0.9.4
                </h1>
                <div className="blink" style={{
                    backgroundColor: 'var(--crt-green)',
                    color: '#000',
                    padding: '0 8px',
                    fontWeight: 'bold'
                }}>LIVE</div>
            </div>

            {/* MIDDLE: Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
                {routes.map(r => (
                    <button
                        key={r.path}
                        onClick={() => navigate(r.path)}
                        style={{
                            backgroundColor: location.pathname === r.path ? 'var(--crt-green)' : 'transparent',
                            color: location.pathname === r.path ? '#000' : 'var(--crt-green)',
                            border: location.pathname === r.path ? '2px solid var(--crt-green)' : '2px dashed #004400',
                            padding: '4px 8px',
                            fontSize: '16px'
                        }}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* RIGHT: System Specs & Rewind */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '16px' }}>
                <span>XGBoost ACC 94.7%</span>
                <span>DUCKDB ONLINE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '2px solid #004400', paddingLeft: '20px' }}>
                    <span style={{ color: 'var(--crt-amber)' }}>REWIND TO:</span>
                    <input type="range" min="0" max="100" defaultValue="100" style={{ width: '100px' }} />
                </div>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{time}</span>
            </div>
        </header>
    );
}
