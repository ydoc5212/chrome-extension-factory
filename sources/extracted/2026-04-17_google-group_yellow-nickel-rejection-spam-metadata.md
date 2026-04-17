---
extracts:
  - sources/forums/2026-04-17_google-group_yellow-nickel-rejection-spam-metadata.md
extracted_at: 2026-04-17
title: "Yellow Nickel — keyword stuffing in CWS listing triggers removal and persistent auto-rejection on resubmit"
author: Malcolm Mason Rodriguez (developer), Stefan Van Damme (community)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/P-bhOJgCwpY
evidence_class: b
topics:
  - cws-review
  - rejection-codes
  - spam-policy
  - yellow-nickel
  - auto-rejection
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Yellow Nickel — keyword stuffing in CWS listing triggers removal and persistent auto-rejection on resubmit

## TL;DR

Keyword stuffing at the end of a CWS store listing page triggers Yellow Nickel removal; after the extension is pulled, every resubmission auto-rejects even after the metadata is cleaned up, and creating a new listing does not reliably escape the block.

## Signal

This thread documents the same auto-rejection-loop pattern as the language-pack Yellow Nickel thread, but with a clearer causal chain: the developer admits "stuffing a bunch of keywords at the end [of the] web store listing page" as the policy trigger. The extension was published successfully, then removed 6 minutes later after automated detection. After cleaning the listing, every resubmission continued to auto-reject.

The developer raises the "new listing" escape hatch — a common instinct — but the thread (and community knowledge) suggests the ID-level block does not transfer cleanly to a new ID if the underlying extension is substantially the same.

The key insight here is that Yellow Nickel is not just a review gate: it is a removal action, and once an extension ID is flagged for a Spam violation, the automated system remembers. Human escalation (One Stop Support or direct community appeal) is required to unblock the ID. This can take months in the worst cases.

## Key quotes

> "I believe this was due to stuffing a bunch of keywords at the end [of the] web store listing page. I didn't realize that this was not allowed. I updated the listing page but now my extension is automatically rejected when submitted."
> — Malcolm Mason Rodriguez, Apr 29, 2023

> "I have reached out to support but have seen that in many cases this can take months to resolve."
> — Malcolm Mason Rodriguez, Apr 29, 2023

## Implications for the factory

- **For `docs/09`:** Confirm: keyword lists appended to descriptions are a Yellow Nickel trigger. Once triggered, cleanup is not self-resolving — budget weeks to months for manual escalation. Don't stuff keywords; use clear, natural-language description prose.
- **For the validator:** The `check:cws:ship` description-content check (listing-content rule) is the preventive control. The rule should scan for comma-separated keyword lists or repeated terms in the description.
- **For the template itself:** `docs/templates/listing.md` should explicitly forbid keyword lists and include example of correct descriptive prose.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_yellow-nickel-rejection-spam-metadata.md`](../forums/2026-04-17_google-group_yellow-nickel-rejection-spam-metadata.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/P-bhOJgCwpY
- **Wayback:** (none returned)
