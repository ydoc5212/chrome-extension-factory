---
extracts:
  - sources/forums/2026-04-17_google-group_yellow-lithium-launcher-policy-takedown.md
extracted_at: 2026-04-17
title: "Yellow Lithium — single-purpose launcher/redirect extensions get taken down without warning"
author: Vishnu NUK (developer), community
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/YOwgoTD9spA
evidence_class: b
topics:
  - cws-review
  - rejection-codes
  - spam-policy
  - yellow-lithium
  - takedown
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Yellow Lithium — single-purpose launcher/redirect extensions get taken down without warning

## TL;DR

Yellow Lithium is the Spam policy code for extensions whose primary purpose is to launch/install another app, theme, webpage, or extension; it can be applied retroactively to long-standing extensions without advance notice, and the boundary between "launcher" and "webapp with functionality" is ambiguous enough to produce contested takedowns.

## Signal

Yellow Lithium is documented as: "The item's primary purpose is installing or launching another app, theme, webpage, or extension." The full policy citation is the Spam and Placement → Functionality clause: "Do not post an extension with a single purpose of installing or launching another app, theme, webpage, or extension. Extensions with broken functionality — such as dead sites or non-functioning features — are not allowed."

The thread (2,432 views) documents a developer whose 8-year-old extension (60,000 users) was taken down after a support interaction about comment spam removal. The developer disputes the classification: the extension opens an Ookla Speedtest-style web app in a new tab — which the developer argues adds user functionality (one-click speed test) and is a web app, not a "webpage." The dispute reveals how ambiguous the line is between "an extension that launches a web app" and "a web app with legitimate added value."

Key operational finding: Yellow Lithium takedowns can happen retroactively (even 8-year-old listings) and without pre-notification. The automated policy enforcement does not require Chrome to contact the developer first. "A TakeDown should enforce only when malware or serious wrongdoing is confirmed" is the developer's argument — the reality is that Spam-family violations (Yellow series) can result in immediate removal, not just rejection of a pending update.

## Key quotes

> "Violation reference ID: Yellow Lithium. Violation: The item's primary purpose is installing or launching another app, theme, webpage, or extension."
> — CWS automated removal email, Aug 2021

> "My Extension is not installing or launching another app, theme, webpage or extension. My Extension was adding functionality to chrome. Users can test their Internet speed with just one click of a button."
> — Vishnu NUK, Aug 10, 2021

## Implications for the factory

- **For `docs/09`:** Yellow Lithium applies to extensions whose value proposition is routing users to another web destination. Even long-standing extensions are not safe from retroactive application. Extensions that wrap a web app (e.g., speed test, converter tool) are in the risk zone; they should demonstrate native functionality beyond the redirect.
- **For the validator:** No static rule can catch this. Ship-mode checklist should prompt: "Does the extension perform meaningful work locally, or does it primarily redirect/launch a URL?" If the latter, Yellow Lithium risk is high.
- **For the template itself:** The factory's architecture (popup, content script, options, service worker) provides substantial local functionality — this is the correct pattern. Pure URL-launcher extensions should not be built with this factory.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_yellow-lithium-launcher-policy-takedown.md`](../forums/2026-04-17_google-group_yellow-lithium-launcher-policy-takedown.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/YOwgoTD9spA
- **Wayback:** https://web.archive.org/web/20260417024806/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/YOwgoTD9spA
