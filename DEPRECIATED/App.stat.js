import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music2, Mail, Info, ExternalLink } from 'lucide-react';

const App = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  const navLinks = [
    { 
      icon: <Info className="w-5 h-5" />,
      label: "INFO",
      href: "#",
      description: "About Signal-23" 
    },
    { 
      icon: <Mail className="w-5 h-5" />,
      label: "CONTACT",
      href: "mailto:your@email.com",
      description: "Get in touch" 
    },
    { 
      icon: <Music2 className="w-5 h-5" />,
      label: "MUSIC",
      href: "#",
      description: "Listen on platforms",
      platforms: [
        { name: "Spotify", url: "#" },
        { name: "Apple Music", url: "#" },
        { name: "Bandcamp", url: "#" },
        { name: "SoundCloud", url: "#" }
      ]
    }
  ];

  // Canvas and noise effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // red
        data[i + 1] = value; // green
        data[i + 2] = value; // blue
        data[i + 3] = 255;   // alpha
      }

      return imageData;
    };

    const drawSignal = (imageData) => {
      const data = imageData.data;
      const signalPhrase = "SIGNAL-23";
      const signalStart = Math.random() * (data.length / 4 - signalPhrase.length * 8);

      for (let i = 0; i < signalPhrase.length; i++) {
        const charCode = signalPhrase.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
          const bit = (charCode >> j) & 1;
          const index = (signalStart + i * 8 + j) * 4;
          if (bit && index < data.length - 4) {
            data[index] = 255;     // red
            data[index + 1] = 0;   // green
            data[index + 2] = 0;   // blue
          }
        }
      }
    };

    const drawWave = (imageData, type) => {
      const data = imageData.data;
      const width = canvas.width;
      const startY = Math.random() * canvas.height;
      const amplitude = Math.random() * 30 + 10;
      const frequency = Math.random() * 0.02 + 0.01;
      const thickness = Math.floor(Math.random() * 3) + 1;

      for (let x = 0; x < width; x++) {
        let y;
        
        switch(type) {
          case 'sine':
            y = startY + Math.sin(x * frequency + time) * amplitude;
            break;
          case 'triangle':
            y = startY + (Math.abs(((x * frequency + time) % (2 * Math.PI)) - Math.PI) - Math.PI/2) * amplitude/2;
            break;
          case 'saw':
            y = startY + ((x * frequency + time) % Math.PI) * amplitude/Math.PI;
            break;
          default:
            y = startY + Math.sin(x * frequency + time) * amplitude;
        }

        for (let t = -thickness; t <= thickness; t++) {
          const yPos = Math.floor(y + t);
          if (yPos >= 0 && yPos < canvas.height) {
            const index = (yPos * width + x) * 4;
            if (index < data.length - 4) {
              data[index] = 255;     // white waves
              data[index + 1] = 255;
              data[index + 2] = 255;
            }
          }
        }
      }
    };

    const animate = () => {
      const imageData = generateNoise();
      
      if (Math.random() < 0.1) {
        drawSignal(imageData);
      }

      if (Math.random() < 0.2) {
        const waveTypes = ['sine', 'triangle', 'saw'];
        const randomType = waveTypes[Math.floor(Math.random() * waveTypes.length)];
        drawWave(imageData, randomType);
      }

      ctx.putImageData(imageData, 0, 0);
      time += 0.05;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Audio control
  useEffect(() => {
    if (isPlayingAudio) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlayingAudio]);

  // Dropdown menu control
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (index) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredLink(index);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 300); // Increased delay for better usability
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Navigation Links */}
      <nav className="absolute top-0 right-0 p-6 z-20">
        <div className="flex flex-col space-y-4">
          {navLinks.map((link, index) => (
            <div 
              key={index} 
              className="relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href={link.href}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
              >
                {link.icon}
                <span className="text-sm font-medium">{link.label}</span>
              </a>
              
              {/* Dropdown for Music platforms */}
              {link.platforms && hoveredLink === index && (
                <div 
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="py-1">
                    {link.platforms.map((platform, pIndex) => (
                      <a
                        key={pIndex}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/20"
                      >
                        {platform.name}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl font-bold mb-8 text-white font-neo-brutalist">SIGNAL-23</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            {isPlayingAudio ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>

      <audio ref={audioRef} loop>
        <source src="/pieces-website-mp3.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default App;