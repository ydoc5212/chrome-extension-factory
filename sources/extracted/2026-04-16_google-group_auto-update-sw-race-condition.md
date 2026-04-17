---
extracts:
  - sources/forums/2026-04-16_google-group_auto-update-sw-race-condition.md
extracted_at: 2026-04-16
title: "MV3 service worker goes stale after auto-update (4+ year unresolved bug)"
author: Kyle Edwards (OP) + Simeon Vincent + Oliver Dunk (Chrome DevRel) + practitioner community
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/POU6sW-I39M
evidence_class: b
topics:
  - service-worker
  - manifest-v3
  - auto-update
  - lifecycle
  - reliability
  - chromium-bug
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Chromium issue #40805401 — SW goes "stale" after auto-update, unresolved since 2021

## TL;DR

A 4-year thread (Jun 2021 → Aug 2025, 80+ posts, 8,203 views) documenting a real MV3 bug tracked at **https://issues.chromium.org/issues/40805401**: after Chrome auto-updates an extension, a small fraction of users (reports range from ~0.01% to ~1% of update events) end up with a service worker that reports itself "active" in `chrome://serviceworker-internals/` but receives **no events at all** — no `chrome.tabs`, no `webNavigation`, no `webRequest`, no message-port traffic. No user-facing error; the extension silently stops working. **Workarounds:** (1) ask the user to toggle the extension off/on or restart Chrome; (2) reinstall. **No programmatic fix exists as of Aug 2025.** Oliver Dunk (Chrome DevRel) remains engaged but the underlying bug was reassigned in May 2025 with no ETA. Named affected extensions include Superhuman, Paperpile, BrightHire.

## Signal

This is the single most important "known MV3 limitation" a factory-user needs to be aware of. It's not a bug anyone can fix in their own code — it's a Chromium-side race condition on update — so knowing it exists prevents wasted debugging hours and shapes how you design user-facing error handling.

The practitioner community in the thread tried everything:
- Simeon Vincent's **try/catch wrapper.js** pattern (a thin `importScripts("background.js")` wrapper wrapped in try/catch, introduced Nov 2021) — never caught any exception, suggesting the SW isn't throwing, it's just in a broken state.
- `navigator.serviceWorker.getRegistrations()` checks from an extension page — sometimes shows the right registration, sometimes multiple, sometimes stale.
- Forced-update via `chrome.runtime.onUpdateAvailable` + `chrome.runtime.reload()` — the pattern from the docs, actually exacerbates the issue in some cases (Patrick Bakke / Superhuman team had to roll it back).
- Server-side simulation of CWS update flow (Rui Conti team) — couldn't reproduce.

The stale state is **not** caught by any listener, including top-level listeners (so the separate "register listeners at top level" rule from sources/extracted/2026-04-16_google-group_sw-event-listeners-top-level.md is necessary but not sufficient). The SW is alive-but-deaf.

**Detection heuristic** (practitioner consensus): if your extension has a content script that sends a message to the SW on page load, have the content script time out after 2–3 seconds. If the SW never responds, surface a non-blocking notification asking the user to reload the extension. Several teams in the thread implement this pattern.

**The forced-update gotcha** (Kyle Edwards, original post): the pattern from `developer.chrome.com/docs/extensions/reference/runtime/#event-onUpdateAvailable`:
```
chrome.runtime.onUpdateAvailable.addListener(() => chrome.runtime.reload());
```
Looks fine in docs but *correlates with* (not necessarily *causes*) the bug. Patrick Bakke's Superhuman team tried this in 2025 and had to disable it. If your extension does this and you start getting user reports of silent failures, prime suspect.

**Affected extensions named in the thread:**
- BrightHire (id: `mbokiighkhdopgedihndpibkincpcgan`) — OP, 1000+ users, ~1% per release
- Superhuman (id: `dcgcnpooblobhncpnddnhoendgbnglpn`) — ~1/10000 per upgrade event reported March 2025
- Paperpile — noted affected in 2024
- Extensions at socialfrontier, ensopi — also impacted

