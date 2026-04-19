# Credential proxy (Cloudflare Worker)

The factory refuses to ship bundles with credentials in them (validator rule `no-bundled-credentials`). This worker is how an extension talks to a third-party API without shipping its keys.

**Extension → this worker → upstream API.** The extension sends a per-install UUID; the worker holds the real key as a Cloudflare secret, rate-limits per UUID, forwards the request.

> If your extension has user sign-in, use `proxy-authed/` instead — it verifies a JWT from Clerk/Auth0/Supabase/Google and rate-limits per real user. Same `/v1/forward` contract; different identity model.

## Fastest path — one command

From the factory root:

```bash
npm run setup:proxy
```

That script mirrors `setup:cws` — it handles wrangler login, creates the KV namespace, writes its id into `wrangler.toml`, prompts for each upstream's base URL + key, runs `wrangler deploy`, and writes `VITE_PROXY_URL` into `.env.local`. You're done in about two minutes if you already have a Cloudflare account.

Or click the button if you'd rather fork-and-deploy:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/REPLACE/WITH-YOUR-REPO)

(Replace the URL with your factory fork after pushing — Cloudflare's Deploy button clones from the URL you hand it.)

## Request shape

Single endpoint: `POST /v1/forward`.

```
headers:
  x-cce-install-id: <uuid v4>
  content-type:     application/json
body:
  { "upstream": "openai",
    "path":     "/v1/chat/completions",
    "method":   "POST",
    "body":     { ...payload your upstream expects... } }
```

Response is the upstream response, streamed back verbatim.

## Manual deploy (if the automation isn't right for you)

1. **Cloudflare account + wrangler.** Sign up at [dash.cloudflare.com](https://dash.cloudflare.com). Then:

   ```bash
   cd proxy
   npm install
   npx wrangler login
   ```

2. **Create the rate-limit KV namespace:**

   ```bash
   npx wrangler kv namespace create RATE_LIMITS
   ```

   Paste the returned `id` into `wrangler.toml` (replace `REPLACE_ME_WITH_KV_NAMESPACE_ID`).

3. **Set upstream credentials.** For each upstream, set a `UPSTREAM_BASE_<NAME>` / `UPSTREAM_KEY_<NAME>` pair. `<NAME>` is free-form; the extension passes it as `upstream` in the request body.

   ```bash
   npx wrangler secret put UPSTREAM_BASE_OPENAI    # paste: https://api.openai.com
   npx wrangler secret put UPSTREAM_KEY_OPENAI     # paste: sk-...
   ```

   For Anthropic, MiniMax, Gemini, etc., add more pairs. One deployed worker can serve all upstreams.

4. **(Optional) tune the rate limit.** Default is 50/24h per install.

   ```bash
   npx wrangler secret put RATE_LIMIT_PER_DAY      # paste: 100 or 20 or whatever
   ```

5. **Deploy:**

   ```bash
   npx wrangler deploy
   ```

   Note the `*.workers.dev` URL. Set `VITE_PROXY_URL` to it in `.env.local` at the factory root.

## Optional: chain through Cloudflare AI Gateway

AI Gateway sits between this worker and the upstream. You get free caching, logging, analytics, and upstream failover — without giving up per-UUID rate limiting (this worker keeps doing that). It's a one-line change: point `UPSTREAM_BASE_<NAME>` at `https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/<provider>` instead of the provider's direct API. See [AI Gateway docs](https://developers.cloudflare.com/ai-gateway/).

## Cost

- Workers free tier: 100k requests/day.
- KV free reads for rate-limit counters.
- Paid: $5/month after 10M requests.

## Spend cap at the provider (non-negotiable)

Even with the proxy, cap your monthly spend at the upstream (OpenAI, Anthropic, MiniMax, Google all support hard budget caps). That is the only defense when a determined attacker mints fresh UUIDs in a loop. The UUID + rate limit here caps casual abuse; the provider-side cap caps worst case.

## Anti-abuse — layer as you grow

V1: per-install UUID + rolling 24h rate limit. If you get seriously attacked:

- Add a proof-of-install HMAC token (worker secret signs on first request, extension replays for 24h).
- Bind to `chrome.instanceID.getID()` (Google-signed per-install token).
- Switch to `proxy-authed/` and require real accounts.

## Alternative runtime

A Vercel Edge Function version lives at `proxy/vercel/`. Same contract, Upstash Redis for the counter instead of Workers KV. Pick one.
