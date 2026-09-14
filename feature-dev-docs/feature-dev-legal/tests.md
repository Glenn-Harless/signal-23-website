# Legal Pages - Test Specifications

## Acceptance Criteria

- `npm run build` emits `build/legal/privacy/index.html`; the build fails if the content file has no `<h1>`.
- The generated document contains the full policy text, a `<title>`, `meta name="description"`, `meta name="robots" content="index, follow"`, a canonical link to `https://signal23.net/legal/privacy`, and zero `<script>` elements.
- A direct GET of `/legal/privacy` on a Netlify-like server returns HTTP 200 with the policy text in the body; `/legal/privacy/` and `/legal/privacy/index.html` return the same document.
- With JavaScript disabled on a 390px-wide viewport, the page shows the heading, effective date, table of contents and all nine sections in reading order, with no horizontal scrolling.
- The only cross-origin requests made by the page are to `fonts.googleapis.com` and `fonts.gstatic.com`; no cookies are set.
- Headings are in order: one `h1`, then `h2` for each section; every in-page table-of-contents link targets an existing `id`.
- `/terms` shows a link whose visible text is "Privacy Policy" and whose `href` is `/legal/privacy`; its About, Contact and Refund Policy sections are unchanged.
- The listen landing pages link **Privacy** to `/legal/privacy` in both the static and React renders.
- The SPA route `/legal/privacy` (for example when the static file is bypassed) renders the same content and sets the document title to "Privacy Policy · Signal-23".
- `/`, `/terminal` and the visual transmission routes are unchanged.

## Unit Test Expectations

- `legalHtmlPlugins` produces one plugin per entry in `LEGAL_PAGES` with `inject: false`, no chunks, and a filename of `<route>/index.html`.
- `legalDevRewrites` maps `/legal/privacy` and `/legal/privacy/` to the generated file and nothing else.
- Escaping: title and description values containing `&`, `<` or `"` are HTML-escaped in the head; the content fragment is inserted verbatim.

## Manual Review Before Publishing

1. Read the policy against the Accuracy table in `requirements.md`; every row must still hold.
2. Confirm the effective date matches the publication date of the current revision.
3. After deploy, request `https://signal23.net/legal/privacy` with a plain HTTP client and confirm 200 and the text; confirm `https://signal23.net/privacy` returns 301 to it.
4. Paste `https://signal23.net/legal/privacy` into Meta's Privacy Policy URL field, and `https://signal23.net/legal/privacy#deletion` into the data deletion instructions field if Meta asks for one.

## Build Verification

```bash
npx tsc --noEmit
npm run build
grep -c "<script" build/legal/privacy/index.html   # expect 0
grep -c "Privacy Policy" build/legal/privacy/index.html
```
