# Listen Landing Pages - Test Specifications

## Acceptance Criteria

- `npm run build` emits `build/listen/<slug>/index.html` for every track in `src/data/listenTracks.json`, and the build fails on an invalid slug, a non-canonical Spotify URL, missing artwork, or a multi-sentence description.
- The generated HTML contains the track title in `<title>`, `og:title`, `og:description`, `og:url`, `og:image` (absolute URL to the approved artwork), `og:image:width/height`, `twitter:card`, and a canonical link.
- The generated HTML references only the `listen` entrypoint's scripts, never `main.js` or the Three.js chunk.
- With JavaScript disabled, the page shows artist, title, artwork and a working "Listen on Spotify" link whose `href` is the configured canonical Spotify URL.
- On 390x844, 375x667, 412x915 and a 375x560 in-app-browser viewport, the Spotify button's bounding box lies fully inside the initial viewport.
- Activating the Spotify link navigates the same tab to `https://open.spotify.com/track/<id>`.
- Under `prefers-reduced-motion: reduce` no `<video>` element is rendered; otherwise the loop video renders with `muted`, `loop`, `playsinline` and fades in only after `playing`.
- In a non-production build the console shows exactly one `[listen] page_view` on load and exactly one `[listen] spotify_outbound_click` per activation, carrying `track_slug`, `destination` and only allowlisted `utm_*` keys (for example `fbclid` is absent).
- With no `LISTEN_META_PIXEL_ID`, no request is made to `connect.facebook.net`.
- With a pixel id and Global Privacy Control enabled, or `localStorage['s23.analytics-consent'] === 'denied'`, no request is made to `connect.facebook.net`.
- `/listen/<unknown>` renders the "No signal" page with a link to `/`.
- `/`, `/terminal` and every visual transmission route render exactly as before.

## Unit Test Expectations

- `readCampaignParams` keeps only allowlisted keys, strips control characters, trims, and caps values at 120 characters; malformed input yields an empty object.
- `recordSpotifyOutbound` returns an event id on the first call and `null` for an identical activation inside one second, then records again after the window.
- `hasTrackingConsent` returns false when `navigator.globalPrivacyControl` is true or stored consent is `denied`, and true otherwise.
- `renderListenMarkup` escapes HTML in title, alt text and URLs, and produces the same element structure and class names as `ListenPage.tsx`.
- `validateTrack` rejects `?si=` share URLs and uppercase slugs.

## Manual Device Review (before any ad launch)

1. Open the ad preview on iPhone (Instagram and Facebook) and Android (Instagram, Facebook, Chrome).
2. Confirm the page renders with the button above the fold inside each in-app browser.
3. Tap the button; confirm the correct track opens, note whether Spotify's app or web page appears, and whether a sign-in or "Open app" prompt intervenes. Reaching Spotify does not mean playback started.
4. Repeat with a content blocker or tracking protection enabled; the link must still work.
5. Only after live events are verified in Meta Events Manager, create the custom conversion for `spotify_outbound_click`, labeled as an outbound click.

## Build Verification

```bash
npx tsc --noEmit
npm run build
grep -c "og:image" build/listen/decay/index.html
```
