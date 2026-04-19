# Development Workflow

## Dev Server

```bash
npm run dev
```

Opens a fresh Chrome instance with the extension pre-loaded. No need to manually load unpacked -- WXT handles it.

## Hot Module Replacement (HMR)

| Context | Behavior |
|---|---|
| Popup, Options, Sidepanel | Instant HMR -- changes appear without closing the UI |
| Content scripts | Full page reload on the target page |
| Background service worker | Full extension reload |

**Known quirk:** When background or content script files change, the popup closes (because the extension reloads). This is normal -- just reopen it.

## Debugging

**Content scripts:**
1. Navigate to a page matching your `matches` pattern
2. Open DevTools on that page (F12 / Cmd+Opt+I)
3. Your content script logs appear in the Console
4. Source files are under the "Content scripts" section in the Sources tab

**Background service worker:**
1. Go to `chrome://extensions`
2. Find your extension
3. Click "Inspect views: service worker"
4. A dedicated DevTools window opens for the background context

**Popup:**
1. Click the extension icon to open the popup
2. Right-click inside the popup > "Inspect"
3. DevTools opens for the popup context

**Sidepanel:**
1. Open the sidepanel
2. Right-click inside it > "Inspect"
3. DevTools opens for the sidepanel context

**Options page:**
1. Right-click extension icon > "Options" (or navigate to the options URL)
2. Standard page DevTools (F12)

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with HMR, opens Chrome |
| `npm run dev:firefox` | Same but for Firefox |
| `npm run build` | Production build to `.output/chrome-mv3/` |
| `npm run build:firefox` | Production build for Firefox |
| `npm run zip` | Build + zip for Chrome Web Store upload |
| `npm run zip:firefox` | Build + zip for Firefox |
| `npm run compile` | TypeScript check only (no build output) |

## Testing Against a Specific Site

Edit the `matches` array in `entrypoints/content.ts`:

```ts
export default defineContentScript({
  // Single site
  matches: ['*://*.github.com/*'],

  // Multiple sites
  matches: ['*://*.github.com/*', '*://*.gitlab.com/*'],

  // All sites (use sparingly -- CWS reviewers scrutinize this)
  matches: ['<all_urls>'],
});
```

Pattern format: `scheme://host/path` where `*` is a wildcard. See [Chrome match patterns docs](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns).

## Install flow — two modes, both automatic

The factory pops a styled Finder window after every build/zip so you never have to hunt for the artifact. The window's background tells you exactly where to drop it.

| Command | Purpose | Finder shows | Drop target |
|---|---|---|---|
| `npm run dev` | HMR loop | *(nothing — WXT launches a dev Chrome with the extension already loaded)* | — |
| `npm run build` | local production test | `chrome-mv3/` folder | `chrome://extensions` (Developer mode on) |
| `npm run zip` | ship to CWS | `<name>-<ver>-chrome.zip` | CWS devconsole *(auto-opens)* → Package → Upload new package |

### How it works (macOS)

After `wxt build` / `wxt zip` finishes, `scripts/install-window.mjs` stages the artifact into a clean sibling folder (`.output/install/` or `.output/publish/`) so *only* the thing you need to drag is visible, then opens a 700×480 centered Finder window with a custom background image that points at the right URL. Apple killed AppleScript control of `background picture` on some macOS versions for regular folders, but the close-and-reopen `.DS_Store` commit pattern still works as of macOS 26.

### Fallbacks if drag-and-drop doesn't work

Click whichever "Choose file" / "Load unpacked" button and paste the absolute path (printed in the terminal) into the file picker:

- **macOS**: press **⌘⇧G** → paste → Enter → Select. Or toggle hidden files with **⌘⇧.**
- **Windows**: click the address bar at the top, paste, Enter
- **Linux**: press **Ctrl+L**, paste, Enter. Toggle hidden files with **Ctrl+H**
