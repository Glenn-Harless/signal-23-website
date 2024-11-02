import React, { useState, useEffect } from 'react';
import { Music2, Mail, Info } from 'lucide-react';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';

const DistortedStack = ({ isPlayingAudio }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Split text into individual characters to mirror each one
  const textToMirror = "SIGNAL-23";
  const mirroredText = textToMirror.split('').map((char, index) => (
    <span 
      key={index}
      className="inline-block"
      style={{ transform: 'scale(-1, 1)' }}
    >
      {char}
    </span>
  )).reverse().join('');

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.9; }
          }
        `}
      </style>
      <div className="absolute right-20 top-0 h-full flex flex-col justify-center">
        {[...Array(7)].map((_, i) => (
          <div 
            key={i} 
            style={{
              ...i === 3 
                ? {
                    WebkitTextStroke: '0.02px white',
                    color: 'black',
                    filter: 'url(#irregular-outline)'
                  }
                : {
                    filter: isPlayingAudio ? 'url(#playing-effect)' : 'url(#default-effect)',
                    animation: `pulse ${2 + i * 0.1}s ease-in-out infinite`,
                    transition: 'filter 0.3s ease'
                  }
            }}
            className={`text-6xl font-bold font-neo-brutalist mb-8 ${
              i === 3 
                ? '' 
                : 'text-white'
            }`}
          >
            {i === 3 ? 'SIGNAL-23' : (
              <div style={{ transform: 'scale(-1, 1)', display: 'inline-block' }}>
                SIGNAL-23
              </div>
            )}
          </div>
        ))}
      </div>

      <svg className="hidden">
        <defs>
          {/* Default effect with mild erosion */}
          <filter id="default-effect">
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
            <feGaussianBlur stdDeviation="2"/>
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
              <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
              <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic"/>
          </filter>

          {/* More intense effect for when playing */}
          <filter id="playing-effect">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="2.5"
              numOctaves="6"
              seed={offset}
            />
            <feDisplacementMap
              in="SourceGraphic"
              scale="25"
            />
            <feGaussianBlur stdDeviation="1.5"/>
            <feComponentTransfer>
              <feFuncR type="linear" slope="2" intercept="-0.2"/>
              <feFuncG type="linear" slope="2" intercept="-0.2"/>
              <feFuncB type="linear" slope="2" intercept="-0.2"/>
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic"/>
          </filter>

          {/* Outline effect stays the same */}
          <filter id="irregular-outline">
            <feTurbulence 
              type="turbulence" 
              baseFrequency="0.7"
              numOctaves="3"
              seed={offset}
            />
            <feDisplacementMap
              in="SourceGraphic"
              scale="1"
            />
            <feGaussianBlur stdDeviation="0.3"/>
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.2"/>
              <feFuncG type="linear" slope="1.2"/>
              <feFuncB type="linear" slope="1.2"/>
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </>
  );
};

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
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div className="fixed inset-0 bg-black -z-10" />
      
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
      
      {/* Mobile view */}
      <div className="md:hidden absolute inset-0 flex flex-col items-center z-20">
        <h1 
          className="text-5xl font-bold text-white font-neo-brutalist mt-12"
          style={{
            filter: 'url(#eroded-blur)'
          }}
        >
          SIGNAL-23
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

      {/* SVG filters - moved to App level so mobile view can use them */}
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
            <feGaussianBlur stdDeviation="2"/>
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
              <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
              <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic"/>
          </filter>

          <filter id="irregular-outline">
            <feTurbulence 
              type="turbulence" 
              baseFrequency="0.7"
              numOctaves="3"
              seed={offset}
            />
            <feDisplacementMap
              in="SourceGraphic"
              scale="1"
            />
            <feGaussianBlur stdDeviation="0.3"/>
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.2"/>
              <feFuncG type="linear" slope="1.2"/>
              <feFuncB type="linear" slope="1.2"/>
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default App;