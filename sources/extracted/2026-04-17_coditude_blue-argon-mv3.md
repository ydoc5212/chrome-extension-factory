---
extracts:
  - sources/blogs/2026-04-17_coditude_blue-argon-mv3.md
extracted_at: 2026-04-17
title: "Blue Argon: the MV3 remote-code rejection and its fix"
author: Hrishikesh Kale (Coditude)
url: https://www.coditude.com/insights/blue-argon-mv3-additional-requirements-explained/
evidence_class: c
topics:
  - cws-review
  - rejection-codes
  - mv3
  - remote-code
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Coditude — Blue Argon means remote-hosted code; bundle everything locally and kill `eval`

## TL;DR

A **Blue Argon** rejection almost always means the extension executes or loads code that isn't inside the submitted ZIP: `<script src="https://…">`, CDN-hosted SDKs (Firebase is the canonical example), `eval()`, `new Function()`, or dynamic script injection from a remote string. The fix is mechanical: remove every remote `<script src>`, vendor every SDK into the package, replace `eval`/`new Function` with safer constructs, confirm `"manifest_version": 3` and no residual MV2 keys, then rebuild and reload unpacked before resubmission.

## Signal

Coditude's Blue Argon post is the plain-English companion to Google's MV3 "Improve security" rule. The value isn't the rule — it's the enumerated list of **how developers trip it without realizing**:

1. `<script src="https://cdn…">` tags inside HTML pages in the package.
2. Runtime `eval()` / `new Function()` / dynamic `document.createElement('script')` with a remote `src`.
3. Unbundled SDKs — Firebase, analytics libraries, third-party auth — referenced by CDN URL rather than vendored into the ZIP.
4. Hybrid MV2/MV3 code where the manifest was flipped to v3 but the execution model still reaches out to remote endpoints for logic.

The recommended fixes are equally practical: use Webpack/Rollup/Vite to produce a single local bundle for heavy frameworks (React, Angular); grep the extension folder for the string `http` to catch stray remote references; prefer MV3-ready SDK variants when available (Firebase, analytics vendors have published them).

The subtle point that doesn't appear in Google's official docs: **precompiled templates** are the escape hatch for code that used to depend on runtime template compilation via `new Function`. If you're shipping a framework that generates templates at runtime, switch to a build-time compiler before submission.

## Key quotes

> "Extensions that get rejected due to Blue Argon are practicing disallowed code execution, most commonly the use of remote code scripts or unsafe execution methods."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "All logic must be static, reviewed, and bundled inside the extension before submission."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "If you are not sure, you can run a search for http in your extension folder to ensure no external code is being loaded."
> — Hrishikesh Kale, Coditude, 2026-04-17

## Implications for the factory

- **For `docs/03-cws-best-practices.md` → "Manifest V3 code requirements" section:** add the Blue Argon rejection label and Coditude's enumerated list of common causes. The `grep -r "http" .` self-check is a useful pre-submission heuristic worth calling out.
- **For `scripts/validate-cws.ts`:** add/extend a rule that flags `<script src="http…">` in any HTML entrypoint and `eval(`/`new Function(` in bundled JS. Failure message should emit "likely Blue Argon: MV3 remote-code violation — bundle all logic into the ZIP."
- **For the template itself:** WXT's Vite-based bundling already defaults to local-bundle output. Document in `docs/09` that this is the reason to prefer the factory over a hand-rolled manifest — MV3 compliance is the default, not an opt-in.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_coditude_blue-argon-mv3.md`](../blogs/2026-04-17_coditude_blue-argon-mv3.md)
- **Original URL:** https://www.coditude.com/insights/blue-argon-mv3-additional-requirements-explained/
- **Wayback:** https://web.archive.org/web/20260417001925/https://www.coditude.com/insights/blue-argon-mv3-additional-requirements-explained/
- **Related extracted:** `sources/extracted/2026-04-17_coditude_rejection-codes-overview.md` — the parent decoder table.
