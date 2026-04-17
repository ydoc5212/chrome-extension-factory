---
extracts:
  - sources/blogs/2026-04-16_macarthur_posts-chrome-extension-host-permission.md
extracted_at: 2026-04-16
title: "Avoiding a Host Permission Review Delay"
author: Alex MacArthur
url: https://macarthur.me/posts/chrome-extension-host-permission/
evidence_class: c
topics:
  - permissions
  - cws-review
  - activeTab
  - content-scripts
  - scripting-api
feeds_docs:
  - docs/09-cws-best-practices.md
---

# MacArthur — Remove `content_scripts`, use `activeTab` + `scripting.executeScript` to dodge the in-depth-review banner

## TL;DR

If the Chrome Web Store upload page shows the **"Due to the Host Permission, your extension may require an in-depth review which will delay publishing"** banner, the cause is often a broad `content_scripts.matches` — even with an empty `host_permissions`. Drop the declarative `content_scripts`, add `"activeTab"` + `"scripting"` to `permissions`, and inject your content script programmatically via `chrome.scripting.executeScript` from inside a user-gesture callback (context menu, action click, etc.). The banner goes away and review time falls off the in-depth queue.

## Signal

This post is the single clearest "before/after" writeup of the review-speed remedy that forum threads and the official `chrome.permissions` docs only describe abstractly. MacArthur shows the exact manifest diff, the exact `background.js` restructure, and — crucially — the exact developer-console banner text, which does **not** appear verbatim on `developer.chrome.com`.

The post also surfaces a subtle second-order gotcha: once you move from declared `content_scripts` to on-demand `scripting.executeScript`, the script runs again on every invocation, re-registering any `runtime.onMessage` listeners and causing duplicate callbacks. MacArthur's fix — track which tabs have already been executed on — is worth knowing, though in MV3 the `globalThis` cache in a service worker only persists for the worker's lifetime (idle-timeout = 30s), so the "already-executed" shortcut can lapse. For longer sessions you'd want `chrome.storage.session` or a re-idempotent content script that short-circuits on duplicate listener registration.

Ties directly to the Simeon Vincent quote extracted from `sources/forums/2026-04-16_google-group_content-scripts-matches-review.md`: DevRel confirms that `content_scripts.matches` is evaluated for review, and this post is the practitioner's cookbook for the same rule.

## Key quotes

> "Due to the Host Permission, your extension may require an in-depth review which will delay publishing"
> — the verbatim developer-console banner MacArthur got when uploading his extension with `"matches": ["<all_urls>"]`. This exact string does not appear on `developer.chrome.com`.

> "I was able to find an alternative approach using Chrome's 'activeTab' and 'scripting' permissions, which would grant access to the page _only when the extension is explicitly invoked._ This way, all the work I needed to do would only ever happen in response to a user's action, and only on the current tab. It's a bit safer, and it'd mean I could bypass that extra review time."
> — Alex MacArthur, explaining the remedy in plain terms

## Implications for the factory

- **For `docs/09-cws-best-practices.md`:** the Permissions section already cites this post; elevate it to call out the literal banner string as a **detection signal** — if you see that banner on upload, trace it to a broad `content_scripts.matches` first, broad `host_permissions` second. Add a separate note that the fix re-runs the content script per invocation, so idempotent listener registration or `chrome.storage.session` guarding is a necessary companion pattern.
- **For `scripts/validate-cws.ts`:** the `content-scripts-matches-breadth` rule (already listed in `docs/09`) should include a diagnostic hint like *"consider removing `content_scripts` entirely and injecting via `chrome.scripting.executeScript` + `activeTab` — see sources/extracted/2026-04-16_macarthur_..."* so when the rule fires, the failure message points at the canonical remedy.
- **For the template itself:** the factory's `entrypoints/background.ts` and `entrypoints/content.ts` already default to a declarative `content_scripts` manifest via WXT. `docs/01-extension-type-profiles.md` should add an "on-demand injection" variant profile — `content_scripts` deleted, `activeTab` + `scripting` added, a user-gesture trigger in the background worker — and document the idempotency companion pattern.

## Provenance

- **Raw capture:** [`../blogs/2026-04-16_macarthur_posts-chrome-extension-host-permission.md`](../blogs/2026-04-16_macarthur_posts-chrome-extension-host-permission.md)
- **Original URL:** https://macarthur.me/posts/chrome-extension-host-permission/
- **Wayback:** https://web.archive.org/web/20260416224023/https://macarthur.me/posts/chrome-extension-host-permission/
- **Related extracted:** (when captured) `sources/extracted/2026-04-16_google-group_content-scripts-matches-review.md` — Simeon Vincent's DevRel confirmation that content-script matches count for review.
