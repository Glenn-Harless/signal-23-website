# SIGNAL-23 Website

The Signal-23 website is a TypeScript/React experience for the electronic music duo Signal-23. It combines the public portal, audio-reactive and generative visual transmissions, an instrument-rack storefront, and hidden operator/index surfaces in a single client-rendered application.

## Stack

- React 17 and React Router 6
- TypeScript compiled through Babel
- Webpack 5 and webpack-dev-server
- Three.js, GSAP, Tone.js, and HLS.js for visual and audio systems
- Tailwind CSS plus route-specific CSS
- Netlify for the production build, SPA routing, and serverless functions
- Stripe Checkout and Cloudflare R2 for paid/free rack delivery
- Docker Compose for the repository's standard local frontend environment

The repository currently pins Node.js 18 in both Netlify and `Dockerfile.frontend`. Dependency/runtime upgrades should be handled as a separate, tested change rather than mixed into visual or documentation work.

## Local Development

### Docker Compose

```bash
docker compose up --build
```

Open [http://localhost:9823](http://localhost:9823). The container runs webpack-dev-server on port 8080 and Docker maps it to host port 9823.

Stop the environment with:

```bash
docker compose down
```

### Native Node.js

Use Node.js 18 to match the deployed environment:

```bash
npm ci
npm start
```

Open [http://localhost:8080](http://localhost:8080).

`npm start` serves the frontend only. To exercise Netlify Functions locally, copy `.env.example` to `.env`, supply the Stripe and Cloudflare R2 credentials, and run the project through Netlify Dev. The Netlify proxy is configured on port 8888 with webpack on target port 8080.

Do not commit `.env` or credentials.

## Build

```bash
npm run build
```

Webpack writes the production bundle to `build/`. Netlify runs the same command and publishes that directory. The SPA fallback in `netlify.toml` rewrites unmatched paths to `index.html`, allowing React Router to resolve direct route visits.

## Routes

Public and commerce routes:

| Path | Purpose |
| --- | --- |
| `/` | Public portal: a window lit by the visitor's clock, Station 23's number groups and the hidden home audio |
| `/terminal` | Public terminal: LOG, TUNE (full releases), DECODE (number groups), SCAN, ARCHIVES |
| `/av` | A/V: every release as a window drawn from its measured spectrum, plus films and excerpts |
| `/instruments` | DL: the schedule sheet of devices and racks, with pay-what-you-want downloads per pack (`/dl` redirects here) |
| `/instruments/success` | Stripe payment verification and signed-download delivery |
| `/terms` | Terms page |
| `/listen/:slug` | Per-track ad landing page with a direct **Listen on Spotify** handoff (currently `decay`, `pulsar-04` and `reset`) |
| `/legal/privacy` | Privacy policy; static HTML readable without JavaScript (`/privacy` redirects here) |
| `/testblandingpage` | Deprecated compatibility path that redirects to `/resonance` |

The public routes above (except `/listen/*`, `/legal/*` and the redirect) carry the site nav, **HOME / A/V / DL**, set in American Typewriter. Its items and route allowlist live in `src/data/siteNav.ts`.

Soft-secret visual transmissions:

| Path | Registry title |
| --- | --- |
| `/decay` | Decay Signal |
| `/reclamation` | Reclamation Bloom |
| `/broadcast` | Broadcast Relay |
| `/forest` | Forest Array |
| `/resonance` | Resonance Field |
| `/growth` | Growth System |
| `/forbidding` | Forbidding Blocks |
| `/well` | Well |
| `/tangle` | Tangle |
| `/learning` | Learning |
| `/stepwell` | Stepwell |
| `/nerve` | Nerve |
| `/face` | Face |
| `/hand` | Hand |
| `/birth` | Birth |
| `/murmur` | Murmur |
| `/streamfront` | Streamfront Delta |
| `/rivulet` | Rivulet |
| `/mycelium` | Mycelium |
| `/mountain` | Mountain |
| `/cloudform` | Cloudform |
| `/torchrite` | Torchrite |
| `/signal-memory` | Signal Memory |

Hidden internal surfaces:

| Path | Purpose |
| --- | --- |
| `/deaddrop` | Newest-first visual index with a featured latest intercept and searchable archive |
| `/operator` | Searchable/filterable registry console |
| `/operator/transmissions/:slug` | Registry detail and visual-export launch links |

The hidden surfaces are intentionally absent from public navigation. `robots.txt`, client-side metadata, and Netlify headers discourage indexing, but these controls are not authentication.

## Visual Export

Each of the 23 visual routes can act as a browser-rendered capture source. A route behaves normally without query parameters and enters export framing when `target` is present, for example:

```text
/torchrite?target=canvas&duration=8&aspect=9:16
```

Supported targets are `canvas`, `reel`, `hardware-feed`, `still`, and `loop`; individual route capabilities are defined in `src/data/transmissions.ts` and displayed in the operator console.

### Signal Memory

`/signal-memory` is the first seed-replayable visual route: a silent, fixed-step 12–15 second piece in which a single simulated CRT beam writes Signal-23's own promo stills onto a single phosphor buffer — losing and regaining sync, integrating twelve observations of the emblem, tracing the contours out of its own memory, rewriting them as Signal-23 glyphs and landing on the frame-1 lockup. It supports 9:16, 4:5 and 16:9 plus three curated presets.

Use the normal route for controls and timeline scrubbing, then add `target=reel` for a clean control-free capture frame (`t=` pins a frame for stills):

```text
/signal-memory?target=reel&seed=S23-GLYPH-1603&duration=13.5&aspect=9:16
```

Capture at 1080×1920 for 9:16, 1080×1350 for 4:5, or 1920×1080 for 16:9 with audio disabled. The visual system, seed, source-derivative and capture notes live in [`src/components/SignalMemory/README.md`](src/components/SignalMemory/README.md).

## Listen Landing Pages

`/listen/<slug>` is a lightweight landing page for visitors arriving from a paid social ad that plays a specific track: artist name, exact track title, the approved artwork, one **Listen on Spotify** link, and small **Explore Signal-23** and **Privacy** links. Ads land on it directly; the portal and terminal are untouched.

Tracks are configured in `src/data/listenTracks.json` (title, slug, canonical Spotify track URL, artwork, optional share crop, optional muted loop video, optional one-sentence description, explore destination). Derived web assets live under `public/listen/<slug>/`.

Before a track is released, give it a `preSaveUrl` (the DistroKid HyperFollow page) instead of `spotifyUrl`; the button then reads **Pre-save on Spotify**. On release day, add the exact `https://open.spotify.com/track/<id>` URL as `spotifyUrl` (not the album link), remove `preSaveUrl`, and redeploy.

At build time `scripts/listen-pages.js` pre-renders one static `build/listen/<slug>/index.html` per track with track-specific Open Graph metadata, the inlined stylesheet, working markup before any JavaScript runs, and only the small `listen` bundle (`src/listen.tsx`). Netlify serves that file ahead of the SPA rewrite; `/listen/:slug` in `App.tsx` is the fallback for other hosts and unknown slugs. `npm start` serves the generated pages at the same pretty URLs.

### Listen page measurement

Measurement lives in `src/lib/listenAnalytics.ts`: a page view and a `spotify_outbound_click` event fired once per activation of the Spotify link (never with `preventDefault`), carrying the track slug and allowlisted `utm_*` parameters. It goes to up to three places:

- **Our counter, every visitor.** `navigator.sendBeacon` posts `page_view` and `spotify_tap` to `/.netlify/functions/relay`. The function stores one marker blob per hit in Netlify Blobs, keyed by UTC day, slug, event, device class (`instagram`, `facebook`, `mobile`, `desktop` or `bot`, from the user agent) and `utm_content`. No cookies, IPs, user agents or timestamps finer than the day are stored. Production counts go to the `listen-counter` store; deploy previews, branch deploys and `netlify dev` go to `listen-counter-preview`.
- **Meta Pixel, by region.** Only when `LISTEN_META_PIXEL_ID` was set at build time. Consent depends on the visitor's country (`src/lib/consent.ts`):
  - **opt-in** for the EU/EEA, UK and Switzerland, and whenever the country is unknown: a banner (`src/components/Listen/ListenConsent.tsx`) sits in the page flow below the Spotify button, and nothing is requested from `connect.facebook.net` until the visitor taps Accept.
  - **opt-out** everywhere else, including the US ad audience: no banner, and the Pixel loads with the page.

  The built page ships `data-consent="opt-in"` on `#listen-root`. The `listen-region` edge function (`netlify/edge-functions/listen-region.ts`) reads Netlify's `context.geo.country` and flips that to `opt-out` outside the opt-in countries, which are listed in `netlify/shared/consentRegions.ts`. Anything that bypasses it (`npm start`, the SPA fallback) stays opt-in. In both modes a stored decline or Global Privacy Control means no, the choice is kept in `localStorage` under `s23.analytics-consent`, and a **Cookies** link in the page footer opens the banner to change it. Declining after the Pixel ran revokes Pixel consent and expires the `_fbp`/`_fbc` cookies. Automatic Pixel events are off (`autoConfig` false).
- **Conversions API, wherever the Pixel runs.** The same tap is posted to `/.netlify/functions/relay-forward`, which sends `spotify_outbound_click` to Meta's Graph API with the browser event's id (so Meta counts it once), `action_source: website`, the page URL, the client IP and user agent, and `_fbp`/`_fbc` (built from `fbclid` when the cookie is missing). It does nothing unless `LISTEN_META_PIXEL_ID` and `META_CAPI_TOKEN` are set for the functions, when the request carries `Sec-GPC: 1`, or when a visitor in an opt-in (or unknown) country has not explicitly accepted.

To check both regions locally, build and serve with Netlify Dev's mock geolocation (from a worktree checkout, also pass `--functions` with that checkout's `netlify/functions` path):

```bash
LISTEN_META_PIXEL_ID=<pixel id> npm run build
netlify dev --dir build --framework '#static' --country US
netlify dev --dir build --framework '#static' --country DE
```

The banner and the Pixel exist only on the listen pages. Function names avoid "track" and "analytics" so ad blockers' generic rules leave the counter alone.

Counter totals are public and aggregate only:

```text
/.netlify/functions/relay-totals              last 14 UTC days
/.netlify/functions/relay-totals?days=30      last 30 days (max 92)
/.netlify/functions/relay-totals?from=2026-11-02&to=2026-11-11&slug=pulsar-04
```

The response has overall totals, totals by `utm_content` and by device class, and per-day rows by slug, device and `utm_content`. Its `store` field says whether it read production or preview counts. `npm start` does not run functions (the beacons 404 harmlessly); use `netlify dev` or a deploy preview to exercise them.

Older requirements and review notes for the first version live in `feature-dev-docs/feature-dev-listen/` and may be stale.

## Privacy Policy

`/legal/privacy` is the public privacy policy for the website and for Signal-23's internal Meta advertising app; it is the URL used in Meta's Privacy Policy field. The policy text lives once, in `src/components/Legal/privacy-policy.content.html`. At build time `scripts/legal-pages.js` renders it into a static, script-free `build/legal/privacy/index.html` (metadata plus inlined `Legal.css`), so the full text is in the initial HTML response for people and crawlers alike. `/legal/privacy` in `App.tsx` renders the same content as an SPA fallback, `/terms` links to it, and `netlify.toml` redirects `/privacy` there. Netlify serves directory pages at the trailing-slash URL, so the served address, canonical tag and the value for Meta's Privacy Policy URL field are all `https://signal23.net/legal/privacy/`.

To change the policy, edit the content file and update the effective date in its header. The page must never add analytics, pixels or cookies of its own. The listen pages' consent banner links to its `#listen-pages` section.

## Portal, Number Station and Terminal

The home portal (`src/components/Station/`) draws one window on the GPU: a detailed cloud in a single fragment shader, three parallax layers with self-shadowing, colored by the visitor's local clock (dawn, day, dusk, night; no location prompt). The window element is also the click area into the terminal. Without WebGL it falls back to a soft cloud drawn on the CPU. `?sky=dawn|day|dusk|night` previews a time of day and `?at23=1` previews the call-up the station sends 23 minutes past each hour.

The number readout steps through the day's groups digit by digit; the red dot blinks in time and is the home audio's hidden play button. Each of the 23 soft-secret visuals in `src/data/transmissions.ts` has one group, numbered in registry order; the scheme, the daily schedule and the flash timing live in `src/data/numberStation.ts`. The terminal's DECODE turns a group into its route and remembers recovered routes in the visitor's own browser (`localStorage`).

TUNE lists every release on a frequency taken from its release date. Measured numbers and spectra live in `src/data/releaseTelemetry.json`; release metadata, audio paths and YouTube IDs in `src/data/releases.ts`. Full tracks are 192 kbps MP3s of the released masters in `public/audio/`; the home page's hidden player loops Pieces from there. A release without audio shows as not loaded. A/V links each release to its Spotify and Bandcamp page (the single where there is one) and each EP to its album. SCAN still plays a random stretch of the HLS stream in `src/components/Terminal/AudioStreamer.ts`.

## A/V

`/av` (`src/components/AV/`) shows the latest release, EP2 and the Pillars EP as small portals painted from each track's measured spectrum in the visitor's sky colours; hovering shows the data as lines and clicking opens the terminal on that release (`/terminal?tune=MM.DD`). Films (official visuals) and excerpts (Shorts) come from `src/data/releases.ts`. Their stills are served from `public/av/`, and the YouTube player loads only when a visitor presses play, with a direct YouTube link beside it in case YouTube refuses to play embedded.

## Payment and Download Flow

- An exact `$0` selection calls `/.netlify/functions/free-download` and returns a 30-minute Cloudflare R2 signed URL without involving Stripe.
- An amount of `$0.50` or more calls `/.netlify/functions/create-checkout` and redirects to hosted Stripe Checkout.
- Stripe returns successful payments to `/instruments/success?session_id=...`; that page calls `/.netlify/functions/verify-payment` before receiving a 30-minute R2 signed URL.
- `/.netlify/functions/stripe-webhook` verifies Stripe signatures and logs completed or expired checkout sessions.

DL sells one pack per rack folder: `guitar`, `drums`, `synths-pads`, `any-source`, `vocals`, `mix-fx` and `lab`. Their R2 object names live in `netlify/functions/utils/storage.ts` (`Signal-23 <Pack> Racks.zip`); the retired `arps`, `audio-fx`, `bass` and `keys` stay mapped so earlier receipts still resolve.

## DL

`/instruments` (`src/components/DL/`) is a numbers-station schedule sheet: one line per rack, each digit one of its knobs at its saved position (0 to 9), devices first and then each pack in folder order. Rack names, knobs, presets and descriptions live in `src/data/racks.json`, generated from the racks in Ableton's User Library (`Presets/Audio Effects/Audio Effect Rack/1 Guitar` to `7 Lab`) and Glenn's racksmith notes. Third-party presets are left out. BK Baklengs is listed under Devices as in development, with demos in `public/audio/bk/` rendered from a plain synth phrase; while one plays, its line reads out the sound's energy band by band.

## Repository Layout

```text
src/
  App.tsx                         React Router configuration
  components/                    Route and shared UI components
  data/transmissions.ts          Operator and visual-export registry
  data/releases.ts               Releases for TUNE and A/V (audio, films, measured telemetry)
  data/numberStation.ts          Number groups, daily schedule and DECODE
  data/listenTracks.json         Listen landing page track configuration
  listen.tsx                     Standalone entry for the static /listen/<slug> pages
  hooks/                         Shared React hooks
  lib/                           Export parsing and validation
  styles/                        Global and shared styles
netlify/functions/               Stripe and R2 endpoints; listen page counter and Conversions API relay
netlify/edge-functions/          listen-region: sets each listen page's consent mode from the visitor's country
netlify/shared/                  Code shared by functions and edge functions (opt-in country list)
scripts/listen-pages.js          Pre-renders static /listen/<slug> pages for webpack
scripts/legal-pages.js           Pre-renders the script-free /legal/privacy page for webpack
public/                          Static files, models, audio (public/audio/ holds release MP3s), and thumbnails
feature-dev-docs/                Older per-feature notes (reference only; may be stale)
Dockerfile.frontend              Node 18 development image
docker-compose.yml               Host port 9823 → container port 8080
webpack.config.js                Development and production bundling
netlify.toml                     Build, functions, headers, and SPA fallback
```

## Configuration

The serverless payment flow expects:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Creates and verifies Stripe Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible account endpoint |
| `R2_ACCESS_KEY_ID` | R2 API credential |
| `R2_SECRET_ACCESS_KEY` | R2 API credential |
| `R2_BUCKET` | Private rack bucket; defaults to `signal23-racks` |
| `LISTEN_META_PIXEL_ID` | Meta Pixel (dataset) ID, `2364230354409635` ("Signal-23 Listen Pages"). Build-time: enables the Pixel and the consent banner on `/listen/<slug>` pages; empty means no Meta code at all. Also read at runtime by `relay-forward`, so scope it to builds and functions. Set it for production only so deploy previews send nothing to Meta |
| `META_CAPI_TOKEN` | Runtime; Conversions API access token from Events Manager. Without it `relay-forward` does nothing |
| `META_TEST_EVENT_CODE` | Optional, runtime; sends Conversions API events to Events Manager's Test Events tab instead of counting them |
| `LISTEN_SITE_URL` | Build-time; origin for listen page canonical/Open Graph URLs. Defaults to Netlify `URL`, then `siteUrl` in `src/data/listenTracks.json` |

See `.env.example` for placeholders.

## Verification

There is no automated test runner configured. For changes, at minimum:

```bash
npx tsc --noEmit
npm run build
```

Then smoke-test the affected routes at desktop and mobile widths. Payment and listen counter changes also require Netlify Dev or a deploy preview because webpack-dev-server does not execute Netlify Functions.
