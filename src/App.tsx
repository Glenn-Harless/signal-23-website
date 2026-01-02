import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Terminal } from './components/Terminal/Terminal';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';
import { DistortedStack } from './components/TextStack/TextStack';
import { EnhancedNumberStation } from './components/EnhancedNumberStation/EnhancedNumberStation';
import { GlitchOverlay } from './components/GlitchOverlay/GlitchOverlay';
import { useViewportHeight } from './hooks/useViewportHeight';
import { useAudio } from './hooks/useAudio';
import { InstrumentsPage } from './components/Instruments/InstrumentsPage';
import { SuccessPage } from './components/Instruments/SuccessPage';
import { WorkstationShell } from './components/WorkstationShell/WorkstationShell';

// Home component (previously App content)
interface HomeProps {
  isMobile: boolean;
}

const Home: React.FC<HomeProps> = ({ isMobile }) => {
  const [showGlitch, setShowGlitch] = useState(false);
  const viewportHeight = useViewportHeight();
  const navigate = useNavigate();
  const { isPlaying, togglePlayback } = useAudio();

  const navLinks = [
    {
      label: "music@signal23.net",
      description: "Get in touch",
      href: "mailto:music@signal23.net"
    },
    {
      label: "Instrument Racks",
      description: "Ableton Packs",
      href: "/instruments"
    }
  ];

  // Handle portal click to navigate to terminal
  const handlePortalClick = () => {
    navigate('/terminal');
  };

  return (
    <>
      <div
        className="relative w-full h-full overflow-hidden bg-black"
      >
        <div className="fixed inset-0 bg-black -z-10" />

        <div className="relative h-full">
          <div className="absolute inset-0 z-20">
            <AudioPlayer
              isPlaying={isPlaying}
              onPlayPause={togglePlayback}
              audioSource="/pieces-website-mp3.mp3"
            />
          </div>

          <Portal
            isMobile={isMobile}
            onClick={handlePortalClick}
          />

          <EnhancedNumberStation
            isMobile={isMobile}
            onGlitchChange={setShowGlitch}
          />

          <div className="hidden md:grid grid-cols-12 h-full relative z-10">
            <div className="col-span-7 xl:col-span-8 relative">
            </div>

            <div className="col-span-5 xl:col-span-4 relative">
              <div className="h-full">
                <DistortedStack isPlayingAudio={isPlaying} />
              </div>
            </div>
          </div>

          <div className="md:hidden flex flex-col items-center h-full relative z-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-neo-brute-transparent mt-12">
              SIGNAL-23
            </h1>
          </div>
        </div>

        <svg className="hidden">
          <defs>
            <filter id="eroded-blur">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1.2"
                numOctaves="5"
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2" />
                <feFuncG type="linear" slope="1.8" intercept="-0.2" />
                <feFuncB type="linear" slope="1.8" intercept="-0.2" />
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>
          </defs>
        </svg>
      </div>

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
        <GlitchOverlay isActive={showGlitch} />
      </div>
    </>
  );
};

// Main App component with routing
const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <BrowserRouter>
      <WorkstationShell isMobile={isMobile}>
        <Routes>
          <Route path="/" element={<Home isMobile={isMobile} />} />
          <Route path="/terminal" element={<Terminal isMobile={isMobile} />} />
          <Route path="/instruments" element={<InstrumentsPage />} />
          <Route path="/instruments/success" element={<SuccessPage />} />
        </Routes>
      </WorkstationShell>
    </BrowserRouter>
  );
};

export default App;
