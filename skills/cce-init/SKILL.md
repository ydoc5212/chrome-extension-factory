---
name: cce-init
description: First-time onboarding for a freshly-cloned Chrome Extension Factory. Orients the user on the factory's philosophy, walks through extension-shape profile selection (deleting unused entrypoints), delegates to `cws-content` for listing copy, optionally runs `cws-screens` for screenshots, optionally walks through OAuth setup, confirms structural green, and drops a `.cce-init-done` marker. Idempotent — re-invoking on an already-initialized factory offers a sub-recipe menu instead of re-running the whole flow.
triggers:
  - "user just cloned the chrome extension factory"
  - "fresh factory clone"
  - "first time setup"
  - "initialize the extension factory"
  - "onboard me to this repo"
  - "what do I do first"
  - "help me get started with this extension template"
  - "strip down the factory for my use case"
  - "/cce-init"
invokes:
  - "cws-content"                                      # skill delegation for listing copy (Phase D)
  - "cws-screens"                                      # skill delegation for screenshots (Phase E, optional)
  - "cws-video"                                        # skill delegation for launch video (Phase E2, optional)
  - "npm run check:cws"                                # structural validator (Phase G)
  - "npx wxt prepare"                                  # regenerate WXT types after profile-strip (Phase C)
writes:
  - ".cce-init-done"                                   # marker file dropped at Phase H
  - ".gitignore"                                       # add the marker to gitignore (Phase H)
  - "CLAUDE.md"                                        # inject/refresh publishing-directive marker block (Phase H)
  - ".claude/publishing-directive.md"                  # canonical directive body, imported by CLAUDE.md (Phase H)
  - "entrypoints/"                                     # delete unused entrypoints during profile selection (Phase C)
  - "entrypoints/*/App.tsx"                            # bespoke UI skeletons in Phase C2
  - "entrypoints/content.ts"                           # bespoke DOM hook in Phase C2
  - "entrypoints/background.ts"                        # bespoke message/storage wiring in Phase C2
  - "wxt.config.ts"                                    # only to remove orphaned permissions flagged in Phase C
---

# cce-init skill

You are driving the `cce-init` skill. Your single responsibility is to orient a brand-new user of the Chrome Extension Factory: explain the philosophy briefly, strip the factory to their extension shape, delegate to other skills for content and screenshots, optionally walk OAuth setup, confirm `check:cws` stays green, and drop a marker file so subsequent runs know init is done.

You do NOT write listing copy yourself (that's `cws-content`). You do NOT generate screenshots yourself (that's `cws-screens`). You do NOT submit or zip (that's `cws-ship`). You DO:

- Detect whether this is a fresh clone.
- Walk profile selection (4 profiles) and delete the entrypoints that don't belong to the user's chosen profile.
- Delegate to `cws-content` for initial listing/welcome copy.
- Delegate to `cws-screens` for screenshot scaffolding (if `screenshots/` still exists).
- Walk the OAuth setup stepwise, linking to `docs/06-keepalive-publish.md` rather than duplicating it.
- Run `npm run check:cws` at the end to confirm the factory invariant holds.
- Drop `.cce-init-done` and add it to `.gitignore`.

The factory invariant after a fresh-clone run: `npm run check:cws` stays green; `npm run check:cws:ship` drops from 4 content errors to 0 (modulo `ship-ready-screenshots` if the user skipped Phase E, which is expected and fine).

---

## Phase 0 — Locate the factory

Before anything else, figure out whether the current working directory IS a factory repo. A factory repo has BOTH of:

- `wxt.config.ts` at the repo root
- `scripts/validate-cws.ts`

**If both present:** you're in a factory. Proceed to Phase A.

**If either is missing:** the user invoked `/cce-init` outside a factory. Offer to clone:

> This directory isn't a Chrome Extension Factory. Want me to clone one?
>
> 1. Clone into a new subdirectory of the current working directory (recommended). Ask for a name.
> 2. Clone into an existing empty directory. Ask for the path.
> 3. Cancel — I'll exit and the user can run `npx create-chrome-extension <name>` themselves.

On choice 1: ask for the name, then run `git clone --depth 1 <factory-repo-url> ./<name>` + `rm -rf ./<name>/.git` + `git init ./<name>` + switch the skill's working directory to `./<name>` (use the Bash tool's `cwd` for subsequent calls). Then run `npm install` in the new directory. Then proceed to Phase A from the new directory.

On choice 2: validate the target is empty; same sequence.

On choice 3: exit cleanly with instructions:

> Run `npx create-chrome-extension <name>` to scaffold the factory, then re-invoke `/cce-init` inside the new directory.

The factory repo URL is fixed — use the canonical URL documented in `packages/cli/bin/cli.mjs` (`REPO_URL`, overridable via `CCE_REPO_URL` env var). Do not invent a different URL.

---

## Phase A — Detect state

**Before anything else**, figure out whether this is a fresh clone or a re-invocation.

