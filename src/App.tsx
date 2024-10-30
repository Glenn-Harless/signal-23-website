import React, { useState, useEffect } from 'react';
import { Music2, Mail, Info } from 'lucide-react';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';

const BlocksGrid = () => {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    const generateBlocks = () => {
      const blocksCount = window.innerWidth > 768 ? 64 : 16;
      return Array.from({ length: blocksCount }, (_, i) => ({
        id: i,
        opacity: Math.random() > 0.8 ? 0 : 0.97,
        rotation: (Math.random() - 0.5) * 5,
        delay: Math.random() * 20
      }));
    };

    setBlocks(generateBlocks());

    const handleResize = () => {
      setBlocks(generateBlocks());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 grid grid-cols-8 grid-rows-8 gap-0.5 p-0.5 z-0 pointer-events-none md:grid-cols-8 md:grid-rows-8">
      {blocks.map(block => (
        <div
          key={block.id}
          className="relative overflow-hidden transform-gpu transition-transform duration-1000"
          style={{
            transform: `rotateX(${block.rotation}deg) rotateY(${block.rotation}deg)`,
            opacity: block.opacity,
            background: 'rgba(255, 255, 255, 0.05)' // Changed from black to subtle white
          }}
        >
          {/* Portal effect - removed black background */}
          <div
            className="absolute inset-0 rounded-full animate-portalPulse"
            style={{ 
              animationDelay: `${block.delay}s`,
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
            }}
          />
          {/* Void ring */}
          <div
            className="absolute inset-0 border border-white/10 rounded-full animate-voidRotate"
            style={{ animationDelay: `${block.delay / 2}s` }}
          />
          {/* Glitch scan effect */}
          <div 
            className="absolute inset-0 animate-glitchScan"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Enhanced Glitch Text Component
const GlitchText = ({ text }) => {
  const [isGlitching, setIsGlitching] = useState(false);
  
  useEffect(() => {
    const glitchLoop = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }, 2000 + Math.random() * 3000);
    
    return () => clearInterval(glitchLoop);
  }, []);

  return (
    <div className="relative">
      {/* Base text */}
      <div 
        className={`text-6xl font-bold text-white font-neo-brutalist relative transition-transform
                    ${isGlitching ? 'animate-[glitch-skew_0.2s_infinite]' : ''}`}
      >
        {/* Main text */}
        <span className="relative block">
          {text}
        </span>
        
        {/* Glitch layers */}
        <span 
          className={`absolute top-0 left-0 w-full 
                      ${isGlitching ? 'animate-[glitch-anim1_0.2s_infinite]' : 'opacity-0'}`}
          style={{ 
            textShadow: '2px 0 #ff0000',
            clipPath: 'rect(24px, 550px, 90px, 0)',
          }}
        >
          {text}
        </span>
        
        <span 
          className={`absolute top-0 left-0 w-full
                      ${isGlitching ? 'animate-[glitch-anim2_0.3s_infinite]' : 'opacity-0'}`}
          style={{ 
            textShadow: '-2px 0 #00ff00',
            clipPath: 'rect(85px, 550px, 140px, 0)',
          }}
        >
          {text}
        </span>
      </div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 51%, transparent 100%)',
        backgroundSize: '100% 4px',
        animation: isGlitching ? 'scanlines 0.2s linear infinite' : 'none',
      }} />
    </div>
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

  return (
    // its this class
    <div className="relative w-full h-screen overflow-hidden bg-transparent"> 
      <div className="fixed inset-0 bg-black -z-10" />
      
      {/* Add BlocksGrid before Portal */}
      <BlocksGrid />

      <Portal isMobile={isMobile} />

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(transparent 97%, rgba(255,255,255,0.3) 100%),
            linear-gradient(90deg, transparent 97%, rgba(255,255,255,0.3) 100%)
          `,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block absolute inset-0">
        <div className="w-full flex flex-col items-center">
          <div className="mt-12">
            <GlitchText text="SIGNAL-23" />
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <AudioPlayer 
            isPlaying={isPlayingAudio}
            onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
            audioSource="/pieces-website-mp3.mp3"
          />
        </div>
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden absolute inset-0 flex flex-col items-center z-20">
        <div className="mt-12">
          <GlitchText text="SIGNAL-23" />
        </div>
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

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="w-full h-2 bg-white/5"
          style={{
            animation: 'scan 4s linear infinite',
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes glitch-anim1 {
          0% { clip-path: rect(24px, 550px, 90px, 0); }
          20% { clip-path: rect(45px, 550px, 50px, 0); }
          40% { clip-path: rect(12px, 550px, 92px, 0); }
          60% { clip-path: rect(70px, 550px, 32px, 0); }
          80% { clip-path: rect(15px, 550px, 81px, 0); }
          100% { clip-path: rect(24px, 550px, 90px, 0); }
        }

        @keyframes glitch-anim2 {
          0% { clip-path: rect(85px, 550px, 140px, 0); }
          20% { clip-path: rect(25px, 550px, 84px, 0); }
          40% { clip-path: rect(76px, 550px, 123px, 0); }
          60% { clip-path: rect(15px, 550px, 69px, 0); }
          80% { clip-path: rect(93px, 550px, 135px, 0); }
          100% { clip-path: rect(85px, 550px, 140px, 0); }
        }

        @keyframes glitch-skew {
          0% { transform: skew(-2deg); }
          20% { transform: skew(2deg); }
          40% { transform: skew(-1deg); }
          60% { transform: skew(3deg); }
          80% { transform: skew(1deg); }
          100% { transform: skew(-2deg); }
        }

        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }

        @keyframes scan {
          from { transform: translateY(-100vh); }
          to { transform: translateY(100vh); }
        }


        @keyframes portalPulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          45%, 55% { 
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 1;
          }
        }

        @keyframes voidRotate {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 0;
          }
          45%, 55% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes glitchScan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          45%, 55% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }

      `}</style>
    </div>
  );
};

export default App;