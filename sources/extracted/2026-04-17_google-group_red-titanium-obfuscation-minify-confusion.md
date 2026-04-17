---
extracts:
  - sources/forums/2026-04-17_google-group_red-titanium-obfuscation-minify-confusion.md
extracted_at: 2026-04-17
title: "Red Titanium — obfuscation check flags dynamic URL construction, not just minification"
author: Ajay Goel (developer), Patrick Kettner (Chrome Extensions team)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/2cO2apjQe5s
evidence_class: b
topics:
  - cws-review
  - rejection-codes
  - obfuscation
  - red-titanium
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Red Titanium — obfuscation check flags dynamic URL construction, not just minification

## TL;DR

Red Titanium (code obfuscation) can be triggered by dynamic string concatenation to construct URLs — even when the intent is allowlisting CDN domains — and Chrome team confirmed that the specific flagged snippet in this case was likely an overzealous false positive, suggesting One Stop Support appeal as the fix.

## Signal

Red Titanium is the violation code for "having obfuscated code in the package." The key finding in this thread is that the CWS automated scanner looks for intent-obscuring patterns, not just for minified variable names. Constructing a URL dynamically from a variable (`'https://' + loaderDomainCDN + '/path'`) was flagged even though the developer's purpose was failover across an allowlisted set of hardcoded domains.

Patrick Kettner from the Chrome Extensions team weighed in to say that if that single concatenation line was the only snippet cited, "it sounds like a mistake of overzealous review" and recommended a One Stop Support appeal. This is a notable admission that Red Titanium can produce false positives when a dynamically composed string looks obfuscated in isolation.

The practical resolution path from the community (Stryder Crown's advice): replace dynamic URL construction with a hardcoded array/map of valid domains, cycling through them with explicit conditionals. This makes the reviewer's job unambiguous regardless of what the automated scanner flagged.

## Key quotes

> "Speaking as someone on the Extensions team at Chrome... If that was the only snippet listed as the violation, it sounds like a mistake of overzealous review. I would recommend opening an appeal via One Stop Support."
> — Patrick Kettner, Chrome Extensions team, Sep 30, 2023

> "You might be better suited by creating a (hardcoded) map/array of all your valid domains and cycling through that instead of concat'ing them."
> — Stryder Crown, Sep 30, 2023

## Implications for the factory

- **For `docs/09`:** Note that Red Titanium can fire on dynamic URL construction (string concatenation with variables), not only on intentional obfuscation. The fix is to use hardcoded arrays of allowed domains. False positives are acknowledged by Chrome team; One Stop Support appeal is the escalation path.
- **For the validator (`scripts/validate-cws.ts`):** No static analysis rule is practical here (any legitimate concatenation could be flagged). Document as a human review checklist item: "check for dynamic URL construction patterns that could trigger Red Titanium."
- **For the template itself:** The `scripts/inject-secrets.ts` pattern replaces `__PLACEHOLDER__` strings at build time with literal values — this results in hardcoded strings in the final bundle, which is the correct pattern to avoid Red Titanium.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_red-titanium-obfuscation-minify-confusion.md`](../forums/2026-04-17_google-group_red-titanium-obfuscation-minify-confusion.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/2cO2apjQe5s
- **Wayback:** https://web.archive.org/web/20260417024636/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/2cO2apjQe5s
