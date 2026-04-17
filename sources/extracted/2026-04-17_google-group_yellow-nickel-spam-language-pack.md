---
extracts:
  - sources/forums/2026-04-17_google-group_yellow-nickel-spam-language-pack.md
extracted_at: 2026-04-17
title: "Yellow Nickel — spam/metadata policy flags trigger auto-rejection loop that persists after the issue is cleared"
author: Michael Robby (developer)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GpA-af17wjQ
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

# Yellow Nickel — spam/metadata policy flags trigger auto-rejection loop that persists after the issue is cleared

## TL;DR

Yellow Nickel (Spam and Placement in the Store) can create a persistent auto-rejection loop where the extension is blocked even after the metadata violation is resolved; support team response recommending resubmission does not break the loop.

## Signal

Yellow Nickel is the code for violating the CWS "Spam and Placement in the Store" policy — specifically around misleading, irrelevant, excessive, or keyword-stuffed metadata. This thread documents a destructive secondary effect: once Yellow Nickel fires, the extension goes into an auto-rejection state that persists for weeks even after the policy violation is corrected.

The developer received Yellow Nickel on a language pack update (adding new locale strings), was told by support that the extension was now compliant but to resubmit — and then received the same auto-rejection 20+ times over 10+ days. The support team's "you're compliant, resubmit" response is not sufficient to break the automated gate.

This is an under-documented operational risk: Yellow Nickel flags can stick to an extension ID as a "bad actor" signal in the automated review system even after the underlying metadata is cleaned up. Resolution typically requires a human review escalation via One Stop Support, not repeated resubmission.

## Key quotes

> "I've got auto rejection email from Chrome Webstore (after 30s)... I submit support request (no less than 3 times)... 'we took a closer look at your submission and found it to be compliant with our policies. Unfortunately, we cannot approve a submission that has been rejected. Hence, we request you to re-submit your extension.' But when I re-submit my extension, I always got auto rejection."
> — Michael Robby, Aug 4, 2020

## Implications for the factory

- **For `docs/09`:** Yellow Nickel can trigger an auto-rejection loop that doesn't self-resolve after fixing the metadata. If resubmission continues to auto-reject, escalate to One Stop Support — don't just keep resubmitting.
- **For the validator:** The `check:cws:ship` listing content checks (description, title) are the preventive control. Catch keyword stuffing before submission, not after.
- **For the template itself:** `docs/templates/` listing template should note: no keyword lists, no localized keyword dumps appended to descriptions.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_yellow-nickel-spam-language-pack.md`](../forums/2026-04-17_google-group_yellow-nickel-spam-language-pack.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GpA-af17wjQ
- **Wayback:** https://web.archive.org/web/20260417024829/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/GpA-af17wjQ
