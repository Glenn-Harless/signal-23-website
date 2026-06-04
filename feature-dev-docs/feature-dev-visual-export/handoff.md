# Visual Export — Full v1 Fan-Out + Operator UI v2 (Handoff)

Status: executed on 2026-05-08. The current product truth lives in `requirements.md`, `decisions.md`, `tests.md`, and `feature-spec.md`.

You are completing the visual-export feature on the `decay-breathing` branch in one batch. Everything ships in a single PR. This document is self-contained — read it end to end before starting.

## Context

Two routes are already wired with the v1 export pattern: `/decay` and `/reclamation`. The shared infrastructure is in place. This batch fans the same pattern out to the remaining 14 visual routes, adds the operator UI surfacing for export capabilities, and tidies up branch hygiene before the single PR.

Reference docs in this folder define the v1 contract — read them first if anything below is unclear:

- `feature-spec.md` — export contract, target shapes, metadata shape, reserved targets
- `requirements.md` — capability schema, route-level export behavior, edge cases
- `decisions.md` — locked architectural decisions
- `tests.md` — behavior-level acceptance criteria

## What is already done — do not redo

- **Shared infrastructure** (do not modify unless you find a real bug):
  - `src/lib/exportSettings.ts` — `useExportSettings` hook, `resolveSettings` pure function, `AspectRatio` type
  - `src/lib/validateVisualExport.ts` — runtime validator
  - `src/components/ExportFrame/ExportFrame.tsx` + `.css` — aspect-locked framing wrapper
- **Type added**: `VisualExportCapability` and `ExportAspectRatio` in `src/data/transmissions.ts`
- **Two routes wired**:
  - `/decay` → `decayVisualExport`, `hardwareFeedSafe: true`, all 5 targets
  - `/reclamation` → `reclamationVisualExport`, `hardwareFeedSafe: false`, no `hardware-feed` target
