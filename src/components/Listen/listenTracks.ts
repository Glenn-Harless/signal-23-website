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
  /** Verified https://open.spotify.com/track/... URL for the recording heard in the ad. */
  spotifyUrl: string;
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

export function listenPageTitle(track: ListenTrack): string {
  return `${track.title} · ${LISTEN_ARTIST}`;
}

export function listenPageDescription(track: ListenTrack): string {
  return track.description || `Listen to ${track.title} by ${LISTEN_ARTIST} on Spotify.`;
}
