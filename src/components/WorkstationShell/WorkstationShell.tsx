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

    // Add page-specific detection for layout containment
    const isLanding = location.pathname === '/' || location.pathname === '/testblandingpage' || location.pathname === '/terminal' || location.pathname === '/resonance' || location.pathname === '/tangle' || location.pathname === '/learning' || location.pathname === '/forbidding' || location.pathname === '/well';

    // Sync flicker effect with route changes
    useEffect(() => {
        setFlicker(true);
        const timer = setTimeout(() => setFlicker(false), 200);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className={`workstation-shell ${flicker ? 'ws-transitioning' : ''}`}>
            <div className="ws-scanlines" />
            <div className="ws-noise" />


            <div className={`ws-main-container ${isLanding ? 'no-padding ws-reset' : ''}`}>
                {children}
            </div>
        </div>
    );
};


