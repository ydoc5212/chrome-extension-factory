# Mining Queue — start here

**This is the TODO list for the knowledge pipeline.** When you come back to this project and want to grow the `sources/` tree, work the queue top-to-bottom. Each batch is sized to fit in one session.

Discovery artifacts that fed this queue:
- [`_discovery/2026-04-16_forum-ranking.md`](_discovery/2026-04-16_forum-ranking.md) — forums, Q&A, issue trackers
- [`_discovery/2026-04-16_blog-ranking.md`](_discovery/2026-04-16_blog-ranking.md) — community blogs

## How to work this queue

- Each checkbox is one capture. Mark `[x]` when the file lands under `sources/`.
- Capture-method annotations:
  - **(auto)** — `npm run capture:source -- <url> --type=<t>` (plain fetch) Just Works.
  - **(auto --render)** — pass `--render` to launch headless Chromium via Playwright. For JS-rendered venues: Google Groups, Reddit, SO, Substack, Chromium tracker (logged-out views).
  - **(browser-save)** — Cloudflare/WAF/login-walled; save HTML in your browser, then `--from-file=<path>`.
  - **(manual)** — paywall + anti-bot; open in browser and copy-paste into a template from `_templates/`.
- Use `--slug=<custom-slug>` to override the URL-derived filename — useful for replacing a stub in place or when the URL is ugly.
- After each batch: `npm run index:sources` to regenerate `_index/`.
- When the queue empties, run a fresh discovery pass (see "Next discovery passes" at the bottom).

---

## Batch 1 — Load-bearing backfills (do first)

Captures `docs/09-cws-best-practices.md` already depends on. Finishing these unblocks retrofitting inline URLs in `docs/09` to `sources/` references.

- [x] **Backfill Google Group `S1_uqpDFVzY`** — captured 2026-04-16 via `--render`. Signal extracted: content_scripts.matches count as host permissions for review; `activeTab`+`chrome.scripting.executeScript` is the review-friendly alternative. File: `forums/2026-04-16_google-group_content-scripts-matches-review.md`.
- [ ] **Alex MacArthur — "Avoiding a Host Permission Review Delay"** — the single most cross-cited community post on the activeTab pattern. **(auto)**
  URL: https://macarthur.me/posts/chrome-extension-host-permission/

## Batch 2 — Tier-S forum: chromium-extensions Google Group

The hub. Every other venue cross-links here. All **(auto --render)** — Playwright handles the JS rendering.

- [ ] **`k5upFLVnPqE`** — SW keepalive + alarms, Oliver Dunk's canonical answer on registering event listeners at top-level. **(auto --render)**
  URL: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE
- [ ] **`BrwVKyIvCMs`** — review times + deferred publishing, Deco (Chrome team) answer. **(auto --render)**
  URL: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs
- [ ] **`POU6sW-I39M`** — auto-update SW race condition, 80+ posts over 4 years, Chrome team engaged. **(auto --render)** — heavy thread, render may take longer.
  URL: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/POU6sW-I39M
- [ ] **Rejection-code sweep** — for each code below, Google `site:groups.google.com/a/chromium.org/g/chromium-extensions "<code>"` and capture the top 1–2 hits with **(auto --render)**. Codes: Blue Argon, Blue Nickel, Blue Potassium, Purple Lithium, Purple Nickel, Purple Magnesium, Purple Copper, Red Titanium, Red Zinc, Red Nickel, Red Potassium, Red Silicon, Yellow Zinc, Yellow Argon, Yellow Lithium, Yellow Nickel, Yellow Potassium, Grey Titanium.
- [ ] **Oliver Dunk recent responses** — if the Group search supports filtering by poster, capture top 5 recent. Otherwise grep from the first few rejection-code captures for his replies and follow the thread IDs. **(auto --render)**

## Batch 3 — Tier-S blog: Wladimir Palant (Almost Secure)

