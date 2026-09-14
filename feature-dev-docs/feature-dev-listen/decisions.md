# Listen Landing Pages - Decisions Log

Append-only log of architectural decisions.

---

## 2026-09-13 15:45 PDT - Claude Fable 5.1

### Decision: Pre-render a static page per track with its own small bundle

**Context:** The site is a single client-rendered bundle (about 2 MB of JavaScript, all routes imported statically). An ad visitor on a phone would download Three.js, GSAP and Tone.js before seeing a title or a link. Meta's crawler does not execute JavaScript, so per-track sharing metadata cannot come from a React effect.

**Decision:** `scripts/listen-pages.js` emits one `HtmlWebpackPlugin` per track that renders `src/components/Listen/template.html` with static metadata, the inlined stylesheet, pre-rendered markup, and only the `listen` webpack entry (`src/listen.tsx`). Netlify serves the file before the SPA rewrite.

**Rationale:** The title and link exist in the HTML itself, so the page works with JavaScript disabled and renders before any script arrives. The listen entry is roughly 150 KB against 2 MB for the main app. Metadata is correct for crawlers without a prerender service. Converting every other route to lazy loading would have touched all 30 routes for a proof of concept.

---

## 2026-09-13 15:45 PDT - Claude Fable 5.1

### Decision: Keep a SPA fallback route for the same component

**Context:** A host that does not resolve `listen/<slug>/index.html`, or a link to an unconfigured slug, would otherwise render a blank shell.

**Decision:** `App.tsx` registers `/listen/:slug`, rendering `ListenPage` inside `WorkstationShell` with a plain scrolling container and no route-change flicker; unknown slugs get a minimal "No signal" page.

**Rationale:** The visitor never lands on an empty screen, and the shared component keeps the two render paths identical.

---

## 2026-09-13 15:45 PDT - Claude Fable 5.1

### Decision: Plain same-tab anchor to the canonical Spotify track URL

**Context:** The supplied link carried a `?si=` share identifier. In-app browsers handle `target="_blank"` and custom URI schemes unreliably.

**Decision:** Store `https://open.spotify.com/track/<id>` without the share identifier, render it as a normal `<a href>` in the same tab, and never call `preventDefault`.

**Rationale:** The track id alone identifies the recording heard in the ad. Dropping the share identifier avoids attributing plays to one person's share link. A normal link is the most reliable path through Instagram and Facebook webviews and keeps working when scripts are blocked.

---

## 2026-09-13 15:45 PDT - Claude Fable 5.1

### Decision: Sink-based analytics with implied consent and Global Privacy Control

**Context:** The site has no analytics, no consent banner and no privacy page beyond a purchase-focused paragraph on `/terms`. The campaign's purpose is a Meta custom event that Meta can optimize toward.

**Decision:** `src/lib/listenAnalytics.ts` dispatches two events to configured sinks. The Meta Pixel sink exists only when `LISTEN_META_PIXEL_ID` is set at build time and runs only when `hasTrackingConsent()` is true, which honors Global Privacy Control and a stored denial. A console sink covers development. No first-party or session-based sink ships yet.

**Rationale:** The pixel is the piece the ad campaign needs; everything else is a seam. Consent policy is the owners' decision, so the code makes opting out cheap and a banner a one-line integration rather than choosing a regime. Session-level conversion reporting needs a session-capable tool and is documented as a reporting rule instead of half-built.

---

## 2026-09-13 15:45 PDT - Claude Fable 5.1

### Decision: Still first, loop video as a JavaScript-only enhancement

**Context:** Two approved assets exist for Decay: a 3000x3000 still and an 8-second 1080x1920 canvas video with audio. The brief prefers the video if allowed but forbids artwork that delays or displaces the button.

**Decision:** The still is the artwork in both the static and React renders and the sharing image. The video is transcoded to a 540x540 muted loop and added only by React, only when motion is allowed, fading in over the still once it plays.

**Rationale:** The page never waits on 1.4 MB of video. Reduced-motion and data-saver users get the still. If autoplay is blocked the still is already on screen, so nothing looks broken.

---

## 2026-09-13 15:45 PDT - Claude Fable 5.1

### Decision: "Explore Signal-23" opens the track's own visual route

**Context:** The brief allows the secondary link to open the existing art experience.

**Decision:** `exploreHref` is per track; Decay points at `/decay` (Decay Signal). The default is the portal at `/`.

**Rationale:** The visitor just heard Decay; its generative visual is the most coherent next step and is one hop away. The portal remains the default for tracks without a visual.
