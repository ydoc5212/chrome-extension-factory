---
extracts:
  - sources/forums/2026-04-17_google-group_oliver-dunk-rollback-mv3-to-mv2.md
extracted_at: 2026-04-17
title: "MV3 rollback to MV2 is possible if the extension originally shipped as MV2"
author: bradcush (developer), Simeon Vincent (Chrome DevRel, 2022), Oliver Dunk (Chrome DevRel, 2025)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/Ko9TuoEFEZ4
evidence_class: b
topics:
  - manifest-v3
  - manifest-v2
  - rollback
  - cws-policy
  - oliver-dunk
feeds_docs:
  - docs/09-cws-best-practices.md
---

# MV3 rollback to MV2 is possible if the extension originally shipped as MV2

## TL;DR

An extension that originally published as MV2 and migrated to MV3 can roll back to MV2 via the Chrome Web Store; Oliver Dunk confirmed in Jan 2025 that no policy changes had been made to this capability.

## Signal

The original 2022 question (bradcush) asks whether a MV2 extension that is incrementally migrating to MV3 via staged rollout can roll back if problems are detected. Simeon Vincent confirmed: "if your extension started as MV2 and you migrated to MV3, Chrome Web Store will let you move back to MV2."

Oliver Dunk reconfirmed this same answer in January 2025, after MV2 deprecation enforcement was underway, when a developer (Sashank Gunda) asked whether the MV2 submission block had changed this: "We haven't made any recent changes to the Chrome Web Store around the handling of Manifest V2 extensions. You should be able to rollback in the same way Simeon described."

The practical constraint is the original-manifest condition: extensions that were created as MV3 from the start cannot roll back to MV2. Only those that have a MV2 publishing history can downgrade. This is relevant for incremental migration strategies.

## Key quotes

> "Yep, if your extension started as MV2 and you migrated to MV3, Chrome Web Store will let you move back to MV2."
> — Simeon Vincent, May 11, 2022

> "We haven't made any recent changes to the Chrome Web Store around the handling of Manifest V2 extensions. You should be able to rollback in the same way Simeon described."
> — Oliver Dunk, Jan 6, 2025

## Implications for the factory

- **For `docs/09`:** Note: MV2 rollback is possible only for extensions with a MV2 publication history. This factory creates MV3-only extensions (no rollback path available). For teams migrating existing MV2 extensions using this factory as a base, staged rollout with MV2 fallback is technically available.
- **For the validator:** No rule needed.
- **For the template itself:** The factory is MV3-only by design. No change needed.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_oliver-dunk-rollback-mv3-to-mv2.md`](../forums/2026-04-17_google-group_oliver-dunk-rollback-mv3-to-mv2.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/Ko9TuoEFEZ4
- **Wayback:** https://web.archive.org/web/20260417025044/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/Ko9TuoEFEZ4
