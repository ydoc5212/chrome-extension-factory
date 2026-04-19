---
name: cws-ship
description: Orchestrate the full Chrome Web Store submission flow — gate on ship-mode validator, reconcile version, summarize, submit via `npm run ship`, and interpret the terminal state (live / in-review / rejected / failed / timeout). Delegates content fixes to `cws-content`, screenshot fixes to `cws-screens`, and video fixes to `cws-video` rather than duplicating their recipes. Does NOT implement any deterministic checks itself; it reads `--json` from the existing scripts.
triggers:
  - "user says `ship it` / `publish` / `submit to the Chrome Web Store`"
  - "user asks `is this ready to go live`"
  - "user wants to run `npm run ship` but doesn't know what to fix first"
  - "user says `cws-ship` / `/cws-ship`"
  - "user just finished `cws-content` or `cws-screens` and wants to submit"
  - "user asks about a CWS rejection code (Blue Argon, Purple Lithium, Yellow Zinc, Red Titanium, Grey Titanium, etc.)"
  - "user wants to check submission status after a prior ship"
invokes:
  - "npm run check:cws:ship -- --json"       # ship-mode validator, JSON envelope
  - "npx tsx scripts/version-sync.ts --json" # version reconciliation, JSON envelope
  - "npm run ship"                            # full orchestrated gate (check → version-sync → zip → publish)
  - "npx tsx scripts/publish-cws.ts --json"   # direct submit+poll (post-mortem / status-only paths)
  - "npm version patch"                       # offered to user, never run silently
  - "<skill>cws-content</skill>"              # delegate content rule fixes
  - "<skill>cws-screens</skill>"              # delegate screenshot rule fixes
  - "<skill>cws-video</skill>"                # delegate video rule fixes
writes:
  # cws-ship is the orchestration layer. It does not directly edit user code.
  # The two files below are touched only as side effects of tools it runs:
  #   - `npm version patch` writes package.json (version bump, only on user confirm).
  #   - `npm run ship` produces .output/*.zip (not tracked; artifact of wxt zip).
  # Delegated skills (cws-content, cws-screens) write their own declared files.
  - "package.json"                            # version field only, only via `npm version`
---

# cws-ship skill

You are driving the `cws-ship` skill. Your single responsibility is to take the user from **"I want to ship this extension"** to a known terminal state (**`live`**, **`in-review`**, **`rejected`**, **`failed`**, or **`timeout`**) in one conversational flow. You do not re-implement any deterministic check — you orchestrate the existing scripts.

The flow has four phases. Run them in order. Do not skip.

```
Phase A — Gate       : run ship-mode validator, delegate or stop on each rule id.
Phase B — Version    : run version-sync, offer to bump if behind-or-equal.
Phase C — Confirm    : summarize name/description/version/permissions/screenshots, confirm.
Phase D — Submit     : run `npm run ship`, parse publish-cws terminal state, handle each branch.
```

If the user interrupts (`stop`, `cancel`, `not yet`), halt at the current phase and report what's next when they come back.

---

## What this skill is NOT responsible for

- Editing `wxt.config.ts` or `entrypoints/welcome/config.ts` — that's `cws-content`'s write scope.
- Editing `screenshots/config.ts` — that's `cws-screens`' write scope.
- Modifying `scripts/validate-cws.ts`, `scripts/version-sync.ts`, or `scripts/publish-cws.ts`. If a rule ID seems wrong, surface the error verbatim and tell the user to file an issue — do not patch.
- Fixing structural (code-level) errors — broad host permissions, CSP holes, remote-code patterns, SW keepalives, etc. Those are developer problems, not ship problems. Surface the validator output verbatim and stop.

---

## Phase A — Gate: run the ship validator, route each finding

### A.1 Run the validator

Before asking the user anything, run:

```bash
npm run check:cws:ship -- --json
```

Parse the JSON envelope. Schema (`schemaVersion: 1`):

```json
{
  "schemaVersion": 1,
  "mode": "ship",
  "rulesRun": 17,
  "summary": { "errors": N, "warnings": M },
  "findings": [
    { "rule": "<rule-id>", "severity": "error|warn", "message": "...", "why": "...", "source": "...", "fix": "...", "locations": [] }
  ],
  "docUrl": "docs/03-cws-best-practices.md"
}
```

**Always branch on `finding.rule`. Never branch on `finding.message`** — messages are for humans; rule ids are the public API the skill keys off.

### A.2 Route each error finding

For each entry in `findings` where `severity === "error"`, route by `rule`:

| Rule id | Domain | Action |
|---|---|---|
| `listing-ready-name` | content (cws-content) | **Delegate to `cws-content`** |
| `listing-ready-description` | content (cws-content) | **Delegate to `cws-content`** |
| `ship-ready-optional-host` | content (cws-content) | **Delegate to `cws-content`** |
| `ship-ready-welcome-config` | content (cws-content) | **Delegate to `cws-content`** |
| `ship-ready-screenshots` | screenshots (cws-screens) | **Delegate to `cws-screens`** |
| `ship-ready-video` | video (cws-video) | **Delegate to `cws-video`** |
| anything else (structural: `host-permissions-breadth`, `content-scripts-matches-breadth`, `unused-permission`, `csp-extension-pages`, `remote-code-patterns`, `offscreen-missing-justification`, `listing-fields-present`, etc.) | out of cws-ship scope | **STOP.** Surface the finding verbatim and tell the user to fix it themselves. |

