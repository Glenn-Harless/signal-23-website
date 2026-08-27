# Visual Export - Decisions Log

Append-only log of architectural decisions.

---

## 2026-05-07 20:17 PDT - Codex GPT-5

### Decision: Use existing soft-secret routes as export engines

**Context:** Signal-23 already has hidden visual pages that work as standalone route surfaces. The export workflow needs reusable engines without adding public navigation or duplicating visual systems.

**Decision:** Keep each visual at its existing route and add export behavior through metadata and query parameters.

**Rationale:** Existing routes already carry the visual identity and release context. Query-param export mode keeps normal viewing intact, avoids new public route exposure, and gives operators direct links for repeatable capture setups.

---

## 2026-05-07 20:17 PDT - Codex GPT-5

### Decision: Split lightweight registry intent from detailed visual capability metadata

**Context:** The operator registry already has `exportUse` metadata. Export implementation needs more detail than a flat target list, including seeds, duration, aspect support, recording method, controls, and hardware-feed safety.

**Decision:** Preserve `exportUse` as the summary field and add a future `visualExport` capability object for visual transmissions.

**Rationale:** The registry index can stay scannable while detail pages and route validation use richer capability data. This avoids overloading the existing field and keeps future operator UI predictable.

---

## 2026-05-07 20:17 PDT - Codex GPT-5

### Decision: Treat browser capture as the v1 output source

**Context:** Export targets need usable source material, but a full transcoding or upload pipeline would add infrastructure before the route contract is proven.

**Decision:** v1 export produces browser-rendered source output suitable for manual or local recording. Final MP4/WebM/PNG/WebP delivery can be created downstream.

**Rationale:** Browser capture is enough to validate aspect ratio, seed, duration, framing, and hardware-feed behavior. Transcoding and social upload automation can follow once the visual route contract is stable.

---

## 2026-05-07 20:46 PDT - Codex GPT-5

### Decision: Constrain v1 metadata to browser-source export behavior

**Context:** The v1 decision treats browser-rendered output as the source and leaves capture/transcoding outside the app. Detailed recording methods, output formats, fixed control flags, custom aspect ratios, and future targets would imply implementation commitments that v1 does not make.

**Decision:** Use a smaller `VisualExportCapability` shape with supported targets, default target, seed support, duration support, fixed named aspect ratios, `capture`, hardware-feed safety, and operator notes.

**Rationale:** The schema should describe the behavior v1 can validate. In-page recording transports, final delivery formats, control metadata, custom ratios, and future target IDs can be added when the feature that needs them lands.

---

## 2026-05-07 20:46 PDT - Codex GPT-5

### Decision: Use `target` as the export-mode switch

**Context:** The earlier URL contract used both `mode=export` and `target=...`, which created two sources of truth for the same state.

**Decision:** The presence of `target` means export mode. No `target` means normal mode.

**Rationale:** A single signal avoids drift and keeps direct operator URLs shorter and easier to reason about.

---

## 2026-05-07 20:46 PDT - Codex GPT-5

### Decision: Defer metadata provenance and registry duplication rules

**Context:** `visualExport` metadata will duplicate some information from `exportUse`, and its lifecycle may need provenance separate from the parent `Transmission`. Route-specific hardware-feed safety also requires audit rather than assumption.

**Decision:** Defer three questions until visual export metadata is implemented: whether `visualExport` needs its own `addedAt`, whether `exportUse` is derived from `visualExport.supportedTargets` or treated as a denormalized cache, and which routes are genuinely hardware-feed safe after interaction audits.

**Rationale:** These questions matter at implementation time, but answering them before metadata exists would harden assumptions without evidence from the route audits.

---

## 2026-05-07 20:46 PDT - Codex GPT-5

### Decision: Keep route scope canonical in the feature spec

**Context:** Visual route lists will drift if repeated across requirements, decisions, tests, and implementation notes.

**Decision:** Keep the canonical v1 visual route list only in `feature-spec.md` under Route Scope. Other visual export docs should reference that section instead of re-enumerating the routes.

**Rationale:** A single route-scope list makes future route additions easier to review and keeps the living docs from disagreeing about which hidden visual routes are included.

---

## 2026-05-07 21:30 PDT - Codex GPT-5

### Decision: Prove visual export on `/decay` before fanning out

**Context:** The visual route family has varied internals, aspect behavior, randomness, and interaction requirements. Applying metadata and framing to every route before validating the contract would create broad churn and likely harden incorrect assumptions.

