# Chrome Extension Factory

Ship Chrome extensions fast. [WXT](https://wxt.dev) + React 19 + Tailwind v4 + TypeScript.

## Quick Start

```bash
git clone <this-repo> my-extension
cd my-extension
npm install
npm run dev   # opens Chrome with extension loaded
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
   5. SCREENSHOTS    /app-store-screenshots skill → marketing/
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
| `npm run capture:source` | Capture a URL into `sources/` with provenance |
| `npm run index:sources` | Regenerate `sources/_index/*` from capture frontmatter |
| `npm run dev:firefox` | Dev server for Firefox |

## Keepalive Publish

Scheduled GitHub Action bumps the patch version and re-publishes every 4 months so your Chrome Web Store listing doesn't get flagged as stale. Opt-in: add 4 CWS API secrets to your repo and the workflow activates itself. See [docs/08-keepalive-publish.md](docs/08-keepalive-publish.md).

## Knowledge Pipeline

The factory ships three layers: **scaffolding** (the extension template), **distilled playbooks** (`docs/`), and **raw sources** (`sources/`). `sources/` holds primary evidence — captured Chrome docs pages, DevRel forum threads, community writeups — with frontmatter that records URL + retrieval date + Wayback snapshot so the knowledge survives link rot. That's what makes `docs/09-cws-best-practices.md` more than a random checklist: every claim can be traced back to something you can re-read.

Capture a new source: `npm run capture:source -- <url> --type=official|forum|blog`. See [sources/README.md](sources/README.md) for the full pipeline.

## Docs

- [**Architecture**](ARCHITECTURE.md) — design philosophy, division of labor (scripts vs. skills), how to extend
- [**Roadmap**](ROADMAP.md) — planned implementation sessions for CWS API integration, skills, screenshots
- [Getting Started](docs/00-getting-started.md)
- [Extension Type Profiles](docs/01-extension-type-profiles.md)
- [Development Workflow](docs/02-development-workflow.md)
- [Chrome Web Store Submission](docs/03-chrome-web-store-submission.md)
- [Staleness Prevention](docs/04-staleness-prevention.md)
- [Launch Materials](docs/05-launch-materials.md) — screenshots via `/app-store-screenshots`
- [Security](docs/06-security.md)
- [Useful Patterns](docs/07-useful-patterns.md)
- [Keepalive Publish](docs/08-keepalive-publish.md)
- [CWS Best Practices](docs/09-cws-best-practices.md) — rules the Chrome Web Store enforces but doesn't assemble in one place
- [Welcome / Onboarding](docs/10-onboarding.md) — the post-install welcome page pattern, when to keep, when to delete
- Templates: [Privacy Policy](docs/templates/privacy-policy.md) · [Store Listing](docs/templates/store-listing.md) · [QA Checklist](docs/templates/qa-checklist.md)
- [Sources](sources/README.md) — raw captures (official docs, forums, blogs) with provenance; the evidence layer behind the playbooks
