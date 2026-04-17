---
extracts:
  - sources/blogs/2026-04-17_redcanary_chromeloader-pushy-malvertiser.md
extracted_at: 2026-04-17
title: "ChromeLoader — ISO malvertiser that uses PowerShell to sideload a malicious extension"
author: Aedan Russell (Red Canary)
url: https://redcanary.com/blog/threat-detection/chromeloader/
evidence_class: c
topics:
  - security
  - malicious-extensions
  - malvertising
  - chromeloader
feeds_docs:
  - docs/09-cws-best-practices.md
---

# ChromeLoader — the malvertising → ISO → PowerShell → sideloaded-extension attack chain

## TL;DR

ChromeLoader is a browser hijacker distributed via fake cracked-software ISOs that uses PowerShell and the Windows Task Scheduler COM API (not `schtasks.exe`) to sideload a malicious Chrome extension, bypassing detection tools that only watch for standard scheduler commands. It redirects search traffic to ad sites; the same PowerShell-sideload technique could be repurposed for higher-impact payloads.

## Signal

ChromeLoader's significance is not the payload (ad-traffic hijacking is low-severity) but the **delivery technique**: using PowerShell with `--load-extension` to install an extension that was never submitted to or reviewed by the Chrome Web Store. This is the sideloading vector the factory's template pattern guards against at the org-policy level.

The attack chain:
1. **Distribution:** ISO files masquerading as cracked games or pirated media, spread via pay-per-install sites and social media QR codes
2. **Execution:** `CS_Installer.exe` loads the Task Scheduler COM API and injects into `svchost.exe` to create a scheduled task — deliberately avoiding `schtasks.exe` calls that security tools commonly monitor
3. **Persistence:** Scheduled task runs PowerShell with a Base64-encoded command (using shortened `-encodedcommand` flag to reduce signature surface) that downloads and decompresses the extension
4. **Load:** PowerShell invokes Chrome with `--load-extension` pointing to the dropped directory in `AppData\Local`, loading the extension without CWS involvement
5. **Self-cleanup:** After loading, the scheduled task removes itself

The macOS variant uses DMG + bash script + `/Library/LaunchAgents` for persistence, loads extensions into both Chrome and Safari.

**Why detection is hard:** The technique blends three individually common behaviors (PowerShell, Task Scheduler, Chrome extensions) that are rarely seen together in this sequence. Red Canary's behavioral analytics key off: PowerShell with shortened `encodedCommand` flag + variable references; Chrome spawned from PowerShell with `--load-extension` + `AppData\Local`; shell processes with extension-loading parameters.

**The broader risk:** Red Canary notes that the same PowerShell sideload technique applied to a credential harvester or spyware would let malware "gain an initial foothold and go undetected before performing more overtly malicious activity, like exfiltrating data from a user's browser sessions." ChromeLoader is a proof-of-concept for a far more dangerous class of attack.

**Factory relevance:** The template's `optional_host_permissions` pattern and the enterprise policy guidance (ExtensionInstallSources) are the developer-side counterpart to this threat — an extension distributed through CWS with minimal permissions cannot be ChromeLoader. ChromeLoader *bypasses* CWS entirely; the enterprise mitigation is `ExtensionInstallSources` locking down to CWS only.

## Key quotes

> "ChromeLoader uses PowerShell to inject itself into the browser and add a malicious extension to it, a technique we don't see very often (and one that often goes undetected by other security tools)."
> — Aedan Russell, Red Canary, May 2022

> "If applied to a higher-impact threat — such as a credential harvester or spyware — this PowerShell behavior could help malware gain an initial foothold and go undetected before performing more overtly malicious activity, like exfiltrating data from a user's browser sessions."
> — Aedan Russell, Red Canary, May 2022

> "Notably, ChromeLoader does not call the Windows Task Scheduler (schtasks.exe) to add this scheduled task, as one might expect. Instead, we saw the installer executable load the Task Scheduler COM API, along with a cross-process injection into svchost.exe."
> — Aedan Russell, Red Canary, May 2022

## Implications for the factory

- **For `docs/09`:** ChromeLoader is the canonical example of a *sideload* attack — one that bypasses CWS entirely. The docs should distinguish between "malicious extension distributed via CWS" (PDF Toolbox, Dataspii) and "malicious extension never in CWS" (ChromeLoader). The factory's CWS-publishing workflow is irrelevant to this threat class; the relevant mitigation is enterprise `ExtensionInstallSources` policy.
- **For the validator:** Not applicable — ChromeLoader never enters CWS, so no CWS-level rule catches it.
- **For the template itself:** No direct change. But the welcome-page pattern of requesting permissions from CWS-installed extensions via user gesture is the right design — it keeps the install provenance auditable.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_redcanary_chromeloader-pushy-malvertiser.md`](../blogs/2026-04-17_redcanary_chromeloader-pushy-malvertiser.md)
- **Original URL:** https://redcanary.com/blog/threat-detection/chromeloader/
- **Wayback:** not archived (wayback returned null at capture time)
- **Published:** May 2022 (Red Canary)
