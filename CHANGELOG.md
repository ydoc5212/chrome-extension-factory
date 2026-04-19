## [0.1.0] — 2026-04-19

### Added
- First plugin release packaging the six existing factory skills:
  - `cce-init` — onboarding interview that strips unused entrypoints, delegates content/screenshots/video, confirms structural-green
  - `cws-content` — fills listing copy (name, description, host origins, welcome) and clears the four content rules
  - `cws-screens` — interviews + generates the five Chrome Web Store screenshots
  - `cws-ship` — gates on the validator, version-syncs, and submits via the CWS API (with manual-zip fallback)
  - `cws-video` — interviews + generates the 30-second promo video via the external hyperframes skill
  - `setup-cws-credentials` — walks Google Cloud project + OAuth client setup and harvests refresh tokens
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` so the repo is installable via `/plugin marketplace add codyhxyz/create-chrome-extension`.
