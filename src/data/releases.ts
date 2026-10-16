// Releases as the terminal (TUNE) and A/V see them.
// Each release sits on a frequency taken from its release date, MM.DD.
// Measured numbers come from the masters (releaseTelemetry.json); a release without a local master
// shows as not loaded until its audio is added.

import telemetry from './releaseTelemetry.json';

export type ReleaseTelemetry = {
  dur: number;
  lufs: number;
  lra: number;
  tp: number;
  centroid: number;
  key: string | null;
  /** 24 slices through the track, 48 log-spaced bands each, 0-100. */
  spectrum: number[][];
};

export type Release = {
  slug: string;
  title: string;
  date: string;
  /** Tuning frequency shown in the terminal. */
  freq: string;
  group: string;
  audio?: string;
  /** Official visual on YouTube (16:9). */
  film?: string;
  /** Vertical excerpts on YouTube. */
  excerpts: string[];
};

export const RELEASES: Release[] = [
  {
    slug: 'pieces',
    title: 'Pieces',
    date: '2025.11.28',
    freq: '11.28',
    group: 'EP1',
    audio: '/pieces-website-mp3.mp3',
    film: '5_QlZY85eKA',
    excerpts: ['cm1E3WjcYNM'],
  },
  {
    slug: 'pillars',
    title: 'Pillars',
    date: '2026.01.02',
    freq: '01.02',
    group: 'EP1',
    film: 'xfliM3sAmOU',
    excerpts: ['BObVvPSduFE'],
  },
  {
    slug: 'reset',
    title: 'Reset',
    date: '2026.02.06',
    freq: '02.06',
    group: 'EP1',
    film: 'Ys8Yhyo_kRM',
    excerpts: ['spg2qyfL8nI'],
  },
  {
    slug: 'decay',
    title: 'Decay',
    date: '2026.03.20',
    freq: '03.20',
    group: 'EP1',
    audio: '/audio/decay.mp3',
    film: 'NQbDXcCFL84',
    excerpts: ['BEjHnS4gsPk', '5s5YYismqMk'],
  },
  {
    slug: 'pillars-ambient',
    title: 'Pillars (Ambient)',
    date: '2026.04.13',
    freq: '04.13',
    group: 'EP1',
    film: 'MqOUYAsZ_sM',
    excerpts: ['UyjCCA4SKg4'],
  },
  {
    slug: 'branchsplit',
    title: 'Branchsplit',
    date: '2026.08.28',
    freq: '08.28.1',
    group: 'EP2',
    audio: '/audio/branchsplit.mp3',
    excerpts: [],
  },
  {
    slug: 'streamfront',
    title: 'Streamfront',
    date: '2026.08.28',
    freq: '08.28.2',
    group: 'EP2',
    audio: '/audio/streamfront.mp3',
    excerpts: ['9rreyTWs9SM', 'VtlDfMmzQ8o'],
  },
  {
    slug: 'cloudform',
    title: 'Cloudform',
    date: '2026.08.28',
    freq: '08.28.3',
    group: 'EP2',
    audio: '/audio/cloudform.mp3',
    excerpts: ['i5SHFUtktac'],
  },
  {
    slug: 'torchrite',
    title: 'Torchrite',
    date: '2026.08.28',
    freq: '08.28.4',
    group: 'EP2',
    audio: '/audio/torchrite.mp3',
    excerpts: ['sClYliWkKx8'],
  },
  {
    slug: 'brooding-games',
    title: 'Brooding Games',
    date: '2026.09.25',
    freq: '09.25',
    group: 'SINGLE',
    audio: '/audio/brooding-games.mp3',
    excerpts: ['O0bI5iXpACI', 'Eh2flYe95xs'],
  },
];

// Other vertical visuals on the channel that aren't tied to one release.
export const LOOSE_EXCERPTS: Array<{ id: string; title: string }> = [
  { id: 'hZ2ciHM4Izo', title: 'EP2, teaser' },
  { id: 'efpSs_P3GK8', title: 'EP2' },
  { id: 'ONpcdai0VvQ', title: 'Revealing Diptych' },
  { id: 'oyPao5acqY0', title: 'Revealing Diptych, excerpt 3' },
  { id: '4mjVfQSvbq8', title: 'Dimension and System' },
  { id: 'BMF239UaqJg', title: 'Beside the Collision' },
  { id: 'fKwE_umw6zw', title: 'Blurring Beside the Maelstrom' },
  { id: 'nLASKfRrNYo', title: 'Forging in the Compass' },
  { id: 'YY4W7K_EG24', title: 'Rolling the Torch' },
  { id: 'eTUGMAFWWcU', title: 'Mod Selekt' },
  { id: 'ls9lLJy_ntI', title: 'L17 Door' },
  { id: 'FMxo-Xm4sPA', title: 'Visual' },
  { id: 'xnClbINhkfU', title: 'Visual' },
];

const TELEMETRY = telemetry as Record<string, ReleaseTelemetry>;

export const telemetryFor = (slug: string): ReleaseTelemetry | null => TELEMETRY[slug] ?? null;

export const latestRelease = () => RELEASES[RELEASES.length - 1];

export const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
