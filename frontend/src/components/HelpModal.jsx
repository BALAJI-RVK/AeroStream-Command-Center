import { X, Monitor, ShieldAlert, Zap, ToggleLeft, Database, Cpu, Cloud, Sparkles } from 'lucide-react';

export default function HelpModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700 }}>
                            📖 AeroStream User Guide
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                            Enterprise Airline Operations Command Center
                        </p>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="guide-item">
                    <h4><Monitor size={16} style={{ marginRight: 8, verticalAlign: -3 }} />Monitor Mode — Dashboard</h4>
                    <p>Real-time flight tracking via the interactive Leaflet map. Aircraft icons turn <strong style={{ color: 'var(--danger)' }}>RED</strong> when the XGBoost-predicted delay probability exceeds 60%. KPI cards show live operational metrics. The AI Quick Brief provides a Gemini-generated summary of current operations.</p>
                </div>

                <div className="guide-item">
                    <h4><ShieldAlert size={16} style={{ marginRight: 8, verticalAlign: -3 }} />Risk Intel — XGBoost Intelligence</h4>
                    <p>Click any flight to see the detailed XGBoost breakdown of <strong>Weather vs Carrier risk</strong>. The delay probability gauge shows the model's confidence. Contributing factors are ranked by importance. Historical 7-day trends reveal delay patterns for each route.</p>
                </div>

                <div className="guide-item">
                    <h4><Zap size={16} style={{ marginRight: 8, verticalAlign: -3 }} />Ops Strategy — AI Mitigation</h4>
                    <p>Press the <strong>"Mitigate"</strong> button on any high-risk flight. Gemini 2.0 Flash instantly generates a 3-step operational plan covering <strong>Fuel, Crew, and Passengers</strong>. The cost analysis shows savings achieved. The cheapest diversion airport is recommended based on aviation tax data.</p>
                </div>

                <div className="guide-item">
                    <h4><ToggleLeft size={16} style={{ marginRight: 8, verticalAlign: -3 }} />Environment Toggle</h4>
                    <p>Switch between <strong>Testing</strong> (demo API key) and <strong>Deployment</strong> (production key) in the header. When <strong>Demo Mode</strong> is active, all data is generated locally — zero API calls are made.</p>
                </div>

                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                        🛠️ Technology Stack
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Database size={14} color="var(--accent-cyan)" /> DuckDB (Analytics + Cache)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Cpu size={14} color="var(--accent-cyan)" /> XGBoost on CUDA (RTX 4050)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Cloud size={14} color="var(--accent-cyan)" /> FastAPI + Live APIs
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={14} color="var(--accent-cyan)" /> Gemini 2.0 Flash AI
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
