import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { useSearchParams } from 'react-router-dom';
import { ExportFrame } from '../ExportFrame/ExportFrame';
import { signalMemoryVisualExport } from '../../data/transmissions';
import { AspectRatio, useExportSettings } from '../../lib/exportSettings';
import {
  buildSchedule,
  DEFAULT_SIGNAL_MEMORY_DURATION,
  EMBLEM_REFERENCE_WIDTH,
  Field,
  LOCKUP_ALIGN,
  OBSERVATIONS,
  phaseAt,
  Schedule,
  ScheduleMode,
  SIGNAL_MEMORY_PRESETS,
  SOURCE,
} from './signalMemoryTimeline';
import './SignalMemory.css';

// Signal Memory.
//
// A CRT remembers with phosphor: the beam writes, the glow lingers, the next
// pass writes over what is left. This route is that machine and nothing else.
// There is a single phosphor buffer. Every step, the beam sweeps a slice of the
// raster and writes what it is reading into that slice; everything it did not
// touch simply decays. Fragments, transitions, integration, contour extraction,
// the glyph code and the final lockup are all the same operation with the beam
// reading a different signal, at a different speed, with a different sync.
//
// The schedule (signalMemoryTimeline.ts) decides what the beam reads and when.
// Simulation runs at a fixed 60 steps per second regardless of display rate, so
// a seed reproduces the same frames every time.

const TEXTURE_PATHS = {
  observationsA: '/signal-memory/frames/observations-a.webp',
  observationsB: '/signal-memory/frames/observations-b.webp',
  lockup: '/signal-memory/frames/lockup.webp',
  text: '/signal-memory/frames/text.webp',
  star: '/signal-memory/frames/star.webp',
  glyphs: '/signal-memory/frames/glyphs.webp',
};

