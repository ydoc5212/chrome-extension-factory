---
extracts:
  - sources/blogs/2026-04-17_coditude_purple-family-privacy.md
extracted_at: 2026-04-17
title: "Purple Family (Lithium/Nickel/Copper/Magnesium): user-data privacy rejections"
author: Hrishikesh Kale (Coditude)
url: https://www.coditude.com/insights/understanding-purple-family-rejection-codes-resolving-user-data-privacy-issues/
evidence_class: c
topics:
  - cws-review
  - rejection-codes
  - privacy
  - privacy-policy
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Coditude — Purple Family rejections mean privacy-policy, consent, or transport issues around user data

## TL;DR

**Purple Lithium / Nickel / Copper / Magnesium** rejections flag problems in how the extension collects, discloses, or transmits user data. The common root causes: no publicly accessible privacy policy, vague data disclosure ("we collect user data" with no specifics), data collection before user consent, HTTP instead of HTTPS, collecting more than the stated purpose requires, or bundling third-party SDKs that collect silently. The fix is a complete transparency pass: publish a detailed policy on an HTTPS public URL (not Google Docs, not a PDF, not a GitHub raw link), disclose every field collected and why, gate collection behind explicit consent, use HTTPS everywhere, and minimize to the least data the feature actually needs.

## Signal

Coditude's structural claim: Purple variants all share one root — user data handled without **clear explanation or protection**. The coloured-element distinction tells the developer "privacy family" but the remedy is uniform across all four.

Reviewers are documented as looking for a specific checklist:
- Privacy policy that is **easy to find** on the listing
- A per-data-type breakdown with purpose justification
- Evidence of consent flow before collection starts
- HTTPS-only transport
- Data minimization tied to the extension's stated purpose

The non-obvious gotchas Coditude flags:
1. **Policy hosting matters.** Google rejects privacy policies hosted on Google Docs, PDFs, GitHub raw links, or private/inaccessible URLs. The policy must live at a secure public HTTPS URL — ideally on the org's own website.
2. **SDK audit.** Third-party analytics/auth SDKs can collect data the developer isn't aware of. Every SDK must be inventoried against Chrome's privacy requirements.
3. **Consent before anything.** Background scripts that silently fire telemetry on install are a reliable Purple trigger. Use Chrome's built-in permission prompts — don't build custom pop-ups that can read as misleading.
4. **Purpose-permission cross-check.** Reviewers compare declared permissions to the claimed extension purpose. A tab-layout customizer requesting browsing history is an automatic mismatch.

Coditude's pre-resubmission privacy checklist (worth lifting verbatim): accessible policy link in listing, consent-gated collection, HTTPS-only transmissions, no unused data permissions, no PII unless required, documented SDK audit.

## Key quotes

> "Each colour variation (Lithium, Nickel, Copper, Magnesium) usually signifies variety of privacy policy issues, but they all have a common source, your extension collects, transmits, or uses user data without clear enough explanation or protection."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Google rejects policies hosted google docs, PDFs, GitHub raw links, or inaccessible/private URLs."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Chrome reviewers frequently cross-check permissions against the claimed purpose; any mismatch will lead to another rejection."
> — Hrishikesh Kale, Coditude, 2026-04-17

## Implications for the factory

- **For `docs/03-cws-best-practices.md` → "Privacy & data handling" section:** add the Purple Family rejection labels and Coditude's privacy-policy hosting rules (HTTPS public URL, not Google Docs / PDF / GitHub raw). Add the purpose-permission cross-check as a reviewer heuristic — this is load-bearing for understanding why over-scoped permissions also trigger privacy-family rejections.
- **For `scripts/validate-cws.ts`:** add a rule that verifies the listing's `privacy_policy` URL (when present in submission config) is HTTPS and not on a denylisted host pattern (docs.google.com, drive.google.com, raw.githubusercontent.com, *.pdf). Also add a rule that flags `http://` endpoints in `host_permissions` or in bundled code — emit "likely Purple family: insecure transport."
- **For the template itself:** `docs/templates/` should ship a privacy-policy boilerplate Markdown file aligned to Coditude's disclosure structure (what / why / who shared with / how to opt out). The QA checklist in `docs/templates/qa-checklist.md` should include the six-item pre-resubmission privacy list.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_coditude_purple-family-privacy.md`](../blogs/2026-04-17_coditude_purple-family-privacy.md)
- **Original URL:** https://www.coditude.com/insights/understanding-purple-family-rejection-codes-resolving-user-data-privacy-issues/
- **Wayback:** https://web.archive.org/web/20260417001946/https://www.coditude.com/insights/understanding-purple-family-rejection-codes-resolving-user-data-privacy-issues/
- **Related extracted:** `sources/extracted/2026-04-17_coditude_rejection-codes-overview.md`, `sources/extracted/2026-04-17_coditude_purple-potassium-permissions.md` (sibling Purple family post).
