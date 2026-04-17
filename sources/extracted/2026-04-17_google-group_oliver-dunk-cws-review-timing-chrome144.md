---
extracts:
  - sources/forums/2026-04-17_google-group_oliver-dunk-cws-review-timing-chrome144.md
extracted_at: 2026-04-17
title: "CWS has no expedited review process; Oliver Dunk can intervene privately for breaking-change updates"
author: Ahmed Rafi Ullah (developer), Oliver Dunk (Chrome DevRel)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/pZE7JESZO-Y
evidence_class: b
topics:
  - cws-review
  - review-timing
  - chrome144
  - oliver-dunk
feeds_docs:
  - docs/09-cws-best-practices.md
---

# CWS has no expedited review process; Oliver Dunk can intervene privately for breaking-change updates

## TL;DR

There is no official CWS expedited review path; Oliver Dunk confirmed this explicitly, but offered to intervene privately for a 2M-user extension blocked by the Chrome 144 messaging API breaking change.

## Signal

A developer with a ~2 million user extension submitted an update on Jan 11, 2026 — two days before Chrome 144 Stable (Jan 13) — to fix a login breakage caused by the Chrome 144 messaging API change. They requested expedited review. Oliver Dunk's response, within ~3 hours:

"We don't have a process for expediting reviews — however I will reach out privately to make sure we can minimize the impact of this."

Two takeaways for factory users:

1. **There is no formal expedited review lane.** Planning for Chrome API breaking-change updates must include enough runway for a standard review cycle (which can be 1–7+ days). Submitting the day before a Stable rollout is too late.

2. **Posting on the Google Group with Oliver Dunk CC'd can result in informal intervention** for high-impact situations (millions of users, documented breaking change). This is not a guaranteed path but is the highest-leverage escalation available outside One Stop Support.

## Key quotes

> "We don't have a process for expediting reviews — however I will reach out privately to make sure we can minimize the impact of this."
> — Oliver Dunk, Jan 12, 2026

> "This extension has ~2 million active users, so the Chromium 144 rollout (scheduled for Jan 13 according to the PSA announcement) could result in user-facing login issues if the update does not clear review in time."
> — Ahmed Rafi Ullah, Jan 12, 2026

## Implications for the factory

- **For `docs/09`:** State explicitly: CWS has no expedited review queue. When a Chrome API breaking change is announced (e.g., via PSA in the Group), submit the compatibility fix immediately — not the day before Stable. 3–7 day review buffer is the safe minimum.
- **For the validator:** No rule needed.
- **For the template itself:** No code change needed. Operational knowledge only.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_oliver-dunk-cws-review-timing-chrome144.md`](../forums/2026-04-17_google-group_oliver-dunk-cws-review-timing-chrome144.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/pZE7JESZO-Y
- **Wayback:** (none returned)
