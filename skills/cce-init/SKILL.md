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
  - "entrypoints/"                                     # delete unused entrypoints during profile selection (Phase C)
  - "wxt.config.ts"                                    # only to remove orphaned permissions flagged in Phase C
---

# cce-init skill

You are driving the `cce-init` skill. Your single responsibility is to orient a brand-new user of the Chrome Extension Factory: explain the philosophy briefly, strip the factory to their extension shape, delegate to other skills for content and screenshots, optionally walk OAuth setup, confirm `check:cws` stays green, and drop a marker file so subsequent runs know init is done.

You do NOT write listing copy yourself (that's `cws-content`). You do NOT generate screenshots yourself (that's `cws-screens`). You do NOT submit or zip (that's `cws-ship`). You DO:

- Detect whether this is a fresh clone.
- Walk profile selection (4 profiles) and delete the entrypoints that don't belong to the user's chosen profile.
- Delegate to `cws-content` for initial listing/welcome copy.
- Delegate to `cws-screens` for screenshot scaffolding (if `screenshots/` still exists).
- Walk the OAuth setup stepwise, linking to `docs/08-keepalive-publish.md` rather than duplicating it.
- Run `npm run check:cws` at the end to confirm the factory invariant holds.
- Drop `.cce-init-done` and add it to `.gitignore`.

The factory invariant after a fresh-clone run: `npm run check:cws` stays green; `npm run check:cws:ship` drops from 4 content errors to 0 (modulo `ship-ready-screenshots` if the user skipped Phase E, which is expected and fine).

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

## Phase C — Profile selection

Present the 4 shapes from `docs/01-extension-type-profiles.md`. Ask the user which fits. Show the delete list for each one up front so the tradeoffs are explicit:

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

Do NOT paste the entire contents of `docs/08-keepalive-publish.md`. That doc is the source of truth; duplicating it here rots. Instead, walk the user through the **stepwise terminal prompts** and point at the doc for the detailed "where do I click?" parts.

Say:

> Full walkthrough lives at `docs/08-keepalive-publish.md` — open it in another tab. I'll run the terminal side; you'll run the browser side.
>
> You'll end up with four secrets. Here's what each is and where it comes from:
>
> | Secret | Source | How to get it |
> |---|---|---|
> | `CWS_EXTENSION_ID` | Chrome Web Store dashboard | The 32-char item ID from your listing URL once you've uploaded a draft once. |
> | `CWS_CLIENT_ID` | Google Cloud Console | Create an OAuth 2.0 client ID (Desktop app type). |
> | `CWS_CLIENT_SECRET` | Google Cloud Console | Shown with the client ID. |
> | `CWS_REFRESH_TOKEN` | Generated via `chrome-webstore-upload-keys` | Run the friendly CLI wizard. |
>
> **Step 1.** If you don't already have a CWS listing (even a draft), create one first at https://chrome.google.com/webstore/devconsole. Pay the $5 one-time dev fee, upload any zip (you'll replace it), save. Grab the item ID from the URL.
>
> **Step 2.** Enable the Chrome Web Store API in Google Cloud: https://developer.chrome.com/docs/webstore/using-api — follow the "Register your application" section to get `CLIENT_ID` and `CLIENT_SECRET`.
>
> **Step 3.** Generate a refresh token using the friendlier wizard:
>
> ```bash
> npx chrome-webstore-upload-keys
> ```
>
> Paste the client id + secret it asks for; it opens a browser, you grant consent, and it prints the refresh token.
>
> **Step 4.** Export all four as shell env vars (for local testing). Put them in your shell profile (`~/.zshrc` / `~/.bashrc`) or a local `.env` you source manually — **do not commit them**:
>
> ```bash
> export CWS_EXTENSION_ID="..."
> export CWS_CLIENT_ID="..."
> export CWS_CLIENT_SECRET="..."
> export CWS_REFRESH_TOKEN="..."
> ```
>
> **Step 5.** Verify they're set:
>
> ```bash
> echo $CWS_EXTENSION_ID | grep .
> echo $CWS_CLIENT_ID | grep .
> echo $CWS_CLIENT_SECRET | grep .
> echo $CWS_REFRESH_TOKEN | grep .
> ```
>
> Each should print a non-empty value. If any is blank, go back to that step.
>
> **Step 6 (CI only, if you want the keepalive publish workflow to run in GitHub Actions).** Add the same 4 values as repo secrets at GitHub → Settings → Secrets and variables → Actions. The workflow no-ops cleanly if they're absent, so this is purely opt-in.

Once the user confirms `echo $CWS_EXTENSION_ID | grep .` prints something:

> Secrets confirmed. `npm run ship` will now use them to auto-publish. The scripts in `scripts/cws-api.ts`, `scripts/version-sync.ts`, and `scripts/publish-cws.ts` handle the API calls; you never touch OAuth directly.

If the user runs into any "I clicked the wrong button" issues, point them back at `docs/08-keepalive-publish.md` — do not attempt to re-explain the Google Cloud Console dance yourself.

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

Three things happen here: drop the marker, update `.gitignore`, print the summary.

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

Skill writes `.cce-init-done`:

```
2026-04-16
```

Skill edits `.gitignore` to add:

```
# cce-init marker (local-only; signals init has been run)
.cce-init-done
```

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

Created:
- `.cce-init-done` — one-line ISO date.

This is the end state cce-init is responsible for. `cws-content` owns `wxt.config.ts`'s name/description and (if it still existed) `welcome/config.ts`; `cce-init` owns the profile-strip and the marker.

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
- Does not duplicate the OAuth setup walkthrough — `docs/08-keepalive-publish.md` is the source of truth; this skill references it and just runs the terminal side.
- Does not fabricate defaults. If the user deflects a question, the skill delegates or skips, it does not fill in plausible-looking values.
- Does not run on an already-initialized factory. Phase A's detector short-circuits to the sub-recipe menu.
