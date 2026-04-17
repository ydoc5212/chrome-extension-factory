---
extracts:
  - sources/forums/2026-04-16_google-group_sw-event-listeners-top-level.md
extracted_at: 2026-04-16
title: "Register service-worker event listeners at top level, never inside async init"
author: Oliver Dunk (Chrome DevRel) + BoD (OP)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE
evidence_class: b
topics:
  - service-worker
  - manifest-v3
  - lifecycle
  - alarms
  - keepalive
  - sync-storage
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Oliver Dunk — Register SW listeners at top level + Chrome 120+ 30-second alarm floor

## TL;DR

If your MV3 service worker's event listeners fire while dev tools are open but miss events when the SW goes idle and restarts, the bug is almost always the same: listeners registered inside an async function (init, IIFE, promise chain) instead of at the top level of the script. Chrome wakes the SW to handle an event, runs the top-level script synchronously, and dispatches — if your `addListener` call is still pending inside a Promise, the event fires before the listener is attached and is silently lost. **Move every `chrome.*.onX.addListener` to the top of the script, before any `await`.** Also: Chrome 120+ minimum `chrome.alarms` period is 30 seconds (down from 1 minute); `setInterval` is the fallback for sub-30s work if you keep the SW alive via periodic API calls; `chrome.storage.onChanged` on the `sync` area fires across the user's devices.

## Signal

This thread is the single most citable reproduction of the MV3 SW listener-registration gotcha. BoD's symptom ("alarm works while I'm inspecting it, fails otherwise") is the exact pattern every MV3 newcomer hits — the dev-tools-open case keeps the SW alive, so the async listener registration completes in time; once you close dev tools, the SW goes idle, and on wake, the async hasn't run yet when Chrome dispatches the event. Oliver Dunk diagnoses it in one message, cites the official migrate-to-service-workers page, and BoD confirms the fix resolves the issue.

Two secondary signals worth logging:
- Oliver states the Chrome 120+ minimum alarm duration is **30 seconds** with a link to the release notes. Pre-120 was 60 seconds. Anything faster than 30s has to use `setInterval` inside a kept-alive SW — and Oliver explicitly notes that keeping the SW alive via periodic `chrome.*` API calls is the supported pattern, not a hack. Worth distinguishing from the "keepalive port ping" pattern, which is community folklore and reviewer-flagged.
- `chrome.storage.onChanged` listeners on the `sync` area DO fire across the user's devices when synced data updates. Oliver confirms: "If you add an onChanged listener specifically for the sync storage area, that should fire across all devices when updated data is synced :)" This is undocumented in the obvious places and enables cross-device real-time state without polling.

A tertiary open question Oliver left hanging: Roberto's suggestion of `chrome.sync.alarms.create` (cross-device alarm replication) — Oliver said "first time I've seen that suggestion, seems possible" but no follow-up. Worth filing as a feature request for docs/09's "Miscellaneous folklore" section or monitoring for future announcement.

BoD's minimal repro lives at https://github.com/BoD/chrome-extension-alarm/tree/master/extension (commits show the before/after fix) — useful as a live reference extension when explaining the rule to a teammate.

## Key quotes

> "Could you try moving the `chrome.alarms.onAlarm.addListener` call out of the main function and to the top-level of the script? Currently, you're registering it asynchronous, as this means you are likely to miss events when the service worker starts up."
> — Oliver Dunk (Chrome DevRel), Sep 27 2024

> "From Chrome 120, the minimum alarm duration is 30 seconds. If you need anything higher frequency, you should be able to use setInterval. You will just need to make sure you are doing something to keep the service worker alive, such as calling an extension API which extends the service worker's lifetime."
> — Oliver Dunk, Sep 19 2024

> "If you add an onChanged listener specifically for the sync storage area, that should fire across all devices when updated data is synced :)"
> — Oliver Dunk, Sep 19 2024

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** the "Service worker lifecycle" section already lists "Register every event listener synchronously at top level" — strengthen it with the BoD symptom ("works with devtools open, fails when closed") as the canonical diagnostic, and with Oliver's official-docs link to `developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#register-listeners`. Add the Chrome-120+ 30-second alarm floor as a hard number. Add the `chrome.storage.onChanged` cross-device fact as a new bullet under a new "Cross-device state" subsection (currently unwritten).
- **For the validator (`scripts/validate-cws.ts`):** the existing `sw-listener-top-level` rule is marked "best-effort" in `docs/09`. Tighten it: scan `entrypoints/background.ts` (and any file matching `background*.ts`) for `chrome.*.onX.addListener(` calls; fail if the AST node is inside an async function, Promise chain, or any callback (`.then`, `addEventListener`, `setTimeout`, etc.). Reference this extraction in the failure message.
- **For the template itself:** `entrypoints/background.ts` should have a top-of-file comment block: "All `chrome.*.onX.addListener` calls MUST be at the top level of this file, before any `await`. See sources/extracted/2026-04-16_google-group_sw-event-listeners-top-level.md for why." Consider shipping a pre-structured `background.ts` where all listener registrations are visually grouped at the top and business logic is factored into helpers they call.

## Provenance

- **Raw capture:** [`../forums/2026-04-16_google-group_sw-event-listeners-top-level.md`](../forums/2026-04-16_google-group_sw-event-listeners-top-level.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE
- **Wayback:** https://web.archive.org/web/20260416224054/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE
- **Reference repo:** https://github.com/BoD/chrome-extension-alarm/tree/master/extension (minimal repro; commits show before/after)
- **Related extracted:** `sources/extracted/2026-04-16_google-group_auto-update-sw-race-condition.md` (SW restart race on auto-update — adjacent MV3 lifecycle topic).
