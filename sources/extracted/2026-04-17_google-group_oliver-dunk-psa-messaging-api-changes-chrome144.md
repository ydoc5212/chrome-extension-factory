---
extracts:
  - sources/forums/2026-04-17_google-group_oliver-dunk-psa-messaging-api-changes-chrome144.md
extracted_at: 2026-04-17
title: "Chrome 144 messaging API changes: Promise returns in onMessage, browser namespace, polyfill becomes noop"
author: Justin Lulejian (Chrome Extensions team), Oliver Dunk (Chrome DevRel)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/4txWvDW55hU
evidence_class: a
topics:
  - messaging-api
  - manifest-v3
  - breaking-change
  - chrome144
  - browser-namespace
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Chrome 144 messaging API changes: Promise returns in onMessage, browser namespace, polyfill becomes noop

## TL;DR

Chrome 144 (Stable: Jan 13, 2026) introduces Promise-returning `runtime.onMessage` listeners, the `browser` namespace as default, and polyfill-alignment behavior changes; the webextension-polyfill becomes a noop and extensions relying on it for callback→promise conversion need auditing.

## Signal

This is an official PSA posted by the Chrome Extensions team (Justin Lulejian, CC Oliver Dunk) on Nov 5, 2025. Three related changes ship together in Chrome 144:

1. **`browser` namespace available by default** — as an optional alternative to `chrome`, aligning with Firefox extension API surface. The `browser` namespace was announced earlier and now launches with these changes.

2. **Promise returns from `runtime.onMessage` listeners** — Previously, returning a Promise from an `onMessage` listener did not work in Chrome; you had to call `sendResponse` asynchronously. In Chrome 144, `return new Promise(resolve => resolve('value'))` in a listener is valid. This eliminates the most common reason to use webextension-polyfill.

3. **Error behavior alignment with polyfill** — If a listener throws before responding, the sender's Promise rejects. Listener ordering matters: the first listener to throw determines the rejection; subsequent listeners are not consulted.

The critical operational note: the webextension-polyfill **will become a noop** when these changes take effect (it detects Chrome's capability and stops wrapping). Extensions that rely on the polyfill for the callback→Promise bridge need to test against Chrome 144 Canary. Extensions that use the polyfill for Firefox compatibility still need it for Firefox, just not Chrome.

## Key quotes

> "We strongly encourage you to test these new features to see if your extension(s) require any messaging adjustments since the polyfill will become a noop when these changes take effect."
> — Justin Lulejian, Chrome Extensions team, Nov 5, 2025

> "The first listener to throw an error will cause the sender's promise to reject."
> — PSA body, Nov 5, 2025

## Implications for the factory

- **For `docs/09`:** Add Chrome 144 as a significant milestone: messaging patterns shift from callback-only to Promise-native. Polyfill users should audit.
- **For the validator:** No rule needed — this is a runtime behavior change, not a manifest violation.
- **For the template itself:** The factory's `utils/messaging.ts` uses `@webext-core/messaging` which wraps the native API. Verify this library handles Chrome 144 behavior correctly (especially the error-propagation changes). If the factory exposes raw `runtime.onMessage` examples, update them to show the Promise return pattern.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_oliver-dunk-psa-messaging-api-changes-chrome144.md`](../forums/2026-04-17_google-group_oliver-dunk-psa-messaging-api-changes-chrome144.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/4txWvDW55hU
- **Wayback:** https://web.archive.org/web/20260417024931/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/4txWvDW55hU
