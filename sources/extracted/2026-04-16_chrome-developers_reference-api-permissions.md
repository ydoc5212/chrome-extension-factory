---
extracts:
  - sources/official/2026-04-16_chrome-developers_reference-api-permissions.md
extracted_at: 2026-04-16
title: "chrome.permissions API reference"
author: Google (Chrome for Developers docs)
url: https://developer.chrome.com/docs/extensions/reference/api/permissions?hl=en
evidence_class: a
topics:
  - permissions
  - activeTab
  - runtime-permissions
  - optional-host-permissions
feeds_docs:
  - docs/03-cws-best-practices.md
  - docs/05-useful-patterns.md
---

# Official — `chrome.permissions` runtime-request API + the non-optional permissions list

## TL;DR

`chrome.permissions.request()` must be called **from inside a user-gesture callback** (click handler, context-menu click, action click). Pair with `optional_permissions` / `optional_host_permissions` in the manifest. Use `"https://*/*"` in `optional_host_permissions` as a wildcard placeholder that lets you request any origin at runtime without declaring each one up front. Nine permissions **cannot** be made optional: `debugger`, `declarativeNetRequest`, `devtools`, `geolocation`, `mdns`, `proxy`, `tts`, `ttsEngine`, `wallpaper`. As of Chrome 133+ there's a new `addHostAccessRequest()` API that lets the extension prompt the user specifically on pages where it can be granted access — a cleaner UX than a blanket request.

## Signal

This is the primary-source spec for the review-speed recipe that the rest of the knowledge base cites. The factory's welcome/onboarding flow (`entrypoints/welcome/`) is already structured around these exact four steps: declare optional, request inside a user gesture, check with `contains()`, optionally remove with `remove()`.

Two specifics worth codifying in playbooks:

**(1) The wildcard-in-optional-host-permissions trick.** `"optional_host_permissions": ["https://*/*"]` is a manifest entry that grants *no* host access at install time but lets the extension call `chrome.permissions.request({ origins: ['https://example.com/'] })` for any origin at runtime. This is the exact pattern to use when your extension needs to support user-provided URLs (saved-page extensions, content extractors) — you don't know the origins at build time, you ask for them one at a time as the user visits them.

**(2) The non-optional permissions list is non-obvious.** Nine permissions can only be declared in `permissions` / `host_permissions`, never `optional_*`. Most are niche (`mdns`, `ttsEngine`, `wallpaper`), but `declarativeNetRequest`, `devtools`, and `proxy` are common in real extensions. If you were hoping to lazy-request `declarativeNetRequest`, you can't — it's required or nothing. Plan the manifest accordingly.

**(3) Chrome 133+ adds `addHostAccessRequest()`.** New API (2025): instead of `permissions.request()` from a user gesture, the extension can call `addHostAccessRequest({ tabId, pattern })` to surface a "wants access to this site" prompt *only* when the tab could actually be granted that access. Cleaner than the all-or-nothing `request()` flow. Worth wiring into the factory's welcome page for users on Chrome 133+.

## Key quotes

> "Use the `chrome.permissions` API to request declared optional permissions at run time rather than install time, so users understand why the permissions are needed and grant only those that are necessary."
> — Chrome for Developers, API overview

> "If you want to request hosts that you only discover at runtime, include `'https://*/*'` in your extension's `optional_host_permissions` field. This lets you specify any origin in `'Permissions.origins'` as long as it has a matching scheme."
> — Chrome for Developers, Step 2

> "Permissions must be requested from inside a user gesture, like a button's click handler."
> — Chrome for Developers, Step 3 code-comment verbatim

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** add an explicit bullet under the Permissions section for the non-optional list: "These permissions cannot be made optional — they're install-time or nothing: `debugger`, `declarativeNetRequest`, `devtools`, `geolocation`, `mdns`, `proxy`, `tts`, `ttsEngine`, `wallpaper`." This preempts the "I thought I could lazy-request it" failure mode.
- **For `docs/05-useful-patterns.md`:** the welcome page's permission-request flow is already documented. Add a note about Chrome 133+ `addHostAccessRequest()` as a progressive-enhancement path when the user's Chrome supports it — detect via feature check, fall back to classic `request()`.
- **For the validator (`scripts/validate-cws.ts`):** add a rule `optional-permissions-non-optional-listed` that flags any manifest where a permission from the non-optional list appears in `optional_permissions` — the manifest will fail silently at install, user never gets prompted, and debugging takes forever.
- **For the template itself:** `entrypoints/welcome/App.tsx` requests `optional_host_permissions` from a user gesture (already the canonical pattern per CLAUDE.md). Document in a comment that the `"https://*/*"` wildcard in `optional_host_permissions` is intentional — reviewers sometimes flag it during submission, and the justification is this official API doc.

## Provenance

- **Raw capture:** [`../official/2026-04-16_chrome-developers_reference-api-permissions.md`](../official/2026-04-16_chrome-developers_reference-api-permissions.md)
- **Original URL:** https://developer.chrome.com/docs/extensions/reference/api/permissions?hl=en
- **Wayback:** https://web.archive.org/web/20260416210439/https://developer.chrome.com/docs/extensions/reference/api/permissions?hl=en
- **Related extracted:** `sources/extracted/2026-04-16_macarthur_posts-chrome-extension-host-permission.md` (practitioner cookbook applying this API), `sources/extracted/2026-04-16_google-group_content-scripts-matches-review.md` (DevRel confirmation that `content_scripts.matches` counts as host permissions — this API is the remedy).
