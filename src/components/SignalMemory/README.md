# Signal Memory

`/signal-memory` is a silent, deterministic 12–15 second piece for 9:16 social video (also 4:5 and 16:9), built only from Signal-23's own CRT promo stills. The originals stay outside the repository and are never modified; the route ships six optimised WebP derivatives in `public/signal-memory/frames/`. No generated imagery is used anywhere.

## The system

A CRT remembers with phosphor: the beam writes, the glow lingers, the next pass writes over what is left. This route is that machine and nothing else.

There is **one beam and one phosphor**. Every simulation step (fixed 60 Hz) the beam sweeps a slice of a 300-line raster and writes what it is currently *reading* into that slice; everything it did not touch simply decays with a half-life. Nothing on screen fades in or out on an animation curve — light only appears where the beam has put it, and it only stays as long as the phosphor holds it. Frame changes are raster wipes, because that is how a CRT changes frames. The scanlines are the beam's own footprint, not an overlay.

What changes over the piece is what the beam reads, how well it is synced, and how it blends into what is already glowing. The schedule in `signalMemoryTimeline.ts` turns (seed, duration, aspect) into an explicit list of raster fields; `SignalMemory.tsx` executes them.

### The piece (default, `mode=code`)

The whole piece is the beam re-writing one picture as glyphs.

- **Pre-roll (hidden).** Before frame zero the beam integrates the twelve photographs of the emblem (frames 2–15 are the same screen under different phosphor states, each placed so the emblem sits in the same spot) into a running mean, snapshots that into memory with the raster averaged out, then re-scans the screen thirty times reading the memory through an orientation-weighted difference-of-Gaussians — flats fade, edges are written back as light — until only the emblem's contours are lit. That contour drawing becomes the memory the visible piece reads. Then the phosphor is cleared.
- **Ghost (0–0.9 s).** The contour drawing scans in from black, dim, line by line.
- **Five passes.** The beam becomes a cell raster and types the memory as Signal-23 glyphs (3 · I · S · 2 · A · G · N · L, cut from the alphabet sheet; glyph, scale and brightness all from the cell's luminance), row by row, at 4 → 7 → 13 → 26 → 52 columns (portrait basis; other aspects scale). Between passes the beam re-scans the drawing over the previous code, a little dimmer each time, so every pass is written over the picture. Each pass is finer and faster than the last; the fifth lands the emblem as a fine glyph mosaic on the final frame, which holds for half a second.

### The plate

The type is not clean, because no machine that has printed anything is. Every defect is a physical one, seeded and reproducible — not noise laid over the top:

- **Registration.** The plate is set slightly crooked (a shear across the frame), each line of type slips a little horizontally, and now and then one line is badly fed. A second impression lands out of register with the first, in a shifted colour — the duotone ghost on the edge of each character.
- **The slugs are worn.** Each cell's character sits loose: its own small offset, rotation and inking pressure. The outline is chewed by noise measured *across the slug* (larger bites, then fine sand along the edge), so a small character wears in proportion to its size instead of dissolving. A few impressions slur sideways, as if the sheet moved under the platen. Now and then the wrong slug is in the stick.
- **The inking is not flat.** A blotchy ink film, grain at phosphor scale, and pinholes where the ink failed to take at all.
- **The ground is not black.** A dim, unevenly stained field, dust in the gate, and the occasional scratched line straight across the plate.

The amount of wear is the seed's `grit` parameter.

### The arc (`?mode=arc`)

The earlier five-phase version is kept for comparison: acquisition (lost sync, text and starburst fragments), transit (observations integrating at accelerating field rate), extraction (contours out of memory), codification (two glyph passes), resolution (a slow field writes the frame-1 lockup, glyph rows tiled to fill tall frames) and hold.

Determinism: the seed is hashed with FNV-1a and drives Mulberry32 for every choice (observation order, sync errors, tint, grid size, plate wear, phase lengths). The shader hashes are seeded from the same value. Simulation is fixed-step, so the same seed, duration, aspect and output size always produce the same frames; scrubbing backwards clears the phosphor and replays from step zero. No `Math.random()` is called during animation.

## Presets

- `S23-COLD-2307` **COLD ARCHIVE** — blue phosphor, slightly coarser grid (3 → 44 columns), cleanest plate (`grit` 1.0).
- `S23-SPLIT-1315` **RED SPLIT** — hot ochre phosphor, coarsest grid (3 → 40 columns), dirtiest plate and strongest duotone ghosting (`grit` 1.25).
- `S23-GLYPH-1603` **GLYPH VAULT** — finest grid (4 → 52 columns), lavender phosphor, worn plate (`grit` 1.1).

Any other seed string produces a new deterministic variation.

## Controls and URLs

The normal route has play/pause, restart, a scrubber, seed input, preset buttons, aspect and duration controls; all are reflected in the URL. Adding `target=` enters clean export mode and removes every control from the frame.

```text
/signal-memory?seed=S23-GLYPH-1603&duration=13.5&aspect=9:16
/signal-memory?target=reel&seed=S23-GLYPH-1603&duration=13.5&aspect=9:16
/signal-memory?target=still&seed=S23-COLD-2307&duration=12&aspect=4:5
/signal-memory?target=hardware-feed&seed=S23-SPLIT-1315&duration=15&aspect=16:9
/signal-memory?target=still&seed=S23-GLYPH-1603&aspect=9:16&t=10.6
```

`t=` pins the playhead at a time (paused) for frame-accurate stills and QA. Durations clamp to 12–15 s; unsupported aspects fall back to 9:16.

## Capture

1. Open the route with `target=reel`, the preset seed, duration and aspect you want.
2. Set the browser capture area to 1080×1920 (9:16), 1080×1350 (4:5) or 1920×1080 (16:9). The raster is defined in frame units, so any size of the same aspect gives the same picture.
3. Record the browser source at 30 or 60 fps with no audio. Start on black at frame zero (use Restart) and stop after the final mosaic has held for a beat.
4. Add music downstream. The piece has no audio dependency; the pass boundaries listed below are the natural places to cut to a track.

Good stills: the first big glyph pass around 12 %, a pass typing over the drawing around 32 % or 60 %, the finished mosaic after 97 %. Phase boundaries (13.5 s): ghost ends 0.9 s; passes end at 2.3, 4.4, 6.9, 9.8 and 13.0 s, each preceded by a 0.3 s re-scan.

## Source derivatives

- `observations-a.webp`, `observations-b.webp` — `promo1 frame{2,4,5,6,7,9}.jpg` and `frame{10,11,12,13,14,15}.jpg`, 1920×803 each in two 2×3 atlases.
- `lockup.webp` — `promo1 frame1.jpg` at 2560×1071.
- `text.webp` — `promo1 frame16.jpg` at 2560×1071.
- `star.webp` — `promo1 frame3.jpg` at 2560×1071.
- `glyphs.webp` — eight glyph masks cut from `promo2 frame1.jpg`, 256×256 each, ordered by ink coverage.

Emblem alignment for each observation was measured once (dark-mask centroid and extent) and is recorded in `OBSERVATIONS` in `signalMemoryTimeline.ts`.
