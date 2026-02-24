import { useState } from 'react';
import { Rnd } from 'react-rnd';
import { useRetroSound } from '../components/SoundProvider';

const initialCrew = [
    { id: 1, name: 'CAPT. REYNOLDS', role: 'PIC', status: 'AVAILABLE', x: 20, y: 50 },
    { id: 2, name: 'FO. WASHBURNE', role: 'FO', status: 'AVAILABLE', x: 20, y: 110 },
    { id: 3, name: 'CAPT. ROCHARD', role: 'PIC', status: 'RESTING', x: 200, y: 50 },
    { id: 4, name: 'FO. VANCE', role: 'FO', status: 'IN-FLIGHT', x: 380, y: 50 },
    { id: 5, name: 'FA. SERRA', role: 'CABIN', status: 'AVAILABLE', x: 20, y: 170 },
    { id: 6, name: 'FA. INARA', role: 'CABIN', status: 'AVAILABLE', x: 20, y: 230 }
];

export default function Crew() {
    const [crewMembers, setCrewMembers] = useState(initialCrew);
    const { playClick } = useRetroSound();

    const updatePosition = (id, d) => {
        setCrewMembers(members => members.map(m =>
            m.id === id ? { ...m, x: d.x, y: d.y } : m
        ));
        playClick(); // metallic clank sound on drop
    };

    return (
        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dotted var(--crt-green)', paddingBottom: '10px', marginBottom: '20px' }}>
                <div>
                    <h1>MAGNETIC CREW BOARD</h1>
                    <div className="text-amber">RESOURCE ALLOCATION PANEL</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px', flex: 1 }}>

                {/* Roster List / Stats */}
                <div className="hardware-panel bg-panel" style={{ overflowY: 'auto' }}>
                    <h3 style={{ borderBottom: '1px solid var(--crt-green)', paddingBottom: '5px' }}>DUTY LIMITS</h3>

                    <div style={{ marginTop: '20px' }}>
                        <div>PIC AVAILABLE: {crewMembers.filter(c => c.role === 'PIC' && c.status === 'AVAILABLE').length}</div>
                        <div>FO AVAILABLE: {crewMembers.filter(c => c.role === 'FO' && c.status === 'AVAILABLE').length}</div>
                        <div>CABIN AVAILABLE: {crewMembers.filter(c => c.role === 'CABIN' && c.status === 'AVAILABLE').length}</div>
                    </div>

                    <h3 style={{ borderBottom: '1px solid var(--crt-green)', paddingBottom: '5px', marginTop: '30px' }}>ALERTS</h3>
                    <div className="blink text-red" style={{ marginTop: '10px' }}>
                        WARNING: CAPT ROCHARD NEARING 100HR MONTHLY LIMIT
                    </div>
                </div>

                {/* The Board */}
                <div className="hardware-panel" style={{ position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(circle, #001a00 10%, #000 90%)' }}>

                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                        <line x1="180" y1="0" x2="180" y2="100%" stroke="var(--crt-green)" strokeDasharray="5,5" />
                        <text x="50" y="30" fill="var(--crt-green)" fontFamily="VT323" fontSize="20">BASE HUB</text>

                        <line x1="360" y1="0" x2="360" y2="100%" stroke="var(--crt-amber)" strokeDasharray="5,5" />
                        <text x="210" y="30" fill="var(--crt-amber)" fontFamily="VT323" fontSize="20">CREW REST</text>

                        <text x="390" y="30" fill="var(--crt-red)" fontFamily="VT323" fontSize="20">ACTIVE SECTORS</text>
                    </svg>

                    {crewMembers.map((member) => (
                        <Rnd
                            key={member.id}
                            bounds="parent"
                            size={{ width: 140, height: 40 }}
                            position={{ x: member.x, y: member.y }}
                            onDragStop={(e, d) => updatePosition(member.id, d)}
                            dragGrid={[20, 20]} // snaps to a grid like a real magnetic board
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '10px',
                                background: '#111',
                                border: `2px solid ${member.role === 'PIC' ? 'var(--crt-amber)' : member.role === 'FO' ? 'var(--crt-green)' : '#fff'}`,
                                color: member.role === 'PIC' ? 'var(--crt-amber)' : member.role === 'FO' ? 'var(--crt-green)' : '#fff',
                                boxShadow: '2px 2px 5px rgba(0,0,0,0.8), inset 1px 1px 2px rgba(255,255,255,0.2)',
                                cursor: 'grab',
                                userSelect: 'none',
                                fontFamily: 'Courier Prime, monospace',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            {member.name}
                        </Rnd>
                    ))}
                </div>
            </div>
        </div>
    );
}
