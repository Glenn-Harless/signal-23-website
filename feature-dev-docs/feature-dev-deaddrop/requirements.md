# Deaddrop - Requirements

## Summary

`/deaddrop` is Signal-23's hidden visual index, presented as “THE ARRAY.” It exposes the soft-secret art catalog to people who know the direct URL without adding it to the homepage, terminal directory, or public navigation.

Deaddrop is a presentation layer over `src/data/transmissions.ts`, not an independent catalog. It currently represents all 22 registry entries whose type is `visual` and visibility is `soft-secret`. Status remains visible and searchable but does not independently determine catalog eligibility.

## Inputs

For each eligible transmission, Deaddrop consumes:

- `slug` for identity and thumbnail naming
- `route` for the card destination
- `title` for the primary label
- `status` for visible metadata and search
- `release` when present
- `tags` for visible metadata and search
- `notes` for search
- `addedAt` for chronological ordering, visible metadata, and search

Thumbnail images resolve from `/thumbnails/<slug>.jpg`.

The search input accepts free-form text. Matching is trimmed and case-insensitive across title, slug, route, notes, tags, release, status, and `addedAt`.

## Outputs

### Default View

Eligible transmissions are sorted newest-first by `addedAt`.

When the normalized search query is empty:

- The newest transmission appears once in a full-width `LATEST INTERCEPT` feature panel.
- Every remaining transmission appears once in the `ARCHIVE` card grid.
- A polite status line communicates the archive size in the default view.

### Search View

When the normalized search query is non-empty:

- The latest feature panel is hidden.
- Every matching transmission, including the otherwise featured newest item, appears once in the results grid.
- The polite status line reflects the number of matches against the full catalog.
- No-match state text remains visible when the result set is empty.

### Cards and Feature Panel

The feature panel and archive cards remain links to each transmission's normal route. They show:

- title
- route
- `addedAt` date
- status
- up to the displayed tag limit
- release when present

The route opens in normal presentation mode; Deaddrop does not append visual-export query parameters.

## Thumbnail Behavior

The catalog includes real 640×360 route captures for Mycelium, Mountain, and Cloudform at:

- `/thumbnails/mycelium.jpg`
- `/thumbnails/mountain.jpg`
- `/thumbnails/cloudform.jpg`

If any thumbnail is missing or fails to load, the card must retain an explicit visible fallback. Failure must not leave a broken-image icon, invisible media region, or unusable link.

## Discovery and Privacy

Deaddrop is hidden for presentation, not secured for privacy.

- No homepage, public navigation, or terminal command links to `/deaddrop`.
- The page sets client-side `robots` metadata to `noindex,nofollow`.
- `public/robots.txt` disallows `/deaddrop` and `/deaddrop/`.
- Netlify sends `X-Robots-Tag: noindex, nofollow` for `/deaddrop` and `/deaddrop/*`.

These measures discourage discovery and indexing but do not provide authentication or access control.

## Accessibility and Responsive Behavior

- Search has an accessible label.
- Result-count changes are announced with a polite live region.
- Links remain keyboard focusable and expose a visible focus state.
- Mobile layouts must not produce horizontal page overflow.
- Route and metadata remain visible on touch/mobile layouts without requiring hover.
- Text and metadata wrap or truncate without colliding with adjacent content.
- Reduced-motion preferences disable non-essential lift, scale, and animated-transition effects.

## Constraints

- Deaddrop must not maintain a second hard-coded list of visual routes.
- Only soft-secret visual transmissions appear; their registry status is shown rather than silently filtering non-active states.
- The same transmission must never appear twice in one view.
- Registry additions and metadata changes must flow through to Deaddrop without component-level catalog edits.
- Visual-export capability metadata does not affect Deaddrop eligibility or change normal route links.

## Edge Cases

- A search that matches the newest transmission shows it once in the grid and not in the hidden feature slot.
- A search containing only whitespace behaves like the default view.
- Missing optional `release` or `notes` fields do not leave empty labels or break search.
- Multiple entries with close or identical dates must remain individually addressable through their unique slugs and routes.
- A failed thumbnail retains legible identity and metadata on both feature and archive cards.
- Zero matching results show the empty state and announce a zero result count.

## User Flows

A visitor opens `/deaddrop`, sees Torchrite as the current newest `LATEST INTERCEPT`, scans the remaining visual routes in the archive, and opens a linked visual.

A visitor searches a title, route, tag, release, status, or date. The feature panel disappears, matching transmissions appear exactly once in the grid, and the result count updates politely.

A visitor on a narrow touch device can read the route and metadata, search the entire catalog, and open cards without hover or horizontal scrolling.