**How to delegate.** For the content cluster (any of `listing-ready-name`, `listing-ready-description`, `ship-ready-optional-host`, `ship-ready-welcome-config`), tell the user:

> The ship validator is flagging listing/welcome content. That's `cws-content`'s job, not mine. Invoking it now to fix `<rule-id-list>`. I'll wait and re-run the validator when it's done.

Then invoke `cws-content` (in the future plugin runtime, this is a skill-to-skill call; for now, state the handoff and let the user trigger it, OR if you have the tool to do so, call it directly). When `cws-content` reports done, re-run `npm run check:cws:ship -- --json` and re-route.

For `ship-ready-screenshots`, analogous:

> Screenshots aren't ready. Handing off to `cws-screens` — it'll walk you through the 5-screenshot deck and regenerate PNGs. When it reports done, I'll re-run the validator.

For `ship-ready-video`, analogous:

> The launch video isn't ready. Handing off to `cws-video` — it'll interview you for hook/beats and invoke `heygen-com/hyperframes` to generate the exports. When it reports done, I'll re-run the validator. (If you'd rather ship without a video, delete `video/` — the rule no-ops on an absent directory.)

**Do not duplicate cws-content's, cws-screens', or cws-video's recipes in this skill.** Those recipes are the unit of reuse. Keep the delegation explicit: name the other skill, name the rule ids you're delegating, resume only when the other skill reports green on those rules.

### A.3 Handle `listing-drift` (warning)

`listing-drift` is severity `warn`, not `error` — it does NOT block submission on its own. But surface it prominently before Phase C confirms:

> **Listing drift detected.** The local `wxt.config.ts` and the live CWS listing disagree:
> - Local name: `"<localName>"`
> - Live name:  `"<liveName>"`
>
> One of these is authoritative. Which?
> - **(a) The local manifest** (my repo is the source of truth) → we'll overwrite the live listing on next publish. Confirm by continuing.
> - **(b) The live listing** (someone edited it in the CWS dashboard) → stop, update `wxt.config.ts` to match, then re-invoke me.
> - **(c) Defer** → ship anyway and accept that the publish will overwrite the live copy with what's in the manifest.

Let the user pick (a)/(b)/(c) explicitly before proceeding. If they pick (b), exit — they need to manually reconcile before re-invoking. If they pick (a) or (c), continue to Phase B.

Same treatment for `listing-drift` on `description` if it fires.

### A.4 Warnings other than `listing-drift`

Warnings (`sensitive-permission-declared`, `sw-keepalive-hack`, `war-matches-breadth`, `content-script-main-world`, `optional-host-suggestion`, `sw-listener-top-level`, etc.) do not block submission. Surface them in a "heads up" section before Phase C but do not prompt the user to fix them. They may deliberately be accepting these costs (e.g. they need `tabs` and have a justification ready for the dashboard).

### A.5 Re-run loop

After any delegation, re-run `npm run check:cws:ship -- --json`. Keep looping Phase A until `summary.errors === 0`. Only then proceed to Phase B.

If the same rule id keeps firing after a delegation, the other skill didn't fix the thing the rule checks. Surface the JSON output to the user and ask — don't loop blindly.

---

## Phase B — Version sync

### B.1 Run version-sync

```bash
npx tsx scripts/version-sync.ts --json
```

Parse the JSON envelope (`schemaVersion: 1`):

```json
{
  "schemaVersion": 1,
  "script": "version-sync",
  "skipped": true|false,
  "status": "skipped"|"ahead"|"behind-or-equal"|"error",
  "localVersion": "0.1.0",
  "remoteVersion": "0.0.9"|null,
  "reason": "..."|undefined,
  "fix": "..."|undefined
}
```

### B.2 Handle each status

**`status: "ahead"`** → Local version is newer than live. Good. Continue to Phase C.

**`status: "behind-or-equal"`** → Local version ≤ live. Tell the user:

> Your local version is `<localVersion>` and the live CWS version is `<remoteVersion>`. CWS requires strictly-increasing version numbers — shipping this would be rejected (`status: upload-failed`, error `ITEM_VERSION_TOO_LOW` or similar).
>
> I can run `npm version patch` (bumps `<localVersion>` → `<localVersion-with-patch-bumped>`) and re-run. Or you can pick minor/major. Which?

Wait for explicit confirmation (`patch`, `minor`, `major`). Then run the corresponding `npm version <bump>` command. Do not auto-bump. When it completes, re-run version-sync to confirm `ahead`, then continue to Phase C.

**`status: "skipped"` with `reason` mentioning "no CWS secrets"** → CWS API is not configured. Offer three paths:

> CWS API secrets aren't configured (`CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`). Without them, I can't verify your version against the live store or auto-publish. Pick:
>
> **(a) Proceed manually.** I'll run `npm run check:cws:ship && wxt zip` to produce `.output/<name>-chrome.zip`. You upload that to [the CWS developer dashboard](https://chrome.google.com/webstore/devconsole) yourself.
> **(b) Configure secrets first.** See `docs/06-keepalive-publish.md` for the 4-secret OAuth walkthrough. Come back when it's set up.
> **(c) Cancel.**