- **Auto-validation** runs at module load in `transmissions.ts` (don't remove it; extend it for new entries by definition since the loop iterates all transmissions).
- **Record button convention**: gated `process.env.NODE_ENV !== 'production' && !exportSettings.isExportMode`. Apply this verbatim to every other route that has a record button.

Use Decay (`src/components/Decay/Decay.tsx`) and Reclamation (`src/components/Reclamation/Reclamation.tsx`) as your reference implementations. The pattern is established; do not deviate from it without flagging.

## What to build in this batch

### 1. Wire the 14 remaining visual routes

Routes (all under `src/components/<Name>/<Name>.tsx`):

`/broadcast`, `/forest`, `/stepwell`, `/forbidding` (component name: `ForbiddingBlocks`), `/well`, `/tangle`, `/learning`, `/nerve`, `/face`, `/hand`, `/birth`, `/murmur`, `/growth`, `/resonance`.

For each route, do all of the following:

#### 1a. Add a `<routeName>VisualExport` capability constant

Place near the existing two in `src/data/transmissions.ts`. Use this rubric:

- `supportedTargets`: include all 5 (`canvas`, `reel`, `hardware-feed`, `still`, `loop`) **unless** `hardwareFeedSafe` is `false`, in which case drop `hardware-feed`.
- `defaultTarget: 'canvas'`.
- `seed: { supported: false, defaultMode: 'random' }` for **all** routes. Do not retrofit RNG. This is locked.
- `duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 }` unless the route has a longer natural cycle (meditative/breathing motion → up to 60s max). Pick per route based on observed motion period.
- `aspectRatios: { supported: ['9:16', '16:9', '1:1', '4:5'], default: '9:16' }`.
- `capture: 'browser-source'`.
- `hardwareFeedSafe`: `true` if the route renders a useful visual without any user interaction (load it, walk away, output is still valid). `false` if the visual is essentially empty or broken without clicks (e.g., `/broadcast`'s `spawnRing` — if clicks are required for anything to appear, it's not hardware-feed-safe).
- `operatorNotes`: one short sentence about non-determinism, warmup time, or any quirk.

#### 1b. Modify the route component

Follow Decay/Reclamation exactly:

- Import `ExportFrame`, the route's `visualExport` constant, and `useExportSettings`.
- Call `useExportSettings(<routeName>VisualExport)` near the top of the component.
- Replace `window.innerWidth/innerHeight` reads with the `getMountSize()` pattern:
  ```ts
  const getMountSize = () => {
    const rect = mountElement.getBoundingClientRect();
    const width = rect.width || mountElement.clientWidth || window.innerWidth;
    const height = rect.height || mountElement.clientHeight || window.innerHeight;
    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
    };
  };
  ```
- Replace `window.addEventListener('resize', ...)` with `ResizeObserver(resizeToMount)` observing `mountElement`. Disconnect in cleanup.
- Wrap the return in `<ExportFrame aspect={exportSettings.aspect} active={exportSettings.isExportMode}>`.
- Effect dep array: `[exportSettings.isExportMode]`.
- **Container click handlers** (HUD toggles, spawn-on-click): gate on `!exportSettings.isExportMode` so they no-op during export. Pattern:
  ```tsx
  onClick={() => { if (!exportSettings.isExportMode) setShowText(prev => !prev); }}
  ```
- **Record buttons**: gate on `process.env.NODE_ENV !== 'production' && !exportSettings.isExportMode`. Same as Decay/Reclamation.
- **HUD/log overlays**: gate visibility on `&& !exportSettings.isExportMode` so they don't appear in the captured viewport.
- **Three.js framing**: if the scene clips at narrow aspects (9:16), add a camera-distance or orbit-radius tweak similar to Decay's `getCameraBaseZ` or Reclamation's `mountAspect < 0.8 ? 300 : ...`. Verify by loading `?target=canvas` and confirming the subject fits.

#### 1c. Update the route's CSS

If the container is `width: 100vw; height: 100vh`, change to `width: 100%; height: 100%` so it sits inside `<ExportFrame>` cleanly. (Same change already applied to Reclamation.)

#### 1d. Update the existing transmission entry

In `src/data/transmissions.ts`:

- Set `visualExport: <routeName>VisualExport` on the existing transmission entry for that route.
- Mirror `exportUse` to match `supportedTargets` (manual mirror — denormalized cache pattern).

### 2. Operator UI v2

Add export capability surfacing. Data source is `src/data/transmissions.ts` via the `visualExport` field on each Transmission.

#### `src/components/Operator/OperatorIndex.tsx`

Add an **EXPORT** column to the table. Render per row:

- If `visualExport` is undefined → `—`.
- Otherwise → comma-separated target IDs (e.g., `canvas, reel, hardware-feed, still, loop`) followed by ` · HFS` if `hardwareFeedSafe: true`.

Hook the new column into whatever search/filter the index already uses; do not redesign the search behavior.

#### `src/components/Operator/TransmissionDetail.tsx`

If the transmission has `visualExport`, add a section after the existing detail rendering. Two sub-sections:

**EXPORT CAPABILITY** (definition list):

- Targets: comma-separated `supportedTargets`
- Default: `defaultTarget`
- Aspects: comma-separated `aspectRatios.supported`; mark default with `(default)`
- Duration: `minSeconds`–`maxSeconds`s (default `defaultSeconds`s) — or `indefinite` if `duration.supported: false`
- Seed: `supported` or `not supported`
- Capture: `capture` value
- Hardware-feed safe: `yes` or `no`
- Notes: `operatorNotes` if present

**LAUNCH LINKS** (one link per supported target):

- For each target in `supportedTargets`, render a link: `<a href="<route>?target=<target>" target="_blank" rel="noopener">target</a>`.
- Link opens in new tab.
- Use the transmission's `route` field for the path.

No new routes. No URL structure changes. Operator UI search/sort/filter behavior unchanged outside of the new column.

### 3. Branch hygiene

- Append to existing `.gitignore`:
  ```
  .beads/
  .claude/
  docs/plans/
  ```
- Do not commit `.beads/issues.jsonl`, `.beads/signal-23-website.db`, `.claude/`, or `docs/plans/`. If they are already tracked, leave them — only add ignore rules going forward.

## Constraints and non-goals

- **No seed support** on any route. v1 is non-deterministic for all 16 routes.
- **URL contract is locked**: `target` is the export switch; do not introduce `mode=export` or any other signal.
- **No `addedAt` field** on `VisualExportCapability`.
- **Do not modify** `exportSettings.ts`, `validateVisualExport.ts`, or `ExportFrame.tsx` unless you find a real bug. Flag any bug rather than silently fixing.
- **Operator UI**: only add the new column and detail block. Do not change search, filter, sort, navigation, or styling outside of what the new content needs.
- **Public surface untouched**: do not modify the homepage, terminal command list, sitemap behavior, or public navigation.
- **No new test infrastructure**. The project has no vitest/jest/playwright wired up. Validation is the runtime validator + manual checklist below.

## Manual verification — complete before declaring done

### Three sample routes — full check

Pick `/broadcast` (likely non-HFS), `/forest` (probably HFS), and `/nerve` (heavy motion + interaction). For each:

1. Load with no params → unchanged behavior, console clean.
2. Load `?target=canvas` → 9:16 letterboxed, scene framed correctly (no clipping), HUD/record button hidden, click on container is a no-op.
3. Load `?target=canvas&aspect=16:9` → 16:9 letterboxed, scene reframes (camera adjusts).
4. Load `?target=youtube` → falls back to canvas, `console.warn` fires.

### Smoke test — remaining 11 routes

For each: load `?target=canvas` and confirm no console errors and the scene renders inside the frame.

### Operator UI

1. `/operator` shows the EXPORT column populated for all 16 visual routes.
2. `/operator/transmissions/decay` shows full capability block + 5 launch links.
3. `/operator/transmissions/reclamation` shows 4 launch links (no `hardware-feed`).
4. Clicking a launch link opens the route in a new tab with the correct query params.

### Public surface

`/` and `/terminal` look identical to before.

### TypeScript

`tsc --noEmit` (or the project's equivalent — check `package.json` scripts) compiles cleanly.

## Final reporting

When done, report back with:

1. **Each route's `hardwareFeedSafe` value** and a one-sentence reason for each (16 lines total, one per visual route).
2. **Any route where you found a clipping/framing issue** at narrow aspect and what you did to fix it.
3. **Anything that didn't fit the pattern cleanly** so we can review the exception.
4. **Confirmation** that the manual verification checklist passed.
5. **A summary diff** (`git diff --stat`) so we can sanity-check the scope of changes.

## After this batch

Once this PR merges, the visual-export v1 initiative is complete. No further follow-ups are scheduled. The three deferred decisions in `decisions.md` (provenance for `visualExport`, `exportUse` derivation rules, hardware-feed audits) remain deferred — revisit them only if drift or pain shows up in real use.
