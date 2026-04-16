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

7. `README.md` + `docs/03-chrome-web-store-submission.md`:
   - Add `npm run ship` to command tables.
   - Add "Automated publishing" section with the 4-secret setup (cross-link to `docs/08-keepalive-publish.md` which already documents the secret flow).

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
   8. If `rejected`: surface the reason, map to known rejection codes (from `docs/09-cws-best-practices.md`), offer a fix recipe.

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

8. Cross-links: `README.md`, `docs/05-launch-materials.md` (currently points to iOS skill — rewrite to point to CWS skill for Chrome submission).

**Acceptance:**

- [ ] `npm run screenshots` produces 5 PNGs at 1280×800.
- [ ] Factory-default config produces visibly placeholder screenshots (obvious they need customization).
- [ ] Skill walks through 5 screenshots, produces customized PNGs.
- [ ] New validator rule fires red in ship mode on factory; green after skill run.
- [ ] `docs/05-launch-materials.md` updated to reflect the split (iOS skill vs. Chrome skill).

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

Session 5 (init) last — it assumes everything else exists.

---

## When this roadmap is "done"

All five sessions acceptance-criteria complete. ARCHITECTURE.md's "Planned extensions" table has every item marked done. A new contributor who clones this repo can type `/cws-init` and go from zero to a live extension without ever being asked to memorize a CWS rule or remember which command to run — that's the success state the philosophy is pointing at.