const STEP_RATE = 60;
const RASTER_LINES = 300;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// The beam pass. Reads the previous phosphor state and writes the next one.
const beamFragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uPrev;
  uniform sampler2D uMemory;
  uniform sampler2D uObsA;
  uniform sampler2D uObsB;
  uniform sampler2D uLockup;
  uniform sampler2D uText;
  uniform sampler2D uStar;
  uniform sampler2D uGlyphs;

  uniform vec2 uRes;
  uniform float uFrameAspect;
  uniform float uDecay;
  uniform float uBeam0;
  uniform float uBeam1;
  uniform float uLines;
  uniform float uGain;
  uniform float uThreshold;
  uniform float uAlpha;
  uniform float uAdd;
  uniform int uMode;
  uniform int uSource;
  uniform float uFrame;
  uniform vec3 uAlign;
  uniform float uZoom;
  uniform float uHDrift;
  uniform float uTearAmp;
  uniform float uRoll;
  uniform float uSeed;
  uniform float uFieldIdx;
  uniform float uFieldPhase;
  uniform float uNoise;
  uniform float uSharpen;
  uniform float uFlatFade;
  uniform float uFeedZoom;
  uniform float uSourceMix;
  uniform float uDesat;
  uniform vec3 uTint;
  uniform float uCols;
  uniform float uCell0;
  uniform float uCell1;
  uniform float uGrit;

  const float SRC_ASPECT = 2.3903;
  const float ROW_TOP = 0.945;
  const float ROW_BOT = 0.04;
  const float ROW_PITCH = 0.21;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345 + uSeed);
    return fract(p.x * p.y);
  }
  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  float inside(vec2 p) { return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0); }

  // One impression of a glyph slug. The slug's shape comes from the alphabet
  // sheet; how much of it actually takes depends on how hard it is inked
  // (threshold) and on grain at the scale of the phosphor, so the edge breaks
  // up the way a worn letterpress character does rather than resolving cleanly.
  float glyphInk(float g, vec2 p, float thr, float wear, vec2 cid) {
    // Chew the outline. The lookup itself is displaced by noise at two scales —
    // larger bites out of the edge and fine sand along it — so a worn slug
    // prints a broken character instead of a clean one. The noise is measured
    // across the slug rather than across the screen, so a small character wears
    // in proportion to its size instead of dissolving.
    vec2 c1 = floor(p * 9.3) + cid * 13.0;
    vec2 c2 = floor(p * 25.7) + cid * 29.0;
    vec2 j = (vec2(hash21(c1 + 53.0), hash21(c1 + 97.0)) - 0.5) * 0.050
           + (vec2(hash21(c2 + 13.0), hash21(c2 + 71.0)) - 0.5) * 0.022;
    vec2 q = p + j * wear;
    float raw = texture2D(uGlyphs, vec2((g + clamp(q.x, 0.0, 1.0)) / 8.0, clamp(q.y, 0.0, 1.0))).r * inside(q);
    float n = hash21(c2 + g * 7.0) - 0.5;
    return smoothstep(thr - 0.09, thr + 0.09, raw + n * wear * 0.18);
  }

  // Screen uv -> source uv. align = (cx, cyUp, scale). zoom = visible fraction
  // of the emblem-normalised source width.
  vec2 toSource(vec2 uv, vec3 align, float zoom) {
    vec2 P = vec2(uv.x - 0.5, (uv.y - 0.5) / uFrameAspect);
    vec2 S = P * zoom * align.z;
    return vec2(align.x + S.x, align.y + S.y * SRC_ASPECT);
  }

  vec3 sampleObservation(vec2 su) {
    float in01 = inside(su);
    su = clamp(su, 0.001, 0.999);
    float f = uFrame;
    float useB = step(5.5, f);
    f -= useB * 6.0;
    float col = mod(f, 2.0);
    float row = floor(f / 2.0);
    vec2 auv = vec2((col + su.x) * 0.5, 1.0 - (row + 1.0 - su.y) / 3.0);
    vec3 a = texture2D(uObsA, auv).rgb;
    vec3 b = texture2D(uObsB, auv).rgb;
    return mix(a, b, useB) * in01;
  }

  // Frame 1 with its glyph rows continued above and below the glass, so the
  // lockup can fill a tall frame with the source's own typography.
  vec3 sampleLockup(vec2 su) {
    float y = su.y;
    float tiles = 0.0;
    if (y > ROW_TOP) { float n = ceil((y - ROW_TOP) / ROW_PITCH); y -= ROW_PITCH * n; tiles = n; }
    if (y < ROW_BOT) { float n = ceil((ROW_BOT - y) / ROW_PITCH); y += ROW_PITCH * n; tiles = n; }
    float inX = step(0.0, su.x) * step(su.x, 1.0);
    float fade = exp(-tiles * 0.28);
    return texture2D(uLockup, vec2(clamp(su.x, 0.001, 0.999), clamp(y, 0.001, 0.999))).rgb * inX * fade;
  }

  vec3 sampleSignal(vec2 uv) {
    if (uSource == 0) return sampleObservation(toSource(uv, uAlign, uZoom));
    if (uSource == 3) return sampleLockup(toSource(uv, uAlign, uZoom));
    if (uSource == 4) return texture2D(uMemory, clamp(uv, 0.0, 1.0)).rgb * inside(uv);
    vec2 su = toSource(uv, vec3(0.5, 0.5, 1.0), uZoom);
    float in01 = inside(su);
    su = clamp(su, 0.001, 0.999);
    vec3 c = uSource == 1 ? texture2D(uText, su).rgb : texture2D(uStar, su).rgb;
    return c * in01;
  }

  // Horizontal sync error for a raster line: a shear that decays down the field
  // (the classic top-of-picture flag) plus banded jumps where groups of lines
  // lose lock together.
  float syncError(float ry, float line) {
    float flag = exp(-ry * 7.0) * sin(ry * 34.0 + uFieldPhase * 6.2831 + uSeed);
    float band = floor(line / 5.0);
    float jump = hash21(vec2(band, uFieldIdx)) - 0.5;
    float gate = step(0.55, hash21(vec2(band * 1.7 + 9.0, uFieldIdx + 3.0)));
    return uTearAmp * (flag * 0.7 + jump * gate);
  }

  // Edge measure of the memory at emblem scale: a luminance difference of
  // Gaussians (fine blur hides the raster, wide blur is the neighbourhood),
  // weighted by orientation so that the purely horizontal banding a CRT
  // accumulates counts for less than the curved contours of the picture.
  float memoryDoG(vec2 p) {
    float ly = 1.0 / uLines;
    vec2 r1 = vec2(1.25 * ly / uFrameAspect, 1.25 * ly);
    vec2 r2 = vec2(4.75 * ly / uFrameAspect, 4.75 * ly);
    float w[5];
    w[0] = 0.0625; w[1] = 0.25; w[2] = 0.375; w[3] = 0.25; w[4] = 0.0625;
    float fine = 0.0;
    float wide = 0.0;
    float gx = 0.0;
    float gy = 0.0;
    for (int i = 0; i < 5; i++) {
      for (int j = 0; j < 5; j++) {
        vec2 o = vec2(float(i) - 2.0, float(j) - 2.0);
        float wt = w[i] * w[j];
        float lf = luma(texture2D(uMemory, p + o * r1).rgb);
        fine += wt * lf;
        gx += wt * o.x * lf;
        gy += wt * o.y * lf;
        wide += wt * luma(texture2D(uMemory, p + o * r2).rgb);
      }
    }
    float orient = abs(gx) / (abs(gx) + abs(gy) + 1e-4);
    return (fine - wide) * (0.15 + 0.85 * orient);
  }

  vec3 memoryAverage(vec2 c, float cellW, float cellH) {
    vec2 d = vec2(cellW, cellH) * 0.22;
    vec3 m = texture2D(uMemory, c).rgb * 0.2;
    m += texture2D(uMemory, c + vec2( d.x,  d.y)).rgb * 0.2;
    m += texture2D(uMemory, c + vec2(-d.x,  d.y)).rgb * 0.2;
    m += texture2D(uMemory, c + vec2( d.x, -d.y)).rgb * 0.2;
    m += texture2D(uMemory, c + vec2(-d.x, -d.y)).rgb * 0.2;
    return m;
  }

  void main() {
    vec2 uv = vUv;
    float ry = 1.0 - uv.y;
    float line = floor(ry * uLines);
    float lc = (line + 0.5) / uLines;
    float d = (ry - lc) * uLines;
    float prof = exp(-d * d * 5.0);

    vec2 sq = vec2(uv.x * uFrameAspect, uv.y);
    vec3 prev = texture2D(uPrev, uv).rgb * uDecay;
    vec3 next = prev;
    // Phosphor tint at a fixed luminance, so warm and cold presets glow equally.
    vec3 tintN = uTint * (0.78 / max(0.25, luma(uTint)));

    if (uMode == 2) {
      // The type plate. The beam stamps one cell of the memory at a time as a
      // glyph — but this is a machine that has been used: the plate is set a
      // little crooked, the paper feeds unevenly, the slugs are worn and sit
      // loose in the stick, the ink is blotchy, and the second impression is
      // out of register with the first.
      float cellW = 1.0 / uCols;
      float cellH = cellW * uFrameAspect;

      float skew = (hash21(vec2(uFieldIdx, 13.0)) - 0.5) * 0.022 * uGrit;
      float px = uv.x + (ry - 0.5) * skew;

      float row = floor(ry / cellH);
      float rSlip = hash21(vec2(row, uFieldIdx + 2.0));
      // Every line of type sits slightly off; now and then one is badly fed.
      px += ((rSlip - 0.5) * 0.10 + step(0.96, rSlip) * 0.26) * cellW * uGrit;

      float col = floor(px / cellW);
      float idx = row * uCols + col;
      if (idx >= uCell0 && idx < uCell1) {
        vec2 centre = vec2((col + 0.5) * cellW, 1.0 - (row + 0.5) * cellH);
        vec3 m = memoryAverage(centre, cellW, cellH);
        float l = clamp(luma(m), 0.0, 0.999);

        vec2 cid = vec2(col, row);
        float rInk = hash21(cid + 3.7);
        float rDx = hash21(cid + 11.3);
        float rDy = hash21(cid + 19.1);
        float rRot = hash21(cid + 27.9);
        float rSel = hash21(cid + 41.5);

        // Tone picks the slug — but now and then the wrong one is in the stick.
        float g = mod(floor(l * 8.0) + step(0.95, rSel) * (1.0 + floor(rSel * 2.0)), 8.0);

        vec2 local = vec2(fract(px / cellW), 1.0 - fract(ry / cellH));
        float scale = mix(0.5, 0.94, pow(l, 0.45));
        float a = (rRot - 0.5) * 0.17 * uGrit;
        vec2 gl = local - 0.5;
        gl = mat2(cos(a), -sin(a), sin(a), cos(a)) * gl / scale;
        gl += vec2(rDx - 0.5, rDy - 0.5) * 0.13 * uGrit + 0.5;

        // Inking varies slug to slug: some are over-inked and closed up, some
        // are starved and broken.
        float thr = 0.5 + (rInk - 0.5) * 0.36 * uGrit;
        float rough = uGrit;
        float ink = glyphInk(g, gl, thr, rough, cid);

        // Some impressions slur — the sheet moved under the platen.
        float slur = step(0.92, hash21(cid + 63.0)) * uGrit;
        ink = max(ink, glyphInk(g, gl + vec2(0.10, 0.0), thr + 0.06, rough, cid) * 0.6 * slur);

        // The second plate never quite lands on the first.
        vec2 reg = (vec2(hash21(vec2(uFieldIdx, 5.0)), hash21(vec2(uFieldIdx, 9.0))) - 0.5) * 0.13 * uGrit;
        float ink2 = glyphInk(g, gl + reg, thr + 0.06, rough, cid);

        // Blotchy ink film, phosphor-scale grain, and pinholes where it failed
        // to take at all.
        float blot = 0.72 + 0.28 * hash21(floor(sq * 9.0) + 5.0);
        float grain = 0.74 + 0.26 * hash21(floor(sq * uLines * 1.4) + 17.0);
        float pin = 1.0 - step(0.972, hash21(floor(sq * uLines * 2.2) + 29.0)) * 0.8 * uGrit;
        float density = mix(1.0, blot * grain * pin, clamp(uGrit, 0.0, 1.0));

        vec3 chroma = m / (luma(m) + 0.02);
        vec3 colour = mix(tintN, chroma, 0.55);
        vec3 second = mix(colour, colour.bgr, 0.75);
        float weight = 0.12 + 1.6 * l;
        vec3 sig = colour * ink * density * weight + second * ink2 * 0.3 * weight;

        // The ground the type is stamped on: never black, never even. Dust in
        // the gate, and the odd scratched line across the whole plate.
        float stain = hash21(floor(sq * 3.0) + 91.0);
        float dust = step(0.9955, hash21(floor(sq * uLines * 2.0) + 61.0));
        float scratch = step(0.988, hash21(vec2(line, 71.0)));
        sig += tintN * (0.045 * blot * (0.4 + 1.2 * stain) + 0.09 * dust + 0.03 * scratch) * uGrit;

        next = mix(prev, sig, uAlpha * mix(1.0, prof, 0.3));
      }
      gl_FragColor = vec4(max(next, 0.0), 1.0);
      return;
    }

    if (lc >= uBeam0 && lc < uBeam1) {
      float hx = uHDrift + syncError(ry, line);
      vec2 suv = vec2(uv.x + hx, uv.y + uRoll);
      vec3 src = sampleSignal(suv);
      if (uSource == 4) {
        // The drawing is a worn plate too: uneven film, pinholes, dust, and a
        // dim uneven ground so the page is never simply black.
        float blot = 0.7 + 0.3 * hash21(floor(sq * 9.0) + 5.0);
        float grain = 0.75 + 0.25 * hash21(floor(sq * uLines * 1.4) + 17.0);
        src *= mix(1.0, blot * grain, 0.75 * uGrit);
        src *= 1.0 - step(0.976, hash21(floor(sq * uLines * 2.0) + 31.0)) * 0.75 * uGrit;
        float stain = hash21(floor(sq * 3.0) + 91.0);
        src += tintN * (0.038 * blot * (0.4 + 1.2 * stain) + 0.08 * step(0.9965, hash21(floor(sq * uLines * 2.0) + 61.0))) * uGrit;
      }
      vec3 sig;
      if (uMode == 1) {
        // Extraction: the beam re-reads its memory (a snapshot of the integrated
        // picture) and traces where the picture changes. Wherever the memory has
        // an edge at emblem scale, light is written back, limited so it saturates
        // rather than running away; everywhere else the phosphor fades a little on
        // every pass. After a few dozen passes only the contours are still lit.
        vec2 fz = (uv - 0.5) * uFeedZoom + 0.5;
        vec3 c = texture2D(uPrev, fz).rgb;
        float edge = smoothstep(0.008, 0.027, abs(memoryDoG(uv)));
        vec3 m = texture2D(uMemory, uv).rgb;
        vec3 chroma = m / (luma(m) + 0.02);
        vec3 ink = mix(tintN, chroma, uDesat);
        vec3 f = c * (1.0 - uFlatFade) + ink * edge * uSharpen * (1.0 - clamp(luma(c), 0.0, 1.0));
        sig = mix(f, src, uSourceMix);
        sig += (hash21(uv * uRes + uFieldIdx) - 0.5) * uNoise;
        next = mix(prev, sig, mix(1.0, prof, 0.25) * uAlpha);
      } else {
        // Source scan: write what the beam reads, gated by beam strength.
        float lm = luma(src);
        float gate = uThreshold > 0.0 ? smoothstep(uThreshold, uThreshold + 0.22, lm) : 1.0;
        sig = src * gate * uGain;
        sig += (hash21(uv * uRes + uFieldIdx) - 0.5) * uNoise * uGain;
        next = mix(prev, sig, uAlpha * prof) + sig * uAdd * prof;
      }
    }

    gl_FragColor = vec4(max(next, 0.0), 1.0);
  }
