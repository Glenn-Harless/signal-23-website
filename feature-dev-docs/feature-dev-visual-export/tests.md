# Visual Export - Test Specifications

## Acceptance Criteria

- All 16 visual routes expose complete export capability metadata.
- Supported target IDs match the shared export target vocabulary.
- All visual routes open normally with no export parameters.
- All visual routes can open in export mode through query parameters without public navigation changes.
- Unsupported export target requests on wired routes render the route's default target without blanking, crashing, or redirecting.
- Hardware-feed-safe routes keep unsupported-target messages out of the captured viewport.
- Seed-supported routes render repeatable visual state for the same seed, target, aspect ratio, duration, and supported route state.
- All visual routes remain seed-unsupported and non-deterministic in v1.
- Operator index shows visual export target support and hardware-feed safety.
- Operator detail views show export capability metadata and launch links.
- Mobile export controls fit without blocking the visual output.
- Desktop export controls fit without forcing horizontal overflow.
- The homepage and terminal command directory remain unchanged.

## Unit Test Expectations

Visual export metadata validation should reject unknown target IDs, missing default targets, default targets not included in `supportedTargets`, invalid duration ranges, and invalid aspect ratio defaults.

Route export parsing should produce stable normalized settings from supported query parameters and should ignore or report unsupported parameters without throwing runtime errors.

Seed handling should distinguish seed-supported behavior from seed-unsupported behavior.

Hardware-feed safety should be explicit and boolean for every visual route with detailed export metadata.

The runtime validator should emit no errors for any visual route metadata at module load.

## Integration Paths

Path 1: Normal Decay route

1. Load `/decay`.
2. Confirm existing visual behavior is unchanged.
3. Confirm no export frame or letterbox appears.
4. Confirm portrait mobile viewports such as iPhone SE do not crop the Decay shell edges.
5. Confirm no unsupported-target console warning appears.

Path 2: Canvas export mode

1. Load `/decay?target=canvas&seed=test-seed&duration=8&aspect=9:16`.
2. Confirm the route renders in the requested framing.
3. Confirm the Three.js scene remains visible inside the aspect frame.
4. Confirm the Decay shell edges are not cropped by the narrow frame.
5. Confirm no in-viewport controls appear over the export frame.

Path 3: Reclamation canvas export mode

1. Load `/reclamation`.
2. Confirm existing normal behavior is unchanged, including the click-toggled HUD outside export mode.
3. Load `/reclamation?target=canvas&duration=12&aspect=9:16`.
4. Confirm the route renders inside the requested aspect frame.
5. Confirm the city and bloom structure fit the narrow frame without obvious subject cropping.
6. Confirm the development recording button and HUD do not appear over the export frame.

Path 4: Unsupported target

1. Load `/decay?target=youtube`.
2. Confirm the page does not blank, crash, or redirect.
3. Confirm the route uses its default `canvas` target.
4. Confirm `console.warn` reports `unsupported target: youtube`.
5. Repeat for `/reclamation?target=hardware-feed` and confirm the route falls back to its default `canvas` target.

Path 5: Hardware-feed-safe unsupported target

1. Load `/decay?target=youtube`.
2. Confirm the captured viewport silently falls back to the route's default target.
3. Confirm the unsupported-target warning is emitted through `console.warn`.
4. Confirm any visible message appears outside the captured viewport.

Path 6: Fan-out sample routes

1. Load `/broadcast`, `/forest`, and `/nerve` with no query parameters.
2. Confirm normal visual behavior is preserved.
3. Load each route with `?target=canvas`.
4. Confirm each route renders inside a `9:16` export frame with controls and overlays hidden.
5. Load each route with `?target=canvas&aspect=16:9`.
6. Confirm each route renders inside a `16:9` export frame.
7. Load each route with `?target=youtube`.
8. Confirm each route falls back to its default target without blanking, crashing, or redirecting.

Path 7: Remaining visual route smoke test

1. Load each remaining visual route with `?target=canvas`.
2. Confirm the scene renders inside the export frame.
3. Confirm no development recording control or HUD overlay appears over the captured viewport.

Path 8: Operator visibility

1. Load `/operator`.
2. Confirm the operator index shows an export column populated for all visual routes.
3. Open `/operator/transmissions/decay`.
4. Confirm the detail view shows export capability metadata and five launch links.
5. Open `/operator/transmissions/reclamation`.
6. Confirm the detail view shows export capability metadata and four launch links.

Path 9: Public surface preservation

1. Load `/`.
2. Confirm the homepage does not link to export mode or `/operator`.
3. Load `/terminal` and run the command directory.
4. Confirm no export or operator command appears unless intentionally introduced by a future documented change.

## Edge Case Tests

Routes with external assets should show export-safe loading and failure states.

Routes with `capture: external-only` should still render correctly for hardware-feed or external capture.

Routes with indefinite duration should not require a duration parameter to render.

Long seed strings and operator notes should wrap without overlapping controls.
