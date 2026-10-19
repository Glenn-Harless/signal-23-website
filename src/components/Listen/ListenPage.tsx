import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Listen.css';
import spotifyIcon from './spotify-icon.json';
import {
  LISTEN_ARTIST,
  ListenDestination,
  ListenTrack,
  ListenVideo,
  listenDestination,
  listenPageTitle,
  spotifyAppUri,
} from './listenTracks';
import { ConsentBanner, useListenConsent } from './ListenConsent';
import { readCampaignParams } from '../../lib/campaignParams';
import { recordListenPageView, recordSpotifyOutbound } from '../../lib/listenAnalytics';

/*
 * The markup below is mirrored by renderListenMarkup() in scripts/listen-pages.js,
 * which pre-renders it into the static /listen/<slug>/index.html so the page works
 * before (or without) JavaScript. Keep the two structures identical, apart from the
 * JavaScript-only loop video, consent controls and app link test note.
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

/*
 * Spotify app link experiment, off unless the page URL has ?applink=1 (see the README).
 * Instagram's and Facebook's in-app browsers load open.spotify.com as a web page instead of
 * handing it to the Spotify app, so there the button tries spotify:track:<id> first.
 */
const APP_LINK_PARAM = 'applink';
const APP_LINK_FALLBACK_MS = 1500;
const META_IN_APP_BROWSER = /Instagram|FBAN|FBAV|FB_IAB/;

type AppLinkTest = {
  /** The app URI to try on this page, or null when the experiment does not apply here. */
  uri: string | null;
  /** Shown under the button while testing, so a phone shows which path a tap takes. */
  note: string;
};

/** Null unless the URL asks for the experiment. */
function readAppLinkTest(destination: ListenDestination): AppLinkTest | null {
  if (typeof window === 'undefined') return null;
  if (new URLSearchParams(window.location.search).get(APP_LINK_PARAM) !== '1') return null;
  const uri = spotifyAppUri(destination);
  if (!uri) {
    return {
      uri: null,
      note:
        destination.kind === 'presave'
          ? 'App link test off: pre-save link'
          : 'App link test off: not a Spotify track link',
    };
  }
  if (!META_IN_APP_BROWSER.test(navigator.userAgent || '')) {
    return { uri: null, note: 'App link test off: not the Instagram or Facebook browser' };
  }
  return { uri, note: `App link test on: tries ${uri} first` };
}

/**
 * Tries the Spotify app, then loads the https link if the page is still showing after
 * APP_LINK_FALLBACK_MS. The page going hidden (the app opened) cancels the fallback, so
 * coming back from Spotify leaves the visitor here rather than on the web player.
 */
function openSpotifyApp(appUri: string, webUrl: string, onSettled: () => void): void {
  const startedAt = Date.now();
  let timer = 0;

  function settle() {
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', settle);
    onSettled();
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') settle();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', settle);
  timer = window.setTimeout(() => {
    // A timer this late means the page was frozen in the background, i.e. the app opened.
    const wasFrozen = Date.now() - startedAt > APP_LINK_FALLBACK_MS * 2;
    settle();
    if (!wasFrozen && document.visibilityState === 'visible') window.location.href = webUrl;
  }, APP_LINK_FALLBACK_MS);

  window.location.href = appUri;
}

export interface ListenPageProps {
  track: ListenTrack;
}

export const ListenPage: React.FC<ListenPageProps> = ({ track }) => {
  const campaign = useMemo(
    () => readCampaignParams(typeof window !== 'undefined' ? window.location.search : ''),
    [],
  );
  const [showLoop] = useState(() => Boolean(track.loopVideo) && motionAllowed());
  const destination = listenDestination(track);
  const [appLink] = useState(() => readAppLinkTest(destination));
  const appLinkPending = useRef(false);
  const consent = useListenConsent();
  const cookiesButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // After a choice made from the reopened banner, return focus to the control that opened it.
    if (!consent.open && consent.reopened && cookiesButton.current) cookiesButton.current.focus();
  }, [consent.open, consent.reopened]);

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
    // Synchronous and before any navigation; it never holds the link back.
    recordSpotifyOutbound({
      trackSlug: track.slug,
      destinationUrl: destination.href,
      destination: destination.kind,
      campaign,
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    recordActivation();
    // Default: no preventDefault, so the browser follows the https href.
    if (!appLink || !appLink.uri) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (appLinkPending.current) return;
    appLinkPending.current = true;
    openSpotifyApp(appLink.uri, destination.href, () => {
      appLinkPending.current = false;
    });
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
            href={destination.href}
            data-track-slug={track.slug}
            onClick={handleClick}
            onAuxClick={handleAuxClick}
          >
            <svg viewBox={spotifyIcon.viewBox} aria-hidden="true" focusable="false">
              <path d={spotifyIcon.path} />
            </svg>
            <span>{destination.label}</span>
          </a>

          {appLink ? <p className="listen__applink-note">{appLink.note}</p> : null}

          <nav className="listen__secondary" aria-label={`More from ${LISTEN_ARTIST}`}>
            <a className="listen__explore" href={track.exploreHref || '/'}>
              Explore {LISTEN_ARTIST}
            </a>
            {consent.askable && !consent.open ? (
              <button ref={cookiesButton} type="button" className="listen__cookies" onClick={consent.reopen}>
                Cookies
              </button>
            ) : null}
            <a className="listen__privacy" href="/legal/privacy/">
              Privacy
            </a>
          </nav>
        </div>

        {consent.open ? (
          <ConsentBanner measuring={consent.measuring} onChoose={consent.choose} reopened={consent.reopened} />
        ) : null}
      </div>
    </main>
  );
};
