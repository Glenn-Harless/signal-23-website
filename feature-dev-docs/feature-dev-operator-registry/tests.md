# Operator Registry - Test Specifications

## Acceptance Criteria

- Visiting `/operator` displays every entry from `src/data/transmissions.ts`.
- The registry contains exactly 22 soft-secret visual entries, including `/streamfront`, `/rivulet`, `/mycelium`, `/mountain`, `/cloudform`, and `/torchrite`.
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
- `/deaddrop` derives its cards from soft-secret visual registry entries instead of maintaining a separate route list or hiding entries by status.
- `/deaddrop` and `/deaddrop/*` receive the same crawler-discovery protections as the operator surface.

## Unit Test Expectations

Registry data should contain unique slugs and routes for all current router paths that need operator visibility. Each of the 22 visual routes should have `visualExport` metadata whose supported targets agree with `exportUse`.

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

Path 4: Registry consumers

1. Load `/deaddrop` with no query.
2. Confirm all 22 soft-secret visual entries are represented once across the latest feature and archive.
3. Search for `Torchrite`, a release, a status, and an `addedAt` date.
4. Confirm matches come from registry metadata and link to the matching visual route.
5. Confirm no public, commerce, deprecated, or operator-only entry appears.

## Edge Case Tests

Long route and tag values should wrap or scroll without overlapping other UI.

Mobile widths should render table rows as stacked label/value pairs.

Deprecated routes should stay visible in the registry but clearly show deprecated visibility and archived status.

Adding a new registry-backed soft-secret visual should make it available to both `/operator` and `/deaddrop` without a second hard-coded catalog.
