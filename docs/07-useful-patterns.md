# Useful Patterns

Reference for the utilities included in this template.

---

## `queryAllDeep(selector, root)` -- `utils/dom.ts`

Query elements across shadow DOM boundaries.

**When:** Targeting elements inside shadow DOMs. Many modern sites use shadow DOM extensively (YouTube, GitHub, Salesforce, etc.). Standard `document.querySelectorAll` stops at shadow boundaries and returns nothing.

**Usage:**
```ts
import { queryAllDeep } from '@/utils/dom';

// Find all links, even those inside shadow roots
const links = queryAllDeep('a[href]');

// Scope to a specific subtree
const buttons = queryAllDeep('button', someContainer);
```

**How it works:** Uses a `TreeWalker` to recursively enter every `shadowRoot` it encounters, running `querySelectorAll` inside each one.

---

## `closestComposed(node, selector)` -- `utils/dom.ts`

Traverse up from a node, crossing shadow DOM boundaries.

**When:** You have an event target deep inside a shadow root and need to find a logical ancestor that lives in an outer shadow root or the main document. `Element.closest()` stops at the shadow boundary.

**Usage:**
```ts
import { closestComposed } from '@/utils/dom';

element.addEventListener('click', (e) => {
  const card = closestComposed(e.target as Node, '.card');
  // card might be in an outer shadow root -- closest() would have returned null
});
```

**How it works:** Walks `parentElement` normally, then jumps to `shadowRoot.host` when it hits a shadow boundary.

---

## `ensureScopedStyles(rootNode, styleId, css)` -- `utils/dom.ts`

Inject a `<style>` element into a document or shadow root. Idempotent -- won't duplicate if the style ID already exists.

**When:** Your content script needs CSS that works inside shadow DOMs. Styles in the main document do not penetrate shadow roots.

**Usage:**
```ts
import { ensureScopedStyles } from '@/utils/dom';

// Inject into main document
ensureScopedStyles(document, 'my-ext-styles', `
  .my-highlight { background: yellow; }
`);

// Inject into a shadow root
const shadowRoot = element.shadowRoot;
ensureScopedStyles(shadowRoot, 'my-ext-styles', `
  .my-highlight { background: yellow; }
`);
```

---

## `createSuppressableObserver(options)` -- `utils/observer.ts`

MutationObserver wrapper with timestamp-based suppression and debouncing.

**When:** Your extension watches DOM mutations but also modifies the DOM. Without suppression, your mutations trigger the observer, which triggers more mutations -- infinite loop.

**Usage:**
```ts
import { createSuppressableObserver } from '@/utils/observer';

const observer = createSuppressableObserver({
  callback: (mutations) => {
    // React to page changes
    updateUI(mutations);
  },
  debounceMs: 150, // default: 100
});

observer.observe(document.body);

// Before making DOM changes:
observer.suppress();       // suppress for 120ms (default)
observer.suppress(300);    // or specify duration
element.textContent = 'updated';
```

**Options:**
- `callback(mutations)` -- called with batched mutations after debounce window
- `config` -- `MutationObserverInit` (defaults to `{ childList: true, subtree: true }`)
- `debounceMs` -- debounce interval in ms (default: 100)

**Methods:**
- `observe(target)` -- start observing
- `disconnect()` -- stop observing, clear timers
- `suppress(ms?)` -- ignore mutations for the next `ms` milliseconds (default: 120)

---

## `sendMessage` / `onMessage` -- `utils/messaging.ts`

Type-safe message passing between extension contexts, built on `@webext-core/messaging`.

**When:** Content script needs data from background, popup needs to trigger a background action, or any cross-context communication.

**Why:** Typed messaging prevents the "message shape mismatch" class of bugs. The compiler enforces that every `sendMessage` call has the correct data shape and every handler returns the expected response type.

**Define your protocol** in `utils/messaging.ts`:
```ts
interface ProtocolMap {
  ping: { data: void; response: string };
  getSettings: { data: void; response: Settings };
  saveItem: { data: { id: string; value: string }; response: boolean };
}
```

**Handle in background:**
```ts
import { onMessage } from '@/utils/messaging';

onMessage('ping', () => 'pong');

onMessage('getSettings', async () => {
  const result = await chrome.storage.local.get('settings');
  return result.settings;
});

onMessage('saveItem', async ({ data }) => {
  // data is typed as { id: string; value: string }
  await chrome.storage.local.set({ [data.id]: data.value });
  return true;
});
```

**Send from content script or popup:**
```ts
import { sendMessage } from '@/utils/messaging';

const pong = await sendMessage('ping', undefined);  // typed as string
const settings = await sendMessage('getSettings', undefined);  // typed as Settings
const ok = await sendMessage('saveItem', { id: '1', value: 'hello' });  // typed as boolean
```

Add new message types to `ProtocolMap` -- both sides get compile-time type safety automatically.

---

## Welcome / Onboarding Page Pattern

The factory ships a generalized welcome page at `entrypoints/welcome/`. It's a single-page checklist that requests `optional_host_permissions` from a user gesture — the pattern that lets the install prompt stay empty and avoids the Chrome Web Store "in-depth review" banner (see `docs/03-cws-best-practices.md`).

### When to keep it

Keep it if **any** of these is true:
- Your extension needs host permissions to do its core job (the welcome page is where you request them).
- Your extension needs setup before it's useful (API key, account login, choosing a profile).
- Users are likely to install your extension and forget the toolbar icon exists — the pin hint is worth the page on its own.

### When to delete it

Delete `entrypoints/welcome/` and revert the `tabs.create` call in `entrypoints/background.ts` if **all** of these are true:
- Your extension works immediately with smart defaults (uBlock Origin / Vimium / Dark Reader model).
- You don't need any host permissions, or you only need `activeTab` (no install prompt).
- There's no setup, no key, no account.

### Filling in `config.ts`

Five things to set in `entrypoints/welcome/config.ts`:
1. **`valueProp`** — one sentence, plain language.
2. **`activationSurfaces`** — short bullets answering "where does this run?"
3. **`steps`** — array of permission requests (label, justification, permissions, optional privacyNote/cta).
4. **`demoMedia`** *(optional)* — a single image or muted-loop webm above the checklist.
5. **`links`** — repo + issues + privacy URLs for the trust footer.

### What the page does for you

- Detects existing permissions on load via `hasPermissions` — pre-checks granted steps.
- Listens for live permission changes via `watchPermissions` — revoking in `chrome://extensions` updates the page without reload.
- Preserves the user-gesture chain — `chrome.permissions.request()` is called synchronously. Don't add an `await` before it or Chrome silently rejects the prompt.
- Shows a pin hint (puzzle-piece icon) only after every step is granted.
- Opens once — `entrypoints/background.ts` sets a `welcomeShown` flag after first install.

### Anti-patterns to avoid

- Multi-step tours / carousels / modals — users abandon at step 2.
- Generic "Grant access" copy — the `justification` field is required by the type.
- Account creation, email capture, or telemetry-by-default in the welcome flow.
- Conflating welcome with options — welcome is one-shot post-install, options is recurring settings.

### Stress-tests before shipping

1. First install — uninstall, `npm run dev`, welcome tab should auto-open.
2. Reinstall doesn't re-prompt — disable/re-enable, welcome should NOT re-open.
3. Pre-granted state — grant permissions, close tab, manually open `welcome.html` — steps should render pre-checked.
4. Live revoke — with welcome tab open, revoke a host permission in `chrome://extensions` — step should flip back within a second.
5. Dark mode — page rerenders with correct colors.
6. `npm run check:cws` still passes.
