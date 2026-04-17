---
extracts:
  - sources/forums/2026-04-17_google-group_purple-nickel-rejection.md
extracted_at: 2026-04-17
title: "Purple Nickel — privacy policy URL must link to an actual policy page, not a homepage"
author: Robbi (developer), Oliver Dunk (Chrome DevRel)
url: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/ew4qBXgbrvU
evidence_class: b
topics:
  - cws-review
  - rejection-codes
  - privacy-policy
  - purple-nickel
feeds_docs:
  - docs/09-cws-best-practices.md
---

# Purple Nickel — privacy policy URL must link to an actual policy page, not a homepage

## TL;DR

Purple Nickel can fire even when a privacy policy link is present if the URL resolves to general site content rather than a dedicated privacy policy page; Oliver Dunk's standard advice is to file a One Stop Support ticket for any review dispute.

## Signal

This thread is the canonical Oliver Dunk response pattern for Purple Nickel: the developer had a privacy policy hosted on a personal site, received the rejection with the message "owner sites are not considered valid privacy policies," and was confused about whether the link needed to be hosted inside the extension. Oliver Dunk clarified: "Using an external URL is expected so moving this page to your extension wouldn't be the solution."

The phrase "owner site not considered valid" in the Italian-language rejection refers specifically to a URL that resolves to a site homepage rather than a dedicated privacy policy document. A developer-hosted HTML page containing an actual privacy statement is fine; the policy checker requires the page to be unambiguously a privacy policy, not a general owner website.

Oliver Dunk's prescribed escalation path for any contested review is the One Stop Support form (https://support.google.com/chrome_webstore/contact/one_stop_support), where a case ID can be obtained and tracked. He explicitly offers to monitor escalated cases.

## Key quotes

> "Using an external URL is expected so moving this page to your extension wouldn't be the solution."
> — Oliver Dunk, Jul 13, 2023

> "If you haven't already, would you be able to fill out the One Stop Support form? This is the best place to get help with a review and they should be able to tell you why your extension was rejected. If you let me know your case ID when you've done so I can make sure that it gets handled."
> — Oliver Dunk, Jul 13, 2023

## Implications for the factory

- **For `docs/09`:** Add note: the privacy policy URL must resolve directly to a page whose primary content is the privacy policy text, not a homepage that incidentally links to a policy. External hosting is fine.
- **For the validator:** No manifest-level enforcement possible. Ship-mode checklist should prompt to verify the linked page is a real privacy policy, not a homepage.
- **For the template itself:** No code change needed.

## Provenance

- **Raw capture:** [`../forums/2026-04-17_google-group_purple-nickel-rejection.md`](../forums/2026-04-17_google-group_purple-nickel-rejection.md)
- **Original URL:** https://groups.google.com/a/chromium.org/g/chromium-extensions/c/ew4qBXgbrvU
- **Wayback:** https://web.archive.org/web/20260417024704/https://groups.google.com/a/chromium.org/g/chromium-extensions/c/ew4qBXgbrvU