If (a): skip Phase C's version check and go straight to a manual zip flow (see "Manual submission fallback" below). If (b): exit with a clear "pick this up after secrets are set." If (c): exit.

**`status: "skipped"` with `reason` mentioning "crxVersion"** → The CWS API call succeeded but didn't return a `crxVersion`. This happens on newly-drafted items or certain API response modes. Tell the user:

> The CWS API returned a response but didn't expose the live version — I can't verify whether a bump is needed. Safer options:
>
> **(a) Run `npm version patch` anyway.** CWS requires strictly-increasing versions; bumping is cheap and always safe.
> **(b) Ship without bumping.** If this is a first-ever submission, the current version is fine. If it's an update, you risk `ITEM_VERSION_TOO_LOW` at upload. Confirm?

Default recommendation is (a). Wait for confirmation before running `npm version patch`.

**`status: "error"`** → The script surfaced an error field. Most commonly this is auth (invalid refresh token) or network. Show the error verbatim and ask:

> version-sync errored: `<error>`. This usually means OAuth auth failed — your refresh token may have expired. Options:
>
> **(a) Fix secrets and retry.** See `docs/06-keepalive-publish.md`.
> **(b) Proceed manually.** Skip automated publish; produce a zip and upload via the dashboard.
> **(c) Cancel.**

---

## Phase C — Confirm & summarize

Before running `npm run ship`, show the user a one-screen summary so they can sanity-check what's about to ship.

