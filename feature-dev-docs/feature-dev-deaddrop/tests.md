# Deaddrop - Test Specifications

## Acceptance Criteria

- `/deaddrop` includes exactly the 22 current registry entries whose type is `visual` and visibility is `soft-secret`; status remains visible and searchable.
- Eligible entries are ordered newest-first by `addedAt`.
- With an empty query, Torchrite appears once as `LATEST INTERCEPT` and the other 21 entries appear once in `ARCHIVE`.
- With a non-empty query, the feature panel is hidden and all matches appear once in the grid.
- Search matches title, slug, route, notes, tags, release, status, and `addedAt` without case sensitivity.
- Search result changes update a polite live-region count.
- Feature and archive cards link to their registry `route` without export parameters.
- Cards expose title, route, date, status, tags, and an optional release label.
- Failed thumbnail loads produce an explicit visible fallback while the card remains usable.
- Mycelium, Mountain, and Cloudform have real 640×360 route-capture JPEGs.
- `/deaddrop` remains absent from public navigation and crawler-discovery surfaces.
- Narrow viewports have no horizontal overflow and keep route/metadata visible without hover.
- Reduced-motion preferences suppress non-essential card lift, image scale, and transition motion.

## Unit Test Expectations

Eligibility filtering should require `type: visual` and `visibility: soft-secret`. It should not hide a matching entry solely because its status changes.

Chronological sorting should compare `addedAt` values without mutating the exported registry array.

Query normalization should trim surrounding whitespace and lowercase the search string. Empty and whitespace-only queries should select the default featured/archive presentation.

Search indexing should safely normalize missing optional release and notes fields and include every documented searchable field.

Default-view partitioning should return one latest item plus an archive containing every other eligible entry exactly once. Search-view partitioning should return the full filtered set with no separately featured item.

One thumbnail failure should reveal only that transmission's fallback; unrelated images should remain visible.

## Integration Paths

### Path 1: Default Catalog

1. Load `/deaddrop` with no query.
2. Confirm the heading reports 22 transmissions.
3. Confirm Torchrite, dated 2026-08-17, is the single full-width `LATEST INTERCEPT`.
4. Confirm the archive contains the remaining 21 transmissions and begins with Cloudform.
5. Confirm every eligible registry slug appears exactly once across the page.

### Path 2: Latest-Item Search

1. Search `torchrite`.
2. Confirm the `LATEST INTERCEPT` panel is absent.
3. Confirm Torchrite appears exactly once in the results grid.
4. Clear the query and confirm Torchrite returns to the feature panel and disappears from the archive grid.

### Path 3: Metadata Search

1. Search by a tag such as `percolation` and confirm Torchrite matches.
2. Search by release `Torchrite` and confirm the release field participates.
3. Search by status `active` and confirm all 22 entries match.
4. Search by date `2026-08-04` and confirm Cloudform matches.
5. Search by a route such as `/mycelium` and confirm the expected card links to that route.

### Path 4: No Results and Live Count

1. Search a string that matches no metadata.
2. Confirm `NO SIGNALS MATCH` is visible.
3. Confirm the polite result count announces zero matches.
4. Enter only whitespace and confirm the default feature/archive view returns.

### Path 5: Thumbnail Coverage and Failure

1. Confirm `mycelium.jpg`, `mountain.jpg`, and `cloudform.jpg` are JPEG route captures at 640×360.
2. Load the page and confirm each appears on its matching card.
3. Simulate one image request failure.
4. Confirm the affected card shows an explicit fallback, retains its metadata, and remains a working link.
5. Confirm all other thumbnails remain visible.

### Path 6: Responsive and Accessible Presentation

1. Test a narrow mobile viewport.
2. Confirm the page and search control do not overflow horizontally.
3. Confirm dates, statuses, routes, tags, and release labels remain visible without hover.
4. Navigate all cards and search by keyboard and confirm visible focus states.
5. Enable `prefers-reduced-motion: reduce` and confirm non-essential hover/lift/scale animation is removed.

### Path 7: Discovery Controls

1. Confirm `/` and `/terminal` do not link to `/deaddrop`.
2. Confirm the page adds `noindex,nofollow` robots metadata.
3. Confirm `public/robots.txt` disallows `/deaddrop` and `/deaddrop/`.
4. Confirm Netlify headers set `X-Robots-Tag: noindex, nofollow` for `/deaddrop` and `/deaddrop/*`.

## Edge Case Tests

| Scenario | Expected behavior |
| --- | --- |
| Query matches only the newest entry | Latest feature is hidden; one result card appears |
| Query is empty or whitespace | Newest feature plus remaining archive appears |
| Entry has no release | No empty release label; other metadata remains intact |
| Entry has no notes | Search and rendering continue without error |
| Thumbnail fails | Explicit fallback appears; card link and metadata remain usable |
| No matches | Empty state appears and polite count reports zero |
| Narrow viewport | No horizontal overflow; metadata does not depend on hover |
| Reduced motion enabled | Non-essential transforms/transitions are suppressed |
