# Operator Registry - Decisions Log

Append-only log of architectural decisions.

---

## 2026-05-07 18:49 PDT - Codex GPT-5

### Decision: Build the operator layer as a registry-backed hidden console

**Context:** Signal-23 needs room to expand the website with internal release, visual, export, and ROI surfaces without making the public homepage or terminal feel like a conventional navigation site.

**Options Considered:**

1. Add public navigation for visual and release pages.
2. Create one-off hidden pages without a shared data model.
3. Add a structured registry and render an internal operator console from it.

**Decision:** Add `src/data/transmissions.ts` and render `/operator` plus `/operator/transmissions/:slug` from that registry.

**Rationale:** A registry gives future visuals, releases, exports, Racksmith artifacts, and ROI work a shared metadata spine. Keeping the route hidden preserves the public site's sparse surface while still giving operators an explicit map.

---

## 2026-05-07 18:49 PDT - Codex GPT-5

### Decision: Treat `/operator` as aesthetic privacy, not authentication

**Context:** The operator route should not accidentally appear in public navigation or search results, but this slice does not require real access control.

**Options Considered:**

1. Add no controls and rely on the route being unlinked.
2. Add crawler hints only.
3. Add client-side passphrase protection.
4. Add Netlify-level authentication or basic auth.

**Decision:** Use no public links, `public/robots.txt`, client-side `noindex,nofollow` meta tags, and Netlify `X-Robots-Tag` headers. Do not add authentication in this slice.

**Rationale:** Noindex controls match the current goal: preserve the public-facing mystery without pretending the route is actually private. Real security can be added later with server-side protection if the route starts containing sensitive data.

---

## 2026-05-07 19:39 PDT - Codex GPT-5

### Decision: Classify hidden visualization routes as visual

**Context:** Some hidden art routes have interactive or reactive behavior, but the operator registry currently needs a practical taxonomy for production surfaces rather than an implementation taxonomy.

**Decision:** Treat every soft-secret visualization route from `decay` onward as `visual`. Keep `interactive` available for command/workflow surfaces such as the public terminal.

**Rationale:** The operator map should answer what a route is used for. The hidden art routes are visual systems, even when they include motion, capture, or reactive logic.
