# Google Cloud setup for CWS publishing

How the factory gets its Chrome Web Store API credentials, why some of it is
manual, and how to run the whole thing in CI.

## What the factory needs

Four secrets plus one project ID:

| Key | Purpose |
|---|---|
| `GCP_PROJECT_ID` | Google Cloud project that owns the OAuth client and API enablement |
| `CWS_EXTENSION_ID` | 32-char ID of your Chrome Web Store listing |
| `CWS_CLIENT_ID` | OAuth 2.0 Client ID (Desktop app type) |
| `CWS_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `CWS_REFRESH_TOKEN` | Long-lived token for the refresh-token grant |

Local dev: persisted in `.secrets.local.json` (gitignored).
CI: injected as env vars.
Both are read by `loadSecrets()` in `scripts/cws-api.ts` (file takes precedence, env vars are fallback).

## The happy path

```bash
npm run setup:cws          # or invoke the setup-cws-credentials skill
```

That runs `scripts/bootstrap-gcp.ts`, which handles everything Google exposes a
programmatic interface for. The skill (`skills/setup-cws-credentials/SKILL.md`)
wraps it with the interactive steps Google forces you to do by hand.

## What's automated vs. what isn't

| Step | Status | Mechanism |
|---|---|---|
| Create GCP project | automated | `gcloud projects create` |
| Enable Chrome Web Store API | automated | `gcloud services enable chromewebstore.googleapis.com` |
| OAuth consent screen | partially | `gcloud iap oauth-brands create` (Workspace-only; personal accounts configure in console) |
| OAuth 2.0 Desktop Client ID + Secret | **manual** | Must be created in the Google Cloud Console — no public API |
| Refresh token | automated | `npx chrome-webstore-upload-keys` (wrapped by `scripts/harvest-cws-token.ts`) |

## Why the Desktop Client ID is manual

The closest Google ever came to a programmatic API for OAuth client creation
was the **IAP OAuth Admin API**. That API:

- was limited to IAP-scoped clients (not general-purpose Desktop clients)
- was deprecated on **January 22, 2025**
- was shut down on **March 19, 2026**

No replacement has been announced. As of 2026, the only path to an OAuth 2.0
Desktop client ID is clicking through `console.cloud.google.com/apis/credentials`.

The factory handles this with two fallbacks:
1. **Computer-use** (optional): the `setup-cws-credentials` skill can drive a browser via the `gh-computer-use` MCP and read the credentials off the screen.
2. **GUI wizard** (fallback): a static HTML walkthrough at `docs/setup-wizard/index.html` opens in the user's browser with step-specific deep links. The user pastes the credentials back to the terminal.

## Running in CI

The four `CWS_*` secrets go into GitHub → Settings → Secrets and variables →
Actions as repository secrets (not `GCP_PROJECT_ID` — CI doesn't need to create
projects, just use credentials already obtained locally).

```yaml
- run: npm run ship
  env:
    CWS_EXTENSION_ID: ${{ secrets.CWS_EXTENSION_ID }}
    CWS_CLIENT_ID: ${{ secrets.CWS_CLIENT_ID }}
    CWS_CLIENT_SECRET: ${{ secrets.CWS_CLIENT_SECRET }}
    CWS_REFRESH_TOKEN: ${{ secrets.CWS_REFRESH_TOKEN }}
```

If any secret is missing, `loadSecrets()` returns null and every consumer
(`publish-cws.ts`, `version-sync.ts`, `validate-cws.ts`'s `listing-drift` rule)
no-ops cleanly instead of erroring. Forks stay green by default.

## Rotating credentials

To rotate the refresh token (lowest blast radius — use if it's leaked):

```bash
npx tsx scripts/harvest-cws-token.ts
```

It overwrites `CWS_REFRESH_TOKEN` in `.secrets.local.json`. Don't forget to
update the same value in GitHub Actions secrets.

To rotate the OAuth client itself (nuclear option):
1. Open the Credentials page in the console, delete the old client.
2. Re-run the `setup-cws-credentials` skill — it'll detect missing
   `CWS_CLIENT_ID` / `CWS_CLIENT_SECRET` and walk you through Phase B again.

## Troubleshooting

**`gcloud projects create` fails with "Project ID already exists"**
Project IDs are globally unique across all of Google Cloud. Pick a different
one. The bootstrap script suggests `cws-upload-<your-username>` — add a
random suffix if that's taken.

**`gcloud iap oauth-brands create` fails with PERMISSION_DENIED or INVALID_ARGUMENT**
You're on a personal Google account. The API only works for Google Workspace
organizations. The skill detects this and routes you to the GUI wizard.
Nothing is broken.

**`listing-drift` rule errors with "401 Unauthorized"**
The refresh token is stale (rare — they last ~years but can be revoked). Run
`npx tsx scripts/harvest-cws-token.ts` to regenerate.

**`listing-drift` rule errors with "404 Not Found"**
`CWS_EXTENSION_ID` is wrong, or the listing doesn't exist yet. Confirm the
32-char ID in the CWS developer dashboard URL.

**CI pipeline fails with "CWS_EXTENSION_ID is not defined"**
You've got a GitHub Actions job that doesn't pass the secrets through to the
script. Check the `env:` block. The factory's own `.github/workflows/keepalive-publish.yml`
is a working reference.

## See also

- `docs/06-keepalive-publish.md` — what uses these credentials (scheduled re-publish workflow)
- `skills/setup-cws-credentials/SKILL.md` — interactive flow
- `scripts/bootstrap-gcp.ts` — gcloud automation
- `scripts/harvest-cws-token.ts` — refresh-token harvest
- `scripts/cws-api.ts` — credential loader + API client
