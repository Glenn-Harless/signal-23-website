import React, { useState, useEffect, useCallback } from 'react';
import { Music2, Mail, Info, Play, Pause } from 'lucide-react';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';
import { DistortedStack } from './components/TextStack/TextStack';
import { EnhancedNumberStation } from './components/EnhancedNumberStation/EnhancedNumberStation';
import { GlitchOverlay } from './components/GlitchOverlay/GlitchOverlay';

interface NavLink {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  description: string;
  platforms?: Array<{
    name: string;
    url: string;
  }>;
}

interface NumberStationProps {
  isMobile: boolean;
}

const App: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showGlitch, setShowGlitch] = useState(false);  // Added this state

  const navLinks: NavLink[] = [
    { 
      label: "music@signal23.net",
      // href: "mailto:signal.23.music@gmail.com",
      description: "Get in touch" 
    }
  ];

  useEffect(() => {
    // Log when component mounts
    console.log('Checking font loading...');
    
    // Try to create a temporary element with the font
    const testElement = document.createElement('span');
    testElement.style.fontFamily = 'Neobrutalist2';
    testElement.textContent = 'Test';
    document.body.appendChild(testElement);
    
    // Log computed style
    const computedStyle = window.getComputedStyle(testElement);
    console.log('Applied font family:', computedStyle.fontFamily);
    
    // Clean up
    document.body.removeChild(testElement);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <div className="fixed inset-0 bg-black -z-10" />
        
        {/* Base layout container */}
        <div className="relative h-full">
          {/* Position the play button relative to the Portal */}
          <div className="absolute inset-0 z-20">
            <AudioPlayer 
              isPlaying={isPlayingAudio}
              onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
              audioSource="/pieces-website-mp3.mp3"
            />
          </div>

          <Portal isMobile={isMobile} />
          <EnhancedNumberStation 
            isMobile={isMobile}
            onGlitchChange={setShowGlitch}
          />

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-12 h-full relative z-10">
            {/* Left section - Animation area */}
            <div className="col-span-7 xl:col-span-8 relative">
              {/* Removed AudioPlayer from here */}
            </div>

            {/* Right section - Text stack area */}
            <div className="col-span-5 xl:col-span-4 relative">
              <div className="h-full">
                <DistortedStack isPlayingAudio={isPlayingAudio} />
              </div>
            </div>
          </div>

          {/* Mobile Layout - Keep visible button for mobile */}
          <div className="md:hidden flex flex-col items-center h-full relative z-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-neo-brute-transparent mt-12">
              SIGNAL-3
            </h1>
            <div className="absolute top-1/2 -translate-y-1/2">
              {/* <button 
                onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                {isPlayingAudio ? 
                  <Pause className="w-8 h-8 text-white" /> : 
                  <Play className="w-8 h-8 text-white" />
                }
              </button> */}
            </div>
          </div>

          {/* Navigation */}
          <nav className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <div className="flex justify-center space-x-8 opacity-60 font-ibm-mono">
              {navLinks.map((link, index) => (
                <NavigationLink key={index} {...link} />
              ))}
            </div>
          </nav>
        </div>

        {/* Keep SVG filters */}
        <svg className="hidden">
          <defs>
            <filter id="eroded-blur">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Render GlitchOverlay at the root level */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
        <GlitchOverlay isActive={showGlitch} />
      </div>
    </>
  );
};

export default App;