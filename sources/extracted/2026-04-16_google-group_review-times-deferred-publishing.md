---
extracts:
  - sources/forums/2026-04-16_google-group_review-times-deferred-publishing.md
extracted_at: 2026-04-16
title: "Review time factors + deferred publishing"
author: Deco (Chrome DevRel) + Oliver Dunk (Chrome DevRel)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs
evidence_class: b
topics:
  - cws-review
  - deferred-publishing
  - review-times
  - permissions
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Deco + Oliver Dunk — The official CWS line on review-time factors, and deferred publishing as the launch tool

## TL;DR

Chrome DevRel's on-record answer on what drives review time: **(1) broad host permissions, (2) sensitive execution permissions, (3) code size/obfuscation**. Deco states there's "nothing a developer can do to shorten the review time" — but that's the official-line framing; the practical remedies (scope permissions, use `activeTab`, move broad access to `optional_host_permissions` + runtime request) live in sibling captures. The tactical insight from this thread is **deferred publishing** — schedule a go-live date, submit early, sidestep the "review took longer than our launch window" failure mode.

## Signal

William A. asked the perennial question: why do some reviews clear in hours and others take days? Deco gave the authoritative answer by quoting the `developer.chrome.com/docs/webstore/review-process/#review-time-factors` page verbatim — three named factors, no more, no less. Oliver Dunk seconded Deco and added one concrete tool the developer can reach for: **deferred publishing** at `developer.chrome.com/docs/webstore/publish/#deferred-publishing`.

Read this thread as the "official line" endpoint — it's what DevRel says publicly. The unofficial complement is `sources/extracted/2026-04-16_google-group_content-scripts-matches-review.md` (Simeon Vincent's clarification that `content_scripts.matches` counts as broad host permissions) and the MacArthur cookbook extraction — both of which extend Deco's list with specific remedies the official docs don't assemble.

Deco's "there isn't anything you can do" is technically true (everyone queues equally) but misleading in aggregate: the developer CAN shape how long review takes by shaping what their extension declares. The three named factors are all developer-controlled. The folklore about `optional_host_permissions` avoiding in-depth review (the headline finding of `docs/09`) is consistent with Deco's list — moving from `host_permissions` to `optional_host_permissions` reduces the "broad host permissions" signal without removing capability.

## Key quotes

> "Reviews may take longer for extensions that request broad host permissions or sensitive execution permissions, or which include a lot of code or hard-to-review code."
> — Deco (Chrome DevRel), Apr 20 2023, quoting `developer.chrome.com/docs/webstore/review-process`

> "There isn't anything you as a developer can do to shorten the review time, everyone goes through the same process. Mainly, be vigilant of what you are changing, try and if possible factor this into how long a review will take."
> — Deco, Apr 20 2023

> "Some variance is expected, but we do try to keep the times down as much as possible. Deferred publishing can help in some situations if you're planning for a launch."
> — Oliver Dunk (Chrome DevRel), Apr 20 2023

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** the "Updates & re-review triggers" section already mentions deferred publishing. Elevate it to a standalone bullet: "For any extension with a launch date, use deferred publishing — submit 7–14 days before go-live, schedule the publish, absorb review variance without launch-day pain." Cross-reference this extraction.
- **For `docs/03-cws-best-practices.md`:** add a "Deferred publishing" subsection. The link `developer.chrome.com/docs/webstore/publish/#deferred-publishing` is the spec; the justification ("review variance is unpredictable; queue time ≠ wall time") is the pitch to someone planning a marketing push.
- **For the validator (`scripts/validate-cws.ts`):** no new rules — this extraction's insight is procedural, not static-analyzable. Possibly a `ship` mode warning: "first submission on a new publisher account expects manual review; plan for up to 3 weeks."
- **For the template itself:** not applicable. This is a shipping-playbook insight, not a code pattern.

## Provenance

- **Raw capture:** [`../forums/2026-04-16_google-group_review-times-deferred-publishing.md`](../forums/2026-04-16_google-group_review-times-deferred-publishing.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs
- **Wayback:** https://web.archive.org/web/20260416224123/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BrwVKyIvCMs
- **Related extracted:** `sources/extracted/2026-04-16_google-group_content-scripts-matches-review.md` (Simeon's expansion of the "broad host permissions" definition), `sources/extracted/2026-04-16_macarthur_posts-chrome-extension-host-permission.md` (the practitioner cookbook for the remedies Deco's list implies).
