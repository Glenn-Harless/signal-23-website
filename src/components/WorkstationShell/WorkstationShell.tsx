import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import '../../styles/workstation.css';

interface WorkstationShellProps {
    children: React.ReactNode;
    isMobile: boolean;
}

export const WorkstationShell: React.FC<WorkstationShellProps> = ({ children, isMobile }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [flicker, setFlicker] = useState(false);
    const [timestamp, setTimestamp] = useState('');
    const [hexData, setHexData] = useState('0x0000');

    // Update telemetry data
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTimestamp(now.toISOString().split('T')[1].split('.')[0] + 'Z');
            setHexData('0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Sync flicker effect with route changes
    useEffect(() => {
        setFlicker(true);
        const timer = setTimeout(() => setFlicker(false), 200);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    const navLinks = isMobile ? [
        { label: 'PORTAL', path: '/' },
        { label: 'CMD', path: '/terminal' },
        { label: 'RACKS', path: '/instruments' },
    ] : [
        { label: 'VISUALIZATION', path: '/' },
        { label: 'TERMINAL', path: '/terminal' },
        { label: 'ARCHIVAL LEDGER', path: '/instruments' },
    ];

    return (
        <div className={`workstation-shell ${flicker ? 'ws-transitioning' : ''}`}>
            <div className="ws-scanlines" />
            <div className="ws-noise" />

            {/* Persistent Telemetry HUD */}
            <div className="ws-telemetry-frame">
                <header className="ws-telemetry-bar top">
                    <div className="ws-status-item">
                        <span className="ws-status-label">SYS_AUTH:</span>
                        <span className="ws-status-value">SIGNAL-23</span>
                    </div>

                    <nav className="ws-nav">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`ws-nav-item ${location.pathname === link.path ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="ws-status-item extra">
                        <span className="ws-status-label">NODE:</span>
                        <span className="ws-status-value">{hexData}</span>
                    </div>
                </header>

                <footer className="ws-telemetry-bar bottom">
                    <div className="ws-status-item">
                        <span className="ws-status-label">COORD:</span>
                        <span className="ws-status-value">51.5074° N, 0.1278° W</span>
                    </div>

                    <div className="ws-status-item">
                        <span className="ws-status-label">TIME:</span>
                        <span className="ws-status-value">{timestamp}</span>
                    </div>

                    <div className="ws-status-item extra">
                        <span className="ws-status-label">STATUS:</span>
                        <span className="ws-status-value">BROADCAST_ACTIVE</span>
                    </div>

                    <div className="ws-status-item">
                        <span className="ws-status-label">SYNC:</span>
                        <span className="ws-status-value" style={{ color: 'var(--ws-accent)', opacity: 1 }}>CONNECTED</span>
                    </div>
                </footer>
            </div>

            <main className={`ws-main-content ${location.pathname === '/' ? 'no-padding' : ''}`}>
                {children}
            </main>
        </div>
    );
};
