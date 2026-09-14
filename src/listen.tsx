/**
 * Standalone entry for the static /listen/<slug>/index.html pages.
 * Ships only React plus the listen component, not the full site bundle.
 * The pre-rendered markup in #listen-root already works before this runs;
 * mounting adds the optional loop video and analytics.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { ListenPage } from './components/Listen/ListenPage';
import { findListenTrack } from './components/Listen/listenTracks';

const root = document.getElementById('listen-root');

function slugFromLocation(): string {
  const segments = window.location.pathname.replace(/\/+$/, '').split('/');
  const last = segments[segments.length - 1] || '';
  return last === 'index.html' ? segments[segments.length - 2] || '' : last;
}

const slug = (root && root.dataset.track) || slugFromLocation();
const track = findListenTrack(slug);

if (root && track) {
  ReactDOM.render(
    <React.StrictMode>
      <ListenPage track={track} />
    </React.StrictMode>,
    root,
  );
}
