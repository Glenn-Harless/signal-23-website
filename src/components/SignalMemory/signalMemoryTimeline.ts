// Signal Memory — the schedule.
//
// The piece is one electron beam writing onto one phosphor. Nothing on screen
// fades in or out on a curve; light only appears where the beam has written it
// and only stays as long as the phosphor holds it. What changes over the piece
// is what the beam is reading, how well it is synced, and how it blends into
// what is already glowing. This module turns (seed, duration, aspect) into the
// exact list of raster fields the beam will draw. The renderer just executes it.

import type { AspectRatio } from '../../lib/exportSettings';

export const DEFAULT_SIGNAL_MEMORY_DURATION = 13.5;
export const SIGNAL_MEMORY_MIN_DURATION = 12;
export const SIGNAL_MEMORY_MAX_DURATION = 15;

/** Aspect of every promo1 still (3840 × 1606). */
export const SOURCE_ASPECT = 3840 / 1606;

/** Emblem width (fraction of source width) that all observations are normalised to. */
export const EMBLEM_REFERENCE_WIDTH = 0.55;

export type SignalMemoryPreset = {
  id: string;
  label: string;
  seed: string;
  note: string;
};

export const SIGNAL_MEMORY_PRESETS: SignalMemoryPreset[] = [
  {
    id: 'cold-archive',
    label: 'COLD ARCHIVE',
    seed: 'S23-COLD-2307',
    note: 'Long blue phosphor. Slow acquisition, patient integration, cold contour extraction.',
  },
  {
    id: 'red-split',
    label: 'RED SPLIT',
    seed: 'S23-SPLIT-1315',
    note: 'Hot phosphor. Warm observations first, heavier sync tearing, faster decay.',
  },
  {
    id: 'glyph-vault',
    label: 'GLYPH VAULT',
    seed: 'S23-GLYPH-1603',
    note: 'Finer code grid and a longer codification pass before the lockup lands.',
  },
];

// ── Source description ────────────────────────────────────────────────────────

/** What the beam can read. Matches the `uSource` uniform. */
export const SOURCE = { OBSERVATION: 0, TEXT: 1, STAR: 2, LOCKUP: 3, MEMORY: 4 } as const;

/**
 * The twelve observations of the emblem, in atlas order (observations-a holds
 * 0–5, observations-b holds 6–11; 2 columns × 3 rows each). Each entry is the
 * emblem centre (source uv, y measured from the top) and emblem width, found by
 * registering each frame's dark-emblem mask against frame 9, so that every
 * observation can be placed with the emblem in the same spot.
 */
export type Observation = {
  frame: number;
  cx: number;
  cyTop: number;
  width: number;
  warm: boolean;
};

export const OBSERVATIONS: Observation[] = [
  { frame: 2, cx: 0.541, cyTop: 0.468, width: 0.528, warm: true },
  { frame: 4, cx: 0.610, cyTop: 0.521, width: 0.466, warm: true },
  { frame: 5, cx: 0.527, cyTop: 0.501, width: 0.551, warm: false },
  { frame: 6, cx: 0.551, cyTop: 0.498, width: 0.548, warm: false },
  { frame: 7, cx: 0.540, cyTop: 0.500, width: 0.544, warm: false },
  { frame: 9, cx: 0.513, cyTop: 0.499, width: 0.547, warm: false },
  { frame: 10, cx: 0.507, cyTop: 0.514, width: 0.550, warm: false },
  { frame: 11, cx: 0.487, cyTop: 0.506, width: 0.543, warm: false },
  { frame: 12, cx: 0.536, cyTop: 0.509, width: 0.551, warm: true },
  { frame: 13, cx: 0.540, cyTop: 0.505, width: 0.550, warm: true },
  { frame: 14, cx: 0.512, cyTop: 0.295, width: 0.560, warm: true },
  { frame: 15, cx: 0.539, cyTop: 0.505, width: 0.540, warm: true },
];