`;

// Memory snapshot: the phosphor with the raster averaged out (a box over one
// line pitch), so what the beam later reads back is the picture, not the lines.
const snapshotFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uSource;
  uniform float uLines;
  uniform float uFrameAspect;
  void main() {
    float ly = 1.0 / uLines;
    float lx = ly / uFrameAspect;
    vec3 c = vec3(0.0);
    for (int j = -3; j <= 3; j++) {
      for (int i = -1; i <= 1; i++) {
        c += texture2D(uSource, vUv + vec2(float(i) * lx * 0.4, float(j) * ly * 0.3)).rgb;
      }
    }
    gl_FragColor = vec4(c / 21.0, 1.0);
  }
`;

// Display: phosphor to screen. A soft knee keeps additive build-up from clipping.
const displayFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uSource;
  void main() {
    vec3 c = texture2D(uSource, vUv).rgb;
    c = c / (1.0 + c * 0.12);
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }
`;

type PlaybackClock = {
  elapsed: number;
  lastNow: number;
  lastUiUpdate: number;
};

const formatSeconds = (seconds: number) => `${seconds.toFixed(1)}s`;
const aspectClass = (aspect: AspectRatio) => aspect.replace(':', '-');

const alignFor = (field: Field): [number, number, number] => {
  if (field.source === SOURCE.OBSERVATION) {
    const o = OBSERVATIONS[field.observation];
    return [o.cx, 1 - o.cyTop, o.width / EMBLEM_REFERENCE_WIDTH];
  }
  if (field.source === SOURCE.LOCKUP) {
    return [LOCKUP_ALIGN.cx, 1 - LOCKUP_ALIGN.cyTop, LOCKUP_ALIGN.width / EMBLEM_REFERENCE_WIDTH];
  }
  return [0.5, 0.5, 1];
};

export const SignalMemory: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<PlaybackClock>({ elapsed: 0, lastNow: 0, lastUiUpdate: 0 });
  const playingRef = useRef(true);
  const [params, setParams] = useSearchParams();
  const exportSettings = useExportSettings(signalMemoryVisualExport);
  const seed = exportSettings.seed || SIGNAL_MEMORY_PRESETS[0].seed;
  const duration = exportSettings.duration ?? DEFAULT_SIGNAL_MEMORY_DURATION;
  const aspect = exportSettings.aspect;
  // `t` pins the playhead (paused) — used for frame-accurate QA and stills.
  const pinnedTime = params.has('t') ? Number(params.get('t')) : null;
  const mode: ScheduleMode = params.get('mode') === 'arc' ? 'arc' : 'code';
  const [seedDraft, setSeedDraft] = useState(seed);
  const [isPlaying, setIsPlaying] = useState(pinnedTime === null);
  const [elapsed, setElapsed] = useState(0);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const restartTokenRef = useRef(0);

  const schedule = useMemo(() => buildSchedule(seed, duration, aspect, mode), [seed, duration, aspect, mode]);
  const scheduleRef = useRef<Schedule>(schedule);
  scheduleRef.current = schedule;
  playingRef.current = isPlaying;

  useEffect(() => {
    const previousTitle = document.title;
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robotsMeta = existingRobots ?? document.createElement('meta');
    const previousRobotsContent = existingRobots?.getAttribute('content');
    document.title = 'Signal Memory // Signal-23';
    robotsMeta.setAttribute('name', 'robots');
    robotsMeta.setAttribute('content', 'noindex,nofollow');
    if (!existingRobots) document.head.appendChild(robotsMeta);

    return () => {
      document.title = previousTitle;
      if (existingRobots && previousRobotsContent !== null && previousRobotsContent !== undefined) {
        existingRobots.setAttribute('content', previousRobotsContent);
      } else if (existingRobots) {
        existingRobots.removeAttribute('content');
      } else {
        robotsMeta.remove();
      }
    };
  }, []);

  const updateParams = useCallback((changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    next.delete('t');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const restart = useCallback(() => {
    playbackRef.current.elapsed = 0;
    playbackRef.current.lastNow = performance.now();
    playbackRef.current.lastUiUpdate = 0;
    restartTokenRef.current += 1;
    setElapsed(0);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    setSeedDraft(seed);
    if (pinnedTime !== null && Number.isFinite(pinnedTime)) {
      const t = Math.min(schedule.duration, Math.max(0, pinnedTime));
      playbackRef.current.elapsed = t;
      playbackRef.current.lastNow = performance.now();
      restartTokenRef.current += 1;
      setElapsed(t);
      setIsPlaying(false);
      return;
    }
    restart();
  }, [seed, duration, aspect, mode, restart, pinnedTime, schedule.duration]);

  const commitSeed = useCallback(() => {
    const normalized = seedDraft.trim() || SIGNAL_MEMORY_PRESETS[0].seed;
    setSeedDraft(normalized);
    updateParams({ seed: normalized });
  }, [seedDraft, updateParams]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let animationId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let beamMaterial: THREE.ShaderMaterial | null = null;
    let copyMaterial: THREE.ShaderMaterial | null = null;
    let displayMaterial: THREE.ShaderMaterial | null = null;
    let phosphorA: THREE.WebGLRenderTarget | null = null;
    let phosphorB: THREE.WebGLRenderTarget | null = null;
    let memory: THREE.WebGLRenderTarget | null = null;
    let simulatedStep = -1;
    let snapshotTaken = -1;
    let observedRestartToken = restartTokenRef.current;
    const textures: THREE.Texture[] = [];

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.setAttribute('aria-label', 'Signal Memory — a deterministic CRT phosphor reconstruction');
    mount.appendChild(renderer.domElement);

    const useHalfFloat = renderer.capabilities.isWebGL2 || renderer.extensions.has('OES_texture_half_float');
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const loader = new THREE.TextureLoader();

    const makeScene = (material: THREE.Material) => {
      const scene = new THREE.Scene();
      const quad = new THREE.Mesh(geometry, material);
      quad.frustumCulled = false;
      scene.add(quad);
      return scene;
    };
    const makeTarget = (width: number, height: number) => new THREE.WebGLRenderTarget(width, height, {
      type: useHalfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
    const clearTarget = (target: THREE.WebGLRenderTarget | null) => {
      if (!target) return;
      renderer.setRenderTarget(target);
      renderer.clear();
    };
    const resetPhosphor = () => {
      simulatedStep = -1;
      snapshotTaken = -1;
      clearTarget(phosphorA);
      clearTarget(phosphorB);
      clearTarget(memory);
      renderer.setRenderTarget(null);
    };

    setLoadState('loading');

    Promise.all(Object.entries(TEXTURE_PATHS).map(async ([key, path]) => {
      const texture = await loader.loadAsync(path);
      texture.colorSpace = THREE.NoColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      textures.push(texture);
      return [key, texture] as const;
    })).then((loaded) => {
      if (disposed) {
        loaded.forEach(([, texture]) => texture.dispose());
        return;
      }
      const tex = Object.fromEntries(loaded) as Record<keyof typeof TEXTURE_PATHS, THREE.Texture>;

      const uniforms = {
        uPrev: { value: null as THREE.Texture | null },
        uMemory: { value: null as THREE.Texture | null },
        uObsA: { value: tex.observationsA },
        uObsB: { value: tex.observationsB },
        uLockup: { value: tex.lockup },
        uText: { value: tex.text },
        uStar: { value: tex.star },
        uGlyphs: { value: tex.glyphs },
        uRes: { value: new THREE.Vector2(1, 1) },
        uFrameAspect: { value: 1 },
        uDecay: { value: 1 },
        uBeam0: { value: 0 },
        uBeam1: { value: 0 },
        uLines: { value: RASTER_LINES },
        uGain: { value: 1 },
        uThreshold: { value: 0 },
        uAlpha: { value: 1 },
        uAdd: { value: 0 },
        uMode: { value: 0 },
        uSource: { value: 0 },
        uFrame: { value: 0 },
        uAlign: { value: new THREE.Vector3(0.5, 0.5, 1) },
        uZoom: { value: 1 },
        uHDrift: { value: 0 },
        uTearAmp: { value: 0 },
        uRoll: { value: 0 },
        uSeed: { value: 0 },
        uFieldIdx: { value: 0 },
        uFieldPhase: { value: 0 },
        uNoise: { value: 0 },
        uSharpen: { value: 0 },
        uFlatFade: { value: 0 },
        uFeedZoom: { value: 1 },
        uSourceMix: { value: 0 },
        uDesat: { value: 0 },
        uTint: { value: new THREE.Vector3(1, 1, 1) },
        uCols: { value: 12 },
        uCell0: { value: 0 },
        uCell1: { value: 0 },
        uGrit: { value: 1 },
      };
      beamMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader: beamFragmentShader,
        depthTest: false,
        depthWrite: false,
      });
      const beamScene = makeScene(beamMaterial);

      const copyUniforms = {
        uSource: { value: null as THREE.Texture | null },
        uLines: { value: RASTER_LINES },
        uFrameAspect: { value: 1 },
      };
      copyMaterial = new THREE.ShaderMaterial({
        uniforms: copyUniforms,
        vertexShader,
        fragmentShader: snapshotFragmentShader,
        depthTest: false,
        depthWrite: false,
      });
      const copyScene = makeScene(copyMaterial);

      const displayUniforms = { uSource: { value: null as THREE.Texture | null } };
      displayMaterial = new THREE.ShaderMaterial({
        uniforms: displayUniforms,
        vertexShader,
        fragmentShader: displayFragmentShader,
        depthTest: false,
        depthWrite: false,
      });
      const displayScene = makeScene(displayMaterial);

      const resize = () => {
        const rect = mount.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height, false);
        const targetWidth = Math.max(1, Math.floor(width * renderer.getPixelRatio()));
        const targetHeight = Math.max(1, Math.floor(height * renderer.getPixelRatio()));
        uniforms.uRes.value.set(targetWidth, targetHeight);
        uniforms.uFrameAspect.value = targetWidth / targetHeight;
        copyUniforms.uFrameAspect.value = targetWidth / targetHeight;
        phosphorA?.dispose();
        phosphorB?.dispose();
        memory?.dispose();
        phosphorA = makeTarget(targetWidth, targetHeight);
        phosphorB = makeTarget(targetWidth, targetHeight);
        memory = makeTarget(targetWidth, targetHeight);
        resetPhosphor();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();
      setLoadState('ready');

      // One beam pass covering [t0, t1) of a single field.
      const drawFieldSlice = (field: Field, t0: number, t1: number) => {
        if (!phosphorA || !phosphorB || !memory) return;
        const sched = scheduleRef.current;
        const dt = Math.max(0, t1 - t0);
        const fieldLength = Math.max(1e-6, field.t1 - field.t0);
        const p0 = (t0 - field.t0) / fieldLength;
        const p1 = (t1 - field.t0) / fieldLength;

        if (field.snapshot && snapshotTaken !== field.index) {
          snapshotTaken = field.index;
          copyUniforms.uSource.value = phosphorA.texture;
          renderer.setRenderTarget(memory);
          renderer.render(copyScene, camera);
          if (field.clearBefore) {
            clearTarget(phosphorA);
            clearTarget(phosphorB);
          }
        }

        const [cx, cy, scale] = alignFor(field);
        uniforms.uPrev.value = phosphorA.texture;
        uniforms.uMemory.value = memory.texture;
        uniforms.uDecay.value = Math.pow(0.5, dt / Math.max(1e-3, field.halfLife));
        uniforms.uMode.value = field.mode === 'feedback' ? 1 : field.mode === 'cells' ? 2 : 0;
        uniforms.uSource.value = field.source;
        uniforms.uFrame.value = field.observation;
        uniforms.uAlign.value.set(cx, cy, scale);
        uniforms.uZoom.value = field.zoom;
        uniforms.uHDrift.value = field.hDrift;
        uniforms.uTearAmp.value = field.tearAmp;
        uniforms.uRoll.value = field.roll * (1 - p0);
        uniforms.uGain.value = field.gain;
        uniforms.uThreshold.value = field.threshold;
        uniforms.uAlpha.value = field.alpha;
        uniforms.uAdd.value = field.add;
        uniforms.uNoise.value = field.noise;
        uniforms.uSeed.value = sched.params.shaderSeed;
        uniforms.uFieldIdx.value = field.index;
        uniforms.uFieldPhase.value = p0;
        uniforms.uSharpen.value = field.sharpen;
        uniforms.uFlatFade.value = field.flatFade;
        uniforms.uFeedZoom.value = field.feedZoom;
        uniforms.uSourceMix.value = field.sourceMix;
        uniforms.uDesat.value = field.desaturate;
        uniforms.uTint.value.set(sched.params.tint[0], sched.params.tint[1], sched.params.tint[2]);
        uniforms.uGrit.value = sched.params.grit;

        if (field.mode === 'cells') {
          const cols = field.columns;
          const rows = Math.ceil(cols / uniforms.uFrameAspect.value);
          const total = cols * rows;
          uniforms.uCols.value = cols;
          uniforms.uCell0.value = Math.floor(p0 * total);
          uniforms.uCell1.value = p1 >= 1 ? total + 1 : Math.floor(p1 * total);
          uniforms.uBeam0.value = 0;
          uniforms.uBeam1.value = 0;
        } else {
          uniforms.uBeam0.value = p0;
          uniforms.uBeam1.value = p1 >= 1 ? 1.001 : p1;
        }

        renderer.setRenderTarget(phosphorB);
        renderer.render(beamScene, camera);
        [phosphorA, phosphorB] = [phosphorB, phosphorA];
      };

      // Advance the phosphor through one fixed step: [step/60, (step+1)/60).
      const simulateStep = (step: number) => {
        const sched = scheduleRef.current;
        const t0 = step / STEP_RATE;
        const t1 = Math.min(sched.duration, (step + 1) / STEP_RATE);
        if (t1 <= t0) return;
        const fields = sched.fields;
        let wrote = false;
        for (let i = 0; i < fields.length; i += 1) {
          const field = fields[i];
          if (field.t1 <= t0) continue;
          if (field.t0 >= t1) break;
          drawFieldSlice(field, Math.max(t0, field.t0), Math.min(t1, field.t1));
          wrote = true;
        }
        if (!wrote && phosphorA && phosphorB) {
          // No field covers this step (should not happen) — decay only.
          const last = fields[fields.length - 1];
          uniforms.uPrev.value = phosphorA.texture;
          uniforms.uDecay.value = Math.pow(0.5, (t1 - t0) / Math.max(1e-3, last?.halfLife ?? 1));
          uniforms.uBeam0.value = 0;
          uniforms.uBeam1.value = 0;
          uniforms.uMode.value = 0;
          renderer.setRenderTarget(phosphorB);
          renderer.render(beamScene, camera);
          [phosphorA, phosphorB] = [phosphorB, phosphorA];
        }
      };

      const runPreroll = () => {
        scheduleRef.current.preroll.forEach((field) => drawFieldSlice(field, 0, 1));
      };

      const simulateTo = (elapsedSeconds: number) => {
        if (!phosphorA || !phosphorB) return;
        const targetStep = Math.max(0, Math.floor(elapsedSeconds * STEP_RATE + 1e-4));
        if (observedRestartToken !== restartTokenRef.current || targetStep < simulatedStep) {
          observedRestartToken = restartTokenRef.current;
          resetPhosphor();
        }
        if (simulatedStep === -1) runPreroll();
        while (simulatedStep < targetStep) {
          simulatedStep += 1;
          simulateStep(simulatedStep);
        }
        displayUniforms.uSource.value = phosphorA.texture;
        renderer.setRenderTarget(null);
        renderer.render(displayScene, camera);
      };

      const animate = (now: number) => {
        if (disposed) return;
        animationId = requestAnimationFrame(animate);
        const clock = playbackRef.current;
        const sched = scheduleRef.current;
        if (clock.lastNow === 0) clock.lastNow = now;
        const delta = Math.min(0.1, Math.max(0, (now - clock.lastNow) / 1000));
        clock.lastNow = now;

        if (playingRef.current) {
          clock.elapsed = Math.min(sched.duration, clock.elapsed + delta);
          if (clock.elapsed >= sched.duration) {
            playingRef.current = false;
            setIsPlaying(false);
          }
        }

        simulateTo(clock.elapsed);

        if (now - clock.lastUiUpdate > 66 || clock.elapsed === sched.duration) {
          clock.lastUiUpdate = now;
          setElapsed(clock.elapsed);
        }
      };
      animationId = requestAnimationFrame(animate);
    }).catch((error) => {
      console.error('[signal-memory] texture load failed', error);
      if (!disposed) setLoadState('error');
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      textures.forEach((texture) => texture.dispose());
      phosphorA?.dispose();
      phosphorB?.dispose();
      memory?.dispose();
      beamMaterial?.dispose();
      copyMaterial?.dispose();
      displayMaterial?.dispose();
      geometry.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  const phaseLabel = phaseAt(schedule, elapsed);
  const activePreset = SIGNAL_MEMORY_PRESETS.find((preset) => preset.seed === seed);

  return (
    <div className={`signal-memory-page ${exportSettings.isExportMode ? 'is-export' : ''}`}>
      <ExportFrame aspect={aspect} active={exportSettings.isExportMode}>
        <main className="signal-memory-viewport">
          <div
            ref={mountRef}
            className={`signal-memory-stage signal-memory-aspect-${aspectClass(aspect)}`}
          >
            {loadState !== 'ready' && (
              <div className="signal-memory-loading" role="status">
                {loadState === 'error' ? 'SOURCE SIGNAL UNAVAILABLE' : 'ACQUIRING SOURCE SIGNAL'}
              </div>
            )}
            {!exportSettings.isExportMode && (
              <div className="signal-memory-stage-meta" aria-hidden="true">
                <span>S23 / MEMORY</span>
                <span>{phaseLabel}</span>
                <span>{formatSeconds(elapsed)} / {formatSeconds(schedule.duration)}</span>
              </div>
            )}
          </div>
        </main>
      </ExportFrame>

      {!exportSettings.isExportMode && (
        <aside className="signal-memory-controls" aria-label="Signal Memory controls">
          <header>
            <p>SIGNAL—23 / CODE ART</p>
            <h1>SIGNAL MEMORY</h1>
            <span>ONE BEAM. ONE PHOSPHOR.</span>
          </header>

          <div className="signal-memory-transport">
            <button
              type="button"
              onClick={() => {
                if (!isPlaying && elapsed >= schedule.duration) restart();
                else setIsPlaying((current) => !current);
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button type="button" onClick={restart} aria-label="Restart">
              <RotateCcw size={14} />
              RESTART
            </button>
          </div>

          <label className="signal-memory-field">
            <span>PLAYHEAD</span>
            <output>{formatSeconds(elapsed)}</output>
            <input
              type="range"
              min={0}
              max={schedule.duration}
              step={1 / STEP_RATE}
              value={Math.min(elapsed, schedule.duration)}
              onChange={(event) => {
                const next = Number(event.target.value);
                playbackRef.current.elapsed = next;
                playbackRef.current.lastNow = performance.now();
                setElapsed(next);
                setIsPlaying(false);
              }}
            />
          </label>

          <label className="signal-memory-field">
            <span>SEED</span>
            <input
              className="signal-memory-text-input"
              value={seedDraft}
              onChange={(event) => setSeedDraft(event.target.value)}
              onBlur={commitSeed}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitSeed();
              }}
            />
          </label>

          <div className="signal-memory-presets" aria-label="Curated presets">
            {SIGNAL_MEMORY_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={seed === preset.seed ? 'is-active' : ''}
                onClick={() => updateParams({ seed: preset.seed })}
                title={preset.note}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="signal-memory-row">
            <label className="signal-memory-field">
              <span>ASPECT</span>
              <select value={aspect} onChange={(event) => updateParams({ aspect: event.target.value })}>
                <option value="9:16">9:16</option>
                <option value="4:5">4:5</option>
                <option value="16:9">16:9</option>
              </select>
            </label>
            <label className="signal-memory-field">
              <span>DURATION</span>
              <select value={duration} onChange={(event) => updateParams({ duration: event.target.value })}>
                <option value="12">12.0s</option>
                <option value="13.5">13.5s</option>
                <option value="15">15.0s</option>
              </select>
            </label>
          </div>

          <footer>
            <span>{activePreset ? activePreset.label : 'CUSTOM SEED'}</span>
            <span>{schedule.fields.length} FIELDS</span>
            <span>{phaseLabel}</span>
          </footer>
        </aside>
      )}
    </div>
  );
};
