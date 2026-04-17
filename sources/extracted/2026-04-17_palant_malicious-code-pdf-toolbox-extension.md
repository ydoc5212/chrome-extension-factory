---
extracts:
  - sources/blogs/2026-04-17_palant_malicious-code-pdf-toolbox-extension.md
extracted_at: 2026-04-17
title: "PDF Toolbox (2M installs) — obfuscated remote-code-execution via fake API wrapper, evaded CWS for 1+ year"
author: Wladimir Palant
url: https://palant.info/2023/05/16/malicious-code-in-pdf-toolbox-extension/
evidence_class: c
topics:
  - security
  - malicious-extensions
  - pdf-toolbox
  - supply-chain
feeds_docs:
  - docs/09-cws-best-practices.md
---

# PDF Toolbox — 2M-user extension hiding RCE payload as a fake API wrapper for 1+ year

## TL;DR

Palant discovered that the PDF Toolbox Chrome extension (2M+ installs, 4.2-star average) contained obfuscated code disguised as a legitimate extension API wrapper that fetched a config from `serasearchtop[.]com` after a 24-hour delay, enabling that domain to inject arbitrary JavaScript into every website the user visited. The extension passed CWS review and stayed live for at least a year.

## Signal

**The evasion technique is the key finding.** The malicious code used three layers of detection avoidance:

1. **Camouflage as API wrapper:** The malicious module was structured to look like a standard extension API wrapper — a pattern any extension developer would recognize as boilerplate. The deception required a developer-level code audit to pierce.

2. **24-hour activation delay:** The extension waited 24 hours after install before fetching its config from the remote domain. This defeats automated sandbox analysis (which typically runs for minutes, not days) and ensures the extension passes any post-install monitoring window.

3. **Obfuscation:** Nested conditionals and string manipulation obscured the malicious domain. The code "takes a closer look to recognize unexpected functionality here, and quite some more effort to understand what it is doing."

**The permissions angle:** Palant notes the PDF Toolbox's declared permissions were broader than its stated functionality required. The extension requested access to all tabs (to "check for downloadable PDFs") when `activeTab` permission would have sufficed for the core use case. Palant calls this out explicitly: "Chrome Web Store requires extension developers not to declare unnecessary permissions, this policy doesn't seem to be consistently enforced." The excess permissions were what made the RCE payload dangerous — without broad host access, the injected JavaScript would have nowhere to run.

**The blast radius:** The injected JavaScript executed on every website the user visited, with full read/write access. Possible uses: ad injection (most likely, Palant estimates), cryptomining, browsing-profile data collection, banking credential harvesting.

**Scale of subsequent discovery:** Palant's follow-up found the same `serasearchtop[.]com` payload pattern in 18 additional extensions (55M combined installs), and a broader sweep identified 34 malicious extensions with 87M total installs — all using similar obfuscation-and-delay patterns.

**CWS enforcement failure:** Despite Palant's notification to Google through multiple channels, the extension remained in the store as of the article's publication. This is a direct datapoint for `docs/09`'s framing that CWS review is necessary but not sufficient.

## Key quotes

> "The code has been made to look like a legitimate extension API wrapper, merely with some convoluted logic on top. It takes a closer look to recognize unexpected functionality here, and quite some more effort to understand what it is doing."
> — Wladimir Palant, May 16, 2023

> "This code allows serasearchtop[.]com website to inject arbitrary JavaScript code into all websites you visit. While it is impossible for me to tell what this is being used for, the most likely use is injecting ads. More nefarious uses are also possible however."
> — Wladimir Palant, May 16, 2023

> "Chrome Web Store requires extension developers not to declare unnecessary permissions, this policy doesn't seem to be consistently enforced."
> — Wladimir Palant, May 16, 2023

## Implications for the factory

- **For `docs/09`:** The PDF Toolbox case is the clearest example of "malicious extension that passed CWS review." The 24-hour delay and API-wrapper camouflage techniques explain *why* automated review fails — they're specifically designed to defeat it. Cite this when explaining why minimum-permission design matters even post-review (smaller declared scope = smaller damage if the extension is later found to be malicious or acquired by bad actors).
- **For the validator (`scripts/validate-cws.ts`):** The "unnecessary permissions" finding supports the existing rule flagging broad `host_permissions`. Palant's specific point — `activeTab` would have sufficed for the stated use case — is the principle behind the factory's rule recommending `activeTab` over broad host patterns.
- **For the template itself:** The template's use of `optional_host_permissions` (requested at runtime) rather than `host_permissions` (declared at install) directly addresses the excess-permissions attack surface Palant identifies.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_palant_malicious-code-pdf-toolbox-extension.md`](../blogs/2026-04-17_palant_malicious-code-pdf-toolbox-extension.md)
- **Original URL:** https://palant.info/2023/05/16/malicious-code-in-pdf-toolbox-extension/
- **Wayback:** not archived (wayback returned null at capture time)
- **Published:** May 16, 2023 (Wladimir Palant / Almost Secure)
- **Follow-up:** Palant published a series expanding this to 34 extensions / 87M installs; extension list at https://codeberg.org/palant/malicious-extensions-list/
