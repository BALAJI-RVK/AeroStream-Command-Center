import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
import CommandBar from './CommandBar';

export default function Layout() {
    // Optional boot animation state
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setBooting(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`app-layout ${booting ? 'crt-boot' : ''}`}>
            {/* The global CRT Overlay that sits on top of everything */}
            <div className="crt-overlay"></div>

            <div className="main-area" style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '16px' }}>
                <Header />
                <main className="page-content" style={{ flex: 1, marginTop: '20px', position: 'relative', zIndex: 10 }}>
                    <Outlet />
                </main>
            </div>
            <CommandBar />
        </div>
    );
}