Read (don't edit) the relevant files to build the summary:

- `wxt.config.ts` → `manifest.name`, `manifest.description`, `manifest.permissions`, `manifest.optional_host_permissions`.
- `package.json` → `version`.
- `.output/screenshots/` → count of PNGs (should be ≥ 1, ideally 5).

Render:

```
About to submit:
  Name:              <manifest.name>
  Description:       <manifest.description (first 132 chars, truncated with ellipsis if longer)>
  Version:           <package.json version>
  Permissions:       <manifest.permissions joined with ", ">
  Host (optional):   <manifest.optional_host_permissions joined with ", ">
  Screenshots:       <N> PNG(s) in .output/screenshots/
  Listing drift:     <none | flagged — see above>

Confirm with `yes` to run `npm run ship`. Type anything else to stop.
```

Wait for an explicit `yes` (or equivalent). **Do not auto-proceed on silence.**

### Update-mode note

If this is not a first-time submission — i.e. a prior version of this extension is already live on CWS — flag that update reviews are scrutinized differently from initial reviews. Specifically:

> Heads up — this is an update, not a first submission. Update reviews re-examine the whole extension when any of these change meaningfully: declared permissions, host permissions, manifest version, service-worker/content-script structure, code size. If you've added a new permission vs. the live version, add a **permission justification note in the CWS dashboard → Privacy tab** before submitting. Unjustified new permissions are the most common source of "stuck in review >1 week" on updates.

Detect "this is an update" from either: (a) version-sync returned `ahead` with a non-null `remoteVersion`, or (b) the listing-drift check had any output (implies a live listing exists). A first-submission skips this note.

---

## Phase D — Submit and interpret the terminal state

### D.1 Run the ship chain

```bash
npm run ship
```

This is the single orchestrated command. It runs:

1. `npm run check:cws:ship` (should be green — you already gated it in Phase A).
2. `npx tsx scripts/version-sync.ts` (should be `ahead` — you already reconciled in Phase B).
3. `wxt zip` (produces `.output/<name>-chrome.zip`).
4. `npx tsx scripts/publish-cws.ts` (uploads zip, publishes, polls until terminal state).

First halt wins. If something fails at step 1 or 2 despite Phases A and B, that's drift between invocations — re-run the respective phase.

### D.2 Parse publish-cws terminal state

`publish-cws` emits structured transitions on stdout. In its final message (or when run with `--json`), the terminal `state` is one of:

| State | Meaning | Branch |
|---|---|---|
| `live` | Published. Visible on CWS. | D.3 (celebrate) |
| `in-review` | Accepted for review by CWS. Human review pending. | D.4 (wait) |
| `rejected` | CWS rejected the submission. | D.5 (rejection-recovery recipes) |
| `failed` | `publish` call returned a non-terminal error (quota, auth, API error). | D.6 (retry) |
| `timeout` | Polling exceeded the timeout window without reaching a terminal state. | D.7 (status check) |
| `upload-failed` | The zip upload itself failed (usually version-too-low or file corruption). | D.8 (upload-recovery) |

### D.3 `live`

> Published. Your extension is live at `https://chrome.google.com/webstore/detail/<extension-id>` — `<extension-id>` is the value of `CWS_EXTENSION_ID`.
>
> Share the link. Watch the CWS dashboard for the first few install metrics. If this was an update, existing users will auto-update on their next Chrome restart.

Do not over-celebrate. One sentence of acknowledgment, then a practical next-step pointer. Stop.

### D.4 `in-review`

> Submission accepted — now in human review. Typical CWS review time is **1-3 business days**, sometimes longer for first-time publishers or for updates that change permissions.
>
> What to do:
> 1. Check the [CWS dashboard](https://chrome.google.com/webstore/devconsole) for status.
> 2. If you want me to re-check, invoke me with `/cws-ship status` — I'll re-poll `publish-cws` against the existing submission.
> 3. If >1 week goes by with no update, email developer support (link in `docs/03-cws-best-practices.md`).

Stop.

### D.5 `rejected` — invoke rejection-recovery recipe

The `publish-cws` JSON envelope includes a `detail` field. Parse it for a rejection code if present. CWS rejection codes follow a "color + element" pattern (e.g. "Blue Argon", "Purple Lithium"). Map the code to one of the recipes in the **Rejection-recovery recipes** section below.

If the `detail` doesn't include a code (common — many rejections arrive via email only), tell the user:

> Submission was rejected, but the API response didn't include a rejection code. Check your publisher email for the rejection notice — it'll name a code. When you have it, tell me the code and I'll walk you through the fix.

Once a code is identified, invoke the matching recipe.

### D.6 `failed`

> Publish call failed (not rejected — the request itself errored): `<detail>`.
>
> Usually this is:
> - **Auth** — OAuth token expired. Re-mint per `docs/06-keepalive-publish.md`.
> - **Rate limit** — CWS throttles submit calls. Wait 5-10 minutes and retry.
> - **Zip missing / corrupted** — re-run `wxt zip` (or `npm run ship` which does it) and retry.
>
> Want me to retry `npm run ship` now, or stop and diagnose?

### D.7 `timeout`

> Polling timed out before the submission reached a terminal state. This does NOT mean the submission failed — CWS review can take longer than the poll window.
>
> Check the [CWS dashboard](https://chrome.google.com/webstore/devconsole). Likely your submission is now `in-review`. When you want to re-poll, re-invoke me with `/cws-ship status`.

### D.8 `upload-failed`

`publish-cws` flags `upload-failed` when CWS rejects the zip itself — usually before review. Common causes in `detail`:

- `ITEM_VERSION_TOO_LOW` / `ITEM_VERSION_DUPLICATE` → version bump didn't happen or version-sync miscalculated. Bump again and retry.
- `INVALID_DEVELOPER` → OAuth is for a different developer account than the one that owns `CWS_EXTENSION_ID`. Verify secrets.
- `MANIFEST_VERSION_INVALID` → manifest.json corrupted in the zip; re-run `wxt build && wxt zip` clean.
- Anything else → surface verbatim. Offer retry after the user investigates.

### D.9 `/cws-ship status` mode

If invoked with the `status` argument (after a prior submission), skip Phases A-C entirely. Run:

```bash
npx tsx scripts/publish-cws.ts --json --no-auto-publish
```

No — that would re-upload. Instead, the skill's "status mode" is limited by what `publish-cws.ts` exposes today: it doesn't have a separate "status only" mode, it submits+polls as one chain. So status mode is best-effort:

> I can't re-poll an existing submission without re-uploading (that's a limitation of the current `publish-cws.ts`). For status, check the [CWS developer dashboard](https://chrome.google.com/webstore/devconsole) directly. If you want to ship a NEW version, invoke me normally.

Flag this to the user verbatim. Do not re-upload silently.

---

## Manual submission fallback

If CWS secrets aren't configured and the user picked option (a) in Phase B, the flow becomes:

1. Confirm green ship validator (Phase A done).
2. Skip version-sync / publish-cws.
3. Run the gated zip: `npm run zip` (which runs `check:cws:ship` then `wxt zip`).
4. Surface the output path:

   > Zip produced at `.output/<name>-chrome.zip`.
   >
   > Manual upload steps:
   > 1. Open [CWS developer dashboard](https://chrome.google.com/webstore/devconsole).
   > 2. Pick the item (or "+ New item" for a first submission).
   > 3. Upload the zip.
   > 4. Fill in listing fields from `wxt.config.ts` (name, description) if this is a first submission.
   > 5. Upload screenshots from `.output/screenshots/*.png` (drag-and-drop).
   > 6. Fill in the Privacy tab (data usage, Limited Use certification — both mandatory per Jan 2025).
   > 7. Click "Submit for review."
   >
   > When the dashboard reports `Published`, your extension is live. There's no API callback for manual submissions.

5. Do NOT run `npm run ship` in this path — it will fail at `publish-cws` without secrets. Stop cleanly.

---

## Rejection-recovery recipes

Each recipe maps a known CWS rejection code family to: (1) why it triggered, (2) how to fix, (3) which validator rule / cws-content recipe / docs section to cross-reference. These are the response patterns invoked from D.5.

### Recipe R1 — Blue Argon (remote code)

**What it means.** CWS detected remotely-hosted code execution. MV3 forbids this unconditionally.

**Why it fires in practice.** Common causes:
- `eval()` or `new Function()` on a string fetched from a URL.
- `<script src="https://cdn.example.com/...">` in an extension HTML page.
- Dynamic `import()` of an `https://` URL.
- A third-party script (analytics, SDKs) pulled at runtime.
- JSON config fetched at runtime, then `eval`'d or passed to `Function()`.

**Validator cross-reference.** `scripts/validate-cws.ts` has `remote-code-patterns` which detects the common literal patterns (`eval(`, `new Function(`, `<script src="https://...">`, `import("https://...")`).

**Response to user.**

> Your submission was rejected for **remote code (Blue Argon)**. This is MV3's hardest line — any code that isn't bundled into the zip is banned.
>
> Your validator should have caught this before submission. Let's trace why it didn't:
>
> 1. Run `npm run check:cws` (structural). Does `remote-code-patterns` fire?
>    - **Yes** → Validator is correct; you submitted anyway. Fix the code it flagged, re-ship.
>    - **No** → The validator missed it. Likely causes:
>      - A pattern that doesn't match the regexes (e.g. `globalThis['eval']` instead of `eval(`).
>      - A dependency you import that itself uses remote code (run `grep -r "eval\|new Function" node_modules/<suspect-dep>/`).
>      - A service worker that dynamically constructs script URLs (e.g. `fetch(remoteUrl).then(r => r.text()).then(code => new Function(code)())`).
>      - Runtime-fetched HTML that contains inline scripts.
> 2. Once you've found and removed the source, re-run `npm run check:cws`. Confirm clean.
> 3. Re-invoke me to re-ship.

If the user can't find the source, point them at the CWS rejection email — it usually names the file and line.

### Recipe R2 — Purple Lithium (privacy policy missing / inadequate)

**What it means.** CWS requires a public privacy policy URL if your extension touches any user data (including host permissions that could be used to read a page). Missing or inadequate policy = Purple Lithium.

**Default response: invoke the auto-host script.** The factory automates this end-to-end. Run:

```bash
npm run setup:privacy
```

This generates `store/PRIVACY.md` and `store/index.html` from the manifest's declared permissions, enables GitHub Pages on the repo via the `gh` CLI (source: `main` branch, `/store` path), polls until the URL serves 200, and writes the URL into `entrypoints/welcome/config.ts → links.privacy`. After it succeeds, push the new `store/` files and the welcome config diff:

```bash
git add store/ entrypoints/welcome/config.ts && git commit -m "chore: privacy policy" && git push
```

Then update the CWS dashboard:
- **Privacy tab → Privacy policy URL** field — paste the URL from the script.
- **Privacy tab → Data usage** checkboxes and **Limited Use certification** — both mandatory as of Jan 2025; the script can't fill these because the CWS API doesn't expose them. Open the dashboard and check the relevant boxes (the generated `store/PRIVACY.md` is the authoritative source for what to disclose).

**Self-host escape hatch.** If the user wants to host elsewhere (their own domain, Notion page, whatever), pass `--self-host=<url>` to the same script. It writes `store/PRIVACY.md` (so they have a customizable source) and points `links.privacy` at their URL.

**Validator cross-reference.** Two rules collaborate here:
- `ship-ready-welcome-config` fires while `links.privacy` is still a factory placeholder (`your-org.example` etc.).
- `ship-ready-privacy-policy-reachable` (ship-only) HEAD-checks the URL once it's set, and denylists insecure / Google-Docs / raw-GitHub / PDF hosts (the patterns that auto-trip the Purple family). If Recipe R2 fires from CWS but both validators were green, your URL serves 200 but the *content* doesn't meet CWS standards — re-read `store/PRIVACY.md` against the dashboard's data-usage disclosures and check for drift.

### Recipe R3 — Yellow Zinc (listing fields blank / insufficient)

**What it means.** Missing or blank name, title, description, icons, or screenshots in the CWS dashboard. Most commonly appears as "listing incomplete."

**Why it's surprising.** If `npm run check:cws:ship` was green before submission, the local manifest has a name/description/icons/screenshots. So Yellow Zinc post-submission usually means one of:

1. **The CWS dashboard fields are blank even though the manifest isn't.** The manifest auto-populates the dashboard on FIRST upload only — subsequent uploads don't overwrite the dashboard. If someone manually blanked a field in the dashboard, the manifest won't re-fill it.
2. **Screenshots weren't uploaded to the dashboard.** Remember: the factory's `npm run screenshots` produces PNGs in `.output/screenshots/`, but the user must **drag-and-drop them to the dashboard** — there's no API for screenshot upload.
3. **Listing drift** — the `listing-drift` validator rule was warn-severity and got ignored, and the live listing is actually missing something the local manifest has.

**Response to user.**

> Rejected for **listing fields blank / insufficient (Yellow Zinc)**. This shouldn't happen after a green ship validator — so let's diagnose which of three things went wrong:
>
> 1. **Did you upload screenshots to the dashboard?** `npm run screenshots` generates PNGs in `.output/screenshots/`, but there's no API for screenshot upload. You drag them in. If the dashboard shows zero screenshots, that's your culprit.
> 2. **Are the dashboard fields populated?** Open [developer dashboard](https://chrome.google.com/webstore/devconsole) → your item → Store listing tab. Check:
>    - Detailed description (dashboard-only; not in manifest).
>    - Category.
>    - Language.
>    - Screenshots (1-5).
>    - Promo tile (optional but recommended).
>    - If any are blank, fill and re-submit.
> 3. **Is there drift between manifest and dashboard?** Let me re-run the ship validator now — if `listing-drift` fires as a warning, we know the manifest and dashboard disagree. (Triggering that check explicitly.)

After re-running the validator, if `listing-drift` surfaces, walk the user through the Phase A.3 decision (local authoritative vs. dashboard authoritative). This recipe effectively re-opens Phase A on the drift rule.

**Validator cross-reference.** `listing-fields-present` (structural), `listing-ready-name` / `listing-ready-description` (ship), `listing-drift` (ship-warn), `ship-ready-screenshots` (ship).

### Recipe R4 — Red Titanium (obfuscation)

**What it means.** CWS detected code that looks deliberately obfuscated: base64-encoded logic, character-encoding tricks, excessively aggressive minification that strips readable identifiers to single letters while preserving behavior-critical strings.

**Response to user.**

> Rejected for **obfuscation (Red Titanium)**. CWS policy: "Submit code as authored." Minification is allowed but aggressive minification that obscures intent can trip this.
>
> Diagnostic questions:
>
> 1. **Is your build tool doing anything unusual?** WXT/Vite's default `build` does minification but preserves JS semantics. Check `wxt.config.ts` and `vite.config.ts` (if present) for aggressive mangler options (`terserOptions.mangle.toplevel: true`, `mangle.properties: true`, custom obfuscation plugins like `javascript-obfuscator`).
> 2. **Are you shipping a pre-minified third-party library** that base64-encodes its payload? Some SDKs (especially ad/analytics SDKs) self-obfuscate. The fix is to remove the SDK or use a non-obfuscated build.
> 3. **Are you base64-encoding data or config** in a way that makes reviewers suspect obfuscated logic? Even legitimate encoded data can look suspicious — reviewers will err toward rejection.
>
> The fix is usually: disable aggressive minification (`build.minify: 'esbuild'` is usually fine; `'terser'` with custom mangler options is where this bites), or swap out a third-party dep.
>
> After fixing, run `npm run build` and inspect `.output/chrome-mv3/` — if the bundled JS has readable function/variable names, you're fine.

### Recipe R5 — Grey Titanium (affiliate links undisclosed)

**What it means.** Your extension injects affiliate codes into URLs (e.g. referral parameters on Amazon links) without prominent disclosure in the listing, the UI, and before install. Or it does so without a per-code user action.

**Response to user.**

> Rejected for **affiliate links undisclosed (Grey Titanium)**. If your extension monetizes via affiliate injection, three disclosure requirements:
>
> 1. **Listing (CWS dashboard description).** State explicitly that the extension injects affiliate codes, and on which sites. Plain language — "This extension adds affiliate codes to Amazon product links to support development."
> 2. **Extension UI.** A visible indicator in the popup/sidepanel/content script when an affiliate code is being added. "Referral active on this page" or equivalent.
> 3. **Before install.** If you have a landing page or welcome flow, disclose there too. The `entrypoints/welcome/` page is a natural place — add a step or a footnote.
> 4. **Per-code user action requirement (if you inject on many sites).** Each affiliate code injection should require a user action (click), not happen silently. Silent injection across a broad host permission is rejected.
>
> Update all three, re-ship. Want me to draft disclosure copy for the listing and welcome page?

### Recipe R6 — Purple Nickel (prominent data disclosure)

**What it means.** Your extension collects data that isn't closely tied to a clearly-described feature, and you didn't get affirmative runtime consent on top of the CWS dashboard's data-usage checkboxes.

**Response to user.**

> Rejected for **Prominent Data Disclosure (Purple Nickel)**. This fires when the data you collect isn't obviously required for a feature the user understands. Dashboard disclosure (Privacy tab checkboxes) is necessary but not sufficient — you also need affirmative runtime consent.
>
> Diagnostic questions:
>
> 1. **What data does your extension actually collect?** (URLs visited, form contents, clipboard, keystrokes, selected text, anything else?)
> 2. **Is that data required to deliver a feature the user clearly understands?** If yes, describe the connection in the listing and welcome flow. If no, remove the collection.
> 3. **Do you show a runtime consent prompt?** Not a permission request — an actual "we're about to collect X for Y, ok?" affirmative step. The `entrypoints/welcome/` flow is the right place for this on first run.
>
> Fix pattern: add a welcome-step with explicit consent wording before the collection starts. Re-ship. If the data isn't actually needed, the cleanest fix is to stop collecting it.

### Recipe R7 — Yellow Argon (keyword stuffing)

**What it means.** Listing name/description repeats keywords unnaturally (>5 times is the documented threshold) or lists many sites/locations to boost search.

**Response to user.**

> Rejected for **keyword stuffing (Yellow Argon)**. CWS will reject listings that repeat keywords unnaturally or list tons of site names to rank for each.
>
> Check your current name and description:
>
> - `manifest.name` in `wxt.config.ts`: `<name>`
> - `manifest.description`: `<description>`
>
> And the dashboard's "Detailed description" field (that's the long-form one, not in the manifest).
>
> Rewrite to lead with a single benefit in plain language. Any keyword repeated more than ~3 times — consolidate. Lists of sites ("works on GitHub, GitLab, Bitbucket, Gitea, Gitlab, Gogs, Sourcehut...") — trim to the primary one or two and say "and other git forges" if needed.
>
> Want me to invoke `cws-content` to rewrite the name/description? That's its job, and it handles length limits and voice.

If the user accepts, this delegates back to `cws-content`, which handles `listing-ready-name` and `listing-ready-description` (even though those validator rules wouldn't fire on this content — `cws-content` can re-draft on request).

### Recipe R8 — Yellow Lithium (redirection-only extensions)

**What it means.** Your extension's sole function is to open/launch another site, app, or extension. Banned.

**Response to user.**

> Rejected for **redirection-only (Yellow Lithium)**. CWS bans extensions whose only purpose is to launch an app, site, or other extension.
>
> This is a scope/design rejection, not a fix-the-code rejection. Options:
>
> 1. **Add real functionality.** The extension needs to do something on its own, not just redirect. If the redirect is the whole value, this extension won't pass review.
> 2. **Reconsider the format.** Could this be a bookmarklet? A web app with an "Install" CTA? An extension that enhances the destination site rather than launching it?
>
> This isn't something I can fix with a file edit. Decide whether to expand the extension's functionality or abandon the submission.

### Recipe R-unknown — Unrecognized / no code

If the rejection detail doesn't include a code or the code doesn't match any recipe above:

> The rejection didn't name a code I recognize. Detail: `<detail>`.
>
> Options:
>
> 1. **Check your publisher email.** CWS usually sends a more detailed rejection reason by email, naming a specific policy. When you have it, tell me the code (e.g. "Blue Argon", "Purple Lithium") and I'll run the matching recipe.
> 2. **Check the CWS dashboard → your item → "Appeal / Get help"** for the full rejection reason.
> 3. **Review `docs/03-cws-best-practices.md`** — the rejection categories are grouped there by color family.

Do not guess. Do not invent a fix for a rejection you don't understand.

---

## Worked example — end-to-end

A trace of one complete cws-ship run. The user has just finished `cws-content` (listing copy done), hasn't generated screenshots, doesn't have CWS secrets configured yet. They say "Ship it."

### Initial state

User invokes `/cws-ship`.

### Phase A — Gate

Skill runs:

```bash
npm run check:cws:ship -- --json
```

Output (abbreviated):

```json
{
  "schemaVersion": 1,
  "mode": "ship",
  "rulesRun": 17,
  "summary": { "errors": 5, "warnings": 0 },
  "findings": [
    { "rule": "listing-ready-name", "severity": "error", "message": "manifest.name is still \"My Extension\"", "fix": "..." },
    { "rule": "listing-ready-description", "severity": "error", "message": "manifest.description is still factory default", "fix": "..." },
    { "rule": "ship-ready-optional-host", "severity": "error", "message": "optional_host_permissions still contains https://example.com/*", "fix": "..." },
    { "rule": "ship-ready-welcome-config", "severity": "error", "message": "welcome/config.ts has placeholders", "fix": "..." },
    { "rule": "ship-ready-screenshots", "severity": "error", "message": ".output/screenshots/ has no PNGs", "fix": "..." }
  ],
  "docUrl": "docs/03-cws-best-practices.md"
}
```

Skill identifies: 4 content errors + 1 screenshots error. Routing:

- `listing-ready-name`, `listing-ready-description`, `ship-ready-optional-host`, `ship-ready-welcome-config` → delegate to `cws-content`.
- `ship-ready-screenshots` → delegate to `cws-screens`.
- `ship-ready-video` → delegate to `cws-video`.

Skill says:

> The ship validator found 6 errors:
> - 4 content issues (listing copy, origins, welcome config) → delegating to `cws-content`.
> - 1 screenshots issue (no PNGs yet) → delegating to `cws-screens` after content is done.
> - 1 video issue (no exported MP4 yet) → delegating to `cws-video` after screenshots are done.
>
> Invoking `cws-content` now.

Skill invokes `cws-content`. User interviews through name (picks "Review Radar"), description (picks outcome-framed), origins (`https://github.com/*`), welcome config. `cws-content` reports done.

Skill re-runs validator:

```json
{
  "summary": { "errors": 2, "warnings": 0 },
  "findings": [
    { "rule": "ship-ready-screenshots", "severity": "error", ... },
    { "rule": "ship-ready-video", "severity": "error", ... }
  ]
}
```

Good. Content is green. Screenshots and video remain.

Skill says:

> Content is green. Two errors remain: `ship-ready-screenshots` and `ship-ready-video`. Invoking `cws-screens` next.

Skill invokes `cws-screens`. User interviews through 5 screenshots (hero / popup / options / welcome / inline-badge), generates PNGs. `cws-screens` reports done.

Skill re-runs validator:

```json
{
  "summary": { "errors": 1, "warnings": 0 },
  "findings": [
    { "rule": "ship-ready-video", "severity": "error", ... }
  ]
}
```

Skill says:

> Screenshots green. One error remains: `ship-ready-video`. Invoking `cws-video` — it'll interview you for the 30-second hook + beats and hand off to `heygen-com/hyperframes` for generation.

Skill invokes `cws-video`. User interviews through hook, 5 beats, export targets (cws/productHunt/socialHorizontal). Hyperframes generates three MP4s in `.output/videos/`. `cws-video` reports done.

Skill re-runs validator:

```json
{
  "summary": { "errors": 0, "warnings": 0 },
  "findings": []
}
```

Phase A complete.

### Phase B — Version sync

Skill runs:

```bash
npx tsx scripts/version-sync.ts --json
```

Output:

```json
{
  "schemaVersion": 1,
  "script": "version-sync",
  "skipped": true,
  "status": "skipped",
  "localVersion": "0.1.0",
  "remoteVersion": null,
  "reason": "no CWS secrets configured (CWS_EXTENSION_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN)"
}
```

Skill says:

> CWS API secrets aren't configured. Pick:
> **(a) Proceed manually.** I'll produce `.output/review-radar-chrome.zip` — you upload it to the CWS dashboard yourself.
> **(b) Configure secrets first.** See `docs/06-keepalive-publish.md`.
> **(c) Cancel.**

User picks **(a)**.

### Phase C — Confirm

Skill reads `wxt.config.ts`, `package.json`, `.output/screenshots/`. Renders:

```
About to submit (manual mode — no CWS API):
  Name:              Review Radar
  Description:       Never miss a PR review request. See which PRs need your review at a glance on github.com.
  Version:           0.1.0
  Permissions:       (none in `permissions`)
  Host (optional):   https://github.com/*
  Screenshots:       5 PNGs in .output/screenshots/
  Listing drift:     n/a (manual mode)

Confirm with `yes` to run `npm run zip` and produce the upload zip. Type anything else to stop.
```

(No update-mode note — this is a first submission.)

User confirms: `yes`.

### Phase D — Submit (manual branch)

Skill runs `npm run zip`. Output:

```
> check:cws:ship && wxt zip
  ... (validator passes)
  Built .output/review-radar-chrome.zip (142 KB)
```

Skill says:

> Zip produced at `.output/review-radar-chrome.zip`.
>
> Manual upload steps:
> 1. Open [CWS developer dashboard](https://chrome.google.com/webstore/devconsole).
> 2. "+ New item" (first submission).
> 3. Upload the zip.
> 4. Fill listing fields (name/description should auto-populate from the manifest).
> 5. Drag-and-drop the 5 PNGs from `.output/screenshots/` into the Screenshots section.
> 6. Fill Privacy tab: data usage checkboxes + Limited Use certification (both mandatory).
> 7. Paste your privacy policy URL (should match `links.privacy` in `welcome/config.ts`).
> 8. Submit for review.
>
> When the dashboard shows "Published," you're live. (There's no API callback for manual submissions, so I can't report `live` / `in-review` for you — the dashboard is authoritative.)

End of run.

### State transitions summarized

```
A. validator red    (6 errors)
   ↓ delegate cws-content (4 content rules)
A. validator red    (2 errors: screenshots + video)
   ↓ delegate cws-screens
A. validator red    (1 error: video)
   ↓ delegate cws-video
A. validator green  (0 errors)
   ↓
B. version-sync skipped (no secrets)
   ↓ user picks manual
C. summary + confirm
   ↓ user confirms
D. `npm run zip` → zip produced, manual upload instructions printed
```

If the user had CWS secrets configured, Phase D would instead run `npm run ship` end-to-end and reach a `live` / `in-review` / `rejected` terminal state.

---

## Failure-mode notes

- **Same rule id keeps firing after delegation.** cws-content or cws-screens didn't actually resolve the rule the validator checks. Show the validator output and ask the user to look — do not loop blindly.
- **Structural error mid-flow.** A user's in-progress edits (while cws-content was running) introduced a broad host permission or remote-code pattern. Phase A will catch it. Surface verbatim and stop — cws-ship does not touch code.
- **User cancels mid-phase.** State is not persisted. Next invocation starts at Phase A. That's fine — Phase A is idempotent (re-running the validator is cheap) and will route correctly based on current state.
- **`npm run ship` halts at step 1 despite Phase A being green.** Drift between invocations — someone edited a file between Phases A and D. Re-run Phase A.
- **`npm run ship` halts at step 2 despite Phase B being green.** Someone published a newer version from another machine. Re-run Phase B to reconcile, bump version again.
- **Rejection detail doesn't match any known code.** Use Recipe R-unknown. Do not invent a recipe.
- **`publish-cws` returns `timeout`.** The submission is most likely `in-review` on the CWS side — polling just gave up. Point the user at the dashboard; don't re-run `npm run ship` (that would re-upload).

---

## What this skill does NOT do

- Does not write to `wxt.config.ts`, `entrypoints/welcome/config.ts`, `screenshots/config.ts`, or any source file. Those belong to `cws-content` and `cws-screens`.
- Does not re-implement validator rules. If you're tempted to inline a rule check here, stop — that logic lives in `scripts/validate-cws.ts`.
- Does not silently bump the version. `npm version patch` runs only on explicit user confirmation.
- Does not retry submissions automatically. On `failed` / `timeout` / `rejected`, offer the user a retry; don't loop.
- Does not touch the CWS dashboard UI. Some fields (detailed description, screenshots, privacy URL, Limited Use certification) must be set in the dashboard by the user — the skill can only tell them to do it.
- Does not invent rejection codes or fix recipes for rejections it doesn't understand. Use Recipe R-unknown.
