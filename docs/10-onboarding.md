# Welcome / Onboarding Pattern

The factory ships a generalized welcome page at `entrypoints/welcome/`. It's a single-page checklist that requests `optional_host_permissions` from a user gesture — the same pattern that lets the install prompt stay empty and avoids the Chrome Web Store "in-depth review" banner (see `docs/09-cws-best-practices.md`).

This doc covers **when to keep it, when to delete it, and how to fill in `config.ts`.** The principles in here are extracted from Refined GitHub, uBlock Origin, Vimium, Privacy Badger, Dashlane, and Chrome's own developer docs.

---

## When to keep the welcome page

Keep it if **any** of these is true:

- Your extension needs host permissions to do its core job (the welcome page is where you request them).
- Your extension needs setup before it's useful (API key, account login, choosing a profile).
- Users are likely to install your extension and forget the toolbar icon exists — the pin hint is worth the page on its own.

## When to delete it

Delete `entrypoints/welcome/` and revert the `tabs.create` call in `entrypoints/background.ts` if **all** of these are true:

- Your extension works immediately with smart defaults (uBlock Origin / Vimium / Dark Reader model).
- You don't need any host permissions, or you only need `activeTab` (no install prompt).
- There's no setup, no key, no account.

The research is consistent: extensions that ship with smart defaults and skip the welcome page get higher day-7 retention than extensions with welcome pages users had to scroll through. **A welcome page only earns its spot when it's load-bearing.**

---

## How to fill in `config.ts`

The schema lives in `entrypoints/welcome/config.ts`. Five things to set:

1. **`valueProp`** — one sentence. Plain language. If you can't say it in one sentence, your extension probably does too many things to pass the Chrome Web Store single-purpose check.
2. **`activationSurfaces`** — short bullets answering "where does this run?" Sets scope so the permission asks feel narrow.
3. **`steps`** — array of permission requests. Each has:
   - `label` (what's being asked for)
   - `justification` (REQUIRED — "so we can do X on Y", never "grant access")
   - `permissions` (the object passed to `chrome.permissions.request()`)
   - optional `privacyNote` and `cta` overrides
4. **`demoMedia`** *(optional)* — a single image or muted-loop webm above the checklist. **One** demo, not a carousel.
5. **`links`** — repo + issues + privacy URLs for the trust footer.

That's it. The page renders the rest.

---

## What the page does for you (so you don't reinvent it)

- **Detects existing permissions on load** via `hasPermissions` — if the user already granted everything, every step renders pre-checked.
- **Listens for permission changes** via `watchPermissions` (`chrome.permissions.onAdded`/`onRemoved`) — flipping a permission off in `chrome://extensions` updates the page without reload.
- **Preserves the user-gesture chain** — the click handler calls `chrome.permissions.request()` synchronously. Don't add an `await` before it or Chrome silently rejects the prompt.
- **Renders all steps at once** with empty-circle → checkmark progression. Users see the whole shape of the setup, not a one-screen-at-a-time tour.
- **Shows a pin hint** (puzzle-piece icon + one sentence) only after every step is granted.
- **Shows a trust footer** with the manifest version, repo, issues, and privacy links.
- **Themes correctly** in light and dark via Tailwind's `dark:` variant + `<meta name="color-scheme" content="light dark">` (don't drop that meta tag — without it, scrollbars and form controls don't theme).
- **Opens once** — `entrypoints/background.ts` sets a `welcomeShown` flag in `browser.storage.local` after first install. Resetting that flag (or wiping extension storage) re-arms the welcome.

---

## Anti-patterns the scaffold prevents

These are baked out of the structure on purpose. Don't add them back.

- **Multi-step tours / carousels / modals.** Users abandon at step 2. The whole point of the visible-checklist pattern is to skip the tour.
- **Generic "Grant access" copy.** The `PermissionStep.justification` field is required by the type; there's no path to ship without saying *why*.
- **Account creation, email capture, telemetry-by-default.** None of these are part of the schema. If you need them, build them as a separate explicit step the user can decline.
- **Autoplay video with sound, confetti, analytics scripts.** No sound (the `<video>` element is `muted` and `playsInline`); no third-party scripts; no celebration.
- **Conflating welcome with options.** Welcome is one-shot post-install. Options is recurring settings. Keep them separate — don't repurpose the welcome as a settings page or vice versa.
- **Marketing fluff.** The page is short by design. If you're tempted to add a "features" grid, that's a landing page on your website, not the post-install tab.

---

## Stress-tests before shipping

Before declaring an extension done, manually verify:

1. **First install** — uninstall the extension if previously installed, then `npm run dev`. Welcome tab should auto-open.
2. **Reinstall doesn't re-prompt** — disable then re-enable the extension. Welcome should *not* re-open (the `welcomeShown` flag holds).
3. **Pre-granted state** — grant the permissions, close the welcome tab, then manually open `welcome.html`. Steps should render pre-checked, "all set" + pin hint visible.
4. **Live revoke** — with the welcome tab open, go to `chrome://extensions` and revoke a host permission. The corresponding step should flip back to empty within a second (proves `watchPermissions` is wired).
5. **Dark mode** — toggle OS dark mode. Page rerenders with correct colors. Scrollbars match.
6. **CWS validator** — `npm run check:cws` still passes. The welcome flow is a CWS *asset* (it's why your install prompt is empty), not a liability.

---

## Reference implementations worth studying

- [Refined GitHub `welcome.svelte`](https://github.com/refined-github/refined-github/blob/main/source/welcome.svelte) — the cleanest staged-checklist pattern in the wild. Different framework (Svelte), same shape.
- [uBlock Origin](https://github.com/gorhill/uBlock) — the case for *no* welcome page. Smart defaults, dashboard-as-settings.
- [Privacy Badger welcome page](https://github.com/EFForg/privacybadger) — the case for explaining "warmup" behavior so users don't think the extension is broken.
