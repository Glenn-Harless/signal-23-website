# Deaddrop - Decisions Log

Append-only log of architectural decisions.

---

## 2026-08-27 09:17 PDT - Codex GPT-5

### Decision: Derive the hidden visual catalog from the operator registry

**Context:** Deaddrop must remain current as the visual collection grows. Maintaining a second route/card array would duplicate titles, dates, releases, tags, and lifecycle state already present in `src/data/transmissions.ts`.

**Decision:** Build the catalog from registry entries classified as soft-secret visuals. Use registry metadata for eligibility, links, chronological order, card labels, and search; expose status instead of using it as an additional eligibility filter.

**Rationale:** One source of truth keeps Deaddrop aligned with the operator console and visual-export system and makes a new visual route appear without a separate catalog edit.

---

## 2026-08-27 09:17 PDT - Codex GPT-5

### Decision: Feature the newest intercept only in the unfiltered view

**Context:** The index needs a stronger sense of recency without hiding older work or duplicating the newest transmission when the visitor searches.

**Decision:** Sort eligible transmissions newest-first. With an empty query, render the newest as a full-width `LATEST INTERCEPT` and the rest under `ARCHIVE`. With a non-empty query, hide the feature and render every match, including the latest, exactly once in the grid.

**Rationale:** The default view gains editorial hierarchy while search remains a predictable, complete result set.

---

## 2026-08-27 09:17 PDT - Codex GPT-5

### Decision: Fail thumbnails visibly and keep metadata independent of hover

**Context:** Three visual routes lacked thumbnails, and the previous error handler hid failed images, leaving blank media areas. Hover-only route metadata also does not translate to touch devices or reduced-motion users.

**Decision:** Add real 640×360 captures for Mycelium, Mountain, and Cloudform; show an explicit fallback for any future image failure; keep essential metadata visible on mobile; and honor reduced-motion preferences.

**Rationale:** The index should remain legible and navigable when an asset is absent, on touch screens, and for visitors who disable motion. A thumbnail is presentation, not the card's identity or navigation affordance.
