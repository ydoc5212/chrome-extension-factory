# Roadmap

Implementation plan for the factory's planned extensions. Sessions are ordered by dependency and priority. Each session is scoped to one sitting (half-day to day-plus). Every session's acceptance criteria are concrete commands that either pass or fail — if you can't tell whether a session is done by running a command, the criteria are wrong.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the design philosophy these sessions implement.

---

## Dependency graph

```
 Session 1 ──────────────► Session 3
 (CWS API             ▲   (cws-ship skill)
  integration)        │            │
       │              │            ▼
       │         Session 2    Session 5
       │        (cws-content   (cws-init
       │          skill)        skill)
       │              ▲
       └──────────────┘
                               Session 4
                               (cws-screens)
                               ← independent, any order
```

Sessions 1 and 2 are the two "ground floors." After those, everything else slots on top.

---

## Session 1 — CWS API integration layer

**Kind:** Scripts only. No skills.

**Goal:** Wire the factory to the Chrome Web Store API using the four OAuth secrets already defined for keepalive-publish (`CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`). Everything is opt-in: if secrets are absent, scripts and rules no-op cleanly — they do NOT fail. This preserves the factory's green-on-fresh-clone invariant.

**Prerequisites:** None.

**Deliverables:**

1. `scripts/cws-api.ts` — shared helper module. Exports:
   - `loadSecrets(): { extensionId, clientId, clientSecret, refreshToken } | null` — returns null if any secret missing.
   - `getAccessToken(secrets)` — exchanges refresh token for access token.
   - `getPublishedVersion(secrets)` — fetches current live version from CWS.
   - `getListing(secrets)` — fetches current listing metadata (name, description, etc.).
   - `submit(secrets, zipPath)` — uploads and publishes.
   - `pollStatus(secrets, submissionId)` — polls review/publish state.
   - Thin wrapper around `chrome-webstore-upload` npm package (already the implicit standard; don't reinvent the OAuth flow).

2. `scripts/version-sync.ts` — compares `package.json` version to CWS live version:
   - No secrets: exits 0 with a one-line "skipped: no CWS secrets configured" note.
   - Local > remote: exits 0 (all good).
   - Local ≤ remote: exits 1 with a fix message (`npm version patch` to bump).
   - Supports `--json` output mode.

3. `scripts/publish-cws.ts` — submit + poll:
   - Takes the zip from `.output/`.
   - Submits via cws-api.
   - Polls status until terminal state (`live`, `rejected`, or timeout).
   - Emits structured state transitions on stdout (or `--json`).
   - No-ops if no secrets (with a helpful "configure CWS_* secrets to enable" message).

4. New validator rule in `scripts/validate-cws.ts`:
   - `listing-drift` (severity: warn, SHIP_ONLY).
   - Fetches live listing via cws-api.
   - Flags divergence: local manifest.name ≠ CWS listing name, etc.
   - No-ops if no secrets (returns `[]`).

5. `npm run ship` — single orchestrated gate:
   ```json
   "ship": "npm run check:cws:ship && tsx scripts/version-sync.ts && wxt zip && tsx scripts/publish-cws.ts"
   ```
   First halt wins. If the user has no secrets, `publish-cws.ts` prints instructions rather than failing catastrophically.

6. `ARCHITECTURE.md` updates:
   - Automation surface table: add `npm run ship` row.
   - "Planned extensions" table: mark Session 1 items done.

7. `README.md` + `docs/03-cws-best-practices.md`:
   - Add `npm run ship` to command tables.
   - Add "Automated publishing" section with the 4-secret setup (cross-link to `docs/06-keepalive-publish.md` which already documents the secret flow).

**Acceptance — all of these must be true:**

- [ ] `npm run compile` clean.
- [ ] `npm run check:cws` still passes on factory (no regressions).
- [ ] `npm run check:cws:ship` still fails with the same 4 errors (no `listing-drift` noise from no-secret state).
- [ ] `npx tsx scripts/version-sync.ts` exits 0 with "skipped: no CWS secrets configured" message.
- [ ] `npx tsx scripts/version-sync.ts --json` emits valid JSON with a `skipped: true` field.
- [ ] `npx tsx scripts/publish-cws.ts` exits 0 (or 2) with a helpful "configure secrets" message when no secrets set.
- [ ] `npm run ship` refuses cleanly at the `check:cws:ship` step (first halt) on factory template.
- [ ] With fake secrets set in env: version-sync makes a real API call and gets an auth error (proving it's actually calling CWS, not no-op'ing).
- [ ] ARCHITECTURE.md's automation surface table reflects new commands.
- [ ] CI still green.

**Out of scope:** Skills (Session 2+). Screenshots (Session 4). Renaming existing commands.

**Risks:**
- OAuth token refresh semantics — tokens expire. Use a library, don't hand-roll.
- Rate limits on CWS API — unlikely to hit during normal dev; don't pre-optimize.
- Listing-drift false positives if draft state vs. live state isn't handled. Ship warn-severity only; promote to error in a later session once we trust it.

**Estimate:** Half day. ~400 LOC of TypeScript + docs.

---

## Session 2 — `cws-content` skill

**Kind:** First skill. Conversation layer over the existing validator.

**Goal:** When the validator flags content placeholders, the user can invoke `cws-content` and get interviewed through filling them in. Skill ends by re-running the validator and reporting green or remaining issues. Does NOT submit — that's cws-ship.

**Prerequisites:** None. Works against the current `check:cws:ship --json` contract.

**Deliverables:**

1. Skill file — structure depends on the target plugin format. If this becomes a Claude plugin:
   - `plugin/skills/cws-content/SKILL.md` — skill definition with invocation trigger, body.
   - Plugin manifest pointing to it.
   - If we're pre-plugin, the skill can live as a markdown file elsewhere (TBD in session).

2. Skill body covers these rule-id recipes:
   - `listing-ready-name` — interview for value prop in one sentence → draft 3 candidates (feature-focused, outcome-focused, short-punchy) → user picks → write to `wxt.config.ts` `manifest.name`.
   - `listing-ready-description` — draft 3 descriptions, ≤132 chars each, different emphases → user picks → write.
   - `ship-ready-optional-host` — ask what origins the extension actually touches → update `wxt.config.ts` `optional_host_permissions` AND `entrypoints/welcome/config.ts` steps in lockstep.
   - `ship-ready-welcome-config` — walk through each field (valueProp, activationSurfaces, steps, links), elicit → write to `entrypoints/welcome/config.ts`.

3. Skill orchestration logic:
   - Entry: skill runs `npx tsx scripts/validate-cws.ts --ship --json` itself.
   - Parses `findings[]`, groups by rule id.
   - Runs the appropriate recipe for each.
   - After each file write, re-runs validator.
   - Ends when validator is green OR user chooses to stop.

4. Skill should be invokable mid-development, not just pre-submit. "I want to draft listing copy" is a valid reason even if you're not shipping yet.

**Acceptance:**

- [ ] On a fresh factory clone, invoking the skill with a realistic dummy intent ("I built a GitHub PR summarizer") takes the user from 4 ship-mode errors to 0.
- [ ] Writes happen to the right files (wxt.config.ts, welcome/config.ts) — no stray edits.
- [ ] `npm run check:cws:ship` passes after skill run.
- [ ] Skill does not attempt to submit or zip.
- [ ] Skill handles partial runs: user quits mid-flow, state is preserved, re-invoking picks up.
- [ ] Skill's recipes are keyed on stable rule ids — if the rule id changes, only the skill file needs updating (nothing else in the skill hardcodes rule behavior).

**Out of scope:** Submission flow (Session 3). Screenshot content (Session 4). Onboarding / first-time-setup flow (Session 5).

**Risks:**
- Skill format. The plugin architecture isn't fully defined in this repo yet. This session should pick a convention and document it in ARCHITECTURE.md under a new "Skill conventions" subsection.
- Interview quality — vague prompts produce vague copy. Lead with concrete examples in each recipe ("good: 'Highlights PR reviewers you've missed'; bad: 'Helps with GitHub'").

**Estimate:** Half to full day. Mostly prompt-writing + wiring.

---

## Session 3 — `cws-ship` skill

**Kind:** Second skill. Orchestrates the full pre-submission-through-publish flow.

**Goal:** One conversational entry point that takes a user from "I want to ship this" to "it's live on CWS" (or "in review" / "needs fix"), pulling in cws-content recipes as needed.

**Prerequisites:** Sessions 1 AND 2. (Session 1 for the submit plumbing, Session 2 for the content recipes to delegate to.)

**Deliverables:**

1. Skill file `plugin/skills/cws-ship/SKILL.md` (or equivalent).

2. Flow:
   1. Run `check:cws:ship --json`.
   2. If any `listing-ready-*` / `ship-ready-*` errors: delegate to cws-content recipes (re-use the mappings from Session 2 — do not duplicate).
   3. Re-run validator until green.
   4. Run `scripts/version-sync.ts --json`. If local ≤ remote, offer to bump (`npm version patch`) with confirmation.
   5. Summarize the submission: name, description, version, permissions. Ask user to confirm.
   6. Run `npm run ship`.
   7. If publish-cws polled into a terminal state: report `live` / `rejected` / `in-review` / `timeout`.
   8. If `rejected`: surface the reason, map to known rejection codes (from `docs/03-cws-best-practices.md`), offer a fix recipe.

3. Rejection recipes for common cases:
   - Blue Argon (remote code) → point at `remote-code-patterns` validator rule.
   - Purple Lithium (privacy policy missing) → recipe for hosting a privacy policy.
   - Yellow Zinc (listing fields blank) → delegate to cws-content.
   - etc.

**Acceptance:**

- [ ] On a green-ship factory (listing filled in, secrets configured) with a real test extension ID: skill completes submission end-to-end.
- [ ] On a red-ship factory: skill delegates to cws-content, re-runs validator, proceeds once green.
- [ ] On no-secrets factory: skill stops cleanly at the publish step with instructions on setting up OAuth (pointing to docs/08).
- [ ] Rejection handling: if simulating a rejection, skill maps code → fix recipe.
- [ ] Skill does NOT duplicate cws-content's recipes; it invokes cws-content (or shared recipe definitions).

**Out of scope:** Screenshot flow (Session 4). First-time onboarding (Session 5).

**Risks:**
- Rejection codes are opaque and not always in the API response; some rejections come via email only. Handle best-effort; document the limitation.
- Polling cadence — don't spin too fast (rate limits). 30-60s intervals, timeout at ~15 minutes.

**Estimate:** Half to full day.

---

## Session 4 — `cws-screens` skill + repo infrastructure

**Kind:** Skill + new subproject (Next.js page). Fully independent from other sessions.

**Goal:** Generate CWS-compliant screenshots (1280×800, browser-chrome-framed) from declarative config + real extension surfaces. Analogous to the existing `app-store-screenshots` skill for iOS but with completely different visual language (desktop, browser chrome, no phone mockup).

**Prerequisites:** None.

**Deliverables:**

1. `screenshots/` subproject (Next.js app, or a standalone HTML export pipeline). Pattern-match against `marketing/` if that's already the model; otherwise mirror the structure from `app-store-screenshots`.

2. Components:
   - `BrowserFrame` — Chrome window chrome (URL bar, tabs, OS controls) at 1280×800.
   - Slot components for rendering popup, sidepanel, options, welcome content inside the frame.
   - Copy overlay component (same style as `app-store-screenshots` iOS overlays but without the iOS aesthetic).

3. `screenshots/config.ts` — declarative config (same pattern as `entrypoints/welcome/config.ts`):
   - Array of screenshots, each with: surface (popup/sidepanel/options/welcome/content-script-in-page), overlay headline, subhead, theme (light/dark).
   - Factory ships with 5 placeholder screenshots illustrating the popup + sidepanel + options + welcome + content-in-action pattern.

4. Export script: renders each config entry to a PNG at 1280×800.
   - Use Playwright or Puppeteer (headless Chrome) for pixel-perfect render.
   - Output to `.output/screenshots/` (git-ignored by default).

5. `npm run screenshots` — one command: generate all.

6. New validator rule (ship-only): `ship-ready-screenshots` — checks `.output/screenshots/` has at least one PNG and config isn't still at factory defaults.

7. Skill `plugin/skills/cws-screens/SKILL.md`:
   - Walks user through: for each of 5 recommended screenshots, what surface + what copy.
   - Previews outputs (ideally via the Claude Code image-viewing capability).
   - Iterates on overlay copy until user approves.

8. Cross-links: `README.md`, `docs/05-useful-patterns.md` (currently points to iOS skill — rewrite to point to CWS skill for Chrome submission).

**Acceptance:**

- [ ] `npm run screenshots` produces 5 PNGs at 1280×800.
- [ ] Factory-default config produces visibly placeholder screenshots (obvious they need customization).
- [ ] Skill walks through 5 screenshots, produces customized PNGs.
- [ ] New validator rule fires red in ship mode on factory; green after skill run.
- [ ] `docs/05-useful-patterns.md` updated to reflect the split (iOS skill vs. Chrome skill).

**Out of scope:** Submission of screenshots to CWS dashboard (there's no API for screenshot upload; the user drags them into the dashboard). Video promo asset.

**Risks:**
- Playwright adds a heavy devDependency. Consider: is this in scope for a "factory" template? Yes — screenshots are first-class for CWS submission. Accept the dep.
- The "what to render inside the frame" problem: do we render the actual built extension surfaces, or mock screenshots? Prefer actual built surfaces (route to popup.html, etc.) — ensures screenshots match reality. But this requires the dev server to be running during screenshot capture. Decide in session.

**Estimate:** Full day. New subproject; biggest of the sessions.

---

## Session 5 — `cws-init` skill

**Kind:** Onboarding skill. Thin orchestrator over existing pieces.

**Goal:** A user clones the factory and runs the init skill. The skill walks them through profile selection, listing content, OAuth setup, and ends with a green-structural / red-ship factory ready for the `cws-ship` skill when the time comes.

**Prerequisites:** Session 2 (cws-content). Session 4 optional — init can work without screenshots but is more complete with them.

**Deliverables:**

1. Skill file `plugin/skills/cws-init/SKILL.md`.

2. Flow:
   1. Detect: is this a fresh clone? (Heuristic: factory-default name in manifest AND no .cws-init-done marker file.)
   2. Orient: briefly explain the two-tier gate model (structural vs. ship) and where to find more (ARCHITECTURE.md).
   3. Profile selection: ask about the extension shape (content-script-only / popup / sidepanel / full hybrid). Delete unused entrypoints.
   4. Invoke cws-content for initial listing + welcome-config copy.
   5. (If Session 4 done) Invoke cws-screens for initial screenshots.
   6. OAuth setup walkthrough (optional): present the 4-secret CWS API setup (point at docs/08). If user wants to defer, note it and move on.
   7. Run `npm run check:cws` to confirm structural green.
   8. Drop `.cws-init-done` marker.
   9. Print a summary: "You're set up. When ready to ship, invoke `cws-ship`."

3. Skill is idempotent: running it on an already-initialized factory no-ops with a "looks like you've done this; want to re-run a specific step?" prompt.

**Acceptance:**

- [ ] On a fresh clone, init → structural green, ship still red for any intentionally-deferred items (screenshots, OAuth), user has a clear next step.
- [ ] On an already-initialized factory, skill detects and offers targeted re-runs.
- [ ] Does not duplicate cws-content or cws-screens logic; delegates.

**Out of scope:** Anything ship-related (cws-ship handles that).

**Risks:** Scope creep. This skill is tempting to grow into "does everything." Keep it strictly first-run orientation.

**Estimate:** Half day.

---

## Session 6 — `cws-video` skill + default-on infrastructure

**Kind:** Skill wrapping an external skill + validator rule + small config scaffold. Parallel to Session 4 (`cws-screens`) but smaller — the external skill does the generation work, we just configure and validate.

**Goal:** Make a launch-video asset part of the default factory ship flow. A promo video substantially lifts CWS install conversion; the same asset doubles as a launch asset for ProductHunt, Twitter, LinkedIn. The factory ships with video on by default; users who genuinely don't want one delete `video/` (same escape-hatch pattern as `screenshots/`).

**Prerequisites:** Ecosystem skill [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes) — install via `npx skills add heygen-com/hyperframes`. This is a hard dep for the default ship path (unlike, say, CWS API OAuth secrets, which are opt-in). The wrapping skill detects missing install and walks the user through `npx skills add` rather than silently skipping.

**Deliverables:**

1. `/video/config.ts` — declarative, parallel to `screenshots/config.ts`. Factory default has placeholder content obviously needing customization. Fields (reconcile with what hyperframes expects when writing this session): script/narration, visual beats, target length (CWS caps at 30 sec for embedded promo; external launches want 60–90 sec), aspect ratio, export targets (YouTube URL format for CWS; MP4 at common aspect ratios for socials).

2. `/video/` directory is shipped in the factory by default. If the user chooses to skip video entirely, they delete the directory (matches how `screenshots/` is handled — no special "disable video" flag).

3. `scripts/validate-cws.ts` — new rule `shipReadyVideo(ctx: Context): Finding[]` in `SHIP_ONLY_RULES`:
   - If `/video/config.ts` doesn't exist: return `[]` (user explicitly removed the directory — opt-out).
   - If config still has factory placeholders: error (analogous to `ship-ready-screenshots`).
   - If no exported file in `.output/videos/` (or wherever hyperframes writes): error.
   - Ordering: PNG-style shift (first run tells user "no video found"; after generation, if config still has placeholders, tell them to regenerate with real copy).

4. `/skills/cws-video/SKILL.md` — thin wrapper:
   - Frontmatter `requires: [heygen-com/hyperframes]`.
   - Phase A: probe for hyperframes installation; if missing, print `npx skills add heygen-com/hyperframes`, wait for confirmation.
   - Phase B: walk user through video config (script, visual style, length) with examples of good ones (punchy hook, single value prop, clear CTA).
   - Phase C: invoke hyperframes with the config.
   - Phase D: verify output exists and update `ship-ready-video` passes.
   - Frontmatter `writes: [video/config.ts]`.

5. Update `scripts/validate-cws.ts` comment header + any count references (ship mode becomes 18 rules).

6. Update `skills/cws-init/SKILL.md` — Phase E (screenshots) should also invoke `cws-video` as a parallel delegation. Or add a new Phase E+ explicitly. Init should walk the user through video alongside screenshots, since both are default-on assets.

7. Update `skills/cws-ship/SKILL.md` — Phase A rule-id mapping should route `ship-ready-video` to `cws-video`. Same delegation pattern as `ship-ready-screenshots` → `cws-screens`.

8. `npm run video` script in `package.json` — one-shot invocation (if hyperframes has a CLI entrypoint usable from an npm script; otherwise this may be skill-only).

9. `docs/05-useful-patterns.md` — add a video section parallel to the screenshots section; distinguish video spec for CWS (YouTube embed, ≤30 sec preview) vs. social (60–90 sec MP4, etc.).

10. `skills/README.md` — update the External dependencies table: `heygen-com/hyperframes` is **Required** (not optional) for the default ship path.

11. `.gitignore` — add `.output/videos/`.

12. `ARCHITECTURE.md`:
    - Mark Session 6 done in Planned extensions.
    - Automation surface table: add `npm run video` row if it's a direct command.
    - Convention update: document the "hard external dep vs. optional external dep" distinction in Skill conventions.

**Constraints — do NOT violate:**

- Factory invariant shifts with this session: `npm run check:cws:ship` on a fresh clone will now have **6 errors** (5 existing + `ship-ready-video`). That's correct and expected. Update the ARCHITECTURE.md / ROADMAP test commands accordingly.
- Rule id `ship-ready-video` is public API; don't rename after this session.
- If the hyperframes skill API changes (new field, removed field), this is a coordination burden — document which hyperframes version we're pinned against in `skills/cws-video/SKILL.md` and `skills/README.md`.
- Don't reimplement video generation. The whole point is we delegate to hyperframes. If hyperframes is missing capability we need (e.g., specific aspect ratio), file an issue upstream; don't fork the work.

**Acceptance:**

```
npm run compile                                 # exits 0
npm run check:cws                               # passes (structural; no video rule there)
npm run check:cws:ship                          # 6 errors now (5 + ship-ready-video)
jq rule from JSON                               # includes "ship-ready-video"
ls video/config.ts                              # exists with placeholders
ls skills/cws-video/SKILL.md                    # exists
# With hyperframes installed and run through the skill:
ls .output/videos/                              # at least one exported file
npm run check:cws:ship 2>&1 | grep ship-ready-video   # no longer fires
```

Edge case — user opts out:
```
rm -rf video/                                   # explicit opt-out
npm run check:cws:ship                          # 5 errors, ship-ready-video silent (rule no-ops on absent dir)
```

**Out of scope:**
- Multi-language voiceover / localization (defer).
- A/B testing variants (defer).
- Analytics on which videos convert (defer).

**Risks:**
- Hyperframes API / install flow may shift. Mitigation: detect-and-guide rather than assume.
- External-dep friction could reduce factory adoption ("I have to install another thing?"). Mitigation: make the install step a single copyable command in every error message.
- Video quality is judgment-heavy; the validator rule only checks presence + placeholder-escape, not actual quality. That's correct — presence is deterministic, quality is a conversation (cws-video skill handles the quality interview).

**Estimate:** Half day. Smaller than Session 4 because hyperframes does the heavy lifting.

---

## Cross-cutting concerns

These apply to every session and should be checked before calling any session "done."

- **ARCHITECTURE.md updates.** Every session changes at least one section (automation surface, planned extensions → done, conventions if new conventions are introduced). If you didn't touch ARCHITECTURE.md, you probably missed something.
- **Rule id stability.** If a session renames a validator rule, every skill that keys off that rule id must update in the same PR.
- **`--json` contract additively only.** Fields may be added; fields must not be removed or renamed without bumping `schemaVersion`.
- **Opt-in secrets pattern.** Anything requiring CWS API auth must no-op cleanly without secrets. A fresh fork must never see a red CI badge because of missing credentials they haven't pasted yet.
- **Factory invariant.** After any session, `npm run check:cws` passes on the factory, `npm run check:cws:ship` fails on the factory, `npm run zip` refuses on the factory. If a session breaks this, revisit.
- **Test plan must be runnable.** Every acceptance checkbox must map to a command I can run. "It looks good" is not a test.

---

## Suggested sequencing

If you have one short session: Session 1 (CWS API scripts). Unblocks everything downstream; pure deterministic; no plugin-format questions.

If you have two sessions: Session 1 + Session 2 (cws-content). The script layer + first skill = meaningful end-to-end value (user can go from fresh clone to ship-ready listing).

If you have a week: Sessions 1, 2, 3. That's the flagship flow end-to-end (content → ship → live).

Session 4 (screenshots) is best scheduled as its own focused day — it's the largest and the subject matter (visual design, headless Chrome, Next.js) is distinct from the rest of the work.

Session 5 (init) after 2 and 4 ship — it assumes those exist to delegate to.

Session 6 (video) after 3 and 5 ship — retrofits delegation into both of those skills, so they need to exist first. Can parallel with other follow-on work.

---

## Session 7 — `cws-ship` update mode

**Kind:** Skill extension. Modifies `/skills/cws-ship/SKILL.md` (no new skill file) plus a small addition to `scripts/cws-api.ts`.

**Goal:** Today `cws-ship` treats every submission as a first-time launch. The common case after launch is an *update* — same extension ID, new version, different review rules. CWS scrutinizes significant manifest / permission changes on updates ("change of functionality" → re-review). The skill should detect update mode, warn on risky deltas, and coach through the in-dashboard permission-justification note CWS asks for.

**Prerequisites:** Sessions 1 (cws-api has `getPublishedVersion` / `getListing`) and 3 (cws-ship exists). Only runs meaningfully with CWS secrets configured — gracefully degrades on no-secrets (treats as first-time).

**Deliverables:**

1. `/scripts/cws-api.ts` — one new helper `getLivePermissions(secrets)` that returns the currently-live manifest's `permissions` + `host_permissions` + `optional_host_permissions` arrays (if CWS API exposes them, else returns `null` + skip). Same no-secrets / API-fail guard pattern as the existing helpers.

2. `/skills/cws-ship/SKILL.md` — new Phase A.4 between rule-id routing and Phase B (version sync):
   - Check if the extension has a live version on CWS (use existing `getPublishedVersion` from cws-api).
   - If no live version OR no secrets: skip — treat as first-time (current behavior).
   - If live version exists: enter update mode. Fetch live permissions via the new helper. Diff local vs. live:
     - Permissions added → warn. List them. Explain these trigger re-review.
     - Permissions removed → informational. Usually fine, but flag if it's a permission the listing description mentions (the user may need to update listing copy too).
     - Broadened host patterns (e.g., `https://example.com/*` → `https://*/*`) → big warn. Treat as high-risk.
     - `optional_host_permissions` additions → lower risk, but still flag.
   - Coach the user: "CWS's Privacy tab has a 'Permissions justification' field. For any new permission above, write one sentence per permission explaining why — reviewers read these. Here's a draft you can paste: [generate]."

3. Update cws-ship's rejection-recovery recipes — add "Update rejected for change of functionality" entry, pointing back to Phase A.4's output.

4. `/docs/03-cws-best-practices.md` — add a short "Updating an existing extension" section mirroring the Phase A.4 logic.

5. `ARCHITECTURE.md` — mark Session 7 done in Planned extensions. Resolve the "Updates workflow vs. first submission" limitation in Known Limitations.

**Acceptance:**

```
# Without CWS secrets (most contributors):
npm run check:cws                                # still green
npm run check:cws:ship                           # still 6 errors on fresh factory
# cws-ship's Phase A.4 probes, no live version detected → skips, falls through to first-time flow

# With CWS secrets + a real live extension ID:
# cws-ship detects update mode and warns on added permissions
```

Unit-testable? Phase A.4's diff logic is — write a small test that exercises `diffPermissions(local, live)` against fixture data. Do this; it's cheap and the rule is subtle.

**Out of scope:** Automated CWS dashboard edits (no stable API). Auto-generating the listing description diff (judgment-heavy — belongs to cws-content in a future session).

**Risks:**
- CWS API may not expose live permissions cleanly. Probe it before designing the diff — if the API only returns a subset, scope accordingly.
- False positives on cosmetic diffs (ordering, Firefox-vs-Chrome permission name variance). Normalize both sides before comparing.

**Estimate:** Half day.

---

## When this roadmap is "done"

All six shipped sessions acceptance-criteria complete (done). Session 7 is follow-up — promotes a Known Limitation to a concrete next PR. After Session 7: a user on their 5th update, with real CWS secrets configured, gets coaching on change-of-functionality re-review before they hit it. A new contributor who clones this repo can type `/cws-init` and go from zero to a live extension — including screenshots AND a launch video — without ever being asked to memorize a CWS rule or remember which command to run. That's the success state the philosophy is pointing at.