/** Frame 1: the white emblem with glyph rows — the lockup the piece lands on. */
export const LOCKUP_ALIGN = { cx: 0.535, cyTop: 0.5, width: 0.57 };

// ── Seeding ───────────────────────────────────────────────────────────────────

export const hashSeed = (seed: string) => {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (start: number, end: number, value: number) => {
  const normalized = clamp01((value - start) / Math.max(0.0001, end - start));
  return normalized * normalized * (3 - 2 * normalized);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── Seed parameters ───────────────────────────────────────────────────────────

export type SignalMemorySeedParameters = {
  shaderSeed: number;
  /** Phosphor tint used by extraction and codification. */
  tint: [number, number, number];
  /** Multiplier on every phosphor half-life. */
  persistence: number;
  /** Multiplier on horizontal sync tearing. */
  tear: number;
  /** Feedback edge gain during extraction. */
  sharpen: number;
  /** How strongly extraction pulls colour toward the tint. */
  desaturate: number;
  /** Code grid columns for the coarse pass (fine pass is double). Portrait basis. */
  columns: number;
  /** Fraction of the piece given to codification. */
  codeShare: number;
  /** Wear on the type plate: registration, inking, dust, ground. */
  grit: number;
  /** Warm observations lead the transit. */
  warmFirst: boolean;
  /** Direction the lost picture rolls during acquisition. */
  rollSign: number;
  /** Observation order for the transit. */
  order: number[];
};

const shuffle = <T,>(items: T[], random: () => number) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

export const seedParameters = (seed: string): SignalMemorySeedParameters => {
  const random = mulberry32(hashSeed(seed));
  const hue = random();
  const tint: [number, number, number] = hue < 0.5
    ? [lerp(0.55, 0.8, hue * 2), lerp(0.72, 0.86, hue * 2), 1.0]
    : [1.0, lerp(0.7, 0.5, (hue - 0.5) * 2), lerp(0.55, 0.35, (hue - 0.5) * 2)];
  const warmFirst = random() > 0.6;
  const generated: SignalMemorySeedParameters = {
    shaderSeed: random() * 1000,
    tint,
    persistence: lerp(0.85, 1.25, random()),
    tear: lerp(0.8, 1.4, random()),
    sharpen: lerp(0.26, 0.4, random()),
    desaturate: lerp(0.03, 0.08, random()),
    columns: 10 + Math.floor(random() * 4),
    codeShare: lerp(0.16, 0.2, random()),
    grit: lerp(0.8, 1.25, random()),
    warmFirst,
    rollSign: random() > 0.5 ? 1 : -1,
    order: [],
  };

  const curated: Record<string, Partial<SignalMemorySeedParameters>> = {
    'S23-COLD-2307': {
      tint: [0.58, 0.76, 1.0],
      persistence: 1.3,
      tear: 0.85,
      sharpen: 0.3,
      desaturate: 0.07,
      columns: 11,
      codeShare: 0.17,
      warmFirst: false,
          grit: 1.0,
    },
    'S23-SPLIT-1315': {
      tint: [1.0, 0.52, 0.36],
      persistence: 0.82,
      tear: 1.55,
      sharpen: 0.36,
      desaturate: 0.05,
      columns: 10,
      codeShare: 0.16,
      warmFirst: true,
          grit: 1.25,
    },
    'S23-GLYPH-1603': {
      tint: [0.8, 0.86, 1.0],
      persistence: 1.05,
      tear: 1.0,
      sharpen: 0.33,
      desaturate: 0.05,
      columns: 13,
      codeShare: 0.21,
      warmFirst: false,
          grit: 1.1,
    },
  };

  const params = { ...generated, ...(curated[seed] ?? {}) };

  // Observation order: a seeded shuffle, optionally with the warm frames leading.
  const indices = OBSERVATIONS.map((_, index) => index);
  const shuffled = shuffle(indices, random);
  const order = params.warmFirst
    ? [...shuffled.filter((index) => OBSERVATIONS[index].warm), ...shuffled.filter((index) => !OBSERVATIONS[index].warm)]
    : shuffled;
  // The transit should open on a textured observation, not the blown-out white
  // frame (index 2) or the torn one (index 1).
  while (order[0] === 1 || order[0] === 2) order.push(order.shift() as number);
  params.order = order;

  return params;
};

// ── Fields ────────────────────────────────────────────────────────────────────

export type FieldMode = 'scan' | 'feedback' | 'cells' | 'hold';

export type Phase = 'ACQUISITION' | 'TRANSIT' | 'EXTRACTION' | 'CODIFICATION' | 'RESOLUTION' | 'HOLD' | 'PREROLL' | 'GHOST' | 'RESCAN';

export type ScheduleMode = 'code' | 'arc';

/** One raster field: the beam sweeps the frame once (or one grid pass in cell mode). */
export type Field = {
  index: number;
  phase: Phase;
  mode: FieldMode;
  t0: number;
  t1: number;
  source: number;
  /** Observation index for OBSERVATION reads (also used under feedback). */
  observation: number;
  /** Visible fraction of the (emblem-normalised) source width. Smaller = closer. */
  zoom: number;
  hDrift: number;
  tearAmp: number;
  roll: number;
  gain: number;
  threshold: number;
  /** Replace blend toward the beam sample. */
  alpha: number;
  /** Additive contribution of the beam sample. */
  add: number;
  /** Phosphor half-life in seconds while this field is drawn. */
  halfLife: number;
  /** Raster noise floor. */
  noise: number;
  // feedback
  sharpen: number;
  flatFade: number;
  feedZoom: number;
  sourceMix: number;
  desaturate: number;
  // cells
  columns: number;
  /** Copy the phosphor into the memory buffer at the start of this field. */
  snapshot: boolean;
  /** Clear the phosphor (after any snapshot) at the start of this field. */
  clearBefore: boolean;
};

export type Schedule = {
  mode: ScheduleMode;
  duration: number;
  /** Fields drawn in full, invisibly, before step zero (they build the memory). */
  preroll: Field[];
  fields: Field[];
  params: SignalMemorySeedParameters;
  coverZoom: number;
  finalZoom: number;
  frameAspect: number;
};

const aspectValue = (aspect: AspectRatio) => {
  switch (aspect) {
    case '16:9': return 16 / 9;
    case '4:5': return 4 / 5;
    case '1:1': return 1;
    default: return 9 / 16;
  }
};

/** Zoom at which the source height exactly fills the frame. */
export const coverZoomFor = (aspect: AspectRatio) => aspectValue(aspect) / SOURCE_ASPECT;

/** Zoom at which the whole emblem sits inside the frame with a margin. */
export const finalZoomFor = (aspect: AspectRatio) => Math.max(coverZoomFor(aspect), 0.62);

const baseField = (index: number, phase: Phase, mode: FieldMode, t0: number, t1: number): Field => ({
  index,
  phase,
  mode,
  t0,
  t1,
  source: SOURCE.OBSERVATION,
  observation: 0,
  zoom: 1,
  hDrift: 0,
  tearAmp: 0,
  roll: 0,
  gain: 1,
  threshold: 0,
  alpha: 1,
  add: 0,
  halfLife: 0.5,
  noise: 0,
  sharpen: 0,
  flatFade: 0,
  feedZoom: 1,
  sourceMix: 0,
  desaturate: 0,
  columns: 12,
  snapshot: false,
  clearBefore: false,
});

export const buildArcSchedule = (seed: string, duration: number, aspect: AspectRatio): Schedule => {
  const params = seedParameters(seed);
  const random = mulberry32(hashSeed(`${seed}/fields`));
  const D = Math.min(SIGNAL_MEMORY_MAX_DURATION, Math.max(SIGNAL_MEMORY_MIN_DURATION, duration));
  const frameAspect = aspectValue(aspect);
  const coverZoom = coverZoomFor(aspect);
  const finalZoom = finalZoomFor(aspect);
  const P = params.persistence;
  const fields: Field[] = [];
  let index = 0;

  // Phase boundaries as fractions of the piece.
  const codeShare = params.codeShare;
  const acquisitionEnd = 0.2;
  const transitEnd = 0.5 - (codeShare - 0.18) * 0.5;
  const extractionEnd = 0.66 - (codeShare - 0.18) * 0.5;
  const codeEnd = extractionEnd + codeShare;
  const resolveEnd = 0.93;

  // ── 1. Acquisition: sync lost, weak beam, long phosphor. ──
  // Three slow fields of the text frame and the starburst. Only what is bright
  // enough registers, and it lands where the broken sync puts it.
  {
    const t0 = 0;
    const t1 = acquisitionEnd * D;
    const shares = [0.4, 0.33, 0.27];
    let t = t0;
    shares.forEach((share, i) => {
      const f = baseField(index++, 'ACQUISITION', 'scan', t, t + share * (t1 - t0));
      f.source = i === 1 ? SOURCE.STAR : SOURCE.TEXT;
      f.zoom = coverZoom * (i === 1 ? 1.45 : 1.25);
      f.hDrift = (random() - 0.5) * 0.12;
      f.tearAmp = 0.09 * params.tear;
      f.roll = params.rollSign * (0.16 - i * 0.05) * (0.7 + random() * 0.6);
      f.gain = [0.6, 0.45, 0.7][i];
      f.threshold = [0.6, 0.8, 0.5][i];
      f.alpha = 0.0;
      f.add = 0.85;
      f.halfLife = 2.6 * P;
      f.noise = 0.05;
      fields.push(f);
      t = f.t1;
    });
  }

  // ── 2. Transit: sync locks, fields accelerate, observations integrate. ──
  {
    const t0 = acquisitionEnd * D;
    const t1 = transitEnd * D;
    const span = t1 - t0;
    // Geometric field durations, scaled to the piece.
    const durations: number[] = [];
    let d = 0.155 * span;
    let total = 0;
    while (total < span - 0.0001) {
      const next = Math.min(d, span - total);
      durations.push(next);
      total += next;
      d = Math.max(0.026 * span, d * 0.86);
    }
    const n = durations.length;
    let t = t0;
    durations.forEach((dur, i) => {
      const lock = smoothstep(0, 1, i / Math.max(1, n - 1));
      const f = baseField(index++, 'TRANSIT', 'scan', t, t + dur);
      f.source = SOURCE.OBSERVATION;
      f.observation = params.order[i % params.order.length];
      f.zoom = coverZoom;
      f.hDrift = (random() - 0.5) * 0.06 * (1 - lock);
      f.tearAmp = 0.07 * Math.pow(1 - lock, 2.4) * params.tear;
      f.roll = params.rollSign * 0.06 * Math.pow(1 - lock, 2) * (random() > 0.5 ? 1 : -1);
      f.gain = 0.9;
      f.threshold = lerp(0.42, 0.0, smoothstep(0, 0.6, lock));
      f.alpha = lerp(0.34, 0.5, lock) * (1 - 0.35 * smoothstep(0.55, 1, lock));
      f.add = lerp(0.1, 0.0, lock);
      f.halfLife = lerp(1.2, 0.42, lock) * P;
      f.noise = 0.02;
      fields.push(f);
      t = f.t1;
    });
  }

  // ── 3. Extraction: the beam re-scans its own phosphor. ──
  // Flats decay, edges reinforce; the integrated emblem becomes a contour drawing.
  {
    const t0 = transitEnd * D;
    const t1 = extractionEnd * D;
    const dur = 0.0055 * D;
    let t = t0;
    let i = 0;
    while (t < t1 - 0.0001) {
      const f = baseField(index++, 'EXTRACTION', 'feedback', t, Math.min(t1, t + dur));
      const k = (t - t0) / (t1 - t0);
      f.source = SOURCE.OBSERVATION;
      f.observation = params.order[(i + 3) % params.order.length];
      f.zoom = coverZoom;
      f.alpha = 1.0;
      f.halfLife = 40;
      f.sharpen = params.sharpen * 6 * lerp(0.12, 1.0, smoothstep(0, 0.55, k));
      f.flatFade = lerp(0.035, 0.13, smoothstep(0.05, 0.75, k));
      f.feedZoom = 1.0;
      f.sourceMix = 0;
      f.desaturate = params.desaturate * 6;
      f.snapshot = i === 0;
      f.noise = 0.006;
      fields.push(f);
      t = f.t1;
      i += 1;
    }
  }

  // ── 4. Codification: the memory is re-written as glyphs, coarse then fine. ──
  {
    const t0 = extractionEnd * D;
    const t1 = codeEnd * D;
    const split = t0 + (t1 - t0) * 0.38;
    const portraitColumns = params.columns;
    // Keep cells roughly the same physical size across aspects.
    const columns = Math.round(portraitColumns * Math.sqrt(frameAspect / (9 / 16)));
    const coarse = baseField(index++, 'CODIFICATION', 'cells', t0, split);
    coarse.columns = columns;
    coarse.snapshot = true;
    coarse.alpha = 1.0;
    coarse.halfLife = 40;
    fields.push(coarse);
    const fine = baseField(index++, 'CODIFICATION', 'cells', split, t1);
    fine.columns = columns * 2;
    fine.alpha = 1.0;
    fine.halfLife = 40;
    fields.push(fine);
  }

  // ── 5. Resolution: one slow, locked field writes the lockup over the code. ──
  {
    const t0 = codeEnd * D;
    const t1 = resolveEnd * D;
    const f = baseField(index++, 'RESOLUTION', 'scan', t0, t1);
    f.source = SOURCE.LOCKUP;
    f.zoom = finalZoom;
    f.alpha = 1.0;
    f.gain = 0.86;
    f.halfLife = 40;
    f.noise = 0.012;
    fields.push(f);
  }

  // ── 6. Hold: ordinary rescanning keeps the picture lit. ──
  {
    const t0 = resolveEnd * D;
    const t1 = D;
    const dur = 1 / 50;
    let t = t0;
    while (t < t1 - 0.0001) {
      const f = baseField(index++, 'HOLD', 'scan', t, Math.min(t1, t + dur));
      f.source = SOURCE.LOCKUP;
      f.zoom = finalZoom;
      f.alpha = 0.22;
      f.gain = 0.86 * (0.985 + random() * 0.03);
      f.halfLife = 1.4;
      f.noise = 0.01;
      fields.push(f);
      t = f.t1;
    }
  }

  // Acquisition and transit fields were pushed via closures above; make sure the
  // array is in time order (cells/resolve/hold were appended directly).
  const ordered = [...fields].sort((a, b) => a.t0 - b.t0);
  ordered.forEach((f, i) => { f.index = i; });

  return { mode: 'arc', duration: D, preroll: [], fields: ordered, params, coverZoom, finalZoom, frameAspect };
};


// ── The code schedule ─────────────────────────────────────────────────────────
//
// The whole piece is the beam re-writing a picture as glyphs. The picture — the
// emblem's contours, extracted from the integrated observations — is built in a
// hidden pre-roll so the visible piece can open on it. Then the glyph raster
// types over it at escalating resolution, re-scanning the drawing between
// passes so that every pass is written over the picture rather than over the
// previous code. The last pass lands the emblem as a fine mosaic on the final
// frame.

export const buildCodeSchedule = (seed: string, duration: number, aspect: AspectRatio): Schedule => {
  const params = seedParameters(seed);
  const random = mulberry32(hashSeed(`${seed}/code`));
  const D = Math.min(SIGNAL_MEMORY_MAX_DURATION, Math.max(SIGNAL_MEMORY_MIN_DURATION, duration));
  const frameAspect = aspectValue(aspect);
  const coverZoom = coverZoomFor(aspect);
  const finalZoom = finalZoomFor(aspect);
  const preroll: Field[] = [];
  const fields: Field[] = [];
  let index = 0;

  // ── Pre-roll: integrate the observations, extract the contours. ──
  params.order.forEach((observation, i) => {
    const f = baseField(index++, 'PREROLL', 'scan', 0, 1);
    f.source = SOURCE.OBSERVATION;
    f.observation = observation;
    f.zoom = coverZoom;
    f.gain = 0.9;
    f.alpha = 1 / (i + 1); // running mean
    f.halfLife = 1e6;
    preroll.push(f);
  });
  const EXTRACT_PASSES = 30;
  for (let i = 0; i < EXTRACT_PASSES; i += 1) {
    const f = baseField(index++, 'PREROLL', 'feedback', 0, 1);
    const k = i / (EXTRACT_PASSES - 1);
    f.alpha = 1.0;
    f.halfLife = 1e6;
    f.sharpen = params.sharpen * 6 * lerp(0.5, 1.0, smoothstep(0, 0.5, k));
    f.flatFade = lerp(0.06, 0.13, smoothstep(0.05, 0.7, k));
    f.feedZoom = 1.0;
    f.desaturate = params.desaturate * 6;
    f.snapshot = i === 0;
    preroll.push(f);
  }

  // ── Visible piece. ──
  const scale = D / 13.5;
  const base = params.columns;
  const columnSequence = [base / 3.25, base / 1.86, base, base * 2, base * 4]
    .map((c) => Math.max(3, Math.round(c * Math.sqrt(frameAspect / (9 / 16)))));
  const passSeconds = [1.4, 1.8, 2.2, 2.6, 2.9].map((v) => v * scale);
  const rescanSeconds = 0.3 * scale;
  const ghostSeconds = 0.9 * scale;
  let t = 0;

  // Ghost: the contour drawing scans in from black, dim, line by line.
  {
    const f = baseField(index++, 'GHOST', 'scan', t, t + ghostSeconds);
    f.source = SOURCE.MEMORY;
    f.snapshot = true;      // memory <- extracted contours (end of pre-roll)
    f.clearBefore = true;   // then start from black
    f.alpha = 0.5;
    f.gain = 0.5;
    f.hDrift = 0;
    f.tearAmp = 0.012 * params.tear;
    f.halfLife = 4;
    f.noise = 0.02;
    fields.push(f);
    t = f.t1;
  }

  columnSequence.forEach((columns, k) => {
    if (k > 0) {
      // Re-scan the drawing over the previous code, quickly and a little dimmer each time.
      const r = baseField(index++, 'RESCAN', 'scan', t, t + rescanSeconds);
      r.source = SOURCE.MEMORY;
      r.alpha = 0.85;
      r.gain = lerp(0.95, 0.6, k / (columnSequence.length - 1));
      r.tearAmp = 0.006 * params.tear * (random() > 0.5 ? 1 : -1);
      r.halfLife = 40;
      r.noise = 0.012;
      fields.push(r);
      t = r.t1;
    }
    const c = baseField(index++, 'CODIFICATION', 'cells', t, t + passSeconds[k]);
    c.columns = columns;
    c.alpha = 1.0;
    c.halfLife = 40;
    fields.push(c);
    t = c.t1;
  });

  // Whatever is left (rounding) holds the final mosaic.
  if (t < D - 0.0001) {
    const h = baseField(index++, 'HOLD', 'scan', t, D);
    h.source = SOURCE.MEMORY;
    h.alpha = 0;
    h.halfLife = 40;
    fields.push(h);
  }

  return { mode: 'code', duration: D, preroll, fields, params, coverZoom, finalZoom, frameAspect };
};

export const buildSchedule = (seed: string, duration: number, aspect: AspectRatio, mode: ScheduleMode = 'code'): Schedule =>
  mode === 'arc' ? buildArcSchedule(seed, duration, aspect) : buildCodeSchedule(seed, duration, aspect);

export const phaseAt = (schedule: Schedule, time: number): Phase => {
  const field = schedule.fields.find((f) => time >= f.t0 && time < f.t1);
  return field ? field.phase : 'HOLD';
};
