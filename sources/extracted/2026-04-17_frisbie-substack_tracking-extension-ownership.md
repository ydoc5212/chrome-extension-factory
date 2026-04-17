---
extracts:
  - sources/blogs/2026-04-17_frisbie-substack_tracking-extension-ownership.md
extracted_at: 2026-04-17
title: "Chrome extensions change owners invisibly — Under New Management + proposed WECG API"
author: Matt Frisbie
url: https://mattfrisbie.substack.com/p/tracking-browser-extension-ownership
evidence_class: c
topics:
  - ownership-changes
  - security
  - supply-chain
  - user-awareness
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Frisbie — Extension ownership transfers are invisible to users; "Under New Management" detects them; a WECG API fix is proposed

## TL;DR

When a Chrome extension is bought and the publisher account transfers ownership, **existing users are not notified** — the new owner pushes an update and browsers silently accept it. Frisbie ships **[Under New Management](https://github.com/classvsoftware/under-new-management)**, an extension that flags when installed extensions have changed owners, and has proposed a [WECG API change](https://github.com/w3c/webextensions/issues/558#issuecomment-1984719588) to surface transfers natively. This is the user-protection frame for the same attack pattern Palant documents technically — acquired extensions quietly escalating privileges and turning malicious. Frisbie reports the Chrome Extensions team is "taking this very seriously" (as of early 2024).

## Signal

This is the canonical public reference on the ownership-transfer attack surface, and — importantly — the one post that names a concrete defensive tool and an in-flight W3C proposal. Use it as the citation when:
- Writing `docs/` content about supply-chain risk at the extension level.
- Telling users how to protect themselves when picking extensions.
- Tracking whether a reviewer-visible ownership-change signal ever ships.

Frisbie's analogy (worth keeping for docs): "Roads are the internet. Traffic signals are browsers. **Seatbelts, mirrors, and collision warnings are browser extensions.** They protect _you_ specifically." The ownership-transfer problem is that the seatbelt you installed can be silently replaced with one that cuts you in half.

Media footprint: The Register covered the tool (Mar 2024), it hit the HN front page (https://news.ycombinator.com/item?id=39620060), and tl;dr sec #221 featured it. That media reach is part of why Chrome team engagement moved from silence to engagement in 2024–2025 — the problem got legible to non-practitioners.

The proposed API change (WECG issue #558) isn't yet specified — as of this extraction's capture, Frisbie's post is the public endpoint on it. Worth checking the issue periodically for a concrete API shape.

## Key quotes

> "Extension developers are constantly getting offers to buy their extensions. In nearly every case, the people buying these extensions want to rip off the existing users."
> — Matt Frisbie

> "When an extension is purchased and transferred, existing users are unaware that any of this has happened. The new owner is free to push updates, and the users' browsers will happily accept and install these updates."
> — Matt Frisbie

> "I've recommended an API change to the Web Extensions Community Group (WECG) to directly address this issue, and I've looped in the Chrome Extensions team. I'm pleased to say that they are taking this very seriously."
> — Matt Frisbie

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** add an "Ownership transfer" bullet under a new "Supply-chain considerations" section. Cite Frisbie's "Under New Management" as a user-facing defense. Note that this is the user-protection frame for the same problem Palant's 02-03 teardown documents (acquired extensions pushing malicious updates).
- **For a new `docs/11-supply-chain.md`:** seed the doc with three concerns: (1) extension ownership can transfer silently, (2) npm dependencies in your extension can be hijacked similarly, (3) CWS does not currently surface transfer events to users or reviewers. Propose a project-internal policy: document the factory extension's ownership-transfer commitment (e.g., "if this repo is transferred to a new owner, we will publish a last-version-from-original-owner advisory").
- **For the validator (`scripts/validate-cws.ts`):** not applicable — this is about post-install user experience, not static manifest analysis. But worth considering a `ship` mode message: "If you plan to sell this extension in the future, review sources/extracted/2026-04-17_frisbie-substack_tracking-extension-ownership.md for ownership-transfer best practices."
- **For the template itself:** `entrypoints/welcome/` (or wherever the onboarding page lives) could link to "Under New Management" as a recommended companion install. Controversial — it makes the factory endorse a specific tool — but a good-faith pro-user signal.
- **Watch item:** WECG GitHub issue #558 for an eventual API to expose ownership changes. If shipped, `docs/09` gets an update and the template can wire it in.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_frisbie-substack_tracking-extension-ownership.md`](../blogs/2026-04-17_frisbie-substack_tracking-extension-ownership.md)
- **Original URL:** https://mattfrisbie.substack.com/p/tracking-browser-extension-ownership
- **Wayback:** https://web.archive.org/web/20260417001634/https://mattfrisbie.substack.com/p/tracking-browser-extension-ownership
- **Under New Management tool:** https://github.com/classvsoftware/under-new-management
- **WECG proposal:** https://github.com/w3c/webextensions/issues/558
- **Related extracted:** `sources/extracted/2026-04-16_palant_02-03-analysis-of-an-advanced-malicious-chrome-extension.md` (the technical-attack frame of the same ownership-transfer problem).
