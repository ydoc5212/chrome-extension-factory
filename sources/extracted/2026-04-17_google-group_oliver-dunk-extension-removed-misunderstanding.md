---
extracts:
  - sources/forums/2026-04-17_google-group_oliver-dunk-extension-removed-misunderstanding.md
extracted_at: 2026-04-17
title: "Oliver Dunk on extension takedowns: VirusTotal clean ≠ CWS policy compliant; appeal via One Stop Support"
author: Pavel N (developer), Oliver Dunk (Chrome DevRel)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/loxbMnoKkRY
evidence_class: b
topics:
  - cws-review
  - extension-removal
  - policy-enforcement
  - oliver-dunk
  - appeal
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Oliver Dunk on extension takedowns: VirusTotal clean ≠ CWS policy compliant; appeal via One Stop Support

## TL;DR

When an extension is removed for "malicious activity," Oliver Dunk's public position is that he cannot comment on specifics, a VirusTotal scan is not evidence of CWS policy compliance, and the only path is a formal appeal via One Stop Support.

## Signal

This April 2025 thread shows Oliver Dunk's response pattern when a developer posts a removal dispute on the public Group. The Screen Dimmer extension (17,000 users) was removed for "malicious activities harmful to users" with the note "the item will not be reinstated." The developer's theory: the fullscreen paywall was misunderstood as malicious behavior.

Oliver Dunk's reply within 10 minutes is the load-bearing post for this extraction:

1. "I wasn't able to find a case where you have started an appeal." — He checks the support system in real time, suggesting he has dashboard visibility into support cases.
2. "If you believe the item was taken down incorrectly, I'd encourage you to open a new case using the One Stop Support form." — One Stop Support is the only legitimate appeal channel; posting to the Group alone does not constitute an appeal.
3. "I would point out that a scan of your item is not the same as confirming it is compliant with Chrome Web Store policies." — This is a documented clarification: CWS policy compliance is not synonymous with virus-free code. A clean VirusTotal result does not argue against a policy violation (e.g., abusive UX patterns, hidden behavior, ToS violations).

## Key quotes

> "Unfortunately, I can't comment more on such a specific situation here. In addition, I would point out that a scan of your item is not the same as confirming it is compliant with Chrome Web Store policies."
> — Oliver Dunk, Apr 25, 2025

> "If you believe the item was taken down incorrectly, I'd encourage you to open a new case using the One Stop Support form."
> — Oliver Dunk, Apr 25, 2025

## Implications for the factory

- **For `docs/09`:** Add: When an extension is removed for policy violation (not technical rejection), the appeal path is One Stop Support — not the public Group. Posting to the Group may surface the case to Oliver Dunk, but formal appeal must be filed separately. VirusTotal results are not relevant evidence for a policy dispute.
- **For the validator:** No rule needed.
- **For the template itself:** The paywall-over-content pattern the developer used (fullscreen overlay with no popup alternative) is risky. The factory's popup/options patterns are the compliant alternative for monetization UI.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_oliver-dunk-extension-removed-misunderstanding.md`](../forums/2026-04-17_google-group_oliver-dunk-extension-removed-misunderstanding.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/loxbMnoKkRY
- **Wayback:** https://web.archive.org/web/20260417025017/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/loxbMnoKkRY
