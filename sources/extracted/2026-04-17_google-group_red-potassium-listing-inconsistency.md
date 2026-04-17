---
extracts:
  - sources/forums/2026-04-17_google-group_red-potassium-listing-inconsistency.md
extracted_at: 2026-04-17
title: "Red Potassium — icon/screenshot metadata must match observed functionality"
author: Olayiwola Ogunlaja (developer), LePoulpe (community)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/q1J6en_HZDk
evidence_class: b
topics:
  - cws-review
  - rejection-codes
  - metadata
  - red-potassium
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Red Potassium — icon/screenshot metadata must match observed functionality

## TL;DR

Red Potassium fires when the icon and/or screenshots are inconsistent with the extension's actual functionality; the practical fix is to submit a video demonstrating the functionality alongside an explanation of how the icon/metadata relate to what the extension does.

## Signal

Red Potassium is a metadata consistency violation: "The metadata provided is irrelevant to the observed functionality." The "metadata" in scope per the CWS rejection email includes icon and screenshots — not just the text description. This is a common confusion point for first-time submitters who interpret "metadata" as description text only.

The community-surfaced resolution tactic (LePoulpe): "The best way to quickly solve a 'Red Potassium' is to provide a video of the functionality of your extension and explain why your icon and metadata match." This suggests reviewers have some discretion once presented with contextual evidence of intent alignment, and that the underlying detection is visual/contextual rather than purely automated.

PhistucK (a prominent community helper) confirmed: yes, the "Icon & Screenshot" line in the rejection email is the literal violating content. These fields need to be changed or their connection to the extension purpose made explicit.

## Key quotes

> "I found that the best way to quickly solve a 'Red potassium' is to provide a video of the functionality of your extension and explain why your icon and metadata match."
> — LePoulpe, Apr 4, 2022

> "Violation: The metadata provided is irrelevant to the observed functionality. Icon & Screenshot"
> — CWS rejection email quoted by developer, Mar 7, 2022

## Implications for the factory

- **For `docs/09`:** Add: Red Potassium = icon and/or screenshots don't visually match the extension's behavior. Fix = update screenshots to show actual UI, plus upload a demo video explaining the alignment. Note "metadata" includes icon/screenshots, not just description text.
- **For the validator:** The `check:cws:ship` mode should prompt for screenshots that match the extension function. No automated visual-consistency check is feasible.
- **For the template itself:** `docs/templates/` screenshot template should note: show the extension UI in action, not generic or stock imagery.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_red-potassium-listing-inconsistency.md`](../forums/2026-04-17_google-group_red-potassium-listing-inconsistency.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/q1J6en_HZDk
- **Wayback:** https://web.archive.org/web/20260417024735/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/q1J6en_HZDk
