---
name: setup-cws-credentials
description: Walk the user through obtaining the four Chrome Web Store API credentials (CWS_EXTENSION_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN) and a GCP project. Automates everything Google exposes an API for; provides handholding (optional computer-use + GUI wizard) for the one step Google forces you to do by hand — creating an OAuth 2.0 Desktop client ID.
triggers:
  - "user wants to enable `npm run ship` / automated CWS publishing"
  - "user asks `how do I set up Chrome Web Store API credentials`"
  - "cce-init Phase F asks for credentials setup"
  - "user runs `npm run setup:cws`"
  - "user wants to set up Google Cloud for publishing"
invokes:
  - "scripts/bootstrap-gcp.ts"           # automates steps 1–3 via gcloud
  - "scripts/harvest-cws-token.ts"       # automates step 5 (OAuth refresh token)
  - "npx chrome-webstore-upload-keys"    # called by harvest-cws-token, not directly here
  - "npm run check:cws:ship -- --json"   # end-to-end verification
writes:
  - ".secrets.local.json"                # persisted credentials (gitignored)
---

# setup-cws-credentials skill

You are driving the `setup-cws-credentials` skill. Your single responsibility: take the user from **"no Chrome Web Store API credentials configured"** to **".secrets.local.json populated with all 4 CWS_* keys + GCP_PROJECT_ID, and `npm run check:cws:ship` finding no credential-related errors."**

You do not touch listing copy. You do not touch zips. You do not submit. You do not change manifest fields. You do not mutate the user's shell profile — all credentials live in `.secrets.local.json` (gitignored).

---

## Research finding that shapes this skill

Of the five things the user needs, Google provides APIs for four:

| Step | Automatable? | Tool |
|---|---|---|
| 1. GCP project | ✅ | `gcloud projects create` |
| 2. Enable `chromewebstore.googleapis.com` | ✅ | `gcloud services enable` |
| 3. OAuth consent screen | ⚠️ Workspace-only | `gcloud iap oauth-brands create` |
| 4. OAuth 2.0 Desktop client ID + secret | ❌ **no API** | console clicks only |
| 5. Refresh token | ✅ | `npx chrome-webstore-upload-keys` |

The IAP OAuth Admin API (the closest thing to a client-creation API) was **deprecated January 22 2025 and shut down March 19 2026**. There is no public replacement. Step 4 is the reason this skill exists — everything else we can automate, but step 4 needs a human driving a browser.

You have two options to handle step 4:
- **Computer-use** (offer as the default): drive the Google Cloud Console via the `gh-computer-use` MCP, click through Create Credentials → OAuth client ID → Desktop app, read back the credentials.
- **GUI wizard** (fallback): open `docs/setup-wizard/index.html` in the user's browser with `?projectId=<id>&step=4`. Then prompt them to paste `CLIENT_ID` and `CLIENT_SECRET` into the terminal.

Offer computer-use first; fall back to the wizard if the user declines or it fails.

---

## Phase A — Preflight: automatable GCP setup

Run:

```bash
npx tsx scripts/bootstrap-gcp.ts --json
```

Parse the line-delimited JSON events. The envelope for each line:

```json
{ "type": "preflight" | "auth" | "project" | "api-enable" | "oauth-brand" | "done" | "error",
  "status": "ok" | "skipped" | "failed" | "created" | "exists",
  "...": "..." }
```

On `type: "error"`:
- If `step: "preflight"` with "gcloud CLI not found" — relay the `hint` (contains the Homebrew / install URL) and stop. The user must install gcloud before this skill can continue.
- If `step: "auth"` — the script already tried `gcloud auth login`. If it still failed, stop and surface the error verbatim.
- Any other error — surface the `message` and `hint`, stop.

On `type: "done"` — capture the `projectId` and `consoleUrl` fields. You need them for Phase B.

On `type: "oauth-brand", status: "skipped"` with a reason mentioning "Workspace" — that's the personal-account path. Tell the user:

> Heads up: you're on a personal Google account, so the OAuth consent screen has to be set up by hand. I'll open the setup wizard in your browser at step 3 — follow it, then come back and hit enter.

Then open `docs/setup-wizard/index.html?projectId=<id>&step=3` (use `open` on macOS, `xdg-open` on Linux, `start` on Windows). Wait for the user to confirm they're done before moving to Phase B.

On `type: "oauth-brand", status: "created"` or `"exists"` — the consent screen is configured, proceed.

---

## Phase B — The manual wall: OAuth 2.0 Desktop Client ID

Ask the user:

> Next step needs a browser (Google provides no API for this — their IAP client API was deprecated in 2025). Two options:
>
> 1. **I drive the browser for you** (computer-use) — I'll screen-share into the Cloud Console, click through Create Credentials → Desktop app, and read back the Client ID + Secret.
> 2. **You drive, I guide** — I'll open a handholding wizard in your browser with exact steps and buttons highlighted. You paste the Client ID + Secret back here.
>
> Which?

### If the user picks computer-use

