---
extracts:
  - sources/blogs/2026-04-16_palant_02-03-analysis-of-an-advanced-malicious-chrome-extension.md
extracted_at: 2026-04-16
title: "Anatomy of an advanced malicious extension — CSP stripping + Bloom-filter targeting + ownership transfer"
author: Wladimir Palant
url: https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/
evidence_class: c
topics:
  - security
  - manifest-v3
  - declarative-net-request
  - content-security-policy
  - ownership-transfer
  - remote-code
  - review-evasion
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Palant — How one malicious CWS extension chained declarativeNetRequest + DOM events to run remote code, and how reviewers missed it

## TL;DR

A teardown of "Download Manager Integration Checklist" (70K users, at one point FEATURED-badged) — shows the **exact technical recipe** malicious extensions use to bypass MV3's remote-code ban. The recipe: (1) request `declarativeNetRequest` + broad host permissions under a benign cover story, (2) download a server "checklist" that strips CSP headers site-wide, (3) use a `document.documentElement.setAttribute('onreset', <remote-JS>)` + `dispatchEvent('reset')` trick to execute remote code in web-page context, (4) coordinate via a WebSocket to do ad-fraud session replay. Two review-evasion tactics: the server returns empty payload for **two weeks** before activating (sleeps through the review window), and a 256 KiB Bloom filter gates target domains so reverse engineering can't easily enumerate them. Separately: **multiple named extensions changed ownership in 2024 and escalated privileges on the next update** — a pattern the CWS doesn't currently block.

## Signal

This is the primary technical reference for "what a review-evading malicious extension actually looks like in 2025." Every defensive rule in `docs/09` benefits from inverting Palant's findings: the things this extension does are the things a reviewer-safe extension must not do, and the things a reviewer must learn to flag.

Concrete attack primitives to codify:

**(1) CSP stripping via `declarativeNetRequest` + `modifyHeaders`.** The extension added a dynamic rule: remove `Content-Security-Policy` and `Content-Security-Policy-Report-Only` response headers on `main_frame` resources, filter `"*"`. Once CSP is stripped, remote-injected JS in page context isn't blocked. Any extension using `modifyHeaders` to remove security headers (CSP, X-Frame-Options, Permissions-Policy) deserves an automatic hard-reject heuristic.

**(2) The `onreset` attribute + `dispatchEvent` trick.** `document.documentElement.setAttribute('onreset', <JS string>); element.dispatchEvent(new CustomEvent('reset'))` — this runs arbitrary JS in the page's origin context without `eval`, without `new Function()`, without remote `<script src>`. The `<JS string>` comes from a server response stored in `chrome.storage.local`. This trick technically obeys MV3's "no remote code in extension context" rule because the code runs in page context, not extension context — but the extension controls when and what runs. The rule has a loophole that this pattern exploits.

**(3) Review-evasion via delayed activation.** Server returns empty response for ~2 weeks after install; only after the cookie-based "this user has existed long enough" gate does it serve the real payload. Reviewers sandbox-test extensions briefly — this design waits them out.

**(4) Bloom-filter-gated targeting.** 256 KiB binary blob; only specific domain SHA-256 hashes pass the filter and trigger activation. Reverse-engineers can't enumerate the targets without guessing every domain. The extension does *nothing visibly wrong* on the first million domains you test.

**(5) Ownership transfer as an attack vector.** Palant names multiple extensions (Darktheme for google translate, Convert PDF to JPEG/PNG, Download Manager Integration Checklist) that changed hands in 2024 and escalated privileges in the next update. The CWS does not currently block "hey this extension now has a new owner who added broad host permissions." This is Matt Frisbie's "Tracking Browser Extension Ownership" warning made concrete with named cases.

Palant names the adindex advertising company and a specific developer as the human backing (at least some of) these extensions, but the adindex CEO denied a direct employment link. The business model is ad fraud: extension replays recorded browsing sessions on advertiser landing pages to generate fake clicks, paid out by the advertising network.

## Key quotes

> "This is what I flagged as malicious functionality initially: part of the response is used to add `declarativeNetRequest` rules dynamically. At first I missed something however: the rest of the data being stored as `checklist` is also part of the malicious functionality, allowing execution of remote code."
> — Wladimir Palant, Feb 3 2025

> "When the extension downloads its 'checklist' immediately after installation the server response will be empty. ... The server sets a cookie however, allowing it to recognize the user on subsequent downloads. And only after two weeks or so it will respond with the real thing."
> — Palant, on review evasion via delayed activation

> "Darktheme for google translate and Download Manager Integration Checklist extensions both appear to have changed hands in 2024, after which they requested more privileges with an update in October 2024."
> — Palant, on the ownership-transfer attack pattern

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** add a new subsection "Patterns that look like malware (avoid these, or be ready for a slow review)":
  - `declarativeNetRequest` rules that `modifyHeaders` to remove CSP / X-Frame-Options / Permissions-Policy — if your legit extension needs this, document *why* in the permission justification and expect scrutiny.
  - Setting `onX` attributes on DOM elements from string data fetched from a server (Palant's exact trick).
  - Storing JS strings in `chrome.storage` and later feeding them to `setAttribute('onreset', ...)` or equivalent.
  - Server-gated activation patterns (extension behaves differently based on server response + time elapsed since install).
  Each bullet maps to a concrete malware-in-the-wild case; cite this extraction.
- **For the validator (`scripts/validate-cws.ts`):** add rule `dnr-modify-headers-csp` — static-analyze any manifest or `declarativeNetRequest.updateDynamicRules` call for rules whose `action.responseHeaders` targets `content-security-policy` or `x-frame-options` with `operation: "remove"`. Hard fail: "this pattern is a known malware signature per sources/extracted/2026-04-16_palant_02-03-analysis-..."
- **For `docs/00-getting-started.md` or a new `docs/11-ownership-changes.md`:** when evaluating whether to use a third-party JS library in an extension, check whether the underlying npm package has had ownership changes recently. The same attack surface applies at the package level as at the extension level — acquired packages that suddenly escalate privileges are a known supply-chain pattern. The factory should document "vendor pinning" as a first-class concern.
- **For the template itself:** `wxt.config.ts` should default to *no* `declarativeNetRequest` permission. If a downstream extension needs it, they add it intentionally — don't ship the capability by default.

## Provenance

- **Raw capture:** [`../blogs/2026-04-16_palant_02-03-analysis-of-an-advanced-malicious-chrome-extension.md`](../blogs/2026-04-16_palant_02-03-analysis-of-an-advanced-malicious-chrome-extension.md)
- **Original URL:** https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/
- **Wayback:** https://web.archive.org/web/20260416224500/https://palant.info/2025/02/03/analysis-of-an-advanced-malicious-chrome-extension/
- **Related extracted:** `sources/extracted/2026-04-16_palant_01-20-malicious-extensions-circumvent-googles-remote-code-ban.md` (the wider survey of 63 extensions this teardown is a follow-up to), `sources/extracted/2026-04-16_palant_01-13-chrome-web-store-is-a-mess.md` (the CWS-moderation-failure context explaining how 70K-user featured extensions slipped through).
- **Artifacts referenced:** Palant published the deobfuscated payload at `palant.info/2025/02/03/.../payload.txt` and the Bloom-filter-matched domain list at `.../domains.txt`.
