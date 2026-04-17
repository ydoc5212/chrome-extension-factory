---
extracts:
  - sources/blogs/2026-04-17_coditude_purple-potassium-permissions.md
extracted_at: 2026-04-17
title: "Purple Potassium: excessive or unused permissions"
author: Hrishikesh Kale (Coditude)
url: https://www.coditude.com/insights/purple-potassium-how-to-correct-permission-abuse-in-chrome-extensions/
evidence_class: c
topics:
  - cws-review
  - rejection-codes
  - permissions
  - least-privilege
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Coditude — Purple Potassium means your manifest asks for more than your code uses; audit, narrow, and prefer optional permissions

## TL;DR

**Purple Potassium** rejections flag permissions that are excessive, unused, or unnecessary in `manifest.json` — the reviewer applied least-privilege and the manifest failed. Common culprits: `<all_urls>` when one or two hosts suffice; declared `tabs`/`bookmarks`/`cookies` that the code never actually calls; old permissions carried over from removed features; copy-pasted boilerplate from prior projects. The fix: audit every permission against actual code usage, narrow host patterns to specific URLs, convert non-core needs to optional permissions via `chrome.permissions.request()`, and justify sensitive permissions (history, downloads, storage) in Developer Dashboard notes or the privacy policy.

## Signal

Coditude's framing: permissions are the reviewer's primary threat-surface signal, and Chrome applies least-privilege to **both** declared permissions in `manifest.json` **and** runtime requests via `chrome.permissions.request()`. So even dynamic permission requests get the same scrutiny.

The enumerated causes are worth memorizing because they map directly to validator rules:
1. `<all_urls>` when a specific host pattern would work
2. `tabs`, `bookmarks`, `cookies` declared but never called in code
3. Permissions lingering after a feature was removed
4. Sensitive permissions (history, downloads) requested without reviewer-visible justification
5. Boilerplate permission sets copied from older projects

Two particularly load-bearing notes Coditude buries in asides:
- **Commented-out code still counts as "requested."** If you comment out a `chrome.history` call but leave `"history"` in the manifest, Chrome checks the manifest, not your code comments. The audit must be manifest-driven.
- **Privacy policy becomes mandatory** the moment any permission grants access to user data (history, cookies, downloads). This is the hinge between Purple Potassium and the broader Purple family — permission breadth drags privacy policy requirements in with it.

The remedy toolbox is narrow and specific: swap `<all_urls>` for specific hosts, convert non-essentials to `optional_permissions`, call `chrome.permissions.request()` at point-of-need and `chrome.permissions.remove()` when done, test normal and incognito windows after the cleanup to confirm nothing broke.

## Key quotes

> "The Chrome Review process uses the principle of least privilege it applies both to declared permissions in `manifest.json` and runtime requests via `chrome.permissions.request()`, so your extension should only request what is needed to function."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Permissions declared but only commented out in the code still count as requested — Chrome checks the manifest, not code comments."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Privacy policies are mandatory if any permission grants access to user data (like history, cookies, or downloads)."
> — Hrishikesh Kale, Coditude, 2026-04-17

## Implications for the factory

- **For `docs/03-cws-best-practices.md` → "Permissions & host access" section:** add Purple Potassium as the rejection label for this family. Fold in the two underappreciated rules (commented-out code still counts; user-data permissions force a privacy policy). The MacArthur extraction already covers `<all_urls>` → `activeTab + scripting` — cross-link from the Purple Potassium discussion to that specific remedy.
- **For `scripts/validate-cws.ts`:** this is the single best-aligned rejection family for validator automation. Rules to add/extend:
  - Flag `<all_urls>`, `*://*/*`, and overly broad match patterns — emit "likely Purple Potassium."
  - Parse manifest permissions, scan bundled JS for the corresponding `chrome.<api>` call, and flag any declared permission with zero call-sites (strongest signal of "unused permission").
  - When any user-data permission (`history`, `cookies`, `downloads`, `bookmarks`) is declared, require a `privacy_policy` URL in the submission config.
- **For the template itself:** `wxt.config.ts` defaults should comment the permissions block with a one-liner per permission explaining why it's declared — Coditude's "keep a brief README or internal note to denote the reason for each permission" pattern, shipped as a convention.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_coditude_purple-potassium-permissions.md`](../blogs/2026-04-17_coditude_purple-potassium-permissions.md)
- **Original URL:** https://www.coditude.com/insights/purple-potassium-how-to-correct-permission-abuse-in-chrome-extensions/
- **Wayback:** https://web.archive.org/web/20260417002006/https://www.coditude.com/insights/purple-potassium-how-to-correct-permission-abuse-in-chrome-extensions/
- **Related extracted:** `sources/extracted/2026-04-16_macarthur_posts-chrome-extension-host-permission.md` (the `activeTab + scripting` remedy for broad host permissions), `sources/extracted/2026-04-17_coditude_rejection-codes-overview.md`, `sources/extracted/2026-04-17_coditude_purple-family-privacy.md`.
