# Legal Pages - Requirements

## Summary

`/legal/privacy` is Signal-23's public privacy policy. It covers the website, instrument-rack downloads and payments, the internal Meta developer app used to run Signal-23's own Facebook and Instagram advertising, and the AI tools operators use with that data. Meta requires a reachable Privacy Policy URL before the developer app can go live; this page is that URL.

The main art experience is unchanged. The policy is reached from a clearly labeled **Privacy Policy** link on `/terms`, from the **Privacy** link on the listen landing pages, and by the `/privacy` redirect.

## Inputs

- `src/components/Legal/privacy-policy.content.html`: the only copy of the policy text, as an HTML fragment with an `<h1>`, an effective date in the header, a section table of contents and one `<section id>` per topic. Facts in it must match the implementation (see Accuracy).
- `scripts/legal-pages.js`: the list of legal pages (route, content file, title, description).
- `LISTEN_SITE_URL` / Netlify `URL`: origin used for the canonical URL; defaults to `https://signal23.net`.

## Outputs

- `build/legal/privacy/index.html`: a complete HTML document containing the full policy text, page metadata, `robots: index, follow`, a canonical link, the shared stylesheet inlined, the site typeface loaded from Google Fonts, and no `<script>` elements. Netlify serves it before the SPA rewrite at the trailing-slash address `https://signal23.net/legal/privacy/` (HTTP 200 with the text in the initial response); `/legal/privacy` without the slash is a 301 to it. The canonical tag, internal links and the Meta Privacy Policy URL all use the trailing-slash form.
- SPA route `/legal/privacy` rendering the same content file inside the shell, as a fallback for hosts without static-file resolution and for client-side navigation.
- `netlify.toml`: `/privacy` redirects to `/legal/privacy/` with status 301.
- Registry entry `privacy-policy` (type `page`, visibility `public`) in `src/data/transmissions.ts`.

## Content

The policy must, in plain language, cover: who operates the site and the advertising integration; what information is collected, accessed or stored and why; service providers and data sharing (Netlify, Google Fonts, Dropbox audio, Stripe, Cloudflare R2, Meta, AI providers); how access is restricted; retention and deletion practices; how to contact us or request deletion; and an effective date. It distinguishes the permissions granted to the Meta app from the functionality actually used, and states that the current advertising links directly to Spotify with no pixel or analytics on this site.

## Accuracy

Every factual statement is grounded in the repository or the owners' description:

| Statement | Source |
| --- | --- |
| No analytics, pixels or cookies set by the site | No such code in `src/`; the listen Meta Pixel sink is compiled out without `LISTEN_META_PIXEL_ID` |
| One session-storage flag on the terminal | `src/components/Terminal/useTerminal.ts` (`terminal-intro-seen`) |
| Google Fonts, Dropbox audio stream, external links | `src/styles/fonts.css`, `src/components/Terminal/AudioStreamer.ts`, terminal link data |
| Free download collects nothing; 30-minute signed R2 link | `netlify/functions/free-download.ts`, `utils/storage.ts` |
| Stripe Checkout; server receives pack, amount and customer email; webhook logs email and amount | `utils/stripe.ts`, `verify-payment.ts`, `stripe-webhook.ts` |
| No customer database | No persistence in any function; Supabase dependency is unused |
| Meta app scope, AI tool usage, operators-only access | Owners' description in the brief; Marketing API reports are aggregate |
| AI providers are Anthropic (Claude) and OpenAI (Codex) | Confirmed by Glenn Harless, 2026-09-13 |
| Operators named as Glenn Harless and Evan Simonsen | Confirmed by Glenn Harless, 2026-09-13 |
| No Netlify Analytics or other server-side analytics | Confirmed by Glenn Harless, 2026-09-13 |

The policy must not name a legal entity, a numeric retention period, a security certification or an AI training policy unless the owners supply and confirm it.

## Constraints

- Readable without JavaScript and by URL checkers; the text is in the initial HTML.
- No analytics, pixels, cookies or other tracking on the page itself.
- Mobile-readable: single column, at most 680px wide, 15px base type, high-contrast text, visible focus styles, semantic headings in order.
- Visually consistent with the site (black, IBM Plex Mono) while prioritizing legibility over terminal effects; the SPA fallback suppresses the shell's route flicker.
- `/terms` keeps its About, Contact and Refund sections and no longer makes privacy claims of its own; its Privacy section links to the policy.

## Edge Cases

- Content file without an `<h1>` fails the build.
- Hosts that ignore static files fall through to the SPA route with identical content.
- Direct requests to `/legal/privacy/index.html` and `/legal/privacy/` serve the same document.
- The React fallback injects the fragment with `dangerouslySetInnerHTML`; the fragment is repository-authored content, never user input.

## Maintenance

- The Meta permissions are described by capability rather than listed by name, by the owners' choice. If the app's permission set changes materially, update section 4.
- Any new tracking, analytics, provider or data flow on the site requires updating the content file and its effective date before the change ships.
