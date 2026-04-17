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
- [x] **Alex MacArthur — "Avoiding a Host Permission Review Delay"** — captured 2026-04-16. File: `blogs/2026-04-16_macarthur_posts-chrome-extension-host-permission.md`.

## Batch 2 — Tier-S forum: chromium-extensions Google Group

The hub. Every other venue cross-links here. All **(auto --render)** — Playwright handles the JS rendering.

- [x] **`k5upFLVnPqE`** — captured 2026-04-16 via `--render`. Title: "MV3, (inactive) service workers, and alarms". File: `forums/2026-04-16_google-group_sw-event-listeners-top-level.md`.
- [x] **`BrwVKyIvCMs`** — captured 2026-04-16 via `--render`. Title: "Extension review time. How to improve it?". File: `forums/2026-04-16_google-group_review-times-deferred-publishing.md`.
- [x] **`POU6sW-I39M`** — captured 2026-04-16 via `--render`. Title: "MV3 service worker broken after auto-update". 86KB rendered (80+ posts). File: `forums/2026-04-16_google-group_auto-update-sw-race-condition.md`.
- [x] **Rejection-code sweep** — captured + extracted 2026-04-17. 8 substantive threads found across Purple Nickel (2), Red Titanium, Red Potassium, Yellow Lithium, Yellow Nickel (2), Yellow Potassium. **Negative finding:** 10 of 16 target codes have zero indexed Group discussion (Blue Nickel, Blue Potassium, Purple Lithium, Purple Magnesium, Purple Copper, Red Zinc, Red Nickel, Red Silicon, Yellow Argon, Grey Titanium) — likely either rarely triggered, recently introduced, or resolved quietly via One Stop Support. Codes with hits tend to be the ambiguous-application ones.
- [x] **Oliver Dunk recent responses** — captured + extracted 2026-04-17. 5 threads: Chrome 144 messaging PSA (Nov 2025), CWS review-timing (Jan 2026, no expedited path exists), MV3 transition resumption PSA (Nov 2023 debut), VirusTotal-clean-≠-CWS-compliant (Apr 2025), MV3→MV2 rollback requires prior MV2 history (Jan 2025).

## Batch 3 — Tier-S blog: Wladimir Palant (Almost Secure)

**Gap in `docs/09`.** Palant is the most credible extension-security researcher on the internet — adblock dev since 2003, actively publishing MV3 circumvention teardowns in 2024–2025. His work inverts the rejection-code story: what extensions *actually* do to bypass policy.

- [x] **"Chrome Web Store is a mess"** (Jan 13 2025) — captured. File: `blogs/2026-04-16_palant_01-13-chrome-web-store-is-a-mess.md`.
- [x] **"Malicious extensions circumvent Google's remote code ban"** (Jan 20 2025) — captured. File: `blogs/2026-04-16_palant_01-20-malicious-extensions-circumvent-googles-remote-code-ba.md`.
- [x] **BONUS: "Analysis of an advanced malicious Chrome extension"** (Feb 3 2025) — captured as part of the same Palant CWS-security series. File: `blogs/2026-04-16_palant_02-03-analysis-of-an-advanced-malicious-chrome-extension.md`.
- [x] **His extension-tag post index** — captured + extracted 2026-04-17 as `blogs/2026-04-17_palant_categories-add-ons.md`. Extraction nominates 5 follow-up candidates: CWS-search-trick post (Jan 2025), BIScience false-pretenses post (Jan 2025), web-accessible-resources attack-surface post (Aug 2022), PDF Toolbox teardown (May 2023, now captured in Batch 6.5), and "how malicious extensions hide running arbitrary code" (Jun 2023).

## Batch 4 — Tier-S blog: Matt Frisbie

Author of the only up-to-date book on browser extensions (2nd ed. Sept 2025). Prompt API + User Scripts + Offscreen coverage.

