---
extracts:
  - sources/blogs/2026-04-17_bashvlas_update-without-review.md
extracted_at: 2026-04-17
title: "Remote configuration (data, not code) lets you update supported sites without a CWS re-review"
author: Vlas Bashynskyi
url: https://bashvlas.com/blog/update-chrome-extension-without-review
evidence_class: c
topics:
  - cws-review
  - remote-configuration
  - manifest-v3
  - update-triggers
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Bashvlas — Server-side config for site selectors: add supported sites without shipping a new version

## TL;DR

Instead of hardcoding supported-site selectors in the extension package, fetch them from your server at runtime as **data**. Google officially recommends this pattern (see `developer.chrome.com/docs/extensions/develop/migrate/improve-security#configuration-drive`). Adding a new supported site = update the server admin panel; no new extension version, no CWS re-review, no forced-update pain for existing users. Critical distinction from MV3's remote-code ban: this fetches **data** (selectors, URL patterns, feature flags), not executable logic — the ban doesn't apply.

## Signal

This extraction is the official-blessed counterweight to Palant's (extracted at `.../palant_01-20-...`) "remote configuration is a malware signature" framing. Both can be true: *remote config used as a delivery channel for executable JS is the malware pattern; remote config used as a site-pattern allow-list is the legitimate pattern Google explicitly recommends.* The line between them is whether the config payload is interpreted as data or executed.

Bashvlas's example: an extension that extracts text from images. It supports Instagram by default. To add Google support without shipping a new version, the extension reads a list of site patterns + CSS selectors from `https://your-admin.example.com/supported-sites.json` at startup. When the admin adds Google to the list, users' existing extensions pick it up on next sync.

The **official docs link** is load-bearing: `https://developer.chrome.com/docs/extensions/develop/migrate/improve-security#configuration-drive`. The "Migrate to MV3" docs actually *recommend* this pattern as a security improvement, because moving volatile config out of the extension package reduces the code you submit for review and keeps reviewable surface stable across config updates.

**The test for whether your remote config is "safe":** ask whether the data could be rendered to HTML with inline event handlers or passed to `eval`/`Function()`. If yes, you're in the Palant danger zone. If no — it's just selectors, URL patterns, feature flags, translation strings — it's the Bashvlas safe pattern.

## Key quotes

> "Instead of hardcoding image selectors and the list of supported websites into the package of the chrome extension. We can implement a page like this, where an admin user can go in and add a new site like this. Now, when we reload the page - the extension will support this website."
> — Vlas Bashynskyi

> "This method is called 'remote configuration' and this is something Google actually recommends you use in your extensions."
> — Vlas Bashynskyi

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** under "Updates & re-review triggers," add a positive bullet: "Remote configuration for *data* (site selectors, feature flags, URL patterns, strings) avoids re-review when you add support. This is officially recommended — see the `improve-security#configuration-drive` docs. Do not conflate with remote *code*, which is banned."
- **For `docs/03-cws-best-practices.md`:** add a "What triggers re-review vs. what doesn't" quick-reference:
  - Triggers re-review: new manifest permissions, new code, significant code diffs.
  - Doesn't: server-side config changes (site allow-lists, feature flags, content strings).
- **For the template itself:** ship a `utils/remote-config.ts` helper with the canonical safe pattern:
  - Fetch from a `config_url` declared in manifest metadata
  - Validate the response as data-only (JSON schema; reject if any string looks like JS)
  - Cache in `chrome.storage.local` with a TTL
  - Expose a typed `getConfig()` that throws if fetch fails rather than falling back to code
  Include a big comment: "Remote DATA is safe and officially recommended. Remote CODE (any JS string that gets eval'd or injected as HTML with event handlers) is banned. See sources/extracted/2026-04-17_bashvlas_update-without-review.md and the contrast with sources/extracted/2026-04-16_palant_01-20-...md."
- **For the validator (`scripts/validate-cws.ts`):** not a new rule — but the `remote-code-patterns` validator should have a whitelist exception for fetch-to-storage patterns that are clearly data-only (JSON-shaped, not string-templated into HTML/JS).

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_bashvlas_update-without-review.md`](../blogs/2026-04-17_bashvlas_update-without-review.md)
- **Original URL:** https://bashvlas.com/blog/update-chrome-extension-without-review
- **Wayback:** https://web.archive.org/web/20260417002120/https://bashvlas.com/blog/update-chrome-extension-without-review
- **Official docs referenced:** https://developer.chrome.com/docs/extensions/develop/migrate/improve-security#configuration-drive
- **Related extracted:** `sources/extracted/2026-04-16_palant_01-20-malicious-extensions-circumvent-googles-remote-code-ba.md` (the contrast case — remote config as malware vector).
