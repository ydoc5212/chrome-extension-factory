---
extracts:
  - sources/forums/2026-04-17_google-group_yellow-potassium-minimum-functionality.md
extracted_at: 2026-04-17
title: "Yellow Potassium — minimum functionality violation; thread also shows Purple Potassium (unused permissions)"
author: Xijian Yan (developer), Roberto Oneto (community)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GdtnseYh5Ng
evidence_class: b
topics:
  - cws-review
  - rejection-codes
  - permissions
  - yellow-potassium
  - purple-potassium
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Yellow Potassium — minimum functionality violation; thread also shows Purple Potassium (unused permissions)

## TL;DR

This thread primarily documents Purple Potassium (requesting permissions not demonstrably used) rather than Yellow Potassium directly; Yellow Potassium is minimum-functionality, and the thread cross-links to the official troubleshooting page that defines both codes.

## Signal

The thread title references Purple Potassium — "Requesting but not using the following permission(s): contextMenus, tabs, storage" — which is distinct from Yellow Potassium (minimum functionality). The search engine surface snippet claiming "Yellow Potassium is given when you lack minimum functionality" appears in this thread as a reply quoting another violation, not as the primary topic.

However, the thread is valuable for the factory because it documents the Purple Potassium pattern clearly: permissions listed in the manifest but not demonstrably exercised in the submitted code cause rejection. The community advice is: (1) `localStorage` does not need the `storage` permission — only `chrome.storage.*` APIs do; (2) `activeTab` can often substitute for `tabs` unless you specifically need `tab.url` on non-focused tabs; (3) contextMenus always needs the permission if `chrome.contextMenus.*` is called.

The developer's surprise — "the email does not seem to point out the permission which is really unnecessary" — is a recurring pattern: the rejection cites multiple permissions and the developer cannot tell which one was actually unused.

From the official troubleshooting page linked by Xijian Yan: https://developer.chrome.com/docs/webstore/troubleshooting/#excessive-permissions

## Key quotes

> "Violation reference ID: Purple Potassium. Violation: Requesting but not using the following permission(s): contextMenus, tabs, storage"
> — CWS rejection email quoted by Xijian Yan, Apr 2021

> "localStorage doesn't need the storage permission unlike chrome.storage.local. Also try replacing 'tabs' with 'activeTab' and check if the extension still works."
> — Roberto Oneto, Apr 9, 2021

## Implications for the factory

- **For `docs/09`:** Distinguish Yellow Potassium (minimum functionality — extension does too little to warrant a Store listing) from Purple Potassium (excessive permissions — manifest declares permissions not used in submitted code). The factory template requests only permissions actually used; any fork should audit and remove unused permissions before submission.
- **For the validator:** The existing `no-broad-permissions` rule family partially covers this. Consider adding a check that flags commonly over-declared permissions like `tabs` when the manifest has no evident need for `tab.url` access.
- **For the template itself:** The factory manifest already uses `activeTab` rather than `tabs` for content script injection. Document: `storage` is only needed for `chrome.storage.*`, not `localStorage`.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_yellow-potassium-minimum-functionality.md`](../forums/2026-04-17_google-group_yellow-potassium-minimum-functionality.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GdtnseYh5Ng
- **Wayback:** https://web.archive.org/web/20260417024903/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GdtnseYh5Ng
