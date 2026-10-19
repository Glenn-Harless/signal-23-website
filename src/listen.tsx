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
import { setConsentMode } from './lib/consent';

const root = document.getElementById('listen-root');

function slugFromLocation(): string {
  const segments = window.location.pathname.replace(/\/+$/, '').split('/');
  const last = segments[segments.length - 1] || '';
  return last === 'index.html' ? segments[segments.length - 2] || '' : last;
}

const slug = (root && root.dataset.track) || slugFromLocation();
const track = findListenTrack(slug);

if (root && track) {
  // Written by the listen-region edge function from the visitor's country; anything else stays opt-in.
  setConsentMode(root.dataset.consent === 'opt-out' ? 'opt-out' : 'opt-in');
  ReactDOM.render(
    <React.StrictMode>
      <ListenPage track={track} />
    </React.StrictMode>,
    root,
  );
}
