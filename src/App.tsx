import React, { useState, useEffect } from 'react';
import { Music2, Mail, Info } from 'lucide-react';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';

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
    // {
    //   label: "INFO",
    //   href: "/info",
    //   description: "Learn more"
    // },
    // {
    //   label: "MUSIC",
    //   href: "/music",
    //   description: "Listen on your favorite platform",
    //   platforms: [
    //     { name: "Spotify", url: "https://open.spotify.com/artist/4w8b2J7t2j8KkYk5LrQX3Q" },
    //     { name: "Apple Music", url: "https://music.apple.com/us/artist/signal-23/1566932954" },
    //     { name: "YouTube", url: "https://www.youtube.com/channel/UC7Jf6t6m2sQp9d2Q8Hv1Z8w" }
    //   ]
    // }
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

        <div className="absolute right-20 top-0 h-full flex flex-col justify-center">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="text-6xl font-bold text-white font-neo-brutalist mb-8"
            >
              SIGNAL-23
            </div>
          ))}
        </div>
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden absolute inset-0 flex flex-col items-center z-20">
        <h1 className="text-5xl font-bold text-white font-neo-brutalist mt-12">
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
    </div>
  );
};

export default App;