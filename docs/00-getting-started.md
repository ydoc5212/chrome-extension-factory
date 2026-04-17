# Getting Started

## Quick Start

```bash
# Clone the template
git clone <this-repo-url> my-extension
cd my-extension

# Install dependencies
npm install

# Start development (opens Chrome with extension pre-loaded)
npm run dev
```

## Project Structure

```
entrypoints/          # Every file/folder here becomes a manifest entry automatically
  background.ts       # Service worker (runs in background, no DOM access)
  content.ts          # Injected into web pages matching `matches` pattern
  popup/              # Browser action popup (React app)
  options/            # Extension options page (React app)
  sidepanel/          # Chrome side panel (React app)
utils/
  dom.ts              # Shadow DOM traversal helpers (queryAllDeep, closestComposed, etc.)
  observer.ts         # MutationObserver with suppression (prevents infinite loops)
  messaging.ts        # Typed messaging between contexts (content <-> background <-> popup)
public/
  icon/               # Extension icons (16, 32, 48, 96, 128px PNGs)
assets/               # Static assets processed by Vite (images, fonts, etc.)
wxt.config.ts         # WXT + manifest configuration
```

## How WXT File-Based Routing Works

WXT auto-generates manifest entries from the `entrypoints/` directory:

| File/Folder | Manifest Entry |
|---|---|
| `entrypoints/background.ts` | `background.service_worker` |
| `entrypoints/content.ts` | `content_scripts[]` |
| `entrypoints/popup/index.html` | `action.default_popup` |
| `entrypoints/options/index.html` | `options_ui.page` |
| `entrypoints/sidepanel/index.html` | `side_panel.default_path` |

Drop a new file in `entrypoints/` and WXT handles the manifest wiring. Delete a file and its manifest entry disappears.

## What's Included

- **WXT** -- build system, dev server, manifest generation
- **React 19** -- UI framework for popup, options, sidepanel
- **Tailwind CSS v4** -- utility-first styling
- **@wxt-dev/auto-icons** -- generates all icon sizes from source
- **@webext-core/messaging** -- type-safe message passing
- **TypeScript** -- strict typing across all contexts

## Keeping Your Listing Active

Chrome Web Store considers extensions inactive after approximately 6 months without updates. Inactive extensions may be deprioritized in search results or flagged for removal review.

**Strategy:** Set a calendar reminder every 5 months to review the extension, bump the version in `package.json`, and run `npm run zip` + upload.

Even a version bump with no functional changes counts as an update and resets the staleness clock. A GitHub Actions cron can automate the reminder:

```yaml
# .github/workflows/staleness-reminder.yml
name: Staleness Reminder
on:
  schedule:
    - cron: '0 9 1 */5 *'  # First day of every 5th month
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          gh issue create \
            --title "Extension update reminder — $(date +%B\ %Y)" \
            --body "Review for updates, bump version, and re-submit to Chrome Web Store." \
            --label "maintenance"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

For automated keepalive (version bump + publish via GitHub Actions), see [docs/06-keepalive-publish.md](./06-keepalive-publish.md).

## Launch Materials

Screenshots and a launch video are the two biggest conversion assets on the Chrome Web Store tile.

- **CWS screenshots:** 1280×800 PNG, up to 5. Use the `/cws-screens` skill — it walks you through 5 shots and generates PNGs via `npm run screenshots`. Outputs land in `.output/screenshots/`.
- **CWS launch video:** 30-second YouTube embed. Use the `/cws-video` skill wrapping `heygen-com/hyperframes`. Config lives in `video/config.ts`; escape hatch is `rm -rf video/`. The skill will suggest [Cap](https://cap.so) (free, open-source) when it asks you about screen recording footage for each beat.
- **iOS App Store screenshots** (if you ship a companion app): use the `/app-store-screenshots` skill — different dimensions (portrait, phone mockups) from CWS.

These are parallel, not interchangeable. The first CWS screenshot is the tile thumbnail in search results — make it the most compelling one.

## Next Step

See [01-extension-type-profiles.md](./01-extension-type-profiles.md) to strip the template down to your extension type in under 2 minutes.
