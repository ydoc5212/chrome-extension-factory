# Chrome Extension Factory

## Design philosophy (read this first)

**Lean on scripts, not on model recall.** This repo encodes its rules as tests that pass or fail. When in doubt, run the script.

The canonical design doc is [**ARCHITECTURE.md**](ARCHITECTURE.md) — division of labor between deterministic code and model, the plugin-with-sub-skills architecture, how to extend with new rules/skills/gates, planned work. Read it before adding a feature.

### The automation surface — these are the gates

| Command | When it runs | What it enforces | Factory state |
|---|---|---|---|
| `npm run compile` | manual, CI | TypeScript correctness | ✓ green |
| `npm run check:cws` | every push to CI | well-formed extension structure (13 rules) | ✓ green |
| `npm run check:cws:ship` | manual | structural + listing/welcome/screenshots/video content filled in (18 rules; `listing-drift` opt-in on CWS secrets) | ✗ red (by design) |
| `npm run zip` | manual, to package for CWS upload | **gated on `check:cws:ship`** — no zip is produced until ship checks pass | ✗ refuses to run (by design) |

The user can't accidentally ship an un-customized fork: `npm run zip` is the only path to a submittable artifact, and it refuses until ship mode is green. The user never needs to know to "remember to run the validator" — it's wired into the only command that matters.

### Quick rules when working in this repo

- **Adding code that touches permissions, CSP, offscreen documents, content scripts, service-worker patterns?** Write the code, run `npm run check:cws`. Don't try to recall CWS rules from prose.
- **User asks "is this ready to submit?"** Run `npm run check:cws:ship`. Green = yes. Red = the output says what to fix.
- **Adding a new class of rule that should be auto-enforced?** Add it to `scripts/validate-cws.ts` (see ARCHITECTURE.md → "How to extend"). Prose-only rules only get enforced by vibes.
- **Scripts handle pattern/presence/policy; the model handles judgment/synthesis/conversation.** See ARCHITECTURE.md → "Division of labor" for the full table.
- **Rule ids are public API.** Skills key off them. Renames break downstream consumers.

## What this is
A factory for building Chrome extensions at high velocity. Ships every common extension piece (content script, background worker, popup, options, side panel, welcome) so you strip what you don't need per-project.

## Tech stack
- **WXT** — Chrome extension framework with file-based routing and auto-manifest
- **React 19** — popup, options, and side panel UIs
- **Tailwind CSS v4** — styling for React UIs
- **TypeScript** — strict mode throughout
- **@webext-core/messaging** — typed cross-context messaging
- **@wxt-dev/auto-icons** — generates all icon sizes from `assets/icon.svg`

## Project structure
- `entrypoints/` — all extension entry points (file name → manifest entry, auto-generated)
- `utils/` — shared utilities (auto-imported by WXT)
- `components/` — shared React components (auto-imported by WXT)
- `assets/` — icons, shared CSS
- `scripts/` — build-time tooling (secret injection, store zip)
- `docs/` — playbook documentation and templates

## Commands
- `npm run dev` — start WXT dev server (opens fresh Chrome with extension loaded)
- `npm run build` — production build to `.output/chrome-mv3/`
- `npm run zip` — build + package for Chrome Web Store upload
- `npm run compile` — TypeScript type check (no emit)
- `npm run check:cws` — structural CWS validator (in CI; factory passes by design)
- `npm run check:cws:ship` — structural + submission-readiness (factory fails by design until listing fields are filled in)
- `npm run dev:firefox` — dev server targeting Firefox
- `npm run build:firefox` — production build for Firefox

## Key files
- `wxt.config.ts` — WXT + manifest configuration
- `utils/dom.ts` — shadow DOM traversal (queryAllDeep, closestComposed, ensureScopedStyles)
- `utils/observer.ts` — MutationObserver with suppression pattern
- `utils/messaging.ts` — typed message protocol (add message types to ProtocolMap)
- `assets/styles/shared.css` — CSS custom properties for content script theming
- `scripts/inject-secrets.ts` — build-time secret replacement
- `scripts/validate-cws.ts` — Chrome Web Store best-practice validator (rules documented in `docs/03-cws-best-practices.md`)
- `entrypoints/welcome/` — post-install welcome page that requests `optional_host_permissions` at runtime (the pattern that avoids the CWS "in-depth review" banner)

## Extension type profiles
Strip down by deleting entry points you don't need:
- **Content-script-only**: delete `popup/`, `options/`, `sidepanel/`
- **Popup-based**: delete `content.ts`, `sidepanel/`
- **Sidepanel**: delete `popup/`, `content.ts`
- **Full hybrid**: keep everything (default)

See `docs/01-extension-type-profiles.md` for detailed checklists.

## Conventions
- Content scripts use vanilla TS (no React) — keep host page overhead minimal
- Popup/options/sidepanel/welcome use React + Tailwind
- Secrets use `__PLACEHOLDER__` pattern replaced at build time via `scripts/inject-secrets.ts`
- Never commit `.secrets.local.json`
- Use `docs/templates/` for CWS submission materials
- Host access goes in `optional_host_permissions` and is requested at runtime from a user gesture (see `entrypoints/welcome/App.tsx`). Don't add broad patterns to `host_permissions` or `content_scripts.matches` — the validator will catch it anyway.
