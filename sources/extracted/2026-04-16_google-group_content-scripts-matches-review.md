---
extracts:
  - sources/forums/2026-04-16_google-group_content-scripts-matches-review.md
extracted_at: 2026-04-16
title: "Content-script `matches` count as broad host permissions for CWS review"
author: Simeon Vincent (Chrome DevRel) + Richard Bernstein (OP)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/S1_uqpDFVzY
evidence_class: b
topics:
  - permissions
  - cws-review
  - content-scripts
  - activeTab
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Simeon Vincent — `content_scripts.matches` is evaluated for review breadth, independently of `host_permissions`

## TL;DR

The "Publishing will be delayed — Broad host permissions" banner you see on upload can fire on an extension with a completely empty `permissions` array, if `content_scripts.matches` is broad. Chrome DevRel confirms `matches` is the review signal; the remedy is to drop declarative content scripts and inject programmatically from a user-gesture callback using `activeTab` + `chrome.scripting.executeScript` (no `tabs` permission required).

## Signal

OP Richard Bernstein hit the developer-console banner *"Instead of requesting broad host permissions or content script site matches, consider specifying the sites that your extension needs access to, or use the activeTab permission"* on an extension whose only broad-looking manifest entries were three specific URL patterns on his own domain. He iteratively stripped every `permissions` entry down to `[]` — the banner still fired. He finally discovered that `content_scripts.matches` was the culprit and confirmed Simeon Vincent's opening hypothesis. That diagnostic journey is the thread's value: the signal the CWS upload page gives you is "broad host permissions" but the code site it actually measures can be elsewhere in the manifest.

Simeon's first reply codifies the rule: DevRel reads `matches` the same way it reads `host_permissions`. His second post gives the remedy — inject content scripts from a user-action callback (`activeTab` or `contextMenus`) via `chrome.tabs.executeScript` (now `chrome.scripting.executeScript` in MV3), noting that this pattern does **not** require the `tabs` permission. This is the exact recipe MacArthur later writes up as a cookbook post (see `sources/extracted/2026-04-16_macarthur_posts-chrome-extension-host-permission.md`).

A secondary thread gem: Daniel Glazman pushes back that the `tabs` permission warning is overblown given that a broad-matches content script can achieve the same data exfiltration by messaging the document URL back to the background. Simeon concedes the phrasing was misleading and agrees content-script injection is the actual review driver, not `tabs`. That concession is useful DevRel-on-record evidence that the review heuristic is "how much of the web can this extension touch," regardless of which manifest key grants it.

## Key quotes

> "your 'content_scripts' can also affect reviews. Specifically, the 'matches' field for a content script."
> — Simeon Vincent (Chrome Developer Advocate), Jan 27 2019

> "If your extension is invoked by a user action (e.g. the 'activeTab' or 'contextMenus' permissions) then you can inject your content script in the appropriate callback function via 'chrome.tabs.executeScript'. Note that you do not need the 'tabs' permission to use this API."
> — Simeon Vincent, Jan 27 2019

> "It's not more dangerous and I didn't mean to give that impression. I was attempting to describe why 'tabs' *might* trigger that warning. Regardless, as Richard found, the warning wasn't being triggered by tabs but rather content script injection."
> — Simeon Vincent, Mar 25 2019 (clarifying the heuristic)

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** the `content-scripts-matches-breadth` rule is already cited; add the OP's diagnostic narrative as a footnote — "if the banner fires and your `permissions` is empty, check `content_scripts.matches` before filing a support ticket." Also note Simeon's Mar 25 clarification: the `tabs` permission is *less* of a review driver than broad `matches`, contrary to what the early Feb reply implied. The review heuristic is web-surface breadth across *any* manifest key.
- **For the validator (`scripts/validate-cws.ts`):** the `content-scripts-matches-breadth` rule should list the same broad patterns used in `host-permissions-breadth` (`*://*/*`, `https://*/*`, `<all_urls>`, and near-equivalents like `http://*/*`) and emit identical review-time wording so a developer who fixes one rule doesn't assume the other is independent. Suggested fix hint: "drop declarative `content_scripts`, inject via `chrome.scripting.executeScript` from a `chrome.action.onClicked` or `chrome.contextMenus.onClicked` handler with `activeTab`."
- **For the template itself:** `entrypoints/content.ts` defaults to a declarative content script with `matches: ["<all_urls>"]` via WXT. Ship a second profile (referenced in `docs/01-extension-type-profiles.md`) where `content.ts` is deleted and `entrypoints/background.ts` gains an `chrome.action.onClicked` handler that calls `chrome.scripting.executeScript`. That variant should be the default for user-invoked extensions.

## Provenance

- **Raw capture:** [`../forums/2026-04-16_google-group_content-scripts-matches-review.md`](../forums/2026-04-16_google-group_content-scripts-matches-review.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/S1_uqpDFVzY
- **Wayback:** https://web.archive.org/web/20260416222408/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/S1_uqpDFVzY
- **Related extracted:** `sources/extracted/2026-04-16_macarthur_posts-chrome-extension-host-permission.md` — MacArthur's cookbook remedy for the same rule.
