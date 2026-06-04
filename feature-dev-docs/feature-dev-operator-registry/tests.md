# Operator Registry - Test Specifications

## Acceptance Criteria

- Visiting `/operator` displays every entry from `src/data/transmissions.ts`.
- The homepage and terminal command list do not link to `/operator`.
- Search matches title, slug, route, type, status, visibility, release, notes, tags, and export targets.
- Type, status, and visibility filters narrow the table without changing the registry data.
- Soft-secret visualization routes from `decay` onward are classified as `visual`.
- The desktop table spans the full operator content width instead of occupying only the left side of the page.
- Each row links to `/operator/transmissions/:slug`.
- Detail pages render metadata for any registry entry.
- Unknown detail slugs render a not-found state with a path back to `/operator`.
- Entries without export targets display `NONE`.
- `/operator` and `/operator/*` receive `X-Robots-Tag: noindex, nofollow` in Netlify configuration.
- `public/robots.txt` disallows `/operator` and `/operator/`.

## Unit Test Expectations

Registry data should contain unique slugs and routes for all current router paths that need operator visibility.

Filtering behavior should be deterministic for empty queries, case-insensitive text queries, and combined type/status/visibility filters.

Detail lookup should return the matching registry entry for a valid slug and no entry for an unknown slug.

## Integration Paths

Path 1: Operator index

1. Load `/operator`.
2. Confirm summary totals and table rows render.
3. Search `decay`.
4. Confirm `DECAY SIGNAL` remains visible and unrelated routes are hidden.
5. Clear search and filter visibility to `soft-secret`.
6. Confirm public routes are hidden.

Path 2: Operator detail

1. Load `/operator/transmissions/decay`.
2. Confirm title, route, status, visibility, tags, export targets, and notes render.
3. Open the route link and confirm it points to `/decay`.
4. Use the back link to return to `/operator`.

Path 3: Discovery controls

1. Build the site.
2. Confirm `public/robots.txt` is copied into the build output.
3. Confirm `netlify.toml` defines noindex headers for `/operator` and `/operator/*`.

## Edge Case Tests

Long route and tag values should wrap or scroll without overlapping other UI.

Mobile widths should render table rows as stacked label/value pairs.

Deprecated routes should stay visible in the registry but clearly show deprecated visibility and archived status.
