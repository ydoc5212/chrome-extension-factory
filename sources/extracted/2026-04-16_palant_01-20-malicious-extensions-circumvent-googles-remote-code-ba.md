---
extracts:
  - sources/blogs/2026-04-16_palant_01-20-malicious-extensions-circumvent-googles-remote-code-ba.md
extracted_at: 2026-04-16
title: "How MV3's remote-code ban gets bypassed — inject HTML into page context, strip CSP with declarativeNetRequest"
author: Wladimir Palant
url: https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/
evidence_class: c
topics:
  - security
  - manifest-v3
  - remote-code
  - declarative-net-request
  - content-security-policy
  - html-injection
  - review-evasion
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Palant — The remote-code ban has a loophole: inject HTML (not JS) into page context + strip CSP, and you run arbitrary code in every visited page

## TL;DR

MV3's remote-code ban says extension context can't execute downloaded JS. But an extension can legally inject **HTML** into pages, and that HTML can contain `<img onload="<JS>">` or inline event handlers that run in the **page's** context — completely outside the ban. To defeat the target site's Content-Security-Policy (which would normally block inline handlers), the malicious extension uses `declarativeNetRequest` with `modifyHeaders` to strip `content-security-policy` and `x-frame-options` headers from all responses. Palant documents 63 extensions using this pattern across three clusters (Phoenix Invicta, Netflix Party, Sweet VPN), several Featured, some with 100K+ users. The server only returns the malicious payload *after* a warm-up period — so reviewers who sandbox-test on install see nothing wrong.

## Signal

This is the canonical survey explaining *how* MV3's most-hyped security improvement gets routed around. Critical for anyone building (or reviewing) an extension in 2025, because every primitive named here is a legitimate API — the abuse is in combination, not in any single call.