**Gap in `docs/09`.** Palant is the most credible extension-security researcher on the internet — adblock dev since 2003, actively publishing MV3 circumvention teardowns in 2024–2025. His work inverts the rejection-code story: what extensions *actually* do to bypass policy.

- [ ] **"Chrome Web Store is a mess"** (Jan 2025) — navigate from https://palant.info/ index. **(auto)**
- [ ] **"Malicious extensions circumvent Google's remote code ban"** (2024). **(auto)**
- [ ] **His extension-tag post index** — capture as a reference page to surface follow-up posts.

## Batch 4 — Tier-S blog: Matt Frisbie

Author of the only up-to-date book on browser extensions (2nd ed. Sept 2025). Prompt API + User Scripts + Offscreen coverage.

- [ ] **Frisbie Substack — 3-part malicious extension series.** Capture all three. **(auto --render)** — Substack renders client-side; use `/archive` endpoint if discovery finds individual post URLs are gated.
- [ ] **Frisbie — "Tracking Browser Extension Ownership"** — names an attack vector (acquired-extension auto-update) `docs/09` misses entirely. **(auto --render)**
- [ ] **`buildingbrowserextensions.com`** — if a blog exists at the book's site, capture the extension-specific posts.

## Batch 5 — Tier-S blog: Coditude (Hrishikesh Kale)

Only systematic public mapping of CWS rejection-code *families* (Blue / Purple / Red / Grey / Yellow series) with Dec 2025–Jan 2026 posts. Primary source for the color-code legend in `docs/09`.

- [ ] **All Coditude rejection-code family posts** — capture the series. **(auto — verify on first)**

## Batch 6 — Tier-S blog: Vlas Bashynskyi (bashvlas.com)

Agency owner, 40+ extension posts, strong 2024–2025 cadence.

- [ ] **"MAIN content script is like James Bond"** — directly maps to `content-script-main-world` validator rule in `docs/09`. **(auto)**
- [ ] **"Update without review"** — maps to the re-review trigger rules. **(auto)**
- [ ] **`bashvlas.com/blog` index** — capture as a directory page, triage for 5–10 more priority posts.

## Batch 7 — Tier-A blogs: known cited, promote to captures

Already inline-cited in `docs/09`; elevate to full `sources/blogs/` captures so they survive link rot.

- [ ] **Nearform — "Extension Reviews" guide** — https://nearform.com/digital-community/extension-reviews/ (canonical URL; not the `commerce.nearform.com` duplicate). **(auto)**
- [ ] **Snapfont — "Avoiding Lengthy Review Times"** — https://getsnapfont.com/posts/avoiding-lengthy-review-times-for-chrome-webstore-submissions **(auto)**
- [ ] **Stefan VD — "How to get a Chrome Extension featured"** (2024) — navigate from https://www.stefanvd.net/blog/ index, don't guess the slug (deep URLs 404). **(auto)**
- [ ] **AverageDevs — "Monetize Chrome Extensions 2025"** — 403s on WebFetch, **(manual)** copy-paste.
- [ ] **ExtensionRanker — "How to get featured"** — https://extensionranker.com/growth-faq/how-to-get-featured-in-chrome-web-store **(auto)**

## Batch 8 — Tier-S Q&A: Stack Overflow MV3 tag

Pairs with the Google Group: SO gives runnable code, Group gives the "why."

- [ ] **Top 10 highest-voted answers on `[chrome-extension-manifest-v3]`** — https://stackoverflow.com/questions/tagged/chrome-extension-manifest-v3?tab=Votes **(auto --render)** — or consider the Stack Exchange API for structured metadata (vote counts, accepted flag) — see "Next discovery passes" for the API-integration task.
- [ ] **Top 5 answers on `[google-chrome-extension]` published since 2023.** **(auto --render)**

## Batch 9 — Tier-A: WXT framework (factory-specific)

This repo uses WXT; its Discussions are load-bearing for toolchain decisions. Not for broader CWS knowledge, but for "how does our stack handle Chrome quirks."

