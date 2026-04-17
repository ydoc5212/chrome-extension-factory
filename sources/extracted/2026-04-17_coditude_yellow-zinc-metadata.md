---
extracts:
  - sources/blogs/2026-04-17_coditude_yellow-zinc-metadata.md
extracted_at: 2026-04-17
title: "Yellow Zinc: listing metadata and presentation rejections"
author: Hrishikesh Kale (Coditude)
url: https://www.coditude.com/insights/yellow-zinc-fixing-metadata-and-listing-issues-in-chrome-extensions/
evidence_class: c
topics:
  - cws-review
  - rejection-codes
  - listing-metadata
  - screenshots
  - icons
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Coditude — Yellow Zinc rejects the listing, not the code: fix title, description, screenshots, icons

## TL;DR

**Yellow Zinc** rejections mean the code passed technical review but the **listing presentation** failed: vague title ("Productivity Tool", "AI Helper"), missing or unclear description, missing/low-quality screenshots, missing 128x128 icon, wrong image format, or description features that don't match the shipped functionality. Fix with a clear action-oriented title, a structured description (what / who / how), real in-app screenshots (one per major feature, PNG or JPG only — not WebP or SVG), a transparent-background 128x128 icon plus 48x48, and a verified description-to-functionality match.

## Signal

Yellow Zinc is the cheapest rejection to fix and the one most often overlooked because developers treat metadata as an afterthought. Coditude's structural claim: reviewers use the listing **the same way users do** — as the primary signal of what the extension does and whether to trust it. Presentation failures read as either (a) the developer didn't finish the submission or (b) the extension's real behavior doesn't match its claims.

The specific, load-bearing rules Coditude surfaces that are **not prominent on `developer.chrome.com`**:
- **PNG and JPG only** for listing screenshots — WebP and SVG are rejected. This is a concrete format rule that will block a submission.
- **128x128 icon must have a transparent background.** The 48x48 is also required.
- **Description must match code.** If you mention "syncs with Google Drive" or "AI-based suggestions," the reviewer will test for that feature. Aspirational copy is a rejection trigger.
- **Localization is optional but encouraged**, only required when targeting non-English audiences explicitly.

Recommended listing structure (Coditude's template, worth lifting):
- Title: action + purpose ("Tab Saver: Organize and Restore your Chrome Tabs")
- Description: one-line overview → bulleted feature list → use cases
- At least one screenshot per major feature, real in-app captures (not mockups, not stock)
- NTP-modifying extensions: include a screenshot of the New Tab view specifically
- Optional: 30-60 second preview video hosted on YouTube (noted as measurably improving acceptance and conversion)

## Key quotes

> "Chrome is judging not how your code publishes or runs, but how your extension is advertised in the Extension Store."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Chrome only accepts PNG and JPG for listings, not WebP or SVG."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Your description has to match your code exactly. If your description mention features like 'syncing with Google Drive' or 'AI-based suggestions,' those features need to be available and functioning in your extension. Chrome reviewer will also manually test your extensions."
> — Hrishikesh Kale, Coditude, 2026-04-17

## Implications for the factory

- **For `docs/03-cws-best-practices.md` → "Listing assets & metadata" section:** add Yellow Zinc as the rejection label for listing-quality failures. Fold in the concrete format rules (PNG/JPG only, no WebP/SVG; 128x128 transparent-bg icon required) and the reviewer-tests-the-description rule as a spam-adjacent heuristic.
- **For `scripts/validate-cws.ts`:** add rules that inspect the submission assets directory:
  - Reject `.webp` and `.svg` files used as listing screenshots.
  - Require a 128x128 icon with alpha channel (transparent background).
  - Require a 48x48 icon.
  - Require at least one screenshot file present in the expected directory.
  - Emit "likely Yellow Zinc" on each failure.
- **For the template itself:** `docs/templates/` should ship a `listing-copy.md` template matching Coditude's structure (title formula + one-line overview + bulleted features + use cases). The factory's `app-store-screenshots` skill can provide the image outputs; wire `npm run zip` to sanity-check listing asset presence before packaging.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_coditude_yellow-zinc-metadata.md`](../blogs/2026-04-17_coditude_yellow-zinc-metadata.md)
- **Original URL:** https://www.coditude.com/insights/yellow-zinc-fixing-metadata-and-listing-issues-in-chrome-extensions/
- **Wayback:** https://web.archive.org/web/20260417002026/https://www.coditude.com/insights/yellow-zinc-fixing-metadata-and-listing-issues-in-chrome-extensions/
- **Related extracted:** `sources/extracted/2026-04-17_coditude_rejection-codes-overview.md` — the parent decoder table.
