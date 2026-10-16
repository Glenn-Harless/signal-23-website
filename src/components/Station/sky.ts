// The visitor's sky, from their own clock only (no location prompt).
// Shared by the portal, the terminal header and A/V.

export type SkyPhase = 'NIGHT' | 'DAWN' | 'DAY' | 'DUSK';
export type Rgb = [number, number, number];

// Shadow, mid and highlight colours, keyed by hour of day. Between keys the colours blend.
const PALETTE_KEYS: Array<[number, Rgb, Rgb, Rgb]> = [
  [0, [3, 7, 13], [42, 74, 92], [191, 233, 245]],
  [5, [3, 7, 13], [42, 74, 92], [191, 233, 245]],
  [6.7, [10, 8, 8], [107, 93, 99], [236, 217, 210]],
  [8.6, [6, 6, 6], [123, 123, 120], [244, 243, 238]],
  [16.8, [6, 6, 6], [123, 123, 120], [244, 243, 238]],
  [18.8, [11, 7, 5], [110, 85, 61], [240, 211, 168]],
  [20.6, [3, 7, 13], [42, 74, 92], [191, 233, 245]],
  [24, [3, 7, 13], [42, 74, 92], [191, 233, 245]],
];

// Preview hours for ?sky=dawn|day|dusk|night, so the times of day can be shown without waiting.
const PREVIEW_HOURS: Record<string, number> = { dawn: 6.9, day: 12.5, dusk: 18.9, night: 23.2 };

export const localHour = (date = new Date()): number => {
  if (typeof window !== 'undefined') {
    const preview = new URLSearchParams(window.location.search).get('sky');
    if (preview && PREVIEW_HOURS[preview.toLowerCase()] !== undefined) {
      return PREVIEW_HOURS[preview.toLowerCase()];
    }
  }
  return date.getHours() + date.getMinutes() / 60;
};

export const skyPhase = (h: number): SkyPhase => {
  if (h < 5 || h >= 20.5) return 'NIGHT';
  if (h < 8.5) return 'DAWN';
  if (h < 17) return 'DAY';
  return 'DUSK';
};

/** Shadow, mid, highlight as 0-255 RGB. */
export const skyPalette = (h: number): [Rgb, Rgb, Rgb] => {
  for (let i = 0; i < PALETTE_KEYS.length - 1; i += 1) {
    const a = PALETTE_KEYS[i];
    const b = PALETTE_KEYS[i + 1];
    if (h >= a[0] && h <= b[0]) {
      const f = (h - a[0]) / (b[0] - a[0] || 1);
      const mix = (k: 1 | 2 | 3) => a[k].map((v, j) => v + (b[k][j] - v) * f) as Rgb;
      return [mix(1), mix(2), mix(3)];
    }
  }
  return [PALETTE_KEYS[0][1], PALETTE_KEYS[0][2], PALETTE_KEYS[0][3]];
};

const smoothstep = (a: number, b: number, x: number) => {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** 1 at night, 0 by day, easing through dawn and dusk. */
export const nightAmount = (h: number) => Math.max(0, Math.min(1, 1 - smoothstep(5.0, 6.8, h) + smoothstep(18.9, 20.6, h)));

/** Moon phase 0..1 from the date: 0 new, 0.5 full. */
export const moonPhase = (now = Date.now()) => {
  const synodic = 29.530588853;
  const days = (now - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  return (((days % synodic) + synodic) % synodic) / synodic;
};

/** Percentage of the disc lit. */
export const moonLit = (phase: number) => (1 - Math.cos(2 * Math.PI * phase)) / 2;

/** Low sun position for the window, which faces south: it rises on the left and sets on the right. */
export const sunState = (h: number) => {
  const x = Math.max(-0.3, Math.min(1.3, -0.3 + ((h - 6) / 13.5) * 1.6));
  const elevation = h > 6.3 && h < 19.4 ? Math.sin((Math.PI * (h - 6.3)) / 13.1) : 0;
  const glow = Math.exp(-(((h - 6.9) / 1.1) ** 2)) + Math.exp(-(((h - 18.9) / 1.1) ** 2));
  return { x, elevation, glow };
};

/**
 * Where the moon sits in the window, in window units (0..1, top-left origin), or null when it is down.
 * It transits about phase x 24 hours after noon and is up for roughly six hours either side.
 */
export const moonInWindow = (h: number, phase: number) => {
  const transit = (12 + phase * 24) % 24;
  const fromTransit = ((h - transit + 36) % 24) - 12;
  if (Math.abs(fromTransit) > 6.2) return null;
  const a = fromTransit / 6.2;
  return { x: 0.5 + a * 0.55, y: 0.52 - Math.cos((a * Math.PI) / 2) * 0.36 };
};
