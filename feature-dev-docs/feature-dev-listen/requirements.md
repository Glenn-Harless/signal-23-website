# Listen Landing Pages - Requirements

## Summary

`/listen/<slug>` is a lightweight, per-track landing page for visitors who arrive from a paid social ad that plays that track. Its single job is an explicit, measurable handoff to the exact Spotify recording heard in the ad. Ads land on it directly, bypassing the portal at `/` and the terminal introduction. The homepage, `/terminal`, and the visual transmission routes are unchanged.

Current tracks: `decay` (proof of concept). The partners have not selected the first campaign track.

## Inputs

### Track configuration

`src/data/listenTracks.json` is the single source for both the React component and the build-time page generator.

| Field | Required | Meaning |
| --- | --- | --- |
| `artist`, `siteUrl` | yes (top level) | Artist name shown on every page; production origin for canonical and sharing URLs |
| `slug` | yes | URL segment; lowercase letters, digits and hyphens |
| `title` | yes | Exact advertised track title |
| `spotifyUrl` | yes | Canonical `https://open.spotify.com/track/<id>` URL, verified against Spotify; share identifiers (`?si=`) are not stored |
| `artwork` | yes | Approved still (`src`, `width`, `height`, `alt`) shown on the page and used as the sharing image fallback |
| `shareImage` | no | 1200x630 crop for link previews |
| `loopVideo` | no | Muted decorative loop layered over the still when motion is allowed |
| `description` | no | At most one sentence; omitted rather than invented |
| `exploreHref` | no | Destination of "Explore Signal-23"; defaults to `/` |
| `releaseDate` | no | Informational |

The build fails when a track has an invalid slug, a non-canonical Spotify URL, missing artwork, or a multi-sentence description.

Derived web assets live under `public/listen/<slug>/` (`artwork.jpg` 1200x1200, `og.jpg` 1200x630, `loop.mp4` 540x540 muted). Originals stay in Dropbox and are never modified.

### Build-time environment

| Variable | Purpose |
| --- | --- |
| `LISTEN_META_PIXEL_ID` | Enables the Meta Pixel sink. Empty or unset means no third-party tracking code is included |
| `LISTEN_SITE_URL` | Overrides the origin used in canonical and Open Graph URLs; falls back to Netlify's `URL`, then `siteUrl` |

## Outputs

- `build/listen/<slug>/index.html` for every configured track: pre-rendered markup, the shared stylesheet inlined, track-specific `<title>`, description, canonical URL, Open Graph (`music.song`) and Twitter card metadata using the approved artwork, and only the `listen` bundle (React plus the page component) rather than the full site bundle.
- Netlify serves that file before applying the `/* -> /index.html` rewrite, so the ad URL resolves to the static page.
- `/listen/:slug` inside the SPA renders the same component as a fallback. Unknown slugs render a minimal "No signal" page that links to `/`.

## Page Content

First mobile screen, top to bottom:

1. Artist name `Signal-23`
2. Exact track title
3. Approved artwork still, with the optional loop video fading in over it
4. Prominent **Listen on Spotify** button: a plain `<a href>` to the canonical Spotify track URL, same tab
5. **Explore Signal-23** text link (`exploreHref`)
6. **Privacy** link to `/legal/privacy/`

An optional one-sentence description may appear under the title. There is no preview player, sign-up form, or interstitial.

## Behavior Constraints

- The Spotify button is visible without scrolling on typical phones. The page is a flex column that fills the viewport; the artwork flexes between a 150px minimum and a square maximum so it can never push the button below the fold. The page scrolls only when the viewport is shorter than the minimum content.
- Title and link render from static HTML before any JavaScript runs. The link works with JavaScript disabled, analytics blocked, and cookies unavailable.
- No animation gates, loaders, autoplay audio, or required interactions. The shell's route-change flicker is suppressed on this route and, site-wide, under `prefers-reduced-motion`.
- The loop video is a JavaScript-only enhancement: muted, inline, looping, fades in on `playing`. It is skipped under `prefers-reduced-motion`, when the browser reports `saveData`, or when the track has no `loopVideo`. If autoplay is blocked the still remains visible.
- Same-tab navigation to the HTTPS Spotify URL. No app-only URI and no second smart-link page.

## Measurement

- Two events: a page view, and `spotify_outbound_click` fired only when the Spotify link is activated (click, keyboard activation, or middle-click). The outbound payload carries `track_slug`, `destination: "spotify"` and the allowlisted campaign identifiers `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` read from the landing URL (control characters stripped, values capped at 120 characters). All other query parameters are dropped.
- One activation is recorded once: an identical activation within one second is ignored, and every recorded event carries a unique `eventID` for Meta deduplication or a future Conversions API.
- Sinks: Meta Pixel (standard `PageView`, `trackCustom` for the outbound event) when `LISTEN_META_PIXEL_ID` is set; a console sink in non-production builds. With no configured sink the page makes no analytics requests.
- Consent: sinks that contact third parties run only when `hasTrackingConsent()` is true. It is false when the browser sends Global Privacy Control or when `localStorage` key `s23.analytics-consent` is `denied`. The site has no consent banner yet, so consent is otherwise implied; a future banner only needs to write that key.
- Analytics never delays navigation: handlers are synchronous, never call `preventDefault`, and swallow their own errors.
- Reporting rules that live outside the code: keep page-view and outbound counts separate; report the share of tracked sessions with at least one outbound action only with a session-capable tool using the same session definition and filters for numerator and denominator; report media spend divided by attributed outbound events as cost per outbound event, distinct from listeners, streams or fans; state attribution window, tracking coverage and date range; create a Meta custom conversion only after the live events are verified, labeled as an outbound click and never as a purchase, stream, save or follow.

## Edge Cases

- Unknown slug: SPA "No signal" page with a link to `/`.
- Direct request to `/listen/<slug>/index.html`: the entry reads the slug from the `data-track` attribute rather than the URL.
- Host without static-file resolution: the SPA route renders the same component inside the shell.
- Malformed query string: campaign parameters are empty and the page is unaffected.
- Reaching Spotify does not guarantee playback. In-app browsers may show Spotify's web page with an "Open app" prompt instead of deep-linking.

## Open Inputs

- Meta Pixel ID (no tracking until it is set and verified in Events Manager).
- Consent approach: keep implied consent with Global Privacy Control, or add a banner. The privacy policy at `/legal/privacy` currently states the site has no tracking and must be updated before a pixel goes live.
- First campaign track; Evan's approval of layout, artwork still, and loop video; visual continuity with the ad creative.
- Device journey review on iPhone and Android, including Instagram and Facebook in-app browsers.
