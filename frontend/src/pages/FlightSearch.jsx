import { useState, useEffect, useRef } from 'react';
import { getFlights } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useRetroSound } from '../components/SoundProvider';

export default function FlightSearch() {
    const [flights, setFlights] = useState([]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([
        "AEROSTREAM MAINFRAME OS v2.4.1",
        "TYPE 'HELP' FOR COMMANDS.",
        "> SYSTEM READY."
    ]);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { playType } = useRetroSound();

    useEffect(() => {
        async function load() {
            try {
                const res = await getFlights(100);
                setFlights(res.data.flights || []);
            } catch (e) {
                setHistory(h => [...h, "> ERROR OFFLINE DATA DUMP FAILED"]);
            }
        }
        load();

        // Auto-focus input on load and keeps it focused clicking anywhere
        const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };
        document.addEventListener('click', focusInput);
        focusInput();
        return () => document.removeEventListener('click', focusInput);
    }, []);

    const processCommand = (cmd) => {
        const parts = cmd.trim().toUpperCase().split(' ');
        const action = parts[0];
        const arg = parts.slice(1).join(' ');

        let output = [];

        if (action === 'HELP') {
            output = [
                "AVAILABLE COMMANDS:",
                "  SEARCH [Query]  - Search flight number, airline, or city code",
                "  LIST ALL        - List all visible flights in area",
                "  RISK [HIGH|LOW] - Filter by delay probability",
                "  TARGET [ID]     - Open full ops analysis for flight",
                "  CLEAR           - Clear terminal window"
            ];
        } else if (action === 'CLEAR') {
            setHistory(["> SYSTEM READY."]);
            return;
        } else if (action === 'LIST' && arg === 'ALL') {
            output = flights.slice(0, 15).map(f =>
                `[${f.flight_number.padEnd(8)}] ${f.origin}->${f.destination} | ${f.airline.substring(0, 10).padEnd(10)} | RISK: ${f.delay_probability}%`
            );
            if (flights.length > 15) output.push(`... AND ${flights.length - 15} MORE.`);
        } else if (action === 'SEARCH' && arg) {
            const matches = flights.filter(f =>
                f.flight_number?.toUpperCase().includes(arg) ||
                f.airline?.toUpperCase().includes(arg) ||
                f.origin?.toUpperCase().includes(arg) ||
                f.destination?.toUpperCase().includes(arg)
            );
            if (matches.length > 0) {
                output = matches.map(f =>
                    `[${f.flight_number.padEnd(8)}] ${f.origin}->${f.destination} | ${f.airline.substring(0, 10).padEnd(10)} | RISK: ${f.delay_probability}%`
                );
            } else {
                output = [`NO MATCHES FOUND FOR: ${arg}`];
            }
        } else if (action === 'RISK' && arg) {
            let filterFunc;
            if (arg === 'HIGH') filterFunc = f => f.delay_probability > 60;
            else if (arg === 'MEDIUM') filterFunc = f => f.delay_probability > 30 && f.delay_probability <= 60;
            else if (arg === 'LOW') filterFunc = f => f.delay_probability <= 30;
            else {
                output = ["INVALID ARGS. USE HIGH, MEDIUM, OR LOW."];
            }

            if (filterFunc) {
                const matches = flights.filter(filterFunc);
                output = matches.map(f =>
                    `[${f.flight_number.padEnd(8)}] ${f.origin}->${f.destination} | RISK: ${f.delay_probability}%`
                );
                if (output.length === 0) output = ["NO FLIGHTS FOUND MATCHING RISK PROFILE."];
            }

        } else if (action === 'TARGET' && arg) {
            const flight = flights.find(f => f.flight_number === arg);
            if (flight) {
                navigate('/risk', { state: { flight } });
                return; // Navigation handles it
            } else {
                output = [`TARGET FLIGHT NOT FOUND: ${arg}`];
            }
        } else if (action !== '') {
            output = [`COMMAND NOT RECOGNIZED: ${action}`];
        }

        setHistory(h => [...h, `\n> ${cmd.toUpperCase()}`, ...output]);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            processCommand(input);
            setInput('');
        }
    };

    const handleChange = (e) => {
        playType();
        setInput(e.target.value);
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', backgroundColor: '#000', padding: '20px', overflowY: 'auto' }}>
            <div style={{
                fontFamily: 'VT323, Courier New, monospace',
                color: 'var(--crt-green)',
                fontSize: '20px',
                textShadow: '0 0 5px var(--crt-green)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.2
            }}>

                {/* Print History */}
                <div>
                    {history.map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>

                {/* Input Line */}
                <div style={{ display: 'flex', marginTop: '10px' }}>
                    <span style={{ marginRight: '10px' }}>&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--crt-green)',
                            fontFamily: 'VT323, Courier New, monospace',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            outline: 'none',
                            width: '100%',
                            textTransform: 'uppercase',
                            textShadow: '0 0 5px var(--crt-green)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