**Decision:** Ship v1 as a `/decay` pilot with shared export settings parsing, aspect framing, runtime capability validation, `/decay` metadata, and `/decay` container-based Three.js sizing. Defer other visual routes and operator UI changes.

**Rationale:** `/decay` already has complete export target intent and is a useful Canvas/Reel/hardware-feed candidate. A single-route pilot proves the contract while keeping later route work small and audit-driven.

---

## 2026-05-07 21:46 PDT - Codex GPT-5

### Decision: Fit Decay camera distance to export aspect ratio

**Context:** The first `/decay?target=canvas` export frame correctly created a 9:16 viewport, but the Three.js camera kept its original full-viewport distance. A narrower frame reduces horizontal field of view and cropped the shell edges.

**Decision:** In export mode, Decay computes camera base distance from the mount container aspect ratio and a padded shell radius. Normal `/decay` mode keeps the original camera distance.

**Rationale:** Export framing should preserve the visual subject inside the requested aspect ratio. Camera fitting keeps the route visually usable across canvas, square, vertical, and widescreen exports without changing the normal page.

---

## 2026-05-07 21:52 PDT - Codex GPT-5

### Decision: Apply Decay camera fitting to narrow normal viewports

**Context:** `/decay?target=canvas` was fixed, but plain `/decay` in a narrow mobile viewport such as iPhone SE still used the original desktop camera distance and could crop the shell.

**Decision:** Decay now uses the fitted camera distance when the mount aspect ratio is portrait/narrow, even outside export mode. Landscape and desktop normal `/decay` keep the original camera distance.

**Rationale:** Mobile previews and direct soft-secret route visits should preserve the core visual subject. Applying the same aspect-aware camera math to narrow normal viewports fixes mobile cropping without changing desktop composition.

---

## 2026-05-07 22:06 PDT - Codex GPT-5

### Decision: Use Reclamation as the second visual export pilot

**Context:** `/decay` proved the shared export parser, aspect frame, metadata validation, and container-based renderer sizing on one Three.js route. The next route needed to exercise different behavior without broadening scope to every visual page.

**Decision:** Wire `/reclamation` as the second pilot with its own `visualExport` metadata, shared export settings parsing, `ExportFrame` framing, mount-container renderer sizing, and a wider camera orbit for narrow aspect ratios. Keep hardware-feed support out of its capability metadata for now.

**Rationale:** Reclamation has a different composition and route-level overlays, including a click-toggled HUD and development recording button. Wiring it next validates that export mode can keep the captured viewport clean while preserving normal route behavior.

---

## 2026-05-08 08:14 PDT - Codex GPT-5

### Decision: Complete v1 as a full visual route fan-out

**Context:** `/decay` and `/reclamation` proved the shared export parser, aspect frame, route metadata, and clean viewport behavior. The remaining visual routes needed the same route contract and operator discoverability to make the registry useful as a production console.

**Decision:** Wire every visual route in the canonical route scope with `visualExport` metadata, `ExportFrame` export mode, mount-container renderer sizing, hidden export-mode controls/overlays, and operator UI surfacing. Keep all routes seed-unsupported. Mark `/broadcast` and `/reclamation` as not hardware-feed-safe; mark the remaining visual routes as hardware-feed-safe after route audit.

**Rationale:** Completing the fan-out makes visual export a consistent platform capability instead of a pilot-only path. Keeping seed support deferred avoids fake determinism, while explicit hardware-feed safety values make operator launch decisions honest.

---

## 2026-08-27 09:17 PDT - Codex GPT-5

### Decision: Expand the canonical visual-export scope to 22 routes

**Context:** Six registry-backed visuals were added after the original 16-route v1 fan-out: Streamfront, Rivulet, Mycelium, Mountain, Cloudform, and Torchrite. Each already implements the shared export contract and exposes complete capability metadata.

**Decision:** Add the six routes to the canonical scope in `feature-spec.md`, bringing visual export to 22 routes. All six support `canvas`, `reel`, `hardware-feed`, `still`, and `loop`, remain explicitly seed-unsupported, and are classified as hardware-feed-safe.

**Rationale:** The living documentation should follow the implemented registry rather than freeze the launch-day route count. Keeping the current soft-secret visuals inside the same contract preserves consistent operator launch links, capture behavior, and Deaddrop discovery.
