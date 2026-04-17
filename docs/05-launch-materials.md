# Launch Materials

Screenshots and a launch video are the two biggest conversion assets on the Chrome Web Store tile. This doc is the index to the three generation pipelines the factory ships.

## Three pipelines, three audiences

| Pipeline | Target | Skill | Repo location | Default |
|---|---|---|---|---|
| **Chrome Web Store screenshots** | Chrome extension listing on CWS | `/cws-screens` | `screenshots/` | on |
| **Chrome Web Store launch video** | CWS listing embed + ProductHunt / Twitter / LinkedIn | `/cws-video` | `video/` | on |
| **iOS App Store screenshots** | Companion iOS app on the App Store | `/app-store-screenshots` | `marketing/` | skill-managed |

These are **parallel, not interchangeable.** Different dimensions, different aesthetics, different conversion goals. Don't try to use one pipeline's output as input to another.

- **CWS** is desktop, 1280×800, with a browser-chrome frame. Typography is restrained. The screenshot frames an extension surface (popup, sidepanel, options, welcome, or content script on a real page).
- **App Store** is mobile, iPhone/iPad mockups, with app-advertising typography (large, bold, gradient backgrounds). It frames an iOS app screen.

Most Chrome extensions don't have an iOS app, so for most users only the `/cws-screens` skill is relevant. If you also ship an iOS app, the two skills coexist — `screenshots/` produces your CWS assets, `marketing/` produces your App Store assets, and they don't share components or copy.

---

## Chrome Web Store screenshots (recommended)

### At a glance

| Item | Spec |
|---|---|
| Dimensions | **1280×800** (or 640×400; 1280 is strongly preferred) |
| Count | Up to 5 (target exactly 5 — the dashboard caps there) |
| First screenshot | Is the thumbnail in search results. Make it the most compelling one. |
| Format | PNG |
| Upload | Manual, via the CWS dashboard. No API. |

### Workflow

```
/cws-screens            # in Claude Code, from the repo root
```

The skill walks you through 5 shots (one headline + subhead + surface per shot), writes your choices to `screenshots/config.ts`, and generates PNGs via:

```bash
npm run screenshots
```

Outputs land in `.output/screenshots/`. Drag them into the CWS dashboard's **Store listing → Screenshots** field when submitting.

### How the pipeline is built

`screenshots/` is a standalone Next.js 15 project that renders each config entry to a dedicated `/[id]` route at 1280×800. A Playwright capture script (`screenshots/capture.ts`) boots the production build headless, visits each route, and writes PNGs.

- `screenshots/config.ts` — the only file you edit. Typed array of screenshot entries.
- `screenshots/components/BrowserFrame.tsx` — Chrome window chrome (URL bar, tabs, traffic-light buttons, light/dark theme).
- `screenshots/components/CopyOverlay.tsx` — headline + subhead overlay.
- `screenshots/components/SurfaceMock.tsx` — placeholder mockups of each surface (popup / sidepanel / options / welcome / content-in-page). Swap these out for your actual rendered surfaces once the extension is real.

The factory ships 5 placeholder entries with obviously-fake copy (`"Your killer feature here"`, `"your-target-site.com"`) so that `npm run check:cws:ship` fails until you customize them. That's the forcing function — see `scripts/validate-cws.ts` rule `ship-ready-screenshots`.

### What makes a good CWS screenshot

- **Show the extension doing something**, not the popup in isolation. A quiet popup is the weakest possible thumbnail.
- **One feature per screenshot.** Don't crowd.
- **High-contrast overlay copy.** Assume users scroll past in under a second.
- **Mix light and dark** if your extension supports both.
- **First screenshot is the thumbnail.** It must be the most compelling one — treat the other 4 as depth.

### Stripping the pipeline

If you'd rather produce screenshots manually (Figma, CleanShot, whatever) and skip the skill, just delete the `screenshots/` folder. The `ship-ready-screenshots` validator rule no-ops when the folder is missing. You'll still be responsible for producing at least one 1280×800 PNG before submitting.

---

## Chrome Web Store launch video (default-on)

### At a glance

| Item | Spec |
|---|---|
| Skill | `/cws-video` |
| Config | `video/config.ts` (declarative) |
| External dep | `heygen-com/hyperframes` — install with `npx skills add heygen-com/hyperframes` |
| Output dir | `.output/videos/` (gitignored) |
| Validator rule | `ship-ready-video` (SHIP_ONLY, fails on a fresh clone) |
| Escape hatch | `rm -rf video/` — rule no-ops on absent directory |

### Why video ships on by default

CWS listings with an embedded promo video convert meaningfully better than listings without. The same asset pulls weight on ProductHunt, Twitter, and LinkedIn at launch — one production run, many surfaces. Factory default: video is on. Users who genuinely don't want one delete the `video/` directory (same escape hatch as `screenshots/`).

### Length targets

| Target | Length | Use |
|---|---|---|
| CWS embed | 30 sec | YouTube upload, embedded in the CWS listing detail panel. Hard cap. |
| ProductHunt launch | 60 sec | Attached to PH launch. Longer breathing room. |
| Social horizontal (Twitter/LinkedIn) | 60 sec MP4, 16:9 | |
| Social vertical (Instagram/TikTok/Shorts) | 30 sec MP4, 9:16 | Only if targeting those channels |

Hyperframes generates all four from one `video/config.ts`. `exports` field controls which targets it actually produces.

### Workflow

1. Install hyperframes: `npx skills add heygen-com/hyperframes` (one-time, per-user).
2. Invoke `/cws-video`. The skill interviews you for hook + beats + exports, writes `video/config.ts`, and hands off to hyperframes to render.
3. Verify `.output/videos/` contains your exports.
4. `npm run check:cws:ship` should no longer fire `ship-ready-video`.

See `/skills/cws-video/SKILL.md` for the full recipe, worked example, and failure-mode table.

### Separate from the iOS workflow

Do not conflate with the `/app-store-screenshots` skill — that's for iOS App Store screenshots, different asset class entirely. And there is no iOS video pipeline in this factory; if you ship a companion iOS app, the App Store's video requirements are handled separately.

---

## iOS App Store screenshots

Use the `/app-store-screenshots` skill for your **iOS app** (not your Chrome extension). It scaffolds a Next.js + `html-to-image` project under `marketing/` with iPhone/iPad mockups and App Store-scale typography.

See `marketing/README.md` for the full workflow.

Do not invoke `/app-store-screenshots` to generate CWS screenshots — the aesthetic is wrong (phone mockup instead of browser frame) and the dimensions are wrong (Apple requires ~1290×2796 portrait at the current generation; CWS requires 1280×800 landscape).

---

## Other CWS assets

| Asset | Dimensions | Required? | Notes |
|---|---|---|---|
| Store screenshot | 1280×800 | Yes (1–5) | Handled by `/cws-screens`. |
| Small promo tile | 440×280 | No | Only shown if CWS features your extension on a category page. |
| Marquee promo tile | 1400×560 | No | Only shown if CWS features your extension on a banner. |
| Extension icon | 128×128 | Yes (auto) | Auto-generated from `assets/icon.svg` via `@wxt-dev/auto-icons`. |

If you want promo tiles, add additional routes to `screenshots/` at those dimensions and extend the capture script — the infrastructure already handles variable output dimensions. Or produce them manually.

---

## Manual screenshot process (fallback)

If you can't or don't want to use the skill:

1. `npm run build` and load the extension unpacked in Chrome.
2. Open a clean Chrome profile (no other extensions, no bookmarks bar).
3. Navigate to a representative page.
4. Activate the extension (open popup, trigger content script, etc.).
5. Take a screenshot at exactly **1280×800**. On macOS: use CleanShot with a 1280×800 region, or `Cmd+Shift+4` with careful dragging.
6. Optionally annotate in Figma / Canva / Excalidraw.
7. Save to `.output/screenshots/` so the `ship-ready-screenshots` validator rule sees it.

This is slower, less reproducible, and harder to keep consistent across 5 shots. Prefer the skill.
