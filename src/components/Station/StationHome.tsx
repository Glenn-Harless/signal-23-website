import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DistortedStack } from '../TextStack/TextStack';
import { NavigationLink } from '../Navigation/NavigationLink';
import { StationPortal, PortalVariant } from './StationPortal';
import { NumberReadout } from './NumberReadout';
import { StationBroadcast } from './broadcast';
import { analyserFor, resumeAudio } from '../../lib/audioGraph';
import './station.css';

const VARIANT_KEY = 'signal23.portal';
const VARIANTS: PortalVariant[] = ['a', 'b', 'c'];

// The design options stay switchable on deploy previews and locally, not on the live site.
const SHOW_OPTIONS = process.env.SITE_CONTEXT !== 'production';

const readVariant = (): PortalVariant => {
  const fromUrl = new URLSearchParams(window.location.search).get('portal')?.toLowerCase();
  if (fromUrl && (VARIANTS as string[]).includes(fromUrl)) {
    try {
      window.sessionStorage.setItem(VARIANT_KEY, fromUrl);
    } catch {
      // ignore
    }
    return fromUrl as PortalVariant;
  }
  try {
    const stored = window.sessionStorage.getItem(VARIANT_KEY);
    if (stored && (VARIANTS as string[]).includes(stored)) return stored as PortalVariant;
  } catch {
    // ignore
  }
  return 'b';
};

interface StationHomeProps {
  isMobile: boolean;
}

export const StationHome: React.FC<StationHomeProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  const [variant, setVariant] = useState<PortalVariant>(readVariant);
  const broadcast = useMemo(() => new StationBroadcast(), []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    setAudioEl(el);
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
    resumeAudio();
    // Option C breathes with the sound, so it needs the analyser in the signal path.
    if (variant === 'c') analyserFor(el);
    el.play().catch(() => setIsPlaying(false));
  }, [variant]);

  const pickVariant = (v: PortalVariant) => {
    setVariant(v);
    try {
      window.sessionStorage.setItem(VARIANT_KEY, v);
    } catch {
      // ignore
    }
  };

  return (
    <div className="station-home">
      <audio ref={audioRef} src="/pieces-website-mp3.mp3" preload="none" loop />

      <StationPortal
        key={variant}
        variant={variant}
        broadcast={broadcast}
        audio={audioEl}
        isAudioPlaying={isPlaying}
        onEnter={() => navigate('/terminal')}
        onListen={toggleListen}
      />

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

      {SHOW_OPTIONS && (
        <div className="station-home__options" role="group" aria-label="Portal design option">
          <span>PORTAL</span>
          {VARIANTS.map((v) => (
            <button key={v} type="button" className={v === variant ? 'is-on' : ''} aria-pressed={v === variant} onClick={() => pickVariant(v)}>
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
