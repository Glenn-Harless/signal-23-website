import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
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
import { Resonance } from './components/Resonance/Resonance';
import { Growth } from './components/Growth/Growth';
import { ForbiddingBlocks } from './components/ForbiddingBlocks/ForbiddingBlocks';
import { Well } from './components/Well/Well';
import { Tangle } from './components/Tangle/Tangle';
import { Learning } from './components/Learning/Learning';
import { Terms } from './components/Terms/Terms';
import { Stepwell } from './components/Stepwell/Stepwell';
import Broadcast from './components/Broadcast/Broadcast';


// Home component (previously App content)
interface HomeProps {
  isMobile: boolean;
}

const Home: React.FC<HomeProps> = ({ isMobile }) => {
  const [showGlitch, setShowGlitch] = useState(false);
  const viewportHeight = useViewportHeight();
  const navigate = useNavigate();
  const { isPlaying, togglePlayback } = useAudio();

  // Handle portal click - go to terminal
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
            {/* Font renders "-" as "-2", so "SIGNAL-3" displays as "SIGNAL-23" */}
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-neo-brute-transparent mt-12">
              SIGNAL-3
            </h1>
          </div>

          <nav
            className="absolute bottom-0 left-0 right-0 z-20 p-6"
            style={{
              paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1.5rem)' : '1.5rem'
            }}
          >
            <div className="flex justify-center opacity-60 font-ibm-mono">
              <NavigationLink
                label="music@signal23.net"
                description="Get in touch"
                href="mailto:music@signal23.net"
              />
            </div>
          </nav>
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
          <Route path="/testblandingpage" element={<Navigate to="/resonance" replace />} />
          <Route path="/resonance" element={<Resonance />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/forbidding" element={<ForbiddingBlocks />} />
          <Route path="/well" element={<Well />} />
          <Route path="/tangle" element={<Tangle />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/stepwell" element={<Stepwell />} />
          <Route path="/broadcast" element={<Broadcast />} />

        </Routes>
      </WorkstationShell>
    </BrowserRouter>
  );
};

export default App;