**The four-step pattern** (Palant's own summary):
1. Request all-websites access with a plausible cover story. "Volume Booster needs all sites because it might boost volume on any site." Google rarely questions.
2. Have a server-downloaded configuration. Don't justify why — nobody asks.
3. Use part of that configuration as HTML injected into web pages. "Forget" to sanitize so HTML injection via config is possible. Any JS inside that HTML runs in page context — remote-code ban doesn't apply.
4. Use another part of the configuration (or static `declarativeNetRequest` rules) to strip security headers: `Content-Security-Policy`, `X-Frame-Options`, sometimes decoy headers like `gain-id` to make the CSP removal look innocuous in a list.

**The payload pattern Palant documents:**
```
<img height="1" width="1" src="data:image/gif;base64,…"
     onload="(() => {…})();this.remove()">
```
An invisible 1×1 image whose `onload` handler runs JS (fetched from the server, or contains the fetch call), then self-removes. No `<script>` tag. No `eval` in extension context. Technically legal under MV3's text rules.

**The declarativeNetRequest CSP-stripping rule Palant extracted:**
```
{
  "action": {
    "type": "modifyHeaders",
    "responseHeaders": [
      { "header": "gain-id", "operation": "remove" },           // decoy
      { "header": "content-security-policy", "operation": "remove" },  // the real goal
      { "header": "x-frame-options", "operation": "remove" },   // enables frame injection
      ...
    ]
  },
  "condition": { "urlFilter": "*", "resourceTypes": ["main_frame","sub_frame"] }
}
```

**The three clusters Palant names, with indicators:**
- **Phoenix Invicta Inc.** — 14 extensions, newer operation. Most obvious tell: `super-sound-booster.info`, similar over-specific domains. Downloads config every ~6 hours.
- **Netflix Party** — multiple extensions previously flagged by McAfee (2022) and Palant (2023). Still operational. Cookie stuffing + affiliate fraud.
- **Sweet VPN** — most overtly malicious, obfuscation rather than remote code. Downloads "instructions" that are code-like data.

**The IOC domain list** (partial): `super-sound-booster.info`, `shurkul.online`, `kralforum.com.tr`, `rumorpix.com`, `dev.astralink.click`, `everyview.info`, `lottingem.com`, `gulkayak.com`, `topodat.info`, `doubleview.online`, `astato.online`, `doublestat.info`, `triplestat.online`, `fivem.com.tr`. All of these are malicious — if any appear in an extension's network calls, the extension is part of one of these clusters.

**Review evasion via time gating**: the server returns empty/benign response on first install, only serves malicious payload after the extension has been live for some period (cookie-tracked). Reviewers who spin up a sandbox, install, and scan immediately see nothing. This is a recurring pattern Palant also documents in the 02-03 teardown.

**Side-note on why legitimate ad blockers don't lean hard on `declarativeNetRequest`**: Palant notes the same API that blocks ads can redirect resource requests to attacker-controlled scripts. Real ad blockers keep their rule set narrow for this reason — it's a capability, not a convenience. When a factory-user's extension needs `declarativeNetRequest`, the permission justification should explain *which* rule types will be used and why `modifyHeaders` (or `redirect`) is or is not needed.

## Key quotes

> "These rules allow e.g. adding more rules whenever the server decides that some are needed. As these rules aren't code, the usual restrictions against remote code don't apply here."
> — Palant, on the declarativeNetRequest config-update loophole

> "[The shortcut feature] makes no sense but it provides the extension with plausible deniability: it has a legitimate reason to inject HTML code into all web pages."
> — Palant, on the Phoenix Invicta pattern

> "This abuse potential is the reason why legitimate ad blockers, while downloading their rules from a web server, never make these rules as powerful as the declarativeNetRequest API."
> — Palant

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** add a "Manifest V3 code requirements" sub-bullet that the remote-code ban applies to extension context only — HTML injected into page context with JS event handlers is *not* covered. A legit extension should therefore avoid:
  - injecting HTML from any remote source unsanitized
  - injecting HTML with inline event handlers (`onX="..."` attributes)
  - declarativeNetRequest `modifyHeaders` rules that remove security headers (CSP, X-Frame-Options, Permissions-Policy, Content-Security-Policy-Report-Only)
  Cite this extraction for each.
- **For the validator (`scripts/validate-cws.ts`):** add rules:
  - `dnr-modify-headers-security`: static-analyze any manifest `declarative_net_request.rule_resources` files or any code calling `chrome.declarativeNetRequest.updateDynamicRules` and fail if any rule targets `content-security-policy`, `x-frame-options`, `permissions-policy`, or `content-security-policy-report-only` with `operation: "remove"` or `"set"`.
  - `dnr-urlfilter-wildcard`: warn if a rule's `condition.urlFilter` is `"*"` combined with `modifyHeaders` (legit use cases exist but they're rare and reviewers will scrutinize).
  - `inline-event-handler-in-injected-html`: lint helper — if `content_scripts` or a background script uses `innerHTML`/`insertAdjacentHTML` with a template that contains `onload=`, `onerror=`, etc., warn. (Can be noisy; make it advisory, not blocking.)
- **For the template itself:** `wxt.config.ts` should NOT include `declarativeNetRequest` in permissions by default (already noted in the 02-03 extraction). Also: if the factory adds a "content-script injection" example, use `textContent` / `element.append(node)` DOM APIs, never `innerHTML` with untrusted data — document this rule in the template.
- **For `docs/04-security.md`:** expand the CSP section with the "MV3 ban has a loophole" framing. Any time a factory-user's extension needs to inject into page context, they should (a) sanitize all content, (b) never use inline event handlers, (c) justify declarativeNetRequest rules explicitly in the manifest comments.

## Provenance

- **Raw capture:** [`../blogs/2026-04-16_palant_01-20-malicious-extensions-circumvent-googles-remote-code-ba.md`](../blogs/2026-04-16_palant_01-20-malicious-extensions-circumvent-googles-remote-code-ba.md)
- **Original URL:** https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/
- **Wayback:** https://web.archive.org/web/20260416224436/https://palant.info/2025/01/20/malicious-extensions-circumvent-googles-remote-code-ban/
- **Related extracted:** `sources/extracted/2026-04-16_palant_02-03-analysis-of-an-advanced-malicious-chrome-extension.md` (the deep-dive teardown of one Phoenix-Invicta-pattern extension with even more specific techniques), `sources/extracted/2026-04-16_palant_01-13-chrome-web-store-is-a-mess.md` (the context on why these extensions slip past CWS review).
