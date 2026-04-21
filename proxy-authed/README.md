# Credential proxy (authed variant)

Use this instead of `proxy/` **when your extension has user sign-in.**

Same `POST /v1/forward` contract. The difference: the extension sends a signed JWT instead of an anonymous UUID. The worker verifies the JWT against your auth provider's JWKS (Clerk, Auth0, Google, Supabase — any OIDC-style provider works) and rate-limits per user id (`sub` claim), not per install.

## Why you'd pick this over `proxy/`

| | `proxy/` (anonymous) | `proxy-authed/` (this) |
|---|---|---|
| Identity | Per-install UUID (client-generated) | JWT `sub` (provider-signed) |
| Forgeability | High — clear storage, new UUID | Low — requires a real account |
| Rate limit meaning | Soft cap | Hard cap (can ban) |
| User friction | Zero (install-and-go) | Sign-in required |
| Right for | Utilities, single-shot tools, no user state | Apps with sync/history/accounts, B2B, paid |

If your extension has a login screen anyway (to save user state, sync across devices, or for a paid tier), use this one — the auth you're already building does double duty.

## Deploy

1. **Set up an auth provider.** The cheapest no-brainer is Clerk (free tier, Chrome-extension-friendly SDK, JWKS URL is public). Auth0 and Supabase work identically.

2. **Wire sign-in into the extension.** Clerk ships a Chrome-extension SDK; pick your pattern:
   - Popup with Clerk's `<SignIn />` component.
   - Your popup calls `chrome.identity.launchWebAuthFlow` against your own hosted Clerk page.

   After sign-in, stash the session token in `browser.storage.session` (cleared when Chrome closes — the token should be short-lived anyway).

### Provider JWKS cheatsheet

These are the `JWKS_URL` / `JWT_ISSUER` values for common providers. Replace `<tenant>` / `<project-id>` with yours.

| Provider | `JWKS_URL` | `JWT_ISSUER` |
|---|---|---|
| Clerk | `https://<tenant>.clerk.accounts.dev/.well-known/jwks.json` | `https://<tenant>.clerk.accounts.dev` |
| Auth0 | `https://<tenant>.auth0.com/.well-known/jwks.json` | `https://<tenant>.auth0.com/` |
| Supabase | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` | `https://<project-ref>.supabase.co/auth/v1` |
| Google (Identity Platform / Firebase Auth) | `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` | `https://securetoken.google.com/<project-id>` |
| AWS Cognito | `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>/.well-known/jwks.json` | `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>` |
| Microsoft Entra ID (Azure AD) | `https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys` | `https://login.microsoftonline.com/<tenant-id>/v2.0` |
| Okta | `https://<tenant>.okta.com/oauth2/default/v1/keys` | `https://<tenant>.okta.com/oauth2/default` |
| Descope | `https://api.descope.com/<project-id>/.well-known/jwks.json` | `https://api.descope.com/<project-id>` |

Any OIDC-compliant provider works — if yours isn't listed, check for a `/.well-known/openid-configuration` endpoint on your auth domain; it advertises both values as `jwks_uri` and `issuer`.

3. **Deploy this worker** (same rhythm as `proxy/`):

   ```bash
   cd proxy-authed
   npm install
   npx wrangler login
   npx wrangler kv namespace create RATE_LIMITS     # paste id into wrangler.toml
   npx wrangler kv namespace create BANNED_SUBS     # paste id into wrangler.toml

   # From your Clerk / Auth0 / Supabase dashboard:
   npx wrangler secret put JWKS_URL
   # e.g. https://your-tenant.clerk.accounts.dev/.well-known/jwks.json
   npx wrangler secret put JWT_ISSUER
   # e.g. https://your-tenant.clerk.accounts.dev
   npx wrangler secret put JWT_AUDIENCE             # optional

   # Upstream credentials:
   npx wrangler secret put UPSTREAM_BASE_OPENAI     # https://api.openai.com
   npx wrangler secret put UPSTREAM_KEY_OPENAI      # sk-...

   # Optional rate-limit override (default 200/24h — higher than anonymous):
   npx wrangler secret put RATE_LIMIT_PER_DAY

   npx wrangler deploy
   ```

4. **Extension side.** In `utils/proxy-client.ts`, swap the install-id header for a bearer token:

   ```ts
   import { proxyFetch } from '@/utils/proxy-client';

   const token = await yourAuthProvider.getSessionToken();
   const resp = await proxyFetch({
     upstream: 'openai',
     path: '/v1/chat/completions',
     body: { ... },
     headers: { authorization: `Bearer ${token}` },
   });
   ```

   The factory's default `proxy-client.ts` still sends `x-cce-install-id`; when you're using the authed worker, pass `Authorization` via the `headers` parameter and the worker ignores the install-id header.

## Banning an abusive user

Same KV namespace, different key:

```bash
npx wrangler kv key put --binding BANNED_SUBS "ban:<sub>" "1"
```

Where `<sub>` is the JWT `sub` you see in the upstream's bill-spiking request logs.

## Picking between this and `proxy/`

- **Default: `proxy/`.** Most extensions are one-shot utilities; a sign-in wall is friction that hurts install conversion. Anonymous UUID + per-UUID rate limit + provider-side spend cap is enough.
- **Switch to `proxy-authed/` when:** you already need accounts (sync, history, settings-across-devices, paid tier, B2B usage) and/or you've been attacked and the soft cap isn't holding.

Don't deploy both. Pick one per extension — the extension's `proxy-client.ts` talks to exactly one proxy URL.