- [x] **Frisbie Substack — 3-part malicious extension series.** Captured + extracted 2026-04-17. **Finding:** parts 1–3 are teaser announcements pointing to external partner content (Spin.AI guest essay, LayerX webinar, Seraphic Security webinar); substantive content is OFF-substack. The extractions name Cyberhaven, ChromeLoader, PDF Toolbox, Dataspii as breach cases discussed in partner content. **Follow-up discovery targets:** the Spin.AI essay, LayerX webinar, Seraphic webinar, and the named breach writeups.
- [x] **Frisbie — "Tracking Browser Extension Ownership"** — captured + extracted. File: `blogs/2026-04-17_frisbie-substack_tracking-extension-ownership.md`, `extracted/2026-04-17_frisbie-substack_tracking-extension-ownership.md`. Names Under-New-Management tool + WECG API proposal.
- [x] **`buildingbrowserextensions.com`** — checked 2026-04-17. **Negative finding:** no independent blog exists; the "BLOG" nav link redirects to `mattfrisbie.substack.com` (already captured). Documented as extraction-only at `extracted/2026-04-17_buildingbrowserextensions_negative-finding.md`.

## Batch 5 — Tier-S blog: Coditude (Hrishikesh Kale)

Only systematic public mapping of CWS rejection-code *families* (Blue / Purple / Red / Grey / Yellow series) with Dec 2025–Jan 2026 posts. Primary source for the color-code legend in `docs/09`.

- [x] **All Coditude rejection-code family posts** — captured + extracted 2026-04-17 via `--render` (Coditude is SPA, always needs render). 6 raw captures + 6 extractions: overview + blue-series-prohibited-products + blue-argon-mv3 + purple-family-privacy + purple-potassium-permissions + yellow-zinc-metadata. **Negative finding:** no Red-family or Grey/Gray-family posts exist. **Meta-insight from extractions:** most color-family names are informal reviewer classifications, not Google-public labels; Blue Argon is the exception. Now reflected in `docs/09` decoder-table caveat.

## Batch 6 — Tier-S blog: Vlas Bashynskyi (bashvlas.com)

Agency owner, 40+ extension posts, strong 2024–2025 cadence.

- [x] **"MAIN content script is like James Bond"** — captured + extracted 2026-04-17. bashvlas is SSR so plain fetch works. Signal: MAIN world trade-off (page globals + fetch hook vs. chrome.* APIs).
- [x] **"Update without review"** — captured + extracted 2026-04-17. Signal: Google-recommended remote-configuration pattern (data, not code) for adding supported sites without re-review.
- [x] **`bashvlas.com/blog` index** — captured + extracted 2026-04-17. Extraction surfaces 5 high-priority titles as next-pass capture candidates.

## Batch 6.5 — Frisbie follow-up targets

Surfaced from the Batch 4 Frisbie 3-part series extractions — the substantive content lives OFF-substack in partner pieces and named breach writeups.

- [x] **Spin.AI guest essay** — captured + extracted 2026-04-17 as `blogs/2026-04-17_spinai_unpacking-browser-extension-threat-model.md`.
- [x] **LayerX webinar** — captured + extracted 2026-04-17. Recording form-walled; abstract/speakers captured from public landing page. Treated as a pointer source.
- [x] **Seraphic Security webinar** — captured + extracted 2026-04-17. Same pattern as LayerX.
- [x] **Cyberhaven breach writeup** — captured + extracted 2026-04-17 as `blogs/2026-04-17_darktrace_cyberhaven-supply-chain-attack-browser-extensions.md`. **Negative finding:** official Cyberhaven post-mortem URLs (`cyberhaven.com/engineering-blog/*`) are dead; Darktrace analysis used as substitute since it cites the original preliminary analysis directly.
- [x] **ChromeLoader writeup** — captured + extracted 2026-04-17 as `blogs/2026-04-17_redcanary_chromeloader-pushy-malvertiser.md`.
- [x] **PDF Toolbox writeup** — captured + extracted 2026-04-17 as `blogs/2026-04-17_palant_malicious-code-pdf-toolbox-extension.md`.
- [x] **Dataspii writeup** — captured + extracted 2026-04-17 as `blogs/2026-04-17_securitywithsam_dataspii-leak-via-browser-extensions.md` (full 130KB technical report).

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
