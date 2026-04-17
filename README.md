# Chrome Extension Factory

*Package: `create-chrome-extension` — scaffold a new extension with one command.*

Ship Chrome extensions fast. [WXT](https://wxt.dev) + React 19 + Tailwind v4 + TypeScript.

> **First time here?** Run `npx create-chrome-extension my-thing` (or clone + `/cce-init`). The skill walks you through a pitch-driven interview and scaffolds tailored code — see [ARCHITECTURE.md](ARCHITECTURE.md) for the design philosophy.

## Quick Start

```bash
npx create-chrome-extension my-extension
cd my-extension
# Open in Claude Code, run /cce-init
```

Or install the skill directly into Claude Code and let it clone:

```bash
npx skills add <your-org>/cce-factory
# Then in Claude Code: /cce-init
```

Or clone manually:

```bash
git clone <this-repo> my-extension
cd my-extension
npm install
npm run dev
```

## Architecture

A Chrome extension is a small distributed system: separate surfaces that can't share variables and only talk via typed messages.

```
┌───────────────────────────── CHROME BROWSER ──────────────────────────────┐
│                                                                            │
│   ┌──────────────┐     ┌────────────────┐     ┌───────────────────────┐  │
│   │  POPUP       │     │  OPTIONS PAGE  │     │  SIDE PANEL           │  │
│   │  (React+TW)  │     │  (React+TW)    │     │  (React+TW)           │  │
│   └──────┬───────┘     └────────┬───────┘     └───────────┬───────────┘  │
│          │                      │  typed messages         │              │
│          └──────────────────────┼─────────────────────────┘              │
│                                 ▼                                         │
│                        ┌────────────────────┐                             │
│                        │  BACKGROUND WORKER │  ←── alarms, storage,      │
│                        │  (service worker)  │      network, "the brain"  │
│                        └─────────┬──────────┘                             │
│                                  │ messages                               │
│                                  ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │  ACTIVE WEB PAGE                                                │    │
│   │   ┌─────────────────┐         ┌──────────────────┐             │    │
│   │   │ Page DOM        │  ◄────  │ CONTENT SCRIPT   │             │    │
│   │   │ + Shadow DOMs   │         │ (vanilla TS)     │             │    │
│   │   └─────────────────┘         └──────────────────┘             │    │
│   └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```

Messaging is typed via `utils/messaging.ts` — TypeScript catches mismatched payloads at compile time.

## The Factory Idea

Start with everything; **delete what you don't need.**

```
   ┌──────────────┐    delete what     ┌──────────────┐
   │ Full hybrid  │ ─── you don't ───► │ Lean         │
   │ (everything) │     need           │ extension    │
   └──────────────┘                    └──────────────┘
```

Profiles: content-script-only, popup-based, side-panel app, full hybrid. See [docs/01-extension-type-profiles.md](docs/01-extension-type-profiles.md).

## Lifecycle

```
   1. CLONE          git clone <this-repo> my-extension
        ▼
   2. STRIP          delete entrypoints you don't need
        ▼
   3. DEV            npm run dev    → opens Chrome, HMR
        ▼
   4. BUILD          npm run build  → .output/chrome-mv3/
        ▼
   5. SCREENSHOTS    /cws-screens skill → screenshots/ → npm run screenshots
        ▼
   6. ZIP            npm run zip    → uploadable .zip
        ▼
   7. SUBMIT         upload to Chrome Web Store
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR (opens Chrome) |
| `npm run build` | Production build to `.output/chrome-mv3/` |
| `npm run zip` | Build + zip for CWS upload |
| `npm run compile` | TypeScript type check |
| `npm run check:cws` | CWS structural check (runs in CI) |
| `npm run check:cws:ship` | CWS submission-readiness gate (run before `zip`) |
| `npm run version-sync` | Compare local version to live CWS version (no-ops without CWS secrets) |
| `npm run ship` | End-to-end publish: `check:cws:ship` → `version-sync` → `wxt zip` → upload & poll (no-ops at publish step without secrets) |
| `npm run screenshots` | Render 1280×800 CWS screenshots from `screenshots/config.ts` |
| `npm run dev:firefox` | Dev server for Firefox |

## Keepalive Publish

Scheduled GitHub Action bumps the patch version and re-publishes every 4 months so your Chrome Web Store listing doesn't get flagged as stale. Opt-in: add 4 CWS API secrets to your repo and the workflow activates itself. See [docs/06-keepalive-publish.md](docs/06-keepalive-publish.md).

**Knowledge sources:** `sources/` holds frozen citations behind doc claims. New CWS knowledge enters via validator rules + skill recipes — see `ARCHITECTURE.md`.

## Docs

- [**Architecture**](ARCHITECTURE.md) — design philosophy, division of labor (scripts vs. skills), how to extend
- [**Roadmap**](ROADMAP.md) — planned implementation sessions for CWS API integration, skills, screenshots
- [Getting Started](docs/00-getting-started.md)
- [Extension Type Profiles](docs/01-extension-type-profiles.md)
- [Development Workflow](docs/02-development-workflow.md)
- [CWS Best Practices](docs/03-cws-best-practices.md) — rules the Chrome Web Store enforces but doesn't assemble in one place; includes submission mechanics
- [Security](docs/04-security.md)
- [Useful Patterns](docs/05-useful-patterns.md) — utilities, messaging, welcome page pattern
- [Keepalive Publish](docs/06-keepalive-publish.md)
- Templates: [Privacy Policy](docs/templates/privacy-policy.md) · [Store Listing](docs/templates/store-listing.md) · [QA Checklist](docs/templates/qa-checklist.md)
- [Sources](sources/README.md) — frozen citation footnotes behind the playbooks
