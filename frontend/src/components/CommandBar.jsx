import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRetroSound } from './SoundProvider';

export default function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { playType } = useRetroSound();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleExecute = (e) => {
        e.preventDefault();
        const cmd = query.toLowerCase().trim();

        if (cmd.startsWith('predict ')) {
            const flight = cmd.split(' ')[1];
            navigate('/risk', { state: { searchQuery: flight } });
        } else if (cmd.includes('map') || cmd.includes('radar')) {
            navigate('/map');
        } else if (cmd.includes('staff') || cmd.includes('crew')) {
            navigate('/crew');
        } else if (cmd.includes('brief')) {
            navigate('/strategy');
        } else if (cmd === 'exit' || cmd === 'quit') {
            setIsOpen(false);
        } else {
            // Flash red on invalid command
            inputRef.current.style.borderColor = 'var(--crt-red)';
            inputRef.current.style.color = 'var(--crt-red)';
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.style.borderColor = 'var(--crt-green)';
                    inputRef.current.style.color = 'var(--crt-green)';
                }
            }, 300);
            return;
        }

        setQuery('');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,17,0, 0.7)', zIndex: 999990,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh',
            backdropFilter: 'blur(3px)'
        }}>
            <div className="hardware-panel" style={{ width: '600px', boxShadow: 'var(--crt-glow-strong)' }}>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    AEROSTREAM GLOBAL COMMAND PROTOCOL (CMD+K)
                </div>
                <form onSubmit={handleExecute}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px', marginRight: '10px' }}>&gt;</span>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                playType();
                            }}
                            placeholder="Type command (e.g. 'predict 6E-205', 'map')..."
                            autoComplete="off"
                            spellCheck="false"
                            style={{
                                width: '100%', fontSize: '24px', backgroundColor: 'transparent',
                                border: 'none', color: 'var(--crt-green)', outline: 'none',
                                textTransform: 'uppercase'
                            }}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
