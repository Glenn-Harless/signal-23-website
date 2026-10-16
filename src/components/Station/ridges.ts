import { RELEASES, telemetryFor } from '../../data/releases';

export const RIDGE_SAMPLES = 96;

// Each measured release becomes one ridge, oldest first (farthest away).
// The ridgeline is the track's level over its length: the mean of each of its 24 measured slices.
const envelope = (spectrum: number[][]) => {
  const levels = spectrum.map((row) => row.reduce((a, b) => a + b, 0) / row.length);
  const max = Math.max(...levels) || 1;
  return levels.map((v) => v / max);
};

// Upsample to 96 points, then lift local rises and dips so long loud stretches read as a ridgeline
// rather than a plateau.
const shape = (env: number[]) => {
  const n = RIDGE_SAMPLES;
  const last = env.length - 1;
  const u: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const s = (i / (n - 1)) * last;
    const k = Math.min(Math.floor(s), last - 1);
    const f = s - k;
    const p0 = env[Math.max(k - 1, 0)];
    const p1 = env[k];
    const p2 = env[k + 1];
    const p3 = env[Math.min(k + 2, last)];
    u.push(0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f));
  }
  const r = u.map((v, i) => {
    let ws = 0;
    let acc = 0;
    for (let j = 0; j < n; j += 1) {
      const w = Math.exp(-0.5 * ((i - j) / 5) ** 2);
      ws += w;
      acc += w * u[j];
    }
    return 0.4 * v + 2.4 * (v - acc / ws);
  });
  const lo = Math.min(...r);
  const hi = Math.max(...r);
  return r.map((v) => (v - lo) / (hi - lo || 1));
};

/** Ridge profiles, 0..1, oldest release first. The shader expects exactly seven. */
export const ridgeProfiles = (): number[][] =>
  RELEASES.map((r) => telemetryFor(r.slug))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .slice(-7)
    .map((t) => shape(envelope(t.spectrum)));

/** The mast stands on the highest point of the newest ridge. */
export const mastPosition = (front: number[]) => {
  let best = 0;
  front.forEach((v, i) => {
    if (v > front[best]) best = i;
  });
  const u = (best + 0.5) / RIDGE_SAMPLES;
  return {
    u,
    // Window units, matching the shader's front-ridge mapping; y is the mast top.
    x: (u - 0.34) / 0.92 + 0.5,
    footY: 0.9 - 0.22 * 0.86 * front[best],
  };
};
