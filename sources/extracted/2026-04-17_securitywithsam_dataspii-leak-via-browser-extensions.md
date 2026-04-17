---
extracts:
  - sources/blogs/2026-04-17_securitywithsam_dataspii-leak-via-browser-extensions.md
extracted_at: 2026-04-17
title: "DataSpii — eight extensions exfiltrated 4M users' browsing data to a commercial data broker in near real-time"
author: Sam Jadali
url: https://securitywithsam.com/2019/07/dataspii-leak-via-browser-extensions/
evidence_class: b
topics:
  - security
  - malicious-extensions
  - dataspii
  - data-exfiltration
feeds_docs:
  - docs/09-cws-best-practices.md
---

# DataSpii (2019) — browsing history as a product: eight extensions sold 4M users' data to a broker in real-time

## TL;DR

Sam Jadali's 2019 disclosure documents eight Chrome/Firefox extensions (Hover Zoom, SpeakIt!, SuperZoom, FairShare Unlock, SaveFrom.net Helper, PanelMeasurement, Branded Surveys, Panel Community Surveys) that covertly collected full browsing URLs, page titles, and metadata and sold the feed to "Company X" (later identified as Nacho Analytics). Subscribers could query any domain in near real-time — within one hour of a page visit. The exposure covered PII, API keys, corporate secrets, and internal network data from Fortune 500 companies.

## Signal

DataSpii is the foundational case study for "browsing history as an attack surface." The extensions didn't inject code or steal credentials — they simply reported every URL the browser visited, with sufficient metadata that third parties could reconstruct internal workflows, access shared collaboration links, and harvest API keys and authentication tokens embedded in URLs.

**The dilatory tactic:** At least two extensions used a multi-stage activation: install, receive several "clean" automated updates, then activate data collection only after a delayed update. This pattern — similar to PDF Toolbox's 24-hour delay — is specifically designed to defeat automated post-install analysis and reviewers who check extensions at install time.

**The data categories exposed (from Jadali's Table 1) span seven types:**
1. Shared links — Zoom meeting URLs, Skype join links, 23andMe genetic profile links, iCloud photo albums, Nest camera streams, JSFiddle code — all accessible to anyone with the URL
2. PII in URLs — passenger names, confirmation numbers, GPS coordinates, email addresses embedded in airline/rideshare booking pages
3. Page titles — project management tasks, firewall configs, operational details from Atlassian, OneDrive, healthcare platforms
4. File attachments — documents shared via Facebook Messenger and Zendesk tickets (publicly accessible links)
5. Ephemeral links and auth strings — AWS S3 pre-signed URLs, time-limited access tokens, expired before discovery but confirmed via honeypot
6. API keys — live authentication credentials for services the user was logged into
7. Private LAN data — internal network infrastructure exposed via page metadata from Fortune 500 internal tools

**The honeypot confirmation:** Jadali created unique URLs on a control domain, visited them using browsers running affected extensions, and observed third-party visits from AWS netblocks associated with `kontera.com` within 3–5 hours. This is tamper-evident proof of near-real-time data transmission and exploitation.

**The vendor response gap:** Google, Mozilla, and Opera remotely disabled the extensions after disclosure — but Jadali found that remote disabling was insufficient: extensions continued collecting data until manually removed by users. This is a permanent finding: remote kill switches are not reliable mitigations for extensions already installed.

**Evidence class elevated to b:** This is an academic-style technical disclosure with a honeypot experiment, structured data tables, and confirmed response from multiple browser vendors and Fortune 500 companies. Jadali's methodology is rigorous enough to treat as class-b (practitioner research with direct experimentation), not just a blog post.

## Key quotes

> "Imagine if someone could publicly access, in near real-time — within an hour — your sensitive personal data on the websites you are browsing."
> — Sam Jadali, DataSpii disclosure, July 18, 2019

> "We observed two extensions employing dilatory tactics — an effective maneuver for eluding detection — to collect the data."
> — Sam Jadali, DataSpii disclosure, July 18, 2019

> "The online service, referred to in this report as Company X, then provides the collected data to its paid or free-trial members who request such data about any domain of their choosing."
> — Sam Jadali, DataSpii disclosure, July 18, 2019

## Implications for the factory

- **For `docs/09`:** DataSpii is the canonical example of "data-broker infiltration via extension ecosystem." The signal here is that *URL metadata alone* — no injected code, no credential interception — is sufficient for catastrophic data exposure when browsing history is sold commercially. The factory's guidance on `optional_host_permissions` and narrow permission scope is directly motivated by this attack class.
- **For the validator (`scripts/validate-cws.ts`):** The "unnecessary host permissions" and "broad matches" rules are directly grounded in DataSpii: an extension with `"<all_urls>"` or very broad host patterns can exfiltrate browsing history with no additional code beyond a simple `webNavigation` listener. The validator's check for broad patterns is, in part, a DataSpii mitigation.
- **For the template itself:** The template's use of `optional_host_permissions` and user-gesture-triggered permission requests specifically prevents the "installed with broad access, collecting silently" pattern that made DataSpii possible. The welcome-page design is the right counter-pattern.
- **On the remote-kill-switch finding:** Relevant for the factory's "what happens if your extension is compromised" section — users should be told to *uninstall*, not just disable, any extension suspected of malicious behavior.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_securitywithsam_dataspii-leak-via-browser-extensions.md`](../blogs/2026-04-17_securitywithsam_dataspii-leak-via-browser-extensions.md)
- **Original URL:** https://securitywithsam.com/2019/07/dataspii-leak-via-browser-extensions/
- **Wayback:** not archived (wayback returned null at capture time; dataspii.com also exists as a companion disclosure site)
- **Published:** July 18, 2019 (updated August 9, 2024); Sam Jadali / SecurityWithSam.com
- **Media coverage:** Ars Technica, The Register, Salon, ExpressVPN blog, Sophos News