Run these three checks (all three must indicate "fresh" for the factory to count as fresh):

1. **Marker file check.** Does `.cce-init-done` exist at the repo root? If yes → not fresh.
2. **Manifest name check.** Read `wxt.config.ts`. Is `manifest.name` still `'My Extension'`? If no → not fresh.
3. **Welcome config check.** Read `entrypoints/welcome/config.ts` (if it exists). Does it contain any of these factory placeholder strings?
   - `"A brief one-sentence description"`
   - `"your-org"`
   - `"your-extension"`
   If none present AND welcome/config.ts still exists → not fresh. (If the file doesn't exist, the user stripped welcome/ in a previous init — treat that as "not fresh" even if the other signals are ambiguous.)

**If fresh** (marker absent AND default name AND welcome placeholders present): continue to Phase B.

**If not fresh**: do NOT re-run the full flow. Print:

> Looks like you've already run `cce-init` on this factory (marker file present / name customized / welcome copy filled in). I won't re-delete entrypoints or overwrite your config.
>
> Want to re-run a specific step? Pick one:
>
> 1. **Profile selection** — re-strip entrypoints (destructive; only if you changed your mind about the extension shape).
> 2. **Listing content** — re-run `cws-content` to rewrite name / description / welcome copy.
> 3. **Screenshots** — run `cws-screens` to add or update your 5 CWS screenshots.
> 4. **OAuth setup** — walk through the 4 CWS secrets so `npm run ship` can auto-publish.
> 5. **Exit** — no action.

Then branch based on the user's pick:

- `1` → jump to **Phase C** (profile selection). Warn first: "This will delete entrypoints. You've already customized this factory — are you sure?"
- `2` → delegate to `cws-content` (Phase D).
- `3` → delegate to `cws-screens` (Phase E).
- `4` → run Phase F only.
- `5` → stop cleanly.

Do NOT run Phases B, G, or H on a re-invocation. The marker already exists; no need to re-drop it.

---

## Phase B — Orient

The user is looking at a factory clone for the first time. They need a short, honest orientation before you start deleting things. Keep it tight — 3 to 5 sentences, not a blog post. Say roughly:

> This factory leans on **scripts, not model recall**. The rules for "is this extension well-formed" and "is this ready to ship" live in `scripts/validate-cws.ts` — the model's job is to interview you and translate your answers into edits that satisfy those rules.
>
> There are two gates:
> - `npm run check:cws` — structural. Green by design on a fresh clone. Catches regressions you introduce (broad permissions, remote code, CSP holes).
> - `npm run check:cws:ship` — structural + content-ready. Red by design on a fresh clone. Goes green after you fill in your listing / welcome / screenshots.
>
> `npm run zip` gates on `check:cws:ship`, so you literally cannot produce a submittable artifact until you're ready. You don't have to memorize any of these commands — `npm run ship` chains everything when you're ready to publish.
>
> More on the philosophy in `ARCHITECTURE.md`. When in doubt, run the script.

Then show the short command table:

| Command | What it does | Factory state |
|---|---|---|
| `npm run check:cws` | Structural validator | Green |
| `npm run check:cws:ship` | Structural + content-ready | Red (by design) |
| `npm run zip` | Build + package (gated on ship-ready) | Refuses (by design) |
| `npm run ship` | The whole pipeline: validate → version-sync → zip → publish | Halts at first red gate |

End with: "OK — let's customize this to your extension. First question is about the shape."

---

## Phase B2 — Front-loaded interview

Collect every answer needed for Phases C, C2, D, E, E2, F in one pass. No scaffolding, no deletions, no delegation yet — just questions.

Ask in this order, one at a time (wait for each answer before the next):

1. **Pitch** — "In one or two sentences, what are you building?" (feeds Phase C recommendation + Phase C2 bespoke code)
2. **Target sites** — "What URLs will this run on? Be specific (e.g., `https://news.ycombinator.com/*`) or say 'no host access needed' if you're only using `activeTab`." (feeds Phase C welcome-page decision + `wxt.config.ts` permissions)
3. **Welcome page** — inferred from (2): if host access needed, keep welcome; if not, ask "delete the welcome page?" and default to yes.
4. **Features** — ask once, comma-separated: "Any of: auth / persistent storage / keyboard shortcuts / background alarms / none?"
5. **Listing basics** — "What's the extension's public name? (3–45 chars)" and "One-line tagline? (used as the CWS summary)"
6. **Screenshots** — "Scaffold 5 CWS screenshots now, or defer? (now / defer)"
7. **Video** — "Scaffold a launch video now, or defer? (now / defer)"
8. **OAuth** — "Set up automated publishing credentials now, or defer? (now / defer)"

After the user answers all 8, show a one-screen summary of what's about to happen:

> Here's the plan:
>
> - Profile: <picked>
> - Deletes: <list>
> - Bespoke code in: <kept entrypoints>
> - Listing: name "<name>", tagline "<tagline>"
> - Screenshots: <now | defer>
> - Video: <now | defer>
> - OAuth: <now | defer>
>
> Run the plan? (yes / change something / cancel)

On "yes": execute Phases C → C2 → D → E → E2 → F in order without re-interviewing.

On "change something": ask which answer to revise, update it, re-show the summary.

On "cancel": exit cleanly, no changes.

**Important:** when delegating to `cws-content`, `cws-screens`, `cws-video` in later phases, pass the answers already collected here as context so those skills don't re-ask. If a sub-skill insists on re-interviewing, accept it — don't fight it — but prefer skills that accept pre-filled answers.

---

## Phase C — Profile selection (pitch-driven)

Use the pitch already collected in Phase B2. If for any reason it's missing (skill was invoked directly into Phase C), ask now: "In one or two sentences — what are you building?"

Based on the pitch, **recommend** one of the 4 profiles from `docs/01-extension-type-profiles.md`. Heuristics:

- "page enhancer / injector / modifier / block / highlight / modify the DOM" → **content-script-only**
- "quick action from the toolbar / popup / click the icon to ___" → **popup-based**
- "persistent panel / research / reference / chat with a page" → **sidepanel**
- "everything / I need it all / let me decide later" → **full hybrid**

Present the recommendation with a clear exit:

> Sounds like **<profile name>** fits best: <one-sentence why>. That means I'll delete:
>
> <exact delete list from the profile-strip semantics below>
>
> Does that match? (yes / show the other options / keep everything)

On "yes": proceed to the welcome follow-up (below) and then profile-strip semantics.

On "show the other options": present the 4-option menu (see `### Fallback: menu selection` below) and let the user pick.

On "keep everything": treat as full-hybrid (profile 4, no deletions).

### Fallback: menu selection

If the user asks to see the options, show this menu verbatim:

> What's the shape of your extension? Pick one:
>
> **1. Content-script-only** — page enhancer / injector / modifier. No toolbar UI.
> *Deletes:* `entrypoints/popup/`, `entrypoints/options/`, `entrypoints/sidepanel/`.
> Keeps: `entrypoints/content.ts`, `entrypoints/welcome/` (optional — keep if you need host permissions at install time; delete if your extension works with smart defaults).
>
> **2. Popup-based** — quick-action tool triggered from the toolbar icon.
> *Deletes:* `entrypoints/content.ts`, `entrypoints/sidepanel/`, `utils/dom.ts`, `utils/observer.ts`.
> Keeps: `entrypoints/popup/`, `entrypoints/background.ts`, `entrypoints/options/`, `entrypoints/welcome/` (optional).
>
> **3. Sidepanel** — persistent panel alongside the page (research / reference tool).
> *Deletes:* `entrypoints/popup/`, `entrypoints/content.ts`, `utils/dom.ts`, `utils/observer.ts`.
> Keeps: `entrypoints/sidepanel/`, `entrypoints/background.ts`, `entrypoints/options/`, `entrypoints/welcome/` (optional).
>
> **4. Full hybrid** — content script + popup + sidepanel + options. The kitchen sink.
> *Deletes:* nothing. This is the factory default.
> Keeps: everything.

For each profile except "Full hybrid," **also** ask a follow-up:

> Do you need a welcome / onboarding page? Keep it if your extension requests host permissions (the welcome page is where the user grants them from a button click — the pattern that avoids the CWS "in-depth review" banner). Delete it if your extension works with smart defaults and no host permissions.
>
> Answer: keep / delete.

### Profile-strip semantics (exact rules)

These are the exact delete sets per profile — use these verbatim. Never delete anything outside this list in a single pass.

**Content-script-only (profile 1):**
- `entrypoints/popup/`
- `entrypoints/options/`
- `entrypoints/sidepanel/`
- If welcome = delete: also `entrypoints/welcome/`, `utils/permissions.ts`, and the `tabs.create` block in `entrypoints/background.ts`. If no other background logic is kept (messaging, alarms), delete `entrypoints/background.ts` too.

**Popup-based (profile 2):**
- `entrypoints/content.ts`
- `entrypoints/sidepanel/`
- `utils/dom.ts`
- `utils/observer.ts`
- If welcome = delete: also `entrypoints/welcome/`, `utils/permissions.ts`, and the `tabs.create` block in `entrypoints/background.ts`.

**Sidepanel (profile 3):**
- `entrypoints/popup/`
- `entrypoints/content.ts`
- `utils/dom.ts`
- `utils/observer.ts`
- If welcome = delete: same as above.

**Full hybrid (profile 4):**
- Delete nothing. Skip to Phase D.

### Execute the deletions

Before deleting, summarize the plan and ask for explicit confirmation:

> About to delete:
> - `entrypoints/content.ts`
> - `entrypoints/sidepanel/`
> - `utils/dom.ts`
> - `utils/observer.ts`
>
> This is destructive. Proceed? (y/n)

On confirmation, delete each path. After all deletions, run:

```bash
npx wxt prepare
```

This regenerates `.wxt/` types to match the new entrypoint set. WXT will complain loudly if a deleted entrypoint is still imported somewhere; if that happens, surface the error and ask the user to help disambiguate (usually it means a file you kept still imports from a file you deleted — `utils/messaging.ts` importing from `utils/dom.ts` would be a typical case).

### Permission cleanup

After entrypoints are deleted, check `wxt.config.ts` for orphaned permissions:

- Deleted `entrypoints/sidepanel/` → `'sidePanel'` in `manifest.permissions` is now orphaned. Remove it. Also remove `minimum_chrome_version: '114'` if that was only there for sidePanel.
- Deleted `entrypoints/background.ts` entirely → `'alarms'` in `manifest.permissions` is orphaned. Remove it. Also remove `optional_host_permissions` if nothing requests them.
- Kept background but no messaging/alarms usage → let the user decide; don't auto-remove, just flag.

Edit `wxt.config.ts` to remove the orphaned permissions. Show the diff to the user before writing. The structural validator rule `unused-permission` will catch anything you miss, so a second pass is cheap.

**Important:** after profile-strip, re-run `npm run check:cws`. It must stay green. If it doesn't (e.g., `unused-permission` fires), fix whatever it flags before moving on. This is the only place in the init flow where `check:cws` might break, and fixing it here is the user's investment in a clean factory.

---

## Phase C2 — Bespoke first-run code

The kept entrypoints still contain factory templates (generic hello-world popups, placeholder content-script DOM hooks). Now tailor them to the user's pitch so the first `npm run dev` shows something resembling their idea, not a stock demo.

**Scope:** only the entrypoint files that were kept. Do NOT touch `utils/`, `scripts/`, `wxt.config.ts` (already handled in Phase C), or any test file.

**What "bespoke" means, per kept entrypoint:**

- `entrypoints/content.ts` — replace the demo DOM-manipulation with a skeleton that matches the pitch. If the user said "highlight headlines on news sites," write a `queryAllDeep('h1, h2, h3')` loop with a `background: yellow` application. If they said "block tracker scripts," write a `MutationObserver` that looks for `<script src="...">` and removes matches. Do not leave `console.log('hello')` placeholders.
- `entrypoints/popup/App.tsx` — replace the demo counter with the minimal UI implied by the pitch. "Save the tab to a list" → a button + a list component reading from `chrome.storage.local`. "Translate selected text" → a textarea + a button + a result div. Keep it short (~50 LOC), functional, and compile-clean.
- `entrypoints/sidepanel/App.tsx` — same as popup, but laid out for a taller persistent panel.
- `entrypoints/background.ts` — if the pitch implies message-passing or storage, wire the minimal handler. Keep the factory's typed-messaging pattern (`@webext-core/messaging`).
- `entrypoints/options/App.tsx` — leave as a minimal settings stub unless the pitch explicitly calls for settings (e.g., "let users configure which sites to run on").

**Do not** fabricate features the user didn't ask for. Do not add auth, analytics, or third-party integrations unless they came up in the interview.

**After writing bespoke code, run `npm run check:cws`.** It must stay green. If it goes red, most likely you imported a browser global incorrectly or referenced a deleted util — fix before moving on.

**If the pitch is too vague to generate real code** (e.g., "I'll figure it out later"): skip this phase. Leave the factory templates in place. Tell the user:

> Leaving the factory templates in `entrypoints/` — you can flesh them out once you know what you're building. Moving on to listing content.

---

## Phase D — Listing content

State the delegation plainly:

> Now invoking the `cws-content` skill to fill in listing metadata. It'll ask you about name, description, host permissions, and welcome-page copy. That skill runs `npm run check:cws:ship` under the hood and writes to `wxt.config.ts` and `entrypoints/welcome/config.ts`.

Invoke the `cws-content` skill. Wait for it to report back — specifically, wait for it to confirm that all four content rules it owns (`listing-ready-name`, `listing-ready-description`, `ship-ready-optional-host`, `ship-ready-welcome-config`) are cleared, OR to report which ones it couldn't clear (e.g., the user didn't have a privacy policy URL yet — that's a legitimate partial state).

Do NOT duplicate `cws-content`'s recipes. Do NOT re-interview the user yourself. That skill is the source of truth for listing content.

If the user deleted `entrypoints/welcome/` in Phase C, `cws-content`'s Recipe D (`ship-ready-welcome-config`) won't fire — the validator rule is keyed on the file existing. That's correct; move on.

---

## Phase E — Screenshots (optional)

Check whether `screenshots/` still exists at the repo root. It's a Next.js subproject the factory ships with.

**If `screenshots/` exists**: offer to delegate to `cws-screens`:

> Want to scaffold your 5 Chrome Web Store screenshots now? I'll hand off to the `cws-screens` skill. You don't have to finalize copy today — but even draft screenshots clear the `ship-ready-screenshots` validator rule. You can always come back and tweak.
>
> yes / skip

If yes: invoke `cws-screens` and wait for it to report back. Like Phase D, do NOT duplicate its recipes.

If skip: note that `ship-ready-screenshots` will stay red until the user runs `cws-screens` later. That's fine; the factory allows shipping-adjacent states. Move on.

**If `screenshots/` was deleted** (the user stripped it previously — cce-init doesn't delete it in Phase C, but it may have been removed in a prior session): skip this phase silently. Don't tell the user to re-add it; if they wanted screenshots they'd have kept the subproject.

---

## Phase E2 — Launch video (default-on)

The factory ships a launch-video workflow by default. Taste decision documented in ARCHITECTURE.md: CWS listings with a promo video convert markedly better, and the same asset doubles as a launch asset for ProductHunt / Twitter / LinkedIn. One asset, many surfaces.

Check whether `video/` still exists at the repo root.

**If `video/` exists**: offer to delegate to `cws-video`:

> Want to scaffold a launch video now? I'll hand off to the `cws-video` skill. It'll interview you for a 30-second hook + beats, then invoke `heygen-com/hyperframes` (an external skill — `npx skills add heygen-com/hyperframes` if you haven't) to generate the actual video. The same file works for CWS embed, ProductHunt, and socials.
>
> yes / skip

If yes: invoke `cws-video` and wait for it to report back. Do NOT duplicate its recipes. If `cws-video`'s Phase A reports hyperframes is missing and the user opts to defer the install, accept that — cws-video handles the graceful skip.

If skip: note that `ship-ready-video` will stay red until the user runs `cws-video` later. That's fine; matches how screenshots work.

**If `video/` was deleted** (the user genuinely doesn't want a video — explicit opt-out): skip this phase silently. The `ship-ready-video` rule no-ops on absent `video/`, matching the `screenshots/` escape hatch.

---

## Phase F — OAuth setup (optional)

Ask:

> Want to enable automated publishing? This unlocks `npm run ship` to submit your extension directly to the Chrome Web Store API without manually uploading the zip through the dashboard. It requires 4 OAuth secrets and takes ~15 minutes one time.
>
> yes / defer

### If "defer"

> Fine — you can still ship manually: `npm run zip` produces a zip in `.output/` (once ship-mode is green), and you drag-and-drop it into the CWS developer dashboard. The `ship` skill will walk you through that path too. Come back and re-run `cce-init` option 4 when you're ready for automation.

Move on to Phase G.

### If "yes"

Delegate to the `setup-cws-credentials` skill. That skill owns:
- The `gcloud` automation (project create, API enable, best-effort OAuth brand)
- The manual wall (OAuth Desktop Client ID) with computer-use + GUI-wizard fallbacks
- Refresh token harvesting via `npx chrome-webstore-upload-keys`
- Persistence to `.secrets.local.json` (gitignored)
- End-to-end verification via `npm run check:cws:ship --json`

Invoke it and wait for it to report back. Do NOT re-explain the Google Cloud Console flow here — `setup-cws-credentials` and `docs/08-google-cloud-setup.md` are the source of truth. If the user defers any sub-step (e.g. doesn't have a CWS listing yet), accept that and move on; the skill is safe to re-run to fill in missing pieces.

---

## Phase G — Confirm structural green

Run:

```bash
npm run check:cws
```

Expected: green. This is the factory invariant. If it's red, something went wrong in Phase C — most likely an orphaned permission or a broken import from a deleted file.

**If green:** Report the pass briefly and move on:

> `check:cws` is green. Structural invariant holds. Moving to finalize.

**If red:** do NOT proceed to Phase H. Surface the exact validator output to the user and help them fix it. Typical root causes from Phase C:

- `unused-permission` fired → a permission in `wxt.config.ts` isn't used by any kept entrypoint. Remove it.
- TypeScript compile error → a kept file imports from a deleted file. Fix the import (usually `utils/messaging.ts` importing from `utils/dom.ts`, or `entrypoints/background.ts` importing from `utils/permissions.ts`).
- `.output/` missing → `wxt build` didn't run. The `check:cws` script wraps it; re-run `npm run check:cws` after fixing.

After fixing, re-run `npm run check:cws` until it's green. Only then continue to Phase H.

---

## Phase H — Finalize

Four things happen here: inject the publishing directive into `CLAUDE.md`, drop the marker, update `.gitignore`, print the summary.

### Inject the publishing directive (idempotent)

This is the "set-it-and-forget-it" contract with future Claude Code sessions: whenever the user mentions publish / ship / Chrome Web Store / CWS / store listing / screenshots / launch video / OAuth credentials, the session MUST invoke the matching skill (`cws-ship`, `cws-content`, `cws-screens`, `cws-video`, `setup-cws-credentials`) instead of hand-rolling a zip-and-dashboard walkthrough. Without it, Claude defaults to manual pre-flight checklists and asks the user for guidance — the exact failure mode we are preventing.

**Source of truth.** The canonical directive body lives inside this skill at:

```
skills/cce-init/templates/publishing-directive.md
```

Phase H treats that file as authoritative. It does NOT read from the factory's own `CLAUDE.md`, because in a scaffolded child project the factory checkout is gone (the CLI does `rm -rf .git`) — so "read from factory sources" has no meaning. Reading from the skill's own template works everywhere: fresh scaffold, retrofit of a pre-fix scaffold, or one-off invocation on an unrelated repo.

**Algorithm (runs every `cce-init` invocation, including re-runs):**

1. **Load the canonical body.** Read `<skill-dir>/templates/publishing-directive.md` where `<skill-dir>` is the directory containing this `SKILL.md`.
2. **Write the child project's directive file.** Write the canonical body byte-for-byte to `<repo>/.claude/publishing-directive.md`, creating `.claude/` if needed. Overwrite unconditionally — the template is authoritative.
3. **Splice the marker block into `<repo>/CLAUDE.md`.** The block is exactly:

   ```
   <!-- CCE:publishing-directive:begin v1 -->
   @.claude/publishing-directive.md

   <!--
     The directive body lives at `.claude/publishing-directive.md` (imported above).
     This block is managed by `cce-init` Phase H. Do not hand-edit between the
     markers — edits get overwritten on the next `/cce-init` run.
   -->
   <!-- CCE:publishing-directive:end -->
   ```

   Then:
   - If `CLAUDE.md` does not exist: create it with the child project's name as an `# H1` heading, a blank line, then the marker block.
   - If `CLAUDE.md` exists and contains any line starting with `<!-- CCE:publishing-directive:begin` and a later `<!-- CCE:publishing-directive:end -->`: splice out everything from the begin-line through the end-line (inclusive) and replace with the block above. Match on the begin-marker *prefix* (not the exact version suffix) so a stale `v0`/`v1` block is replaced cleanly when the version bumps.
   - If `CLAUDE.md` exists with no markers: insert the block immediately after the first top-level `#` heading (or at top if none). Leave the rest of the file untouched — no reformatting, no deleting.

4. **Do not** paraphrase or shorten the template body. Do not embed the body inline in `CLAUDE.md`. The `@.claude/publishing-directive.md` import is load-bearing — it survives CLAUDE.md regeneration by other tools far better than an inline block.

5. **Verify.** Run `npm run check:cws`. The `claude-md-publishing-directive-present` rule will be red if either the marker block or `.claude/publishing-directive.md` is missing/corrupt. Green = the injection succeeded.

**Version bumps.** To evolve the directive: edit `skills/cce-init/templates/publishing-directive.md` and bump the marker suffix (`v1` → `v2`) in this skill's splice block above. Phase H's prefix match (`<!-- CCE:publishing-directive:begin`) will replace the older block on the next run. Old scaffolds self-heal on the next `/cce-init`.

### Drop the marker

Write a single-line file at the repo root: `.cce-init-done`

Content is just the current date in ISO 8601 (e.g., `2026-04-16`). This file is purely a signal to future `cce-init` invocations that initialization is complete; it has no other consumer.

### Update `.gitignore`

Read the current `.gitignore`. If it doesn't already contain `.cce-init-done`, add a section:

```
# cce-init marker (local-only; signals init has been run)
.cce-init-done
```

Add it above the existing `# Secrets` section or near the bottom — order doesn't matter, grouping does. Don't accidentally reformat the rest of the file.

### Print the summary

> **Init complete.** Factory customized to your profile.
>
> What you did:
> - Profile: `<profile name>` (deleted: `<list of deleted paths>`)
> - Listing: name `<name>`, description `<N>` chars. (Run `cws-content` to rewrite.)
> - Screenshots: `<done via cws-screens>` | `<skipped — run cws-screens later>`
> - OAuth: `<configured — 4 secrets in env>` | `<deferred — use manual zip upload>`
>
> Current state:
> - `npm run check:cws` — green (structural is clean)
> - `npm run check:cws:ship` — `<green>` | `<still flagging ship-ready-screenshots, which is expected since you skipped Phase E>`
>
> Next steps:
> - To rewrite listing copy later: invoke `/cws-content`.
> - To scaffold screenshots later: invoke `/cws-screens`.
> - When ready to submit: invoke `/cws-ship` — it runs the whole pipeline end-to-end.

If Phase F was run (OAuth configured), add:

> `npm run ship` is wired for auto-publish. The secrets are in your shell env.

If Phase F was deferred:

> When you want to flip `npm run ship` on, re-run `/cce-init` and pick option 4 (OAuth setup).

Stop. Do not re-run anything else.

---

## Worked example — "popup-based" profile, full run

This traces a complete fresh-clone run so you can see the shape of a good session.

### Starting state

User runs `/cce-init` on a freshly-cloned factory. Phase A checks:

- `.cce-init-done` — absent.
- `wxt.config.ts` `manifest.name` — `'My Extension'`.
- `entrypoints/welcome/config.ts` — contains `"A brief one-sentence description"` and `"your-org"`.

All three signals say fresh. Continue to Phase B.

### Phase B — orient

Skill prints the 4-sentence philosophy summary + the command table. User says "got it."

### Phase C — profile selection

Skill asks which shape fits. User says:

> I'm building a quick-action tool triggered from the toolbar — a popup that lets me save the current tab's URL to a list.

Skill suggests **profile 2 (popup-based)** and confirms. User confirms.

Skill asks: "Do you need a welcome page? You're asking for host access (reading the current tab) — so probably yes."

User: "I'm only using `chrome.tabs.query()` for the active tab's URL, which just needs the `activeTab` permission — I don't need broad host access. Delete the welcome page."

Skill summarizes the delete plan:

```
About to delete:
  entrypoints/content.ts
  entrypoints/sidepanel/
  utils/dom.ts
  utils/observer.ts
  entrypoints/welcome/
  utils/permissions.ts

Also removing the `tabs.create` welcome-open block from entrypoints/background.ts.

Proceed? (y/n)
```

User: "y."

Skill deletes each path. Then runs:

```bash
npx wxt prepare
```

Output: WXT regenerates types without `entrypoints/welcome/` in the entrypoint set.

Skill inspects `wxt.config.ts`. Orphaned permissions:

- `'sidePanel'` — no sidepanel entrypoint anymore.
- `'alarms'` — background still exists but alarms block is unused; user confirms they don't need alarms → remove.
- `optional_host_permissions: ['https://example.com/*']` — welcome page was the only consumer → remove.
- `minimum_chrome_version: '114'` — only needed for sidePanel → remove.

Skill edits `wxt.config.ts`. The manifest now reads:

```ts
manifest: {
  name: 'My Extension',
  description: 'A brief description of what this extension does.',
  permissions: ['storage'],
},
```

Skill also trims `entrypoints/background.ts`: removes the `browser.runtime.onInstalled` tabs.create block (welcome is gone) and the `browser.alarms.create` block (alarms permission removed). Leaves the `onMessage('ping', ...)` block so the popup can message the background.

Skill runs `npm run check:cws`. Green. Phase C is done.

### Phase D — listing content

Skill says:

> Now invoking `cws-content` to fill in listing metadata. It'll ask you about name, description, and welcome-page copy. (Welcome's deleted for your profile, so it'll skip the welcome recipe.)

Skill delegates to `cws-content`. That skill runs its validator check, finds 3 content errors (name, description, optional-host — no welcome since it was deleted), runs its Recipes A, B, C with the user:

- **A (name)**: user describes "save the current tab to a reading list"; skill drafts 3 candidates; user picks "Tab Stash."
- **B (description)**: skill drafts 3 descriptions; user picks a feature-framed one ~110 chars.
- **C (optional-host)**: user clarifies the extension uses `activeTab` rather than broad host access — no origins needed. Skill writes `optional_host_permissions: []` (empty array; the rule only fires on the `https://example.com/*` placeholder specifically).

`cws-content` re-runs the validator, reports: 0 content errors remaining (welcome was deleted, so `ship-ready-welcome-config` doesn't fire; `ship-ready-screenshots` still fires because screenshots haven't been generated, but that's Phase E's problem, not cws-content's).

`cws-content` hands control back.

### Phase E — screenshots

Skill checks: `screenshots/` exists (default factory state; user didn't delete it). Offers:

> Want to scaffold your 5 CWS screenshots now? (yes / skip)

User: "skip. Coming back to this later."

Skill notes: `ship-ready-screenshots` will stay red until `/cws-screens` runs. Moving on.

### Phase F — OAuth setup

Skill asks:

> Want to enable automated publishing? (yes / defer)

User: "defer."

Skill: "OK — manual zip upload via the CWS dashboard is fine. `npm run zip` produces the zip; drag-and-drop into the developer console. Come back and re-run `/cce-init` option 4 when you want automation."

### Phase G — confirm green

Skill runs:

```bash
npm run check:cws
```

Green. Phase G passes.

### Phase H — finalize

Skill writes `.claude/publishing-directive.md` by copying byte-for-byte from `skills/cce-init/templates/publishing-directive.md`.

Skill splices the marker block into `CLAUDE.md` (idempotent — prefix-matches `<!-- CCE:publishing-directive:begin` so stale versions get replaced cleanly):

```
<!-- CCE:publishing-directive:begin v1 -->
@.claude/publishing-directive.md

<!--
  The directive body lives at `.claude/publishing-directive.md` (imported above).
  This block is managed by `cce-init` Phase H. Do not hand-edit between the
  markers — edits get overwritten on the next `/cce-init` run.
-->
<!-- CCE:publishing-directive:end -->
```

Skill writes `.cce-init-done`:

```
2026-04-16
```

Skill edits `.gitignore` to add:

```
# cce-init marker (local-only; signals init has been run)
.cce-init-done
```

Skill runs `npm run check:cws` to confirm `claude-md-publishing-directive-present` is green.

Skill prints summary:

> **Init complete.** Factory customized to your profile.
>
> What you did:
> - Profile: popup-based (deleted: `entrypoints/content.ts`, `entrypoints/sidepanel/`, `utils/dom.ts`, `utils/observer.ts`, `entrypoints/welcome/`, `utils/permissions.ts`; trimmed `entrypoints/background.ts` and `wxt.config.ts`)
> - Listing: name "Tab Stash," description 110 chars.
> - Screenshots: skipped — run `/cws-screens` later.
> - OAuth: deferred — use manual zip upload via CWS dashboard.
>
> Current state:
> - `npm run check:cws` — green
> - `npm run check:cws:ship` — red on `ship-ready-screenshots` (expected; run `/cws-screens` to clear).
>
> Next steps:
> - To scaffold screenshots later: invoke `/cws-screens`.
> - When you want auto-publish: re-run `/cce-init` and pick option 4 (OAuth setup).
> - When ready to submit: invoke `/cws-ship`.

### Final filesystem state (diff from fresh clone)

Deleted:
- `entrypoints/content.ts`
- `entrypoints/sidepanel/` (directory + contents)
- `entrypoints/welcome/` (directory + contents)
- `utils/dom.ts`
- `utils/observer.ts`
- `utils/permissions.ts`

Modified:
- `wxt.config.ts` — permissions trimmed, optional_host_permissions removed, minimum_chrome_version removed, name + description filled in.
- `entrypoints/background.ts` — welcome tab-create block removed, alarms block removed.
- `.gitignore` — added `.cce-init-done` entry.
- `CLAUDE.md` — publishing-directive marker block (re-)injected.

Created:
- `.cce-init-done` — one-line ISO date.
- `.claude/publishing-directive.md` — canonical CWS-publishing directive (~3KB), imported by CLAUDE.md. Enforced by the `claude-md-publishing-directive-present` validator rule.

This is the end state cce-init is responsible for. `cws-content` owns `wxt.config.ts`'s name/description and (if it still existed) `welcome/config.ts`; `cce-init` owns the profile-strip, the marker, and the publishing directive.

---

## Failure-mode notes

- **User picks a profile, you delete, then `wxt prepare` fails.** The user kept a file that imports from something you deleted. Surface the WXT error, identify the bad import, offer to edit the kept file to remove it. Do NOT re-add the deleted file — that defeats the strip.

- **User changes their mind mid-Phase-C.** If they say "actually I want the sidepanel," stop, apologize, offer to restore from git: `git checkout -- entrypoints/` (if nothing's been committed yet) or `git restore entrypoints/` (more modern). Do not try to manually re-create the files. After restore, re-confirm the profile choice and re-do the delete.

- **`cws-content` fails mid-run** (user refused to answer, network issue, etc.). That's `cws-content`'s problem to handle, not yours. Accept whatever state it reports back in and move to Phase E. The factory invariant tolerates a partial `check:cws:ship` state — `check:cws` is the one that must stay green, and that's structural, not content.

- **User already ran init once, then deleted `.cce-init-done` by accident, then re-invokes.** Phase A's three signals will still detect "not fresh" because the manifest name won't be `'My Extension'` anymore. Good — the skill won't destructively re-run. If the user insists ("no really, it's a fresh start"), they should re-clone the repo rather than fight the detector.

- **`check:cws` is red in Phase G and the user can't figure out why.** Don't guess — read the validator's JSON output. Each finding has a `fix` field naming the exact file and change. Show the user the full finding verbatim and work through one at a time. The rule ids are stable contracts; trust them.

- **User is on Windows.** Delete commands and path separators differ (`rmdir /s` vs `rm -rf`; backslashes vs forward slashes). Use cross-platform approaches where possible; `npx wxt prepare` works either way. Node's `fs.rmSync` with `{ recursive: true }` is a portable alternative if shell commands misbehave.

---

## What this skill does NOT do

- Does not write listing copy, welcome config, or any content the user is responsible for. Delegates to `cws-content`.
- Does not generate screenshots. Delegates to `cws-screens`.
- Does not submit, zip, or publish. That's `cws-ship` (future skill).
- Does not modify `scripts/`, validator rules, or any deterministic-substrate file. It only touches entrypoints/ (profile-strip), `wxt.config.ts` (orphan-permission cleanup), `.gitignore` (marker entry), and the `.cce-init-done` marker itself.
- Does not duplicate the OAuth setup walkthrough — `docs/06-keepalive-publish.md` is the source of truth; this skill references it and just runs the terminal side.
- Does not fabricate defaults. If the user deflects a question, the skill delegates or skips, it does not fill in plausible-looking values.
- Does not run on an already-initialized factory. Phase A's detector short-circuits to the sub-recipe menu.
