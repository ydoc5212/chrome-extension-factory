# Security

## Credentials — never ship them in the bundle

**Rule:** no third-party API key, bearer token, or secret ever lives in a file under `.output/chrome-mv3/`. The factory enforces this — `scripts/validate-cws.ts` runs the `no-bundled-credentials` rule on every `npm run check:cws`. It grep-scans the built bundle for `sk-*`, `AIza*`, `AKIA*`, `xox[baprs]-*`, `gh[pousr]_*`, `sk_live_*`. If any match, the validator exits non-zero. `npm run zip` refuses to produce an artifact.

### Why

Extension bundles are public. A `.crx` is a signed zip; anyone can download it from the Chrome Web Store, unzip it, and grep for strings. Attackers scrape the CWS at scale looking for keys. Confirmed 2025 examples (TheHackerNews, June 2025):

| Extension | Users | Leaked |
|---|---|---|
| Avast Online Security | 7M | GA4 secret |
| AVG Online Security | 600K | GA4 secret |
| Watch2Gether | 1M | Tenor API key |
| Trust Wallet | — | fiat-ramps API key |
| Browsec VPN | 6M | user IDs over plain HTTP |
| TravelArrow | — | geolocation key |

A leaked LLM key bills against your account until you rotate. A leaked analytics write key poisons your data. A leaked payment key is worse.

Build-time placeholder replacement (the old factory pattern) doesn't help — it produces exactly the hardcoded string the scanner is looking for.

### What to do instead — proxy the call

The pattern: extension → your proxy → upstream API. The real credential lives as a server-side secret, never in the bundle. The extension authenticates to your proxy with a per-install UUID; the proxy rate-limits per UUID so a leaked UUID can't run up an unbounded bill.

The factory ships this as a subproject: `proxy/` (Cloudflare Worker, ~120 LOC). A Vercel Edge Function alternative lives at `proxy/vercel/`. Both expose the same `POST /v1/forward` endpoint and work with the factory's `utils/proxy-client.ts` helper.

**Extension side** — replace any direct `fetch('https://api.openai.com/...')` call:

```ts
import { proxyFetch } from '@/utils/proxy-client';

const resp = await proxyFetch({
  upstream: 'openai',
  path: '/v1/chat/completions',
  body: { model: 'gpt-4o-mini', messages: [...] },
});
const data = await resp.json();
```

`proxyFetch` generates a UUID v4 on first call into `chrome.storage.local['cce-install-id']` and reuses it on every subsequent call. The proxy URL comes from `VITE_PROXY_URL` in your `.env.local`.

**Proxy side** — one command. `npm run setup:proxy` walks `wrangler login` / KV create / upstream secrets / deploy / writing `VITE_PROXY_URL` to `.env.local`. Takes about two minutes if you already have a Cloudflare account. See `proxy/README.md` for the manual-deploy steps or the Vercel equivalent (`proxy/vercel/README.md`).

### Authed variant — when your extension has sign-in

If your extension already requires a login (sync, history, paid tier, B2B), use `proxy-authed/` instead of `proxy/`. Same `POST /v1/forward` contract, but it verifies a JWT from your auth provider (Clerk / Auth0 / Supabase / Google) and rate-limits per real user id. Stronger guarantees than per-UUID because `sub` claims aren't forgeable, and you get a `BANNED_SUBS` KV for the rare case you need to cut off an abusive account. Deploy one proxy per extension — pick `proxy/` or `proxy-authed/`, not both. See `proxy-authed/README.md`.

### Spend cap (non-negotiable)

Even with the proxy, cap your upstream-account monthly spend. OpenAI, Anthropic, MiniMax, Google — all of them support a hard monthly budget limit. Set one. It's the difference between "found a leak, lost $50" and "found a leak, lost $50,000."

### Anti-abuse layering

The factory's default proxy rate-limits 50 req / 24h per install UUID. That caps casual abuse. If someone actually attacks you:

1. **Proof-of-install HMAC tokens.** The extension POSTs once, gets a signed 24h token back, replays it on subsequent requests. Rotates automatically. Non-negotiable if you see script-kiddie behavior.
2. **`chrome.instanceID.getID()`.** Google-signed per-install token. Still anonymous, but the signature is the trust root — attackers can't mint fresh ones without installing the extension.
3. **Hard per-origin rate limit at the upstream.** Most providers support this; set it.

Layer these as you need them. V1 ships with per-UUID rate limit only — that's enough for an MVP.

## CWS OAuth credentials (`.secrets.local.json`)

Separate concern from extension credentials. The factory's publish scripts (`scripts/publish-cws.ts`, `scripts/version-sync.ts`, the validator's `listing-drift` rule) use OAuth credentials for the Chrome Web Store API. These run on *your* machine, not in the extension bundle, so they're fine to keep in `.secrets.local.json` (gitignored). See `docs/06-keepalive-publish.md`.

## OAuth inside the extension

For user-facing OAuth flows (signing users into your service, not your build creds), use `chrome.identity.launchWebAuthFlow` with PKCE:

```ts
// In background.ts
const redirectUrl = chrome.identity.getRedirectURL();

const authUrl = new URL('https://provider.com/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', redirectUrl);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

const responseUrl = await chrome.identity.launchWebAuthFlow({
  url: authUrl.toString(),
  interactive: true,
});

const code = new URL(responseUrl).searchParams.get('code');
// Exchange code for tokens.
```

- `chrome.identity.getRedirectURL()` gives the extension's redirect URI.
- Use PKCE — no client secret stored in the extension.
- Add `"identity"` to `permissions` in `wxt.config.ts`.

## MV3 Content Security Policy

Manifest V3 enforces strict CSP. You cannot:

| Banned | Alternative |
|---|---|
| `eval()`, `new Function()` | Refactor to avoid dynamic code execution |
| Remote scripts (`<script src="https://...">`) | Bundle everything via Vite |
| Inline `<script>` tags in HTML | Vite handles this — all scripts are bundled as modules |
| `document.write()` | Use DOM APIs (`createElement`, `appendChild`) |

Vite's build output is already MV3-compliant. Problems only arise if you try to bypass the build system.

## Permissions best practices

- **Only request permissions you actually use.** CWS reviewers reject unjustified permissions. The validator's `unused-permission` rule catches the common case.
- **Prefer optional permissions** for features not all users need:

  ```ts
  // In wxt.config.ts
  manifest: { optional_permissions: ['tabs', 'bookmarks'] },
  ```

  Then request at runtime:

  ```ts
  const granted = await chrome.permissions.request({ permissions: ['tabs'] });
  ```

- **Document each permission** in your privacy policy with a clear reason.
- **Audit before submission.** Review `wxt.config.ts` permissions and remove any you added during development but no longer use.

## Common permission justifications

| Permission | Typical justification |
|---|---|
| `storage` | Saving user preferences and extension state |
| `activeTab` | Accessing the current tab when user clicks the extension |
| `alarms` | Scheduling periodic background tasks |
| `sidePanel` | Displaying the side panel UI |
| `tabs` | Reading tab URLs or titles for core functionality |
| `identity` | OAuth authentication flow |
