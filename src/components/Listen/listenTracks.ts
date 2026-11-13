import data from '../../data/listenTracks.json';

export type ListenImage = {
  src: string;
  width: number;
  height: number;
  alt?: string;
};

export type ListenVideo = {
  src: string;
  width: number;
  height: number;
};

export type ListenTrack = {
  /** URL segment: /listen/<slug>. Lowercase letters, digits and hyphens only. */
  slug: string;
  /** Exact advertised track title. */
  title: string;
  /**
   * Verified https://open.spotify.com/track/... URL for the recording heard in the ad,
   * or a https://open.spotify.com/playlist/... URL for a playlist page.
   */
  spotifyUrl?: string;
  /** Pre-release only: the DistroKid HyperFollow pre-save page, used until `spotifyUrl` is set. */
  preSaveUrl?: string;
  releaseDate?: string;
  /** Optional, at most one sentence. Omit rather than invent copy. */
  description?: string;
  /** Approved still shown on the page and used as the share image fallback. */
  artwork: ListenImage;
  /** Optional 1200x630 crop for link previews; falls back to `artwork`. */
  shareImage?: ListenImage;
  /** Optional muted decorative loop layered over the still when motion is allowed. */
  loopVideo?: ListenVideo;
  /** Where "Explore Signal-23" goes; defaults to the homepage portal. */
  exploreHref?: string;
};

export const LISTEN_ARTIST: string = data.artist;
export const LISTEN_SITE_URL: string = data.siteUrl;
export const listenTracks: ListenTrack[] = data.tracks;

export function findListenTrack(slug: string): ListenTrack | undefined {
  const normalized = slug.trim().toLowerCase();
  return listenTracks.find((track) => track.slug === normalized);
}

export type ListenDestination = {
  href: string;
  label: string;
  /** Reported with the outbound event so pre-save taps stay distinguishable from listens. */
  kind: 'spotify' | 'presave';
};

/** True when the page's button opens a Spotify playlist rather than a track. Mirrored in scripts/listen-pages.js. */
export function isListenPlaylist(track: ListenTrack): boolean {
  return Boolean(track.spotifyUrl && track.spotifyUrl.startsWith('https://open.spotify.com/playlist/'));
}

/**
 * The main button: the track (or playlist) on Spotify once released, the pre-save page before.
 * Playlists keep kind 'spotify', so their taps are the same spotify_outbound_click event.
 * Mirrored in scripts/listen-pages.js.
 */
export function listenDestination(track: ListenTrack): ListenDestination {
  if (track.spotifyUrl) {
    const label = isListenPlaylist(track) ? 'Open the playlist in Spotify' : 'Listen on Spotify';
    return { href: track.spotifyUrl, label, kind: 'spotify' };
  }
  return { href: track.preSaveUrl || '/', label: 'Pre-save on Spotify', kind: 'presave' };
}

/** The small line above the title: the artist, or "A Signal-23 playlist" on playlist pages. */
export function listenKicker(track: ListenTrack): string {
  return isListenPlaylist(track) ? `A ${LISTEN_ARTIST} playlist` : LISTEN_ARTIST;
}

/** Shown under the button on playlist pages only. */
export const LISTEN_PLAYLIST_HINT = 'Then tap + in Spotify to save it to your library.';

export function listenPageTitle(track: ListenTrack): string {
  return `${track.title} · ${LISTEN_ARTIST}`;
}

export function listenPageDescription(track: ListenTrack): string {
  return track.description || `Listen to ${track.title} by ${LISTEN_ARTIST} on Spotify.`;
}
