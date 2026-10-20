import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DistortedStack } from '../TextStack/TextStack';
import { NavigationLink } from '../Navigation/NavigationLink';
import { StationPortal } from './StationPortal';
import { NumberReadout } from './NumberReadout';
import { StationBroadcast } from './broadcast';
import './station.css';

interface StationHomeProps {
  isMobile: boolean;
}

export const StationHome: React.FC<StationHomeProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  const broadcast = useMemo(() => new StationBroadcast(), []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const sync = () => setIsPlaying(!el.paused);
    el.addEventListener('play', sync);
    el.addEventListener('pause', sync);
    el.addEventListener('ended', sync);
    return () => {
      el.pause();
      el.removeEventListener('play', sync);
      el.removeEventListener('pause', sync);
      el.removeEventListener('ended', sync);
    };
  }, []);

  const toggleListen = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
      return;
    }
    el.play().catch(() => setIsPlaying(false));
  }, []);

  return (
    <div className="station-home">
      <audio ref={audioRef} src="/audio/pieces.mp3" preload="none" loop />

      <StationPortal broadcast={broadcast} onEnter={() => navigate('/terminal')} />

      <NumberReadout broadcast={broadcast} isAudioPlaying={isPlaying} onListen={toggleListen} />

      {isMobile ? (
        // The font renders "-" as "-2", so "SIGNAL-3" displays as "SIGNAL-23".
        <h1 className="station-home__title font-neo-brute-transparent">SIGNAL-3</h1>
      ) : (
        <div className="station-home__stack">
          <DistortedStack isPlayingAudio={isPlaying} />
        </div>
      )}

      <div className="station-home__contact font-ibm-mono">
        <NavigationLink label="music@signal23.net" description="Get in touch" href="mailto:music@signal23.net" />
      </div>

    </div>
  );
};
