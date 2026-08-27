# Visual Export Spec

## Purpose

Signal-23 visual routes should operate as reusable visual engines for release assets and live/operator workflows. The public site remains sparse; export capability is exposed through the hidden operator layer and direct soft-secret route URLs.

## Route Scope

Visual export applies to soft-secret visual routes tracked by the operator registry, including `/decay`, `/reclamation`, `/broadcast`, `/forest`, `/stepwell`, `/forbidding`, `/well`, `/tangle`, `/learning`, `/nerve`, `/face`, `/hand`, `/birth`, `/murmur`, `/growth`, `/resonance`, `/streamfront`, `/rivulet`, `/mycelium`, `/mountain`, `/cloudform`, and `/torchrite`.

This list is the canonical v1 route scope for visual export documentation.

## V1 Implementation

The v1 implementation wires all 22 soft-secret visual routes. It adds shared export settings parsing, an aspect-locked `ExportFrame`, runtime capability validation, visual export metadata for every visual route, and container-based Three.js sizing for the wired routes.

Each route remains normal when opened without a `target` query parameter and enters export mode when `target` is present.

## Export Contract

Routes support normal mode and export mode.

Normal mode:

- The route behaves as it does today.
- No public navigation or terminal behavior changes.
- Existing visual framing remains the default.

Export mode:

- The presence of a `target` query parameter is export mode.
- No `target` query parameter means normal mode.
- The route is opened with query parameters on the same path.
- The route reads supported target, seed, duration, and aspect values.
- The route renders a capture-friendly viewport for the requested target or the route's default target.
- Unsupported targets always fall back to `defaultTarget`.

Canonical export URL shape:

```text
/decay?target=canvas&seed=decay-001&duration=8&aspect=9:16
```

## Export Targets

The current `ExportTarget` union in `src/data/transmissions.ts` includes only `canvas | reel | hardware-feed | still | loop`. Future targets require widening that union before they appear in `supportedTargets`.

`canvas` is a vertical, short, loop-first target for Spotify Canvas. It uses `9:16`, expects 3-8 seconds, and does not require audio.

`reel` is a vertical social clip target for Instagram and TikTok. It uses `9:16`, expects 6-60 seconds, and may use audio when the campaign requires it.

`hardware-feed` is a live browser output target for Evan/operator capture. It defaults to `16:9`, can run indefinitely, and must not require audio or persistent visible controls.

`still` is a single-frame target for cover, press, thumbnail, or post assets. It supports common social and video ratios and provides browser-rendered still source material.

`loop` is a reusable moving background target. It supports `1:1`, `9:16`, and `16:9`, and expects 3-30 seconds.

## Reserved Targets

`youtube`, `story`, and `square` are reserved names for future longform, vertical story, and square social formats. They are not v1 `ExportTarget` values and must not appear in `supportedTargets` until the registry type is widened.

## Metadata Shape

Detailed export capability should be added to visual transmission entries as `visualExport`.

```ts
export type VisualExportCapability = {
  supportedTargets: ExportTarget[];
  defaultTarget: ExportTarget;

  seed: {
    supported: boolean;
    defaultMode: 'random' | 'fixed';
  };

  duration: {
    supported: boolean;
    defaultSeconds?: number;
    minSeconds?: number;
    maxSeconds?: number;
  };

  aspectRatios: {
    supported: Array<'9:16' | '16:9' | '1:1' | '4:5'>;
    default: '9:16' | '16:9' | '1:1' | '4:5';
  };

  capture: 'browser-source' | 'external-only';

  hardwareFeedSafe: boolean;
  operatorNotes?: string;
};
```

`seed.supported: true` means the same seed can replay the same output for the same target, aspect, duration, and supported route state. If a route cannot replay a seed, `seed.supported` is `false`.

`capture: browser-source` means the route renders a browser source suitable for external capture. `capture: external-only` means the route is intended for live hardware feed or external capture only.

`/decay` is currently configured with all v1 targets, `defaultTarget: 'canvas'`, `seed.supported: false`, `capture: 'browser-source'`, and `hardwareFeedSafe: true`.

`/reclamation` is currently configured with `canvas`, `reel`, `still`, and `loop`, `defaultTarget: 'canvas'`, `seed.supported: false`, `capture: 'browser-source'`, and `hardwareFeedSafe: false`. Export mode hides its development recording control and click-toggled HUD.

`/broadcast` is configured with `canvas`, `reel`, `still`, and `loop`, `defaultTarget: 'canvas'`, `seed.supported: false`, `capture: 'browser-source'`, and `hardwareFeedSafe: false`.

The remaining visual routes are configured with all v1 targets, `defaultTarget: 'canvas'`, `seed.supported: false`, `capture: 'browser-source'`, and `hardwareFeedSafe: true`.

## Operator UI Implications

`/operator` shows compact export indicators for supported targets and hardware-feed safety.

`/operator/transmissions/:slug` shows detailed visual export capability and preset launch links for visual transmissions.

Operator launch links should open the existing visual route with export query parameters. They should not create new public navigation paths.

## Non-Goals For V1

V1 does not include server-side rendering, video transcoding, automated upload to social platforms, public navigation, authentication, or full analytics/ROI integration.

V1 does not include in-page recording methods, final video/image format promises, or fixed-shape visual control metadata.

V1 does not require every existing visual route to support every export target. Unsupported capabilities are valid when they are explicit and visible to operators.