1. Call `mcp__gh-computer-use__request_access` with an empty `apps` array (falls back to desktop access). If the response includes `allowAll: true`, proceed. Otherwise call `list_applications` and then `request_access` with the browser app's ID.
2. Open the credentials page via the user's default browser (use Bash `open "<consoleUrl>"` on macOS). Wait a few seconds for the page to load.
3. Take a screenshot to confirm the right page is visible. If the user isn't signed in or is signed into the wrong Google account, stop and tell them to resolve it, then retry.
4. Click `+ Create Credentials` → `OAuth client ID`.
5. Select application type `Desktop app`. Name it `Chrome Webstore Upload`.
6. Click `Create`. Screenshot the credentials modal.
7. Read `Client ID` and `Client secret` from the modal (either via OCR on the screenshot or by clicking the clipboard-copy button and reading via `get_clipboard`).
8. Confirm with the user: "I got `CLIENT_ID=abc...` and `CLIENT_SECRET=xyz...` — correct?" Only proceed on yes.
9. Write them to `.secrets.local.json`:

```json
{
  "GCP_PROJECT_ID": "<from phase A>",
  "CWS_CLIENT_ID": "<harvested>",
  "CWS_CLIENT_SECRET": "<harvested>"
}
```

(Preserve any existing keys in the file. Use `Read` then `Write`.)

If computer-use fails at any step — page didn't load, OCR misread, credentials didn't appear — fall through to the GUI-wizard path without re-asking the user.

### If the user picks the GUI wizard

1. Open `docs/setup-wizard/index.html?projectId=<id>&step=4` in the user's default browser:
   - macOS: `open "file:///<abs-path>?projectId=<id>&step=4"`
   - Linux: `xdg-open "file:///..."`
2. In the terminal, prompt:

   > I've opened the setup wizard. Follow step 4 there. When the modal shows your Client ID and Client secret, paste them here (one at a time):

3. Prompt for `CLIENT_ID`, then `CLIENT_SECRET`. Validate that neither is empty and that `CLIENT_ID` ends in `.apps.googleusercontent.com` (soft warn, don't block).
4. Write both to `.secrets.local.json` (preserving existing keys).

---

## Phase C — Harvest the refresh token

Run:

```bash
npx tsx scripts/harvest-cws-token.ts
```

This shells out to `npx chrome-webstore-upload-keys`, which opens a browser for OAuth consent and prints a refresh token. The script displays the `CLIENT_ID` and `CLIENT_SECRET` from `.secrets.local.json` so the user can paste them when the underlying tool asks. After the tool prints the refresh token, the script prompts the user to paste it back and persists it to `.secrets.local.json`.

This is an interactive step — run it in the user's terminal (not via `--json` mode). Relay any error output verbatim if it fails.

---

## Phase D — Extension ID

Ask:

> Do you have a Chrome Web Store listing yet? (Even a draft — just need the 32-char item ID.)

- If **no**: explain:
  > You'll need to create one to get an extension ID:
  > 1. Go to https://chrome.google.com/webstore/devconsole
  > 2. Pay the $5 one-time developer fee (Google's gate — unavoidable)
  > 3. Click "New item", upload any zip (you'll replace it later), save
  > 4. Grab the 32-char ID from the URL
  >
  > Come back when you've got it — this skill is safe to re-run; it'll pick up where you left off.
  Then stop (Phase E will be skipped; the user re-runs later).

- If **yes**: prompt for the ID, validate length (32 chars, lowercase letters only). Write to `.secrets.local.json` as `CWS_EXTENSION_ID`.

---

## Phase E — Verify end-to-end

Run:

```bash
npm run check:cws:ship -- --json
```

Parse the JSON. Expect `listing-drift` (rule id) to be evaluated now — no more "secrets not configured, skipping" — because `loadSecrets()` returns non-null.

- If `listing-drift` passes cleanly (or is not in the findings): report success.
- If `listing-drift` errors with an auth failure: the refresh token or client credentials are wrong. Tell the user the exact error and offer to re-run Phase C.
- If the manifest name/description differs from the live listing: that's not a credentials problem — it's content drift. Point the user to `cws-content` skill and say this skill's job is done.

On success, say:

> Credentials locked in. `npm run ship` will now publish directly to the Chrome Web Store. To use these in CI (GitHub Actions), add the 4 `CWS_*` keys as repo secrets — `loadSecrets()` falls back to env vars when `.secrets.local.json` is absent. See `docs/07-google-cloud-setup.md` for details.

---

## Idempotency guarantees

This skill is safe to re-run at any time. Specifically:
- `bootstrap-gcp.ts` detects an existing project and API enablement; it never destroys or re-creates.
- If `.secrets.local.json` already has some keys, Phases B / C / D skip past them unless the user explicitly asks to rotate.
- Re-running after a partial failure picks up where the previous run left off (credentials in file = assume good; re-verify in Phase E).

Before starting Phase A, read `.secrets.local.json` (if present) and note which keys are already populated. Skip phases whose outputs are already there, unless the user says "I want to rotate credentials" or Phase E's verification fails.

---

## What you don't do

- You don't try to create the OAuth Desktop client via any Google API. There isn't one; stopping to search is wasted effort.
- You don't modify the user's shell profile. Everyone else (`.github/workflows/*`, CI runners) uses env vars; local dev uses `.secrets.local.json`. Both are supported by `loadSecrets()` in `scripts/cws-api.ts`.
- You don't submit a zip. `cws-ship` / `publish-cws.ts` do that.
- You don't duplicate the reference in `docs/07-google-cloud-setup.md`. If the user asks "why can't step 4 be automated?" — point at that doc.
