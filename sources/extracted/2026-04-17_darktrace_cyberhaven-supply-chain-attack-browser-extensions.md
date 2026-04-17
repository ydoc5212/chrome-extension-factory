---
extracts:
  - sources/blogs/2026-04-17_darktrace_cyberhaven-supply-chain-attack-browser-extensions.md
extracted_at: 2026-04-17
title: "Cyberhaven Dec 2024 supply-chain attack — OAuth phish → malicious extension update → Facebook Ads credential theft"
author: Rajendra Rushanth (Darktrace)
url: https://www.darktrace.com/blog/cyberhaven-supply-chain-attack-exploiting-browser-extensions
evidence_class: c
topics:
  - security
  - malicious-extensions
  - cyberhaven
  - supply-chain
  - breach
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Cyberhaven December 2024 breach — OAuth phish bypasses MFA, malicious extension update reaches 400K+ users

## TL;DR

On December 24–26, 2024, attackers phished a Cyberhaven employee via a malicious OAuth app ("Privacy Policy Extension"), used the resulting CWS access to push a trojanized extension update (v24.10.4) that beaconed to `cyberhavenext[.]pro`, and exfiltrated Facebook Ads session cookies from 400,000+ users. The Cyberhaven engineering blog has since been taken down; this capture uses the Darktrace vendor analysis as the primary source.

## Signal

**The attack vector:** Not a credential compromise — the employee had MFA and Google Advanced Protection enabled and never entered credentials. The phish was an OAuth authorization grant for a malicious Google application, which gave the attacker CWS publisher access without touching the password. This is the critical insight: MFA does not protect against OAuth-consent phishing.

**The payload:** The attacker copied the legitimate extension, added two files (`worker.js` modified + a new `content.js`), and pushed it as an update. Automatic extension updates — which require no user interaction — delivered the payload to every user currently running Cyberhaven's extension. The malicious version was live for roughly 25 hours (December 25–26) before Cyberhaven detected and replaced it.

**C2 infrastructure:** The malicious extension beaconed to `cyberhavenext[.]pro` (typosquat on the legitimate `cyberhaven.com` domain) at IP `149.28.124[.]84`. Darktrace detected 5.57 GiB inbound and 859 MiB outbound from two affected devices over two days — significant exfiltration volume.

**Scope of campaign:** Cyberhaven was not the only target. Investigators found the same threat actor had compromised at least 30 additional extensions during December 2024, affecting 2.6M+ users total. The primary motive across the campaign was Facebook Ads account access (session cookies → ad account takeover → fraudulent ad spend).

**Detection gap:** Darktrace detected the anomaly via behavioral beaconing analysis (persistent outbound connections to a new, rare external IP with an extension-typosquat hostname). Traditional endpoint tools relying on signature-based detection would have missed this — the malicious code was a small diff on a trusted, existing extension.

**Why this matters for the factory:** The attack used CWS's own update mechanism as the delivery vector. An extension that passes CWS review and has a legitimate history can be weaponized post-review via a compromised developer account. This is an argument for the validator's rule against broad `host_permissions` at install time — minimum declared permissions reduces the blast radius if the extension is later compromised.

## Key quotes

> "The employee had Google Advanced Protection enabled and had MFA covering his account, but did not receive a MFA prompt, and the employee's Google credentials were not compromised."
> — Cyberhaven preliminary analysis (via Darktrace summary), December 2024

> "Supply chain attacks are not limited to traditional software vendors. Browser extensions, cloud-based applications, and SaaS services are equally vulnerable."
> — Darktrace, March 20, 2025

> "Two affected devices transmitted 5.57 GiB incoming and 859.37 MiB outgoing data over two days."
> — Darktrace, March 20, 2025

## Implications for the factory

- **For `docs/09`:** The Cyberhaven attack is the canonical modern example of "supply-chain compromise via developer account takeover." Add a case-study callout: even a legitimate, reviewed extension can be weaponized if the developer's CWS account is compromised via OAuth phishing. Mitigation: developer accounts should use hardware security keys (not just TOTP MFA), and organizations should monitor extension version bumps.
- **For the validator (`scripts/validate-cws.ts`):** No new rules directly surfaced, but the attack reinforces the existing principle that broad `host_permissions` increases blast radius of any future compromise — a compromised extension with narrow permissions does limited damage.
- **For the template itself:** No direct change; but the welcome-page pattern of requesting `optional_host_permissions` at runtime (rather than baking them into `host_permissions`) is indirectly validated by this breach — the factory's design already minimizes declared scope.
- **Source note:** Cyberhaven's own engineering blog (`cyberhaven.com/engineering-blog/`) has been taken down and redirects to `support.cyberhaven.io` (which is also unresolvable as of 2026-04-17). This Darktrace analysis is the best publicly available substitute for the official post-mortem.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_darktrace_cyberhaven-supply-chain-attack-browser-extensions.md`](../blogs/2026-04-17_darktrace_cyberhaven-supply-chain-attack-browser-extensions.md)
- **Original URL:** https://www.darktrace.com/blog/cyberhaven-supply-chain-attack-exploiting-browser-extensions
- **Wayback:** https://web.archive.org/web/20260417024924/https://www.darktrace.com/blog/cyberhaven-supply-chain-attack-exploiting-browser-extensions
- **Note on primary source:** Cyberhaven's own blog post ("Cyberhaven's Preliminary Analysis of the Recent Malicious Chrome Extension") is dead — all `cyberhaven.com/engineering-blog/*` URLs now return HTTP 301 to `support.cyberhaven.com` (→ `support.cyberhaven.io`), which was unresolvable at capture time. The Darktrace analysis cites and summarizes the Cyberhaven preliminary analysis directly.
