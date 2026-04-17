---
extracts:
  - sources/blogs/2026-04-17_bashvlas_main-content-script-james-bond.md
extracted_at: 2026-04-17
title: "MAIN-world content scripts see page internals; trade chrome.* APIs for access to globals + fetch hooks"
author: Vlas Bashynskyi
url: https://bashvlas.com/blog/main-content-script-james-bond
evidence_class: c
topics:
  - content-scripts
  - main-world
  - isolated-world
  - intelligence-gathering
feeds_docs:
  - docs/03-cws-best-practices.md
  - docs/05-useful-patterns.md
---

# Bashvlas — When to use `world: "MAIN"` content scripts: page-global access at the cost of chrome.* APIs

## TL;DR

Chrome extensions default to `world: "ISOLATED"` for content scripts — safer, but you can't read page globals or intercept `window.fetch`. Switching a content script to `world: "MAIN"` puts it inside the page's JS context: access to `window.X` globals, ability to override `window.fetch` / `XMLHttpRequest`, visibility into the page's internal wiring. **Cost:** no access to `chrome.*` APIs, and communication back to the extension only via `window.postMessage` signals. Use MAIN scripts for intelligence gathering (read what the page is doing, not just its DOM); keep isolated scripts for `chrome.*`-API consumers.

## Signal

The factory's existing `docs/03-cws-best-practices.md` flags a validator rule `content-script-main-world` that warns against MAIN. This post is the counterpoint — **MAIN exists for a real reason**, and some extensions legitimately need it (fetch interception for request-observability extensions, reading page-state from SPAs that don't expose data via DOM, instrumenting specific web apps). The validator rule should be a **warning** with a clear justification path, not a hard reject.

Bashvlas's metaphor is useful for docs voice: a MAIN script is James Bond — "you give him a task and send him to execute, cutting ties to it completely. We can still communicate with it, but only through simple `window.postMessage` signals. It has no sense of personal boundaries and can access a website's private parts and see their global variables. It can get inside of a website's wiring and even override `window.fetch` to see how it is communicating with the backend."

Architectural pattern when you need BOTH capabilities:
- `content.ts` in ISOLATED world: calls `chrome.*` APIs, owns message passing to background SW
- `content-main.ts` in MAIN world: reads page globals, intercepts fetch, posts observations via `window.postMessage`
- ISOLATED script listens for those postMessage events and relays to SW

This is the standard pattern; Bashvlas's post affirms it in a single clear sentence.

## Key quotes

> "MAIN content script in a chrome extension is like James Bond. You give James Bond a task and send him to execute, cutting ties to it completely. We can still communicate with it, but only through simple `window.postMessage` signals. It has no sense of personal boundaries and can access a website's private parts and see their global variables."
> — Vlas Bashynskyi

> "Like a real spy it can get inside of a website's wiring and even override `window.fetch` to see how it is communicating with the backend."
> — Vlas Bashynskyi

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** soften the `content-script-main-world` rule from "fail" to "warn + justify." Cite this extraction as the legitimate-use-case reference. Add a sentence: "If your extension needs to observe page globals or intercept `fetch`/XHR, MAIN is required; reviewers will not reject purely on MAIN, but they will scrutinize the justification text."
- **For the validator (`scripts/validate-cws.ts`):** rename/adjust rule `content-script-main-world` — still fire, but emit severity `warn` in standard mode and `info` when a sibling ISOLATED content script is also registered (i.e., user has the standard two-script pattern). Reference this extraction in the message: "MAIN world is valid for fetch interception and page-global access; see sources/extracted/2026-04-17_bashvlas_main-content-script-james-bond.md."
- **For the template itself:** `entrypoints/content.ts` is ISOLATED by default (correct). Add a commented-out `entrypoints/content-main.ts` stub showing the MAIN-world registration pattern + the `window.postMessage` bridge back to ISOLATED. Document when to uncomment it in `docs/05-useful-patterns.md`.
- **For `docs/05-useful-patterns.md`:** add a "Fetch interception from an extension" pattern. Show the two-script setup (MAIN for fetch override, ISOLATED for chrome.* + message relay to background). Link this extraction for the canonical rationale.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_bashvlas_main-content-script-james-bond.md`](../blogs/2026-04-17_bashvlas_main-content-script-james-bond.md)
- **Original URL:** https://bashvlas.com/blog/main-content-script-james-bond
- **Wayback:** https://web.archive.org/web/20260417002058/https://bashvlas.com/blog/main-content-script-james-bond
- **Official docs referenced:** https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world
- **Related extracted:** `sources/extracted/2026-04-16_google-group_content-scripts-matches-review.md` (broader content-scripts-review heuristics).
