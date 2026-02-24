import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRetroSound } from './SoundProvider';

const AlertContext = createContext();
export const useAlert = () => useContext(AlertContext);

export default function AlertManager({ children }) {
    const [alerts, setAlerts] = useState([]);
    const { playAlert } = useRetroSound();

    // The method any component can call to trigger a massive, interrupting alert
    const triggerAlert = (title, message, isHighRisk = false) => {
        const id = Date.now().toString();
        setAlerts(prev => [...prev, { id, title, message, isHighRisk }]);
        if (isHighRisk) {
            playAlert();
        }
    };

    const acknowledgeAlert = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    return (
        <AlertContext.Provider value={{ triggerAlert }}>
            {children}

            {/* Render the blocking alerts on top of everything */}
            {alerts.length > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,17,0, 0.85)', zIndex: 999999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    {alerts.map(alert => (
                        <div key={alert.id} className="hardware-panel blink-box" style={{
                            width: '500px', backgroundColor: alert.isHighRisk ? '#300' : 'var(--crt-bg-panel)',
                            borderColor: alert.isHighRisk ? 'var(--crt-red)' : 'var(--crt-amber)',
                            borderWidth: '4px', textAlign: 'center', padding: '40px',
                            boxShadow: alert.isHighRisk ? 'var(--crt-glow-red)' : 'var(--crt-glow-amber)'
                        }}>
                            <h1 style={{ color: alert.isHighRisk ? 'var(--crt-red)' : 'var(--crt-amber)', fontSize: '36px', marginBottom: '20px' }}>
                                {alert.isHighRisk ? '!!! CRITICAL ALERT !!!' : 'SYSTEM NOTIFICATION'}
                            </h1>
                            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>{alert.title}</h2>
                            <p style={{ fontSize: '18px', marginBottom: '40px', lineHeight: 1.5 }}>
                                {alert.message}
                            </p>

                            <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                style={{
                                    fontSize: '24px', padding: '10px 40px',
                                    backgroundColor: alert.isHighRisk ? 'var(--crt-red)' : 'var(--crt-amber)',
                                    color: '#000', border: '2px solid #fff', fontWeight: 'bold'
                                }}
                            >
                                [ ACKNOWLEDGE ]
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </AlertContext.Provider>
    );
}

// Ensure global CSS rules for the blink-box exist in App.css later.