- [ ] **WXT Discussions — top 5 substantive threads** — https://github.com/wxt-dev/wxt/discussions — focus on threads where WXT's auto-manifest or entry-point resolution papers over a Chrome quirk. **(auto — GitHub Discussions works with fetch)**
- [ ] **Aaron Klinker's writing** — check https://wxt.dev/blog (if it exists) and any personal site for framework rationale posts. **(auto)**
- [ ] **WXT Discord invite** — confirm whether there's an official Discord. If yes, note the URL here for awareness (not capture — Discord isn't scrapable).

## Batch 10 — Chromium issue tracker (atomic citation unit)

Bug numbers pin knowledge to stable Chrome team identifiers.

- [ ] **#40805401** — referenced from Group + SO. **(auto --render)** first; fall back to **(browser-save)** if logged-in views are needed.
- [ ] **#1271154** **(auto --render)**
- [ ] **#1316588** **(auto --render)**
- [ ] **Ongoing:** when a capture references a bug number, log it here instead of chasing it mid-flow.

---

## Scraping gotchas — consult when hitting resistance

Default strategy: try plain fetch first (fastest), fall back to `--render`, fall back to browser-save.

| Venue | Problem | Workaround |
|---|---|---|
| Google Groups | JS-rendered; fetch returns skeleton | **`--render`** (confirmed working) |
| Stack Overflow | Fetch blocked | **`--render`**, or Stack Exchange API |
| Reddit | Fetch blocked | **`--render`**, or `/r/<sub>/comments/<id>.json` public endpoint (lightweight) |
| Chromium issue tracker | Login wall on list views; direct issue pages sometimes accessible | **`--render`** first; `--from-file` if logged-in views are needed |
| X / Twitter | Login wall; returns 402 to fetch; rate-limits headless too | skip as scraping target; use Mastodon mirror (`@oliverdunk@mastodon.social`) when available |
| averagedevs.com | 403 (Cloudflare) | Cloudflare blocks headless Chrome too — `--render` likely fails; **browser-save or manual** |
| secureannex.com/blog | WAF stub | logged-in browser, `--from-file` |
| extensionpay.com/blog | intermittent 500s | retry fetch or `--render`; fall back to manual |
| stefanvd.net | deep URLs 404 on guessed slugs | always navigate from the blog index first |
| Substack archives | subscribe-gate stub to fetch | **`--render`** (SPA renders fine); try `/archive` endpoint if individual post gates |

**Known non-targets (don't chase):**
- No official Chrome extensions Discord exists. The Google Group IS the chat.
- `r/chromeextensions` (no underscore) is not a real subreddit — use `r/chrome_extensions` with underscore.
- Oliver Dunk's personal blog (`oliverdunk.com`) — only 2 extension posts (Nov 2022). He pivoted to developer.chrome.com/blog and the Google Group.

---

## Next discovery passes (when this queue empties)

- **API integrations for structured metadata:** Stack Exchange API (SO vote counts, accepted flag), Reddit JSON endpoints (thread metadata, comment trees), GitHub REST (WXT issues + discussions via GraphQL). These give us post counts, authors, timestamps as structured data instead of scraped HTML. ~2 hours total.
- **Extension-framework comparative evaluation** — Plasmo, CRXJS, extension.js. Docs + Discussions for toolchain trade-offs beyond WXT-specific knowledge.
- **Big-shop MV2 → MV3 migration writeups** — Grammarly, Honey, LastPass, uBlock engineering blogs. Often have the most concrete MV3 pitfalls at scale.
- **Academic / security-research papers** — USENIX Security, IEEE S&P, CCS. Probably Tier B but one pass to confirm.
- **Google policy-update feeds** — Chrome for Developers blog RSS + Chrome policy blog. Treat as a subscription, not a one-time capture.
- **Oliver Dunk's Mastodon** — policy change announcements often land here before blog posts.
