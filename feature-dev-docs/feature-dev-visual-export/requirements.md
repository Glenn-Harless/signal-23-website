# Visual Export - Requirements

## Summary

Signal-23 hidden visual routes must become reusable export engines without becoming public navigation. The canonical visual route list lives in `feature-spec.md` under Route Scope.

The v1 export contract supports Spotify Canvas, Instagram/TikTok reels, stills, loops, and Evan's hardware-feed workflow through metadata and route-level export behavior. V1 produces browser-rendered source output for external capture or downstream processing; it does not define in-page recording transports or final transcoded delivery formats.

Visual export v1 applies the contract to all 16 soft-secret visual routes in the operator registry. `/operator` surfaces each route's export capability, and route detail pages expose preset launch links.

## Export Targets

The current `ExportTarget` union in `src/data/transmissions.ts` includes only `canvas | reel | hardware-feed | still | loop`. Future targets require widening that union before they appear in `supportedTargets`.

| Target | Aspect Ratio | Duration | Audio | Output Expectation |
| --- | --- | --- | --- | --- |
| `canvas` | `9:16` | 3-8 seconds | Not required | Browser-rendered vertical loop source for downstream Canvas delivery |
| `reel` | `9:16` | 6-60 seconds | Optional | Browser-rendered vertical clip source for downstream social delivery |
| `hardware-feed` | `16:9` by default, fullscreen-safe | Operator-set or indefinite | Not required | Live fullscreen browser output for external capture or hardware routing |
| `still` | `1:1`, `4:5`, `9:16`, or `16:9` | Single frame | Not required | Browser-rendered still frame source |
| `loop` | `1:1`, `9:16`, or `16:9` | 3-30 seconds | Not required | Browser-rendered moving loop source |

## Visual Capability Metadata

Visual export capability metadata attaches to visual `Transmission` entries in `src/data/transmissions.ts`. Every visual route in the canonical route scope has a `visualExport` object.

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

The existing `exportUse` field remains the lightweight registry summary. `visualExport` is the detailed v1 capability object for validation, launch links, operator display, and route export behavior. For wired routes, `exportUse` and `visualExport.supportedTargets` must agree by hand until the source-of-truth decision is resolved.

## Route-Level Export Behavior

Normal route loading must remain unchanged when no `target` query parameter is present. In v1, this behavior is implemented on all visual routes in the canonical route scope.

The presence of `target` is export mode. Export mode is entered through query parameters on the existing soft-secret route, not through a public navigation path. The canonical shape is:

```text
/decay?target=canvas&seed=decay-001&duration=8&aspect=9:16
```

Visual routes with `seed.supported: true` must render the same output for the same seed, target, aspect ratio, duration, and supported route state. Routes with `seed.supported: false` must still render successfully and disclose that seed replay is unsupported. `/decay` is explicitly non-deterministic in v1 and keeps its existing random behavior.

Export controls are allowed only outside the captured viewport. Routes with `hardwareFeedSafe: false` may use an in-viewport operator overlay, but that overlay must be removable before final capture.

Unsupported targets always fall back to the route's `defaultTarget`. Unsupported requests must never produce blank screens, broken canvases, or redirects into public navigation.

Hardware-feed-safe routes must keep the captured viewport clean. If an unsupported target is requested on a hardware-feed-safe route, the viewport falls back silently to `defaultTarget`; the unsupported-target message is surfaced through `console.warn` and may also appear in a non-overlay area outside the captured viewport. Non-hardware-feed-safe routes may show an in-viewport unsupported-target overlay.

Routes that use viewport-sized rendering must use their mount container as the authoritative size in export mode. Wired visual routes use an aspect-controlled `ExportFrame` wrapper and a mount-element `ResizeObserver` so Three.js fills the frame rather than the full browser window.

Aspect-framed routes must preserve the intended subject inside the frame. `/decay` adjusts camera distance from the mount aspect ratio for export mode and narrow normal viewports so targets such as `canvas` and mobile portrait previews do not crop the shell edges.

`/reclamation` supports `canvas`, `reel`, `still`, and `loop` exports. It remains seed-unsupported and non-deterministic. Export mode hides the development recording button and click-toggled HUD so the captured viewport stays clean. Narrow aspect ratios use a wider camera orbit to keep the city and bloom structure inside frame.

All v1 visual routes remain seed-unsupported and non-deterministic. `/broadcast` and `/reclamation` are not hardware-feed-safe in v1; the other visual routes expose `hardware-feed` because they render useful unattended visual output and hide controls or HUD overlays in export mode.

The operator index must display an export column sourced from `visualExport`. The operator detail page must display capability metadata and launch links of the form `<route>?target=<target>` for every supported target.

## Constraints

Visual export does not make hidden routes public. The homepage, terminal command list, sitemap behavior, and public navigation remain unchanged.

The browser route is the source visual engine. Any future server processing, transcoding, upload automation, or analytics consumes output from that engine rather than replacing it.

Hardware-feed-safe routes must avoid mandatory pointer interaction, modal UI, unstable frame layout, and controls that remain visible over the output.

## Edge Cases

Routes with `capture: external-only` can still be useful as hardware feeds.

Routes with no duration support can run indefinitely but should still accept target/aspect metadata for framing.

Routes with 3D assets or audio dependencies must expose loading and failure states suitable for export mode.

Mobile export controls must not overlap the visual viewport or prevent the route from being captured.

Desktop export controls must fit without forcing horizontal page overflow.

## User Flows

An operator opens `/operator`, sees which visual routes support each export target, then opens a route detail page for launch links and notes.

An operator opens `/decay?target=canvas&seed=decay-001&duration=8&aspect=9:16`, verifies the framed output, hides any out-of-viewport controls, and records a Canvas-ready source clip externally.

Evan opens a hardware-feed-safe route in fullscreen export mode and sends the clean browser output to external capture or performance hardware.
