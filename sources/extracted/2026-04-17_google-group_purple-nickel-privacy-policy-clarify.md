---
extracts:
  - sources/forums/2026-04-17_google-group_purple-nickel-privacy-policy-clarify.md
extracted_at: 2026-04-17
title: "Purple Nickel — privacy policy link must go in the developer dashboard Account field"
author: Giga Spoke (developer)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/uaU-ltmUd80
evidence_class: b
topics:
  - cws-review
  - rejection-codes
  - privacy-policy
  - purple-nickel
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Purple Nickel — privacy policy link must go in the developer dashboard Account field

## TL;DR

Purple Nickel fires when the privacy policy link is missing from the dedicated "Privacy policy" field in the developer dashboard Account section; putting it in the description or Support URL field is not sufficient.

## Signal

Purple Nickel is a User Data Policy violation: the extension handles personal/sensitive user data but the privacy policy link is absent from the field the CWS review system actually checks. The error message directs developers to the "Account" section of the developer dashboard, which in older dashboard versions was non-obvious to locate.

The key operational detail from this thread: pasting the link into the extension description or into the "Support URL" field does not satisfy the requirement. The link must be placed in the dedicated Privacy policy field. Once it is placed there, the review auto-unlocks on the next submission.

Additionally, privacy policies served from free-hosting subdomains (e.g., altervista.org/privacy.html) are acceptable as long as the URL resolves to an actual privacy policy page. The message "owner sites are not considered valid privacy policies" refers to a homepage serving general marketing content rather than an actual privacy statement, not to the hosting provider.

## Key quotes

> "Add a publicly accessible link to your privacy policy in the designated field (found in the 'Account' section) in your developer dashboard."
> — CWS rejection email quoted by developer, Oct 2021

> "Never mind, Found the Account section and updated our link in the privacy policy field. Also added the Google Chrome required text into our privacy policy."
> — Giga Spoke, Oct 2021

## Implications for the factory

- **For `docs/09`:** Clarify that the privacy policy URL must be entered in the developer dashboard Account → Privacy policy field, not the description or Support URL. Note that free-host pages are acceptable as long as they actually contain a privacy policy, not a homepage.
- **For the validator (`scripts/validate-cws.ts`):** No manifest-level rule can enforce this (it is a dashboard field). Document it as a manual checklist item in the ship-mode check.
- **For the template itself:** No code change needed; this is a dashboard configuration step.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_purple-nickel-privacy-policy-clarify.md`](../forums/2026-04-17_google-group_purple-nickel-privacy-policy-clarify.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/uaU-ltmUd80
- **Wayback:** https://web.archive.org/web/20260417024612/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/uaU-ltmUd80
