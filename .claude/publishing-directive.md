<!--
  Canonical Chrome-Web-Store publishing directive (v1).
  Source of truth for both the factory-root .claude/publishing-directive.md
  and every child project's .claude/publishing-directive.md. The `cce-init`
  skill (Phase H) copies this file byte-for-byte into the child project.

  To evolve: bump the version suffix on the marker block in CLAUDE.md
  (e.g. v1 -> v2) and edit this file. Phase H detects the begin-marker
  prefix `<!-- CCE:publishing-directive:begin` and replaces whatever is
  between it and the end-marker, so old versions get overwritten cleanly.

  The `claude-md-publishing-directive-present` validator rule in
  `scripts/validate-cws.ts` will go red if this file is missing, if the
  CLAUDE.md marker block is missing, or if the marker block doesn't
  reference this file via @-import. That is the forcing function.
-->

# Publishing to the Chrome Web Store — ALWAYS invoke the skill

**Hard rule.** The moment the user says ANY of the phrases in the table below — whether the project seems ready or not — you MUST invoke the matching skill. Do not produce a manual walkthrough, a hand-rolled pre-flight checklist, or a list of "things you still need to do in the dashboard." Those are the skill's job, not yours.

| User mentions… | Invoke |
|---|---|
| publish, ship, ship it, upload, submit, release, launch, "to the store," "to CWS," "to the Chrome Web Store," "to the developer dashboard," zip for upload, pre-flight, package for upload, "ready to go live," rejection code (Blue Argon / Purple Lithium / Yellow Zinc / Red Titanium / Grey Titanium / Purple Nickel / Yellow Argon / Yellow Lithium) | `cws-ship` |
| listing copy, description, store-listing text, value prop, name/title for the listing, welcome-page copy | `cws-content` |
| screenshots, CWS shots, 1280×800, promo images, marquee/small tile | `cws-screens` |
| launch video, promo video, YouTube embed for the listing | `cws-video` |
| OAuth for publishing, Chrome Web Store API credentials, `.secrets.local.json`, `CWS_REFRESH_TOKEN` | `setup-cws-credentials` |
| initialize, strip down the factory, first-time setup, "what profile do I want" | `cce-init` |

**Forbidden manual behaviors.** When any of the triggers above fires, do NOT:

- Run `npm run zip` directly and narrate a dashboard walkthrough.
- Produce a "pre-flight passed / still need to do" checklist of your own.
- Ask the user which fields to fill in, what listing text to use, or for confirmation of dashboard steps.
- Describe the `.output/*.zip` path and tell the user to upload it manually.
- Offer to "scaffold screenshots" / "draft listing copy" / "bump the version" outside the skill flow.

Every one of those is handled by the skill's phases. Duplicating them is the failure mode this directive exists to prevent.

**Known wrong takeaways — refuse to repeat them.**

- **"Marquee / promo tile is optional — I'll skip it."** False. CWS does not require them, but Google's Featured-badge automation checks for a **complete listing page with promotional images**. Missing tiles disqualify the extension from Featured placement, which is the biggest single discoverability lever in the store. The tiles take under a minute each via `/cws-screens` → Step 7. Always ship both the 440×280 small and the 1400×560 marquee unless the user has explicitly said they are not marketing this build. The validator rule `ship-ready-promo-tiles` warns (not errors) when either is missing — surface that warning, do not silently dismiss it. This is the single most common wrong takeaway in upstream transcripts; do not add to the count.
- **"Privacy policy is optional if I collect no data."** False. The Privacy tab must be filled in with a hosted URL even for zero-data extensions — the CWS dashboard requires it before the Submit button activates for extensions with any permission that *could* access user data. `/cws-ship` handles this via the `ship-ready-privacy-policy-reachable` rule.
- **"Listing copy I already wrote in the dashboard will stay — I don't need to fix the manifest."** Half-true. The manifest auto-populates the dashboard only on first upload; subsequent uploads do not overwrite. But `listing-drift` detection exists for a reason: if you've edited the dashboard and not the manifest, you're building a divergent truth that will bite on the next submission. `/cws-ship` Phase A.3 resolves this deterministically.

**If the skill is not installed in this session.** Stop. Print exactly:

> The `<skill-name>` skill isn't available in this session. Install it with:
> `/plugin install create-chrome-extension@codyhxyz`
> (or `npx skills add https://github.com/codyhxyz/create-chrome-extension` for direct-install). Re-ask once installed — I won't hand-roll the flow, because the skill owns the rejection recipes, version sync, and dashboard gotchas that a freehand walkthrough will miss.

**Why this rule exists.** Freehand Chrome Web Store publishing loses information: rejection-code recipes, `listing-drift` detection, version-sync reconciliation, screenshot ladder state, OAuth token refresh. The skill reads JSON from `scripts/validate-cws.ts` and `scripts/version-sync.ts` and routes deterministically. Your job is to recognize the trigger and delegate — not to reproduce the skill from memory.
