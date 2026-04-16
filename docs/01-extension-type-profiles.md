# Extension Type Profiles

Pick your extension type below and follow the strip-down checklist. Each takes under 2 minutes.

> **About the welcome page.** Every profile below assumes you'll either keep `entrypoints/welcome/` (configure it via `entrypoints/welcome/config.ts`) or delete it. Delete only if your extension works with smart defaults and no host permissions — see `docs/10-onboarding.md` for the decision rule.

---

## 1. Content-Script-Only

*Page enhancer, injector, or modifier. No visible UI chrome.*

**Keep:**
- `entrypoints/content.ts`
- `utils/dom.ts`
- `utils/observer.ts`
- `entrypoints/welcome/` + `utils/permissions.ts` if you need host access (request from welcome). Delete both if defaults are enough.

**Delete:**
- `entrypoints/popup/`
- `entrypoints/options/`
- `entrypoints/sidepanel/`
- `entrypoints/background.ts` (unless you need alarms or messaging — but you need it to open the welcome tab if you keep welcome)
- `utils/messaging.ts` (if no background)

**Config (`wxt.config.ts`):**
```ts
manifest: {
  permissions: [], // remove 'storage', 'alarms', 'sidePanel' if unused
  // remove 'action' -- no popup means no toolbar icon action needed
},
```

**Checklist:**
- [ ] Delete unused entrypoints and utils
- [ ] Edit `matches` in `content.ts` to target your site
- [ ] Remove unused permissions from `wxt.config.ts`
- [ ] `npm run dev` -- verify content script loads on target page

---

## 2. Popup-Based

*Quick-action tool triggered from the toolbar icon.*

**Keep:**
- `entrypoints/popup/`
- `entrypoints/background.ts`
- `entrypoints/options/` (if you need a settings page)
- `utils/messaging.ts`
- `entrypoints/welcome/` + `utils/permissions.ts` if you need host access. Delete if not.

**Delete:**
- `entrypoints/content.ts`
- `entrypoints/sidepanel/`
- `utils/dom.ts`
- `utils/observer.ts`

**Config (`wxt.config.ts`):**
```ts
manifest: {
  permissions: ['storage'], // keep storage, remove 'sidePanel'
  // remove 'alarms' if unused
},
```

**Checklist:**
- [ ] Delete unused entrypoints and utils
- [ ] Remove `sidePanel` and `alarms` permissions if unused
- [ ] Remove `import` references to deleted utils in remaining files
- [ ] `npm run dev` -- verify popup opens from toolbar icon

---

## 3. Sidepanel

*Persistent panel alongside the page (research assistant, reference tool).*

**Keep:**
- `entrypoints/sidepanel/`
- `entrypoints/background.ts`
- `entrypoints/options/` (optional)
- `utils/messaging.ts`
- `entrypoints/welcome/` + `utils/permissions.ts` if you need host access. Delete if not.

**Delete:**
- `entrypoints/popup/`
- `entrypoints/content.ts`
- `utils/dom.ts`
- `utils/observer.ts`

**Config (`wxt.config.ts`):**
```ts
manifest: {
  permissions: ['storage', 'sidePanel'],
  minimum_chrome_version: '114', // sidePanel requires 114+
},
```

If you want the sidepanel to open when the toolbar icon is clicked, add to `background.ts`:
```ts
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```

**Checklist:**
- [ ] Delete unused entrypoints and utils
- [ ] Confirm `sidePanel` is in permissions
- [ ] Remove `alarms` permission if unused
- [ ] `npm run dev` -- verify sidepanel opens (right-click toolbar icon > "Open side panel")

---

## 4. DevTools

*Custom panel in Chrome DevTools (debugger, inspector, profiler).*

> Requires creating a new entrypoint -- not included in the default template.

**Create** `entrypoints/devtools.html`:
```html
<!doctype html>
<html>
  <head><title>DevTools</title></head>
  <body>
    <script src="./devtools.ts"></script>
  </body>
</html>
```

**Create** `entrypoints/devtools.ts`:
```ts
chrome.devtools.panels.create(
  'My Panel',           // panel tab title
  'icon/32.png',        // icon
  'devtools-panel.html' // panel page
);
```

**Create** `entrypoints/devtools-panel/index.html` (standard React entrypoint like popup).

**Delete:**
- `entrypoints/popup/`
- `entrypoints/sidepanel/`
- `entrypoints/content.ts`
- `entrypoints/welcome/` (devtools extensions don't need a welcome — the panel itself is the surface)
- `utils/dom.ts`
- `utils/observer.ts`

**Config (`wxt.config.ts`):**
```ts
manifest: {
  devtools_page: 'devtools.html', // WXT may handle this automatically
  permissions: ['storage'], // remove 'sidePanel', 'alarms'
},
```

**Checklist:**
- [ ] Create devtools entrypoints as shown above
- [ ] Delete unused entrypoints and utils
- [ ] `npm run dev` -- open DevTools on any page, verify your panel appears

---

## 5. Full Hybrid

*Content script + popup + sidepanel + options + background. The kitchen sink.*

**Keep:** Everything. This is the default state of the template.

**Checklist:**
- [ ] Edit `matches` in `content.ts` to target your site
- [ ] Verify all permissions in `wxt.config.ts` are actually used
- [ ] Fill in `entrypoints/welcome/config.ts` (value prop, steps, links) — see `docs/10-onboarding.md`
- [ ] `npm run dev` -- verify all entry points load
- [ ] Remove any entry points you end up not using before submission
