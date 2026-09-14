import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Listen.css';
import { ListenPage } from './ListenPage';
import { LISTEN_ARTIST, findListenTrack } from './listenTracks';

const ListenNotFound: React.FC = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = LISTEN_ARTIST;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="listen">
      <div className="listen__frame">
        <header className="listen__head">
          <p className="listen__artist">{LISTEN_ARTIST}</p>
          <h1 className="listen__title">No signal</h1>
          <p className="listen__description">This listening link is not active.</p>
        </header>
        <div className="listen__actions">
          <a className="listen__cta" href="/">
            <span>Enter {LISTEN_ARTIST}</span>
          </a>
        </div>
      </div>
    </main>
  );
};

/**
 * SPA fallback for /listen/:slug. In production the static per-track HTML is served
 * first (see scripts/listen-pages.js); this route covers hosts without that file
 * and unknown slugs.
 */
export const ListenRoute: React.FC = () => {
  const { slug = '' } = useParams();
  const track = findListenTrack(slug);
  if (!track) return <ListenNotFound />;
  return <ListenPage track={track} />;
};
