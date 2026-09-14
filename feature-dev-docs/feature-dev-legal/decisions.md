# Legal Pages - Decisions Log

Append-only log of architectural decisions.

---

## 2026-09-13 19:20 PDT - Claude Fable 5.1

### Decision: One content file, rendered statically at build time and by the SPA fallback

**Context:** Meta's URL checker and search crawlers do not execute the site's JavaScript, and the brief requires the policy text in the initial HTML response. The site is otherwise a client-rendered SPA. Two hand-maintained copies of a legal text would drift.

**Decision:** The policy lives once in `src/components/Legal/privacy-policy.content.html`. `scripts/legal-pages.js` renders it into a script-free `legal/privacy/index.html` through `HtmlWebpackPlugin` with `inject: false` and no chunks. The React route imports the same file as a string (`asset/source`) for the SPA fallback.

**Rationale:** The static document satisfies "readable without JavaScript" and returns 200 directly from Netlify. The fallback keeps the route working on any host and in client-side navigation. A single source means the two renders cannot disagree.

---

## 2026-09-13 19:20 PDT - Claude Fable 5.1

### Decision: Canonical path `/legal/privacy`, with `/privacy` as a redirect

**Context:** The brief asked for `/legal/privacy` rather than `/privacy`, while Meta's form and people guessing a URL will often try `/privacy`.

**Decision:** The page is built at `/legal/privacy`; `netlify.toml` redirects `/privacy` there with a 301 placed before the SPA catch-all.

**Rationale:** One canonical URL for Meta and search, no dead end for the obvious guess, and room for further `/legal/*` documents from the same generator.

---

## 2026-09-13 19:20 PDT - Claude Fable 5.1

### Decision: Describe practices, never invent facts

**Context:** The owners asked for an accurate policy and explicitly forbade inventing a legal entity, retention periods, certifications or training-policy claims.

**Decision:** Every statement was checked against the functions, components and configuration in the repository (see the Accuracy table in `requirements.md`). Where a fact depends on the owners (AI providers in use, entity name, server-side analytics), the draft states the best-supported version and the requirements file lists it as an open input to confirm before publication.

**Rationale:** A privacy policy is a factual document about the system; the repository is the evidence for the website half, and the owners are the evidence for the advertising half.

---

## 2026-09-13 19:20 PDT - Claude Fable 5.1

### Decision: Reconcile `/terms` by pointing, not duplicating

**Context:** `/terms` claimed "we do not sell or share your personal information", which conflicts with sharing data with Stripe, Netlify, Cloudflare, Google Fonts, Dropbox, Meta and AI providers as described in the policy.

**Decision:** The Privacy section on `/terms` now consists of one sentence and a clearly labeled **Privacy Policy** link. About, Contact and Refund Policy are unchanged.

**Rationale:** Two documents making privacy claims will diverge; the terms page keeps its commerce role and defers privacy to the single policy.
