# Credential proxy (Vercel Edge Function)

Drop-in alternative to `proxy/` (Cloudflare Worker). Same `POST /v1/forward` contract, same request/response shape. The extension client (`utils/proxy-client.ts`) points at whichever one you deploy.

## Deploy

1. **Vercel account + CLI.**

   ```bash
   cd proxy/vercel
   npm install
   npx vercel login
   npx vercel link
   ```

2. **Install Upstash Redis** (for rate-limit counters). From the Vercel dashboard → Marketplace → "Upstash for Redis" → Install. It auto-provisions `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as env vars on your project.

3. **Set upstream credentials.** For each upstream, add a pair of Vercel env vars:

   ```bash
   npx vercel env add UPSTREAM_BASE_OPENAI   # https://api.openai.com
   npx vercel env add UPSTREAM_KEY_OPENAI    # sk-...
   ```

4. **(Optional) tune the rate limit.** Default is 50/24h per install id.

   ```bash
   npx vercel env add RATE_LIMIT_PER_DAY     # e.g. 100
   ```

5. **Deploy.**

   ```bash
   npx vercel --prod
   ```

   Note the production URL. Paste it into the extension's proxy client. Or attach a custom domain.

## Pick Cloudflare vs Vercel

- **Cloudflare** if you want the cheapest-possible free tier and don't already have a Vercel footprint. KV is free for this workload.
- **Vercel** if you're already on Vercel (the factory's `screenshots/` subproject already is) and want one dashboard. Upstash pricing is generous but has a harder free-tier ceiling than Workers KV.

The extension code is identical in both cases — `utils/proxy-client.ts` reads `VITE_PROXY_URL` from `.env.local`, so point it at whichever proxy you deployed and rebuild the extension.

## Anti-abuse

Same layering advice as `proxy/README.md`: cap upstream spend at the provider, add HMAC proof-of-install if raided, optionally bind to `chrome.instanceID.getID()` for Google-signed per-install identity.
