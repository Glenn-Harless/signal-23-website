# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex) working in this repository. The README covers the stack, routes, commands and configuration.

## Working here

- The code and the README are the source of truth. When you add or change a route, env var, build step or deploy behavior, update the README in the same change.
- Don't add planning docs, task lists, or per-feature requirements/decisions/tests files, and don't use Beads. `feature-dev-docs/` holds older per-feature notes: read them for background, but they may be stale, and new work doesn't need entries there.
- Soft-secret visual routes, `/deaddrop` and `/operator` stay out of public navigation and the terminal's command directory. A new visual route gets an entry in `src/data/transmissions.ts`.
- Use Node 18, matching Netlify. There is no automated test runner: verify with `npx tsc --noEmit` and `npm run build`, and check visual changes in a browser at desktop and phone widths.
- Never commit `.env` or credentials.
