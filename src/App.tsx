import React, { useState, useEffect } from 'react';
import { Music2, Mail, Info } from 'lucide-react';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';
import { DistortedStack } from './components/TextStack/TextStack';


interface NavLink {
  icon?: React.ReactNode;
  label: string;
  href: string;
  description: string;
  platforms?: Array<{
    name: string;
    url: string;
  }>;
}

const App: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [offset, setOffset] = useState(0);

  const navLinks: NavLink[] = [
    { 
      label: "CONTACT",
      href: "mailto:signal.23.music@gmail.com",
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

    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div className="fixed inset-0 bg-black -z-10" />
      {/* Portal now positioned at root level like in working version */}
      <Portal isMobile={isMobile} />

      {/* Desktop layout */}
      <div className="hidden md:block absolute inset-0 z-10">
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <AudioPlayer 
            isPlaying={isPlayingAudio}
            onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
            audioSource="/pieces-website-mp3.mp3"
          />
        </div>

        <DistortedStack isPlayingAudio={isPlayingAudio} />
      </div>
      
      {/* Mobile view - simplified to match working version */}
      <div className="md:hidden absolute inset-0 flex flex-col items-center z-20">
        <h1 
          className="text-5xl font-bold text-white font-neo-brute-transparent mt-12"
          style={{
            filter: 'url(#eroded-blur)'
          }}
        >
          SIGNAL-3
        </h1>
        <div className="absolute top-1/2 transform -translate-y-1/2">
          <AudioPlayer 
            isPlaying={isPlayingAudio}
            onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
            audioSource="/pieces-website-mp3.mp3"
          />
        </div>
      </div>
  
      {/* Navigation Links */}
      <nav className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <div className="flex justify-center space-x-8">
          {navLinks.map((link, index) => (
            <NavigationLink key={index} {...link} />
          ))}
        </div>
      </nav>

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
  );
};

export default App;