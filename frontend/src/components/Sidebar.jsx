import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, ShieldAlert, Zap, BarChart3, Search, Settings, HelpCircle } from 'lucide-react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Live Map' },
    { path: '/risk', icon: ShieldAlert, label: 'Risk Intel' },
    { path: '/strategy', icon: Zap, label: 'Ops Strategy' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/search', icon: Search, label: 'Flight Search' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ onHelpClick }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">✈️</div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span className="sidebar-tooltip">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-item" onClick={onHelpClick} style={{ marginTop: 'auto' }}>
                <HelpCircle size={20} />
                <span className="sidebar-tooltip">Help Guide</span>
            </div>
        </aside>
    );
}
