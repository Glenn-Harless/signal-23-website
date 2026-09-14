import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Listen.css';
import spotifyIcon from './spotify-icon.json';
import {
  LISTEN_ARTIST,
  ListenTrack,
  ListenVideo,
  listenPageTitle,
} from './listenTracks';
import { readCampaignParams } from '../../lib/campaignParams';
import { recordListenPageView, recordSpotifyOutbound } from '../../lib/listenAnalytics';

/*
 * The markup below is mirrored by renderListenMarkup() in scripts/listen-pages.js,
 * which pre-renders it into the static /listen/<slug>/index.html so the page works
 * before (or without) JavaScript. Keep the two structures identical.
 */

function motionAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection && connection.saveData) return false;
  return true;
}

const LoopVideo: React.FC<{ video: ListenVideo }> = ({ video }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // React 17 sets `muted` as a property only; make sure autoplay policies see it.
    el.muted = true;
    el.defaultMuted = true;
    const attempt = el.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        // Autoplay blocked (e.g. iOS Low Power Mode): the still underneath stays visible.
      });
    }
  }, []);

  return (
    <video
      ref={ref}
      className={`listen__loop${playing ? ' is-playing' : ''}`}
      src={video.src}
      width={video.width}
      height={video.height}
      muted
      loop
      autoPlay
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
    />
  );
};

export interface ListenPageProps {
  track: ListenTrack;
}

export const ListenPage: React.FC<ListenPageProps> = ({ track }) => {
  const campaign = useMemo(
    () => readCampaignParams(typeof window !== 'undefined' ? window.location.search : ''),
    [],
  );
  const [showLoop] = useState(() => Boolean(track.loopVideo) && motionAllowed());

  useEffect(() => {
    const previousTitle = document.title;
    document.title = listenPageTitle(track);
    return () => {
      document.title = previousTitle;
    };
  }, [track]);

  useEffect(() => {
    recordListenPageView({ trackSlug: track.slug, campaign });
  }, [track.slug, campaign]);

  const recordActivation = () => {
    // No preventDefault: the browser follows the href whatever analytics does.
    recordSpotifyOutbound({ trackSlug: track.slug, destinationUrl: track.spotifyUrl, campaign });
  };

  const handleAuxClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Middle-click opens the track in a new tab without firing `click`.
    if (event.button === 1) recordActivation();
  };

  return (
    <main className="listen">
      <div className="listen__frame">
        <header className="listen__head">
          <p className="listen__artist">{LISTEN_ARTIST}</p>
          <h1 className="listen__title">{track.title}</h1>
          {track.description ? <p className="listen__description">{track.description}</p> : null}
        </header>

        <figure className="listen__art">
          <img
            src={track.artwork.src}
            width={track.artwork.width}
            height={track.artwork.height}
            alt={track.artwork.alt || `${track.title} artwork`}
            decoding="async"
          />
          {showLoop && track.loopVideo ? <LoopVideo video={track.loopVideo} /> : null}
        </figure>

        <div className="listen__actions">
          <a
            className="listen__cta"
            href={track.spotifyUrl}
            data-track-slug={track.slug}
            onClick={recordActivation}
            onAuxClick={handleAuxClick}
          >
            <svg viewBox={spotifyIcon.viewBox} aria-hidden="true" focusable="false">
              <path d={spotifyIcon.path} />
            </svg>
            <span>Listen on Spotify</span>
          </a>

          <nav className="listen__secondary" aria-label={`More from ${LISTEN_ARTIST}`}>
            <a className="listen__explore" href={track.exploreHref || '/'}>
              Explore {LISTEN_ARTIST}
            </a>
            <a className="listen__privacy" href="/legal/privacy">
              Privacy
            </a>
          </nav>
        </div>
      </div>
    </main>
  );
};
