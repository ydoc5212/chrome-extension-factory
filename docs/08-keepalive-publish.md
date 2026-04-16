# Keepalive Publish

Automated workflow that bumps the patch version and re-publishes the
extension to the Chrome Web Store every 4 months, so the listing doesn't get
flagged with a "hasn't been updated in a long time" warning.

## What it does

- Runs on a cron schedule (every 4 months) and on manual trigger
- Bumps the patch version in `package.json` (WXT picks this up automatically)
- Builds, zips, and uploads to the CWS via the official API with `--auto-publish`
- Commits the version bump back to `main` with `[skip ci]`

## Honest caveat

This is a workaround for CWS staleness warnings, not a substitute for real
maintenance. If the extension is actually broken or its dependencies have
known CVEs, ship a real fix instead of relying on synthetic bumps. Treat
the scheduled run as a prompt to review the extension too.

## One-time setup: Get CWS API credentials

You need an OAuth 2.0 client ID, client secret, and refresh token scoped to
the Chrome Web Store API.

1. Follow the official guide: https://developer.chrome.com/docs/webstore/using-api
2. Or use the friendlier walkthrough from `chrome-webstore-upload-keys`:
   https://github.com/fregante/chrome-webstore-upload-keys

You'll end up with four values:

| Secret | Where it comes from |
|--------|--------------------|
| `CWS_EXTENSION_ID` | Chrome Web Store dashboard (the 32-char item ID) |
| `CWS_CLIENT_ID` | Google Cloud OAuth client |
| `CWS_CLIENT_SECRET` | Google Cloud OAuth client |
| `CWS_REFRESH_TOKEN` | Generated via the keys guide above |

## Activate

1. Go to the repo on GitHub → Settings → Secrets and variables → Actions
2. Add each of the 4 secrets above as a "Repository secret"
3. Done. The next scheduled run will pick them up.

If the secrets aren't set, the workflow exits cleanly (no failure email) — so
forks of the template don't get red X's by default.

## Manually trigger

GitHub repo → Actions tab → "Keepalive Publish" → "Run workflow" → pick
branch → Run. Useful for testing the pipeline or doing an ad-hoc bump.

## Disable

Either:
- Delete `.github/workflows/keepalive-publish.yml`, or
- Just don't set the `CWS_EXTENSION_ID` secret (the workflow no-ops)

## Schedule

Cron: `0 12 1 */4 *` — 1st of every 4th month (Jan, May, Sep) at 12:00 UTC.
CWS typically flags listings stale around the 6-month mark, so 4 months
leaves comfortable margin.
