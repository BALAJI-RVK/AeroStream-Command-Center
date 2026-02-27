import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRetroSound } from '../components/SoundProvider';
import api from '../services/api'; // Or we can use fetch for /auth/login directly if it's not in api.js

export default function Login() {
    const navigate = useNavigate();
    const { playType, playClick, playError, playAlert, soundEnabled } = useRetroSound() || {};

    const [bootPhase, setBootPhase] = useState(0); // 0: typing boot, 1: system ready, 2: login form, 3: verifying, 4: success, 5: error
    const [typedText, setTypedText] = useState('');
    const fullText = "AEROSTREAM LEGACY CONSOLE v0.9.4";

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [shake, setShake] = useState(false);

    const typingRef = useRef(null);

    // Simple custom sound effect for modem
    const playModem = () => {
        if (!soundEnabled || !window.AudioContext) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.5);
            osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1.0);

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

            osc.start();
            osc.stop(ctx.currentTime + 1.5);
        } catch (e) { }
    };

    // Boot sequence effect
    useEffect(() => {
        if (bootPhase === 0) {
            let i = 0;
            typingRef.current = setInterval(() => {
                setTypedText(fullText.slice(0, i + 1));
                if (playType) playType();
                i++;
                if (i === fullText.length) {
                    clearInterval(typingRef.current);
                    setTimeout(() => setBootPhase(1), 800);
                }
            }, 60);

            return () => clearInterval(typingRef.current);
        } else if (bootPhase === 1) {
            const timer = setTimeout(() => {
                setBootPhase(2);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [bootPhase, playType]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (bootPhase === 2) {
                if (e.key === 'Enter') {
                    handleLogin();
                } else if (e.key === 'Escape') {
                    setUsername('');
                    setPassword('');
                    if (playClick) playClick();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [bootPhase, username, password, playClick]);

    const handleLogin = async () => {
        if (!username || !password) return;
        if (playClick) playClick();

        setBootPhase(3); // Verifying
        playModem();

        try {
            // we are directly calling Axios here, assuming backend runs on same /api proxy or full URL
            const res = await api.post('/auth/login', { username, password });

            if (res.status === 200) {
                if (playClick) playClick();
                setBootPhase(4); // Success
                localStorage.setItem('aerostream_token', res.data.token);
                localStorage.setItem('aerostream_role', res.data.role);

                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            }
        } catch (error) {
            setBootPhase(5); // Error
            setShake(true);
            if (playError) playError();
            if (playAlert) playAlert();

            setTimeout(() => {
                setShake(false);
                setBootPhase(2); // Go back to login
            }, 2000);
        }
    };

    return (
        <div className="login-root crt-overlay">
            <div className={`login-container ${shake ? 'login-shake' : ''}`}>

                {/* Boot Phase 0 */}
                {bootPhase === 0 && (
                    <div className="boot-text">
                        {typedText}<span className="cursor-blink">_</span>
                    </div>
                )}

                {/* Boot Phase 1 */}
                {bootPhase >= 1 && (
                    <div className="boot-text">
                        {fullText}<br />
                        <span style={{ color: 'var(--crt-green)' }}>SYSTEM READY.</span>
                    </div>
                )}

                {/* Login Form (Phase 2, 3, 5) */}
                {(bootPhase === 2 || bootPhase === 3 || bootPhase === 5) && (
                    <div className="login-form-box retro-panel mt-8 fade-in">
                        <div className="login-row">
                            <label>ENTER DISPATCHER ID:</label>
                            <input
                                autoFocus
                                type="text"
                                spellCheck="false"
                                className="retro-input"
                                value={username}
                                onChange={e => {
                                    setUsername(e.target.value.toLowerCase());
                                    if (playType) playType();
                                }}
                                disabled={bootPhase === 3}
                            />
                        </div>
                        <div className="login-row mt-4">
                            <label>ENTER ACCESS CODE:</label>
                            <input
                                type="password"
                                className="retro-input"
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    if (playType) playType();
                                }}
                                disabled={bootPhase === 3}
                            />
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                className="retro-btn large-btn"
                                onClick={handleLogin}
                                disabled={bootPhase === 3}
                            >
                                [ AUTHENTICATE ]
                            </button>
                        </div>

                        <div className="login-status-area mt-6">
                            {bootPhase === 3 && (
                                <div className="verifying-text blink">
                                    VERIFYING IDENTITY...
                                    <div className="scanline-progress mt-2">
                                        <div className="scanline-bar"></div>
                                    </div>
                                </div>
                            )}

                            {bootPhase === 5 && (
                                <div className="error-text blink-fast" style={{ color: 'var(--crt-red)', textShadow: 'var(--crt-glow-red)' }}>
                                    ACCESS DENIED: INVALID CREDENTIALS
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Success Phase 4 */}
                {bootPhase === 4 && (
                    <div className="success-flash mt-8">
                        <div className="success-text blink">
                            ACCESS GRANTED<br />
                            <span style={{ fontSize: '0.6em', opacity: 0.8 }}>INITIALIZING CONSOLE...</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
