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

    // Add page-specific detection for layout containment
    const isLanding = location.pathname === '/' || location.pathname === '/testblandingpage' || location.pathname === '/terminal' || location.pathname === '/resonance' || location.pathname === '/tangle';

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

    const navLinks = [
        { label: 'PORTAL', path: '/' },
        { label: 'TERMINAL', path: '/terminal' },
    ];

    return (
        <div className={`workstation-shell ${flicker ? 'ws-transitioning' : ''}`}>
            <div className="ws-scanlines" />
            <div className="ws-noise" />

            <nav className="ws-nav-container">
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

            <div className={`ws-main-container ${isLanding ? 'no-padding ws-reset' : ''}`}>
                {children}
            </div>
        </div>
    );
};


