import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/workstation.css';

interface WorkstationShellProps {
    children: React.ReactNode;
    isMobile: boolean;
}

export const WorkstationShell: React.FC<WorkstationShellProps> = ({ children }) => {
    const location = useLocation();
    const [flicker, setFlicker] = useState(false);
    const currentPath = location.pathname === '/'
        ? '/'
        : location.pathname.replace(/\/+$/, '');
    const isDeterministicVisual = currentPath === '/signal-memory';
    // Plain documents (ad landing pages, legal pages): plain scrolling container, no route-change flicker.
    const isPlainDocument = currentPath.startsWith('/listen/') || currentPath.startsWith('/legal/');

    // Add page-specific detection for layout containment
    const isLanding = currentPath === '/' || currentPath === '/testblandingpage' || currentPath === '/terminal' || currentPath === '/resonance' || currentPath === '/tangle' || currentPath === '/learning' || currentPath === '/forbidding' || currentPath === '/well' || currentPath === '/stepwell' || currentPath === '/broadcast' || currentPath === '/forest' || isDeterministicVisual;

    // Sync flicker effect with route changes
    useEffect(() => {
        setFlicker(true);
        const timer = setTimeout(() => setFlicker(false), 200);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className={`workstation-shell ${flicker ? 'ws-transitioning' : ''} ${isDeterministicVisual ? 'ws-deterministic-visual' : ''} ${isPlainDocument ? 'ws-plain-route' : ''}`}>
            <div className="ws-scanlines" />
            <div className="ws-noise" />


            <div className={`ws-main-container ${isLanding ? 'no-padding ws-reset' : ''} ${isPlainDocument ? 'ws-plain' : ''}`}>
                {children}
            </div>
        </div>
    );
};
