# Chrome Web Store Best Practices

Rules the Chrome Web Store team enforces but doesn't assemble in one place. Some are in official docs, just scattered. Some only surface as banners in the developer console when you upload. Some are community folklore. All of them slow, delay, or reject real submissions.

> **TODO — carve the marble.** This doc started as a quarry block of ~40 rules pulled from `developer.chrome.com`, the chromium-extensions Google Group, and community writeups. Not all of these are equally load-bearing. As the factory ships real extensions, prune the ones that turn out to be noise and promote the ones that keep biting. The validator (`scripts/validate-cws.ts`) is the executable shadow of this document — rules we automate live there; rules that resist automation live here as the checklist.

**Evidence legend:** **(a)** officially documented · **(b)** Chrome DevRel forum/blog · **(c)** widely reported by community · **(d)** informed guess.

---

## Design philosophy — two tiers of checks

The factory takes the same shape Create React App and Vite templates take: **baseline tooling passes on a fresh clone, content customization is a separate gate.** Running `npm run build` on a brand-new CRA project succeeds even though the `<title>` is still `React App` — because "does it build" and "did you finish customizing it" are different questions. Conflating them makes CI meaningless: either it fails forever (annoying, gets muted) or you teach users to suppress it (which defeats the point).

So this repo splits CWS validation into two named tiers:

| Tier | Command | Question it answers | State on a fresh factory |
|---|---|---|---|
| **Structural** | `npm run check:cws` | Is this extension well-formed? | ✓ Passes |
| **Ship** | `npm run check:cws:ship` | Am I ready to submit? | ✗ Fails (by design) |

**Structural** catches regressions you introduce while building: broad `host_permissions`, unused declared permissions, `unsafe-eval` in CSP, `eval()` / remote `<script src>`, `setInterval` keepalives in the service worker, missing icons, over-length name, undeclared `justification` on `chrome.offscreen.createDocument()`, MAIN-world content scripts, broad `web_accessible_resources` matches, etc. Every rule is a code-level concern. **CI runs this tier continuously** (`.github/workflows/ci.yml`). It's always green on the template, and it should stay green as you build.

**Ship** is structural + content readiness: did you replace the factory's placeholder name, did you replace the factory's placeholder description. These are the gates you want to fail every time someone tries to submit an un-customized fork, so we check them explicitly — not by letting structural checks fail and hoping you notice.

When to run which:

- Every commit → `check:cws` (automatic via CI).
- Before running `npm run zip` to build a submission package → `check:cws:ship`.

The ship tier will grow over time (screenshot presence, privacy-policy URL match, etc.). The structural tier stays narrow: only things that are unambiguously wrong code.

---

## The headline finding

The runtime-host-permission pattern — use `optional_host_permissions` and call `chrome.permissions.request()` from a user gesture — is **officially documented but nowhere assembled as a review-speed recipe.** The pieces live in five separate pages:

