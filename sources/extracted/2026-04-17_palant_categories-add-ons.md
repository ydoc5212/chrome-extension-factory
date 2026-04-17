---
extracts:
  - sources/blogs/2026-04-17_palant_categories-add-ons.md
extracted_at: 2026-04-17
title: "Palant add-ons category index: directory listing (capture-candidate triage)"
author: Wladimir Palant
url: https://palant.info/categories/add-ons/
evidence_class: c
topics:
  - index
  - capture-candidates
  - cws-review
  - extension-security
feeds_docs: []
---

# Palant add-ons category index — directory page; top capture candidates triaged for next discovery pass

## TL;DR

This is a curation aid, not a content synthesis. The capture script retrieved only the page shell (392 chars) because the post list is rendered into the HTML server-side but filtered by a category index that the plain-fetch pass underweights; the full post list was recovered via direct WebFetch. The index spans 2014–2025, with the highest-signal cluster in Jan–Feb 2025 (CWS policy enforcement teardowns) and a dense 2022–2023 run of extension-security vulnerability analyses. Top 5 follow-up capture candidates are identified below.

## Signal

Palant's add-ons category contains 35+ posts covering two largely non-overlapping clusters:

**Cluster A — CWS store-level failures (2024–2025):** Policy-enforcement gaps, store-search manipulation, malicious extension campaigns, remote-code-ban circumvention. The Jan–Feb 2025 posts (already captured in Batch 3) are the headline pieces. Two uncaptured Jan 2025 posts are high priority: "BIScience: Collecting browsing history under false pretenses" (Jan 13 2025) and "How extensions trick CWS search" (Jan 8 2025). Both extend the "CWS is a mess" series with specific attacker techniques.

**Cluster B — Extension-security vulnerability teardowns (2021–2023):** XSS via extension pages, CSS injection, web-accessible resource abuse, same-origin policy bypass, keylogger bypass via anti-keylogger extension. These are adversarial analyses of published extensions — useful for hardening the factory template against the attack surface Palant repeatedly finds exploitable. The 2022 "Anatomy of a basic extension" / "Attack surface of extension pages" / "When extension pages are web-accessible" trilogy is particularly load-bearing for understanding what the factory should guard against by default.

**Cluster C — 2023 malicious extension campaigns:** PDF Toolbox (already a Batch 6.5 follow-up target), PCVARK ad-blockers, browser-extension games needing all-sites access. These are incident-response teardowns with concrete bypass techniques.

The 2020 "A grim outlook on the future of browser add-ons" is an older policy-vision piece; lower priority now that MV3 is settled.

## Key quotes

No direct quotes available from the index page itself — it is a title/date listing only.

## Implications for the factory

- **Not applicable directly** — this is a discovery aid. The output is the triaged capture-candidate shortlist below.
- **For `docs/09`:** the "How extensions trick CWS search" and "BIScience" posts may surface metadata-manipulation attack patterns (keyword stuffing, false permission claims) that could inform validator rules.
- **For the validator (`scripts/validate-cws.ts`):** the 2022 "web-accessible resources" trilogy may motivate a rule checking `web_accessible_resources` scope is not overly broad.

## Top 5 follow-up capture candidates

Ranked by title-level specificity to factory-relevant topics:

1. **"How extensions trick CWS search"** (Jan 8 2025) — `https://palant.info/2025/01/08/how-extensions-trick-cws-search/` — attacker techniques for gaming CWS discoverability (keyword stuffing, fake reviews, metadata abuse). Informs the listing-quality checks in ship mode.

2. **"BIScience: Collecting browsing history under false pretenses"** (Jan 13 2025) — `https://palant.info/2025/01/13/biscience-collecting-browsing-history-under-false-pretenses/` — extension that misrepresents its data collection in CWS listing. Direct complement to the "CWS is a mess" series already captured; likely quotes exact policy language Palant cites against the extension.

3. **"When extension pages are web-accessible"** (Aug 31 2022) — `https://palant.info/2022/08/31/when-extension-pages-are-web-accessible/` — part of a trilogy on extension-page attack surface. Relevant to `web_accessible_resources` hygiene in the factory manifest.

4. **"Malicious code in PDF Toolbox extension"** (May 16 2023) — `https://palant.info/2023/05/16/malicious-code-in-pdf-toolbox-extension/` — already flagged in Batch 6.5 as a follow-up target. The canonical Palant teardown of PDF Toolbox (2M+ installs); shows exactly how remote-code injection was hidden from reviewers.

5. **"How malicious extensions hide running arbitrary code"** (Jun 2 2023) — `https://palant.info/2023/06/02/how-malicious-extensions-hide-running-arbitrary-code/` — technique generalization across multiple malicious extension campaigns. High value for understanding what the MV3 remote-code ban was designed to prevent and how it can still be circumvented.

Lower priority but worth noting: "The Karma connection in Chrome Web Store" (Oct 30 2024) — coordinated fake-review network in CWS; relevant to listing-integrity topic.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_palant_categories-add-ons.md`](../blogs/2026-04-17_palant_categories-add-ons.md)
- **Original URL:** https://palant.info/categories/add-ons/
- **Wayback:** https://web.archive.org/web/20260417024535/https://palant.info/categories/add-ons/
- **Note:** The raw capture contains only the page shell (392 chars) — the plain-fetch pass missed the post list. The full index was recovered via direct WebFetch for this extraction. If the raw capture needs enriching, re-run with `--render` or use `--from-file` from a browser save.
- **Already captured from this author:** `sources/blogs/2026-04-16_palant_01-13-chrome-web-store-is-a-mess.md`, `sources/blogs/2026-04-16_palant_01-20-malicious-extensions-circumvent-googles-remote-code-ba.md`, `sources/blogs/2026-04-16_palant_02-03-analysis-of-an-advanced-malicious-chrome-extension.md` — confirm no overlap with the candidates above during the next mining pass.