This is not rare bad-luck territory — it's a consistent low-percentage failure mode across a cross-section of real shipping extensions.

## Key quotes

> "The issue ([https://issues.chromium.org/issues/40805401](https://issues.chromium.org/issues/40805401)) was reassigned recently and I'm hopeful we might see some progress there soon. I'm sorry this has taken so long, and it is definitely still on our radar."
> — Oliver Dunk (Chrome DevRel), May 19 2025

> "Based on our data, approximately 1/10000 upgrade events fail with this behavior (pretty rough estimate). Our only known remediation is asking these users to toggle the extension off/on or fully restart chrome. Obviously, this is clumsy and disruptive."
> — Patrick Bakke (Superhuman), March 27 2025

> "By stale state, I mean a state in which the Service Worker does not receive _any_ chrome. events — tabs, webNavigation, webRequests — nada; not from listeners registered at startup and neither from listeners registered adhoc, in devtools when debugging. The Service Worker reports itself as 'active', and we can see it as such on internals page, as well as introspecting its state on globalThis."
> — Rui Conti, Aug 26 2025, clearest technical description of the failure mode

> "Another thing you may want to try is to wrap your SW in a try/catch. The least disruptive way to do this is to introduce a try/catch wrapper script as your background context."
> — Simeon Vincent, Jun 24 2021, the original (ultimately ineffective) mitigation

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** add a new "Known MV3 reliability issues" section under Service Worker Lifecycle. First bullet: "~0.01–1% of auto-update events leave the SW in a silent failure state (Chromium #40805401, open as of 2025). No programmatic fix; design your user-facing flows to recover gracefully." Link this extraction + the Chromium bug.
- **For the validator (`scripts/validate-cws.ts`):** add a `ship` mode **warning** (not an error): if `entrypoints/background.ts` uses `chrome.runtime.onUpdateAvailable` with `chrome.runtime.reload()`, emit a note about the SW-stale race condition and suggest either skipping forced-update or adding the content-script ping recovery pattern below.
- **For the template itself:** ship a new `utils/sw-liveness.ts` helper implementing the practitioner-consensus detection heuristic:
  - From a content script or popup, send a lightweight ping to the SW.
  - Timeout at 2–3 seconds.
  - On timeout, surface a non-blocking notification ("Extension needs a refresh — click to reload") that calls `chrome.runtime.reload()` when clicked.
  Wire it into the factory's `entrypoints/content.ts` as an example pattern with a prominent comment linking this extraction.
- **For `docs/01-extension-type-profiles.md`:** the "full hybrid" and "content-script-only" profiles should both include this liveness-check pattern by default. User can delete it if they don't need it, but the opt-in cost of "detect stale SW" is too high to expect everyone to discover this from scratch.
- **For `docs/05-useful-patterns.md`:** the welcome/onboarding page is a natural place to document the stale-SW recovery for end users ("If the extension stops responding, click here to reload it"). Consider a self-healing "reload extension" button that any user can find.

## Provenance

- **Raw capture:** [`../forums/2026-04-16_google-group_auto-update-sw-race-condition.md`](../forums/2026-04-16_google-group_auto-update-sw-race-condition.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/POU6sW-I39M
- **Wayback:** https://web.archive.org/web/20260416224152/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/POU6sW-I39M
- **Canonical Chromium bug:** https://issues.chromium.org/issues/40805401 (reassigned May 2025, still open)
- **Reference shipping extension (for live repro):** Superhuman `dcgcnpooblobhncpnddnhoendgbnglpn`, BrightHire `mbokiighkhdopgedihndpibkincpcgan`
- **Related extracted:** `sources/extracted/2026-04-16_google-group_sw-event-listeners-top-level.md` (the adjacent "register listeners at top level" rule — necessary but not sufficient to avoid this class of failure).
