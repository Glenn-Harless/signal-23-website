# Operator Registry - Requirements

## Summary

The operator registry is a hidden internal map for Signal-23 routes and transmissions. It gives operators a structured view of public routes, soft-secret art routes, commerce routes, and deprecated routes without adding public navigation or changing the terminal command directory.

## Inputs

Registry entries live in `src/data/transmissions.ts`.

Each entry includes:

- `slug`: stable registry identifier used by operator detail routes
- `route`: site path that the entry describes
- `title`: display name for the route or transmission
- `type`: route category such as visual, interactive, page, or commerce
- `status`: current operational state
- `visibility`: public, soft-secret, operator-only, or deprecated
- `release`: optional release association
- `tags`: searchable descriptors
- `exportUse`: intended export targets
- `notes`: optional operator-facing context
- `addedAt`: date the entry was added to the registry

## Outputs

`/operator` renders a searchable and filterable table of all registry entries.

`/operator/transmissions/:slug` renders a generic detail view for any registry entry.

Both operator routes set a client-side `robots` meta tag with `noindex,nofollow`. Netlify also sends `X-Robots-Tag: noindex, nofollow` for `/operator` and `/operator/*`.

## Constraints

The operator layer is hidden for presentation, not secured for privacy. It must not be linked from the homepage, public navigation, or terminal command list.

The registry is the source of truth for operator route metadata. New transmission routes should be added to the registry when they become meaningful operator surfaces.

Public routes and soft-secret routes may appear inside the operator UI, but the operator UI itself remains reachable only by direct URL.

Soft-secret visualization routes are classified as `visual` by default. `interactive` is reserved for surfaces whose primary purpose is command or workflow interaction, such as the public terminal.

## Edge Cases

Unknown detail slugs render a not-found state inside the operator shell.

Entries without export targets render `NONE` instead of implying export support.

Deprecated compatibility routes can remain in the registry when they still exist in the router.

Long tags, routes, and titles must wrap or scroll without overlapping surrounding controls.

The desktop operator table must occupy the full operator shell width and distribute columns across the available space.

## User Flows

An operator visits `/operator`, searches or filters by type, status, visibility, tag, release, route, or notes, then opens a route or a registry detail page.

An operator visits `/operator/transmissions/decay` directly and sees route metadata, export intent, tags, notes, and adjacent registry navigation.

Search engines and crawlers that respect standard hints receive both `robots.txt` disallow rules and `noindex,nofollow` headers for operator routes.