- [`chrome.permissions` API reference](https://developer.chrome.com/docs/extensions/reference/api/permissions) — documents the mechanics.
- [Permission warning guidelines](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings) — frames it as UX, not review speed.
- [Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) — "Consider implementing optional permissions ... to avoid alarming warnings."
- [Chrome Web Store review process](https://developer.chrome.com/docs/webstore/review-process) — names broad host permissions as a review-slowing signal but does not recommend the remedy.
- [activeTab concept page](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) — positions activeTab as "an alternative for many uses of `<all_urls>`" that "displays no warning message during installation."

The direct statement — *request host permissions at runtime to ship faster* — lives on the chromium-extensions Google Group (Chrome DevRel responses from [Simeon Vincent](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/S1_uqpDFVzY) and [Deco](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs)) and community writeups ([Alex MacArthur](https://macarthur.me/posts/chrome-extension-host-permission/), [Nearform](https://nearform.com/digital-community/extension-reviews/), [Snapfont](https://getsnapfont.com/posts/avoiding-lengthy-review-times-for-chrome-webstore-submissions)). The literal developer-console warning — "Due to the Host Permission, your extension may require an in-depth review which will delay publishing" — is not published on `developer.chrome.com` at all.

So "unwritten" is wrong in letter but right in spirit. Your first submission with `<all_urls>` will tell you.

---

## Permissions & host access

- **(a) Minimum permissions is policy, not style.** Policy text: "Request access to the narrowest permissions necessary ... if multiple permissions could achieve the same goal, you must request those with the least access." Explicit ban on future-proofing: "Don't attempt to 'future proof' your Product by requesting a permission that might benefit services or features that have not yet been implemented." [Source.](https://developer.chrome.com/docs/webstore/program-policies/permissions)

- **(a) Broad host patterns (`*://*/*`, `https://*/*`, `<all_urls>`) trigger in-depth review.** [Source.](https://developer.chrome.com/docs/webstore/review-process) *Validator: `host-permissions-breadth`.*

- **(a+c) Prefer `activeTab` when the extension is user-invoked.** activeTab "displays no warning message during installation" ([official](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)) and community reports it as the single biggest review-time accelerator ([MacArthur](https://macarthur.me/posts/chrome-extension-host-permission/)).

- **(b) Broad content-script `matches` count as "broad host permissions" for review.** Simeon Vincent: "your 'content_scripts' can also affect reviews. Specifically, the 'matches' field." [Source.](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/S1_uqpDFVzY) *Validator: `content-scripts-matches-breadth`.*

- **(a+b) Non-core features belong in `optional_permissions` / `optional_host_permissions` + `chrome.permissions.request()` from a user gesture.** [chrome.permissions](https://developer.chrome.com/docs/extensions/reference/api/permissions) · [Nearform guide](https://nearform.com/digital-community/extension-reviews/). The factory ships a reference welcome/onboarding flow at `entrypoints/welcome/` — see `App.tsx` for the request pattern.

- **(a) Permissions commonly declared but not needed:**
  - `tabs` — only for URL/title/favIconUrl of *other* tabs; not needed for your own popup.
  - `cookies` — only for `chrome.cookies` API, not `document.cookie`.
  - `storage` — only for `chrome.storage`, not `localStorage`/IndexedDB.
  - `activeTab` already grants temporary access after a user gesture without a warning.
  - [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) Sensitive permissions get extra verification time:** `tabs`, `downloads`, `cookies`, `webRequest`. [Source.](https://developer.chrome.com/docs/webstore/review-process) *Validator: `sensitive-permission-declared`.*

- **(a) Every declared permission must be justified** in the dashboard's "Permission justification" field. [Source.](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)

- **(c) Don't ship unused permissions left over from development.** Reviewers grep for the corresponding API and reject the delta. [Source.](https://nearform.com/digital-community/extension-reviews/) *Validator: `unused-permission`.*

## Single-purpose policy

- **(a) Single purpose = one narrow focus area OR one narrow browser function.** Classic rejection: ad-blocker that also shows weather and crypto prices. [FAQ](https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq) · [Troubleshooting](https://developer.chrome.com/docs/webstore/troubleshooting).

- **(a) Side panel content is also subject to single-purpose.** "Make sure that your side panel provides functionality that directly relates to the rest of your extension." [Source.](https://developer.chrome.com/blog/extension-side-panel-launch)

- **(c) "Combining ad injection with other features" is a named violation pattern.** [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(d) If you reuse this factory template, strip unused entry points before submitting.** Reviewers see `sidepanel`, `popup`, `options`, `welcome` in the manifest and ask what each does — even if empty. See `docs/01-extension-type-profiles.md`.

## Manifest V3 code requirements

- **(a) No remotely hosted code. Ever.** Rejection code: **Blue Argon.** Violations: `<script src="https://...">`, `eval()` of a fetched string, dynamic `import()` of a remote URL, any interpreter executing remote commands. Remote *data* is fine only if it contains no logic. [Migration guide](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code) · [MV3 policy](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements). *Validator: `remote-code-patterns`.*

- **(a) CSP for `extension_pages` is locked.** Only `script-src` values allowed: `'self'`, `'wasm-unsafe-eval'`, and (unpacked only) `localhost`/`127.0.0.1`. No `'unsafe-eval'`, no CDN origins, no inline scripts. [Source.](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy) *Validator: `csp-extension-pages`.*

- **(a) Obfuscation is disallowed (Red Titanium).** Base64-encoded logic and character-encoding tricks count. Minification is allowed but slows review. Submit "code as authored." [Source.](https://developer.chrome.com/docs/webstore/review-process)

- **(a) Code size affects review time.** "The more code an extension contains, the more work it takes to verify." [Source.](https://developer.chrome.com/docs/webstore/review-process)

## Service worker lifecycle (MV3 background)

- **(a) 30-second idle timeout; global state does not survive.** Persist via `chrome.storage`, IndexedDB, or CacheStorage. [Source.](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

- **(a) Register every event listener synchronously at top level.** Not inside `addEventListener('install')` or an async callback — the SW respawns and needs listeners attached immediately. [Source.](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) *Validator: `sw-listener-top-level` (best-effort).*

- **(a) `chrome.alarms` minimum period is 30 seconds** (Chrome 120+). [Source.](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

- **(a) Single-request timeout 5 min; `fetch()` must respond within 30 seconds.** [Source.](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

- **(c) Keep-alive hacks (`setInterval` self-ping, reconnecting `chrome.runtime.onConnect` ports) are anti-patterns and can be flagged.** Indefinite SW lifetime is officially only for managed devices. [Source.](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE) *Validator: `sw-keepalive-hack`.*

## Content scripts

- **(a) Use `world: "ISOLATED"` (the default).** `MAIN` shares execution with the host page — host can tamper, `chrome.*` APIs unavailable. [Source.](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts) *Validator: `content-script-main-world`.*

- **(a) `run_at: "document_idle"` is the default and preferred.** Use `document_start` only if injection order genuinely requires it. [Source.](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

- **(a+c) Programmatic injection via `chrome.scripting.executeScript` + `activeTab` is the review-friendliest pattern**, vs. declaring `content_scripts` with broad `matches`. [Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting) · [MacArthur writeup](https://macarthur.me/posts/chrome-extension-host-permission/).

## Offscreen documents

- **(a) `chrome.offscreen.createDocument()` requires a valid `reason` and a well-tailored `justification` string.** Reviewers read justifications. [Source.](https://developer.chrome.com/blog/Offscreen-Documents-in-Manifest-v3) *Validator: `offscreen-missing-justification`.*

- **(a) Offscreen holds peripheral logic only** — DOM parsing, audio, clipboard, geolocation, WebRTC. Primary logic belongs in the service worker. Only the `runtime` API works inside offscreen docs; one per profile. [Source.](https://developer.chrome.com/docs/extensions/reference/api/offscreen)

## Privacy & data handling

- **(a) As of Jan 2025 every submission must complete the "Data usage" tab** — data types collected + Limited Use certification. Both checkbox groups are required. [Source.](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

- **(a) Privacy policy URL is mandatory if you touch any user data.** Public, matches dashboard disclosures, covers collection/use/sharing. Rejection code: **Purple Lithium.** [Source.](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)

- **(a) Limited Use policy forbids ads-personalization, selling data, credit-worthiness determination, and human access without explicit consent/anonymization.** [Source.](https://developer.chrome.com/docs/webstore/program-policies/limited-use)

- **(a) Prominent Data Disclosure (Purple Nickel).** If data collection isn't closely tied to a clearly-described feature, you need affirmative consent at runtime on top of dashboard disclosure. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) HTTPS only for data transmission (Purple Copper).** Don't put user data in URL query strings or headers — they leak into logs. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) Web browsing activity collection is banned except where required for a user-facing feature** (Purple Magnesium). [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

## Listing assets & metadata

- **(a) ≥1 screenshot required; 5 recommended. Target 1280×800 (downscaled to 640×400); fallback 640×400.** No blurry/pixelated uploads. [Images spec](https://developer.chrome.com/docs/webstore/images) · [Best listing](https://developer.chrome.com/docs/webstore/best-listing).

- **(a) Missing/blank icon, title, screenshots, or description → Yellow Zinc rejection.** [Source.](https://developer.chrome.com/docs/webstore/troubleshooting) *Validator: `listing-fields-present`.*

- **(a) Keyword stuffing (Yellow Argon):** "unnatural keyword repetition exceeding five times," long lists of sites/locations in the description. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) No misleading title/description/screenshots.** Content must match actual functionality. Red Nickel/Potassium/Silicon family. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(c) English listing is a prerequisite to nominate for the Featured badge.** [Source.](https://developer.chrome.com/docs/webstore/discovery)

## Updates & re-review triggers

- **(a) Permission additions, manifest changes, and significant code diffs trigger deeper review on update.** A violation caught in an update review can also re-trigger review of the *currently published* version. [Source.](https://developer.chrome.com/docs/webstore/update)

- **(c) Separate manifest/permission updates from listing-only updates.** Bundling a hotfix with a permission change re-triggers full review; listing-only changes have their own path. [Source.](https://getsnapfont.com/posts/avoiding-lengthy-review-times-for-chrome-webstore-submissions)

- **(a) Use deferred publishing** to schedule go-live after review. Announced by Oliver Dunk (Chrome DevRel). [Source.](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs)

## Spam & deceptive behavior

- **(a) Affiliate links (Grey Titanium)** must be disclosed prominently in listing, UI, and before install. Injection of affiliate codes requires a user action per code. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) Redirection-only extensions (Yellow Lithium)** — extensions whose sole function is to launch an app/site/other extension are banned. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) New Tab Page and default search changes must use the Overrides API** (Blue Nickel/Potassium). Can't be done with a content-script hack. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) Spam / review manipulation (Yellow Nickel):** duplicate extensions across accounts, incentivized reviews, disruptive notifications, "sending messages on behalf of the user without giving the user the ability to confirm the content." [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) Deceptive installation flows (Red Zinc):** unclear marketing, misleading CTA buttons, window manipulation to hide metadata at install. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

- **(a) Minimum functionality (Yellow Potassium):** manifest-only submissions, pure link-outs, anything without discernible value. [Source.](https://developer.chrome.com/docs/webstore/troubleshooting)

## Monetization

- **(a) Chrome Web Store Payments shut down Feb 1 2021 — there is no first-party IAP.** Use a third-party (ExtensionPay, Stripe, Paddle, your own license server). [Source.](https://developer.chrome.com/docs/webstore/payments-iap/)

- **(c) Licensing API still exists for checking historical purchases but cannot transact new ones.** [Source.](https://www.averagedevs.com/blog/monetize-chrome-extensions-2025)

- **(d) Subscription flows that open an external webpage and store a license key locally are the common review-safe pattern.** Not officially "preferred" — this is just what ExtensionPay, Paddle, etc. do, and none of it trips remote-code rejections because a license key is data, not logic.

## Featured badge (semi-unwritten criteria)

- **(a) Self-nominate via "My item → I want to nominate my extension."** Once per 6 months. Extension must be public, English-supporting, owned by you. [Source.](https://developer.chrome.com/docs/webstore/discovery)

- **(a) Official criteria: "adherence to Chrome Web Store's best practices guidelines, including providing an enjoyable and intuitive experience, using the latest platform APIs and respecting the privacy of end-users."** [Source.](https://blog.google/products-and-platforms/products/chrome/find-great-extensions-new-chrome-web-store-badges/)

- **(c) Community-reported unwritten criteria:** baseline good ratings, non-trivial install count, responsive issue tracker, polished screenshots, privacy policy actually linked. Pay-to-feature is not a thing. [Stefan VD](https://www.stefanvd.net/blog/2024/04/17/how-to-get-a-chrome-extension-featured/) · [Extension Ranker](https://extensionranker.com/growth-faq/how-to-get-featured-in-chrome-web-store).

## Miscellaneous folklore

- **(c) New developers / new extensions get scrutinized harder.** Your first 1–3 submissions on a new publisher account are effectively always manual review. [Source.](https://developer.chrome.com/docs/webstore/review-process)

- **(c) `web_accessible_resources` should be scoped to specific `matches`, not `<all_urls>`.** Broad WAR makes your extension resources addressable by any site. [Source.](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources) *Validator: `war-matches-breadth`.*

- **(c) Run `web-ext lint` (Mozilla) even for Chrome.** It catches a broader class of manifest issues than Chrome's packager. [Source.](https://nearform.com/digital-community/extension-reviews/)

- **(c) If you're pending review >3 weeks, email developer support** — it's stuck, not queued. [Source.](https://developer.chrome.com/docs/webstore/review-process)

---

## How to use this doc

Day-to-day while building:

- CI runs `npm run check:cws` (structural) on every push. Keep it green.

Before submitting:

1. Run `npm run check:cws:ship` — structural + content readiness. Must pass with zero errors.
2. Walk `docs/templates/cws-submission-checklist.md` — the human checklist.
3. Skim the sections above that apply to your extension's shape: sensitive permissions, user-data handling, browser defaults, offscreen docs, etc.

"Submission-ready" means the ship-mode validator is green. If it's red, you're not done.
