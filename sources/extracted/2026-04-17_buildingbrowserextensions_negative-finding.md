---
extracts: []
extracted_at: 2026-04-17
title: "buildingbrowserextensions.com — no independent blog; Substack already captured"
author: Matt Frisbie
url: https://buildingbrowserextensions.com
evidence_class: d
topics:
  - negative-finding
  - capture-candidates
feeds_docs: []
---

# buildingbrowserextensions.com — book companion site with no independent blog content

## TL;DR

No raw capture was taken. The book's companion site (`buildingbrowserextensions.com`) has a "BLOG" nav link that points directly to `mattfrisbie.substack.com` — the same Substack already captured in Batch 4. There is no independent blog at the domain. No additional capture action is required.

## Signal

The site is a single-page book companion for Matt Frisbie's *Building Browser Extensions* (2nd ed., 2025). Its content is:

- A chapter-by-chapter table of contents (15 chapters spanning architecture, APIs, permissions, authentication, testing, publishing, and cross-browser compatibility).
- A link to the book on Amazon ("GET THE BOOK").
- A link to an example Chrome extension on the Chrome Web Store ("EXAMPLE CHROME EXTENSION").
- A "BLOG" link → `mattfrisbie.substack.com` (the Frisbie Substack, already captured).
- An "AUTHOR" link → Frisbie's personal site.

No articles, posts, or blog content are hosted at `buildingbrowserextensions.com` itself. The domain is a static marketing page for the book.

The Frisbie Substack capture set (Batch 4) already covers the relevant blog outputs: 3-part malicious extension teaser series and "Tracking Browser Extension Ownership." Those captures and their extractions are the correct Frisbie capture artifacts; this domain adds nothing to the pipeline.

## Key quotes

No quotable content — the site is a chapter-list and nav links.

## Implications for the factory

- **Not applicable.** No new content to integrate. If Frisbie publishes new extension-specific posts on his Substack in future discovery passes, capture them from `mattfrisbie.substack.com` directly (use `--render` per the Substack scraping note in `_mining-queue.md`).
- **Batch 4 is complete** for this source. The `buildingbrowserextensions.com` item in the queue can be marked done with this negative finding as the artifact.

## Provenance

- **Raw capture:** none — no capture taken (negative finding; no independent blog content exists at this domain).
- **Original URL:** https://buildingbrowserextensions.com
- **Fetch method:** WebFetch (plain HTTP fetch, no render needed — site is static HTML).
- **Related captures already in set:** `sources/blogs/2026-04-17_frisbie-substack_malicious-extensions-part-1.md`, `sources/blogs/2026-04-17_frisbie-substack_malicious-extensions-part-2.md`, `sources/blogs/2026-04-17_frisbie-substack_malicious-extensions-part-3.md`, `sources/blogs/2026-04-17_frisbie-substack_tracking-extension-ownership.md`.
