# Credential proxy (Cloudflare Worker)

The factory refuses to ship bundles with credentials in them (see validator rule `no-bundled-credentials`). This worker is how an extension talks to a third-party API without shipping its keys. The extension sends a per-install UUID; the worker holds the real key as a Cloudflare secret, rate-limits per UUID, and forwards the request.

**Request shape (single endpoint, `POST /v1/forward`):**

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

## Deploy

One-time setup (takes ~10 minutes):

1. **Cloudflare account + wrangler.** Sign up at [dash.cloudflare.com](https://dash.cloudflare.com). Then, from this directory:

   ```bash
   cd proxy
   npm install
   npx wrangler login
   ```

2. **Create the rate-limit KV namespace.** Once, per environment:

   ```bash
   npx wrangler kv:namespace create RATE_LIMITS
   ```

   Paste the returned `id` into `wrangler.toml` (replace `REPLACE_ME_WITH_KV_NAMESPACE_ID`).

3. **Set your upstream secrets.** For each upstream the extension needs, set a `UPSTREAM_BASE_<NAME>` and `UPSTREAM_KEY_<NAME>` pair. `<NAME>` is free-form; the extension passes it as `upstream` in the request body. Example for OpenAI:

   ```bash
   npx wrangler secret put UPSTREAM_BASE_OPENAI
   # paste: https://api.openai.com
   npx wrangler secret put UPSTREAM_KEY_OPENAI
   # paste: sk-...
   ```

   For Anthropic, MiniMax, Gemini, etc., add more pairs (`UPSTREAM_BASE_ANTHROPIC`, `UPSTREAM_KEY_ANTHROPIC`, …). One deployed worker can serve all upstreams.

4. **(Optional) tune the rate limit.** Default is 50 requests per install per 24h. Tighten or loosen with:

   ```bash
   npx wrangler secret put RATE_LIMIT_PER_DAY
   # paste: 100    (or 20, or whatever)
   ```

5. **Deploy.**

   ```bash
   npx wrangler deploy
   ```

   Note the `*.workers.dev` URL that wrangler prints. Paste it into the extension's `utils/proxy-client.ts` (or equivalent env var). Or point a custom domain at the worker via the Cloudflare dashboard.

## Cost

- Workers free tier: 100k requests/day. Typical extension usage is well under this for MVP.
- KV: free reads for rate-limit counters, effectively zero cost.
- Paid tier is $5/month after 10M requests.

## Anti-abuse — layer as you grow

V1 (what this ships): per-install UUID + rolling 24h rate limit. Enough to cap casual abuse. Someone generating UUIDs in a loop bypasses the cap, so:

- Cap your upstream-account spend (OpenAI, Anthropic, etc. all support hard monthly budget caps — set one). Non-negotiable.
- If you get raided: add a proof-of-install HMAC token (the extension POSTs once, gets a signed 24h token back, replays on subsequent requests). The worker secret signs, the extension just stores. Stops casual script-kiddie-level abuse.
- One level up: bind to `chrome.instanceID.getID()` (a Google-signed per-install token). Still anonymous, but Google's signature is the trust root.

## Alternative: Vercel Edge Function

A drop-in alternative lives at `proxy/vercel/`. Same request/response contract; rate limiting via Upstash Redis instead of Workers KV. Pick one; the extension client code is identical.

## Why this design

- Single endpoint, request body carries the upstream path. One worker serves every upstream the extension talks to; adding a new API is a `wrangler secret put` pair, not a code change.
- Per-install UUID, not per-user auth. Extensions ship anonymous-to-anonymous — a login flow is the extension's responsibility, not the proxy's.
- Rate limit is strict per-install but rolling. A run-up in one 24h window doesn't strand the user forever.
- No request/response logging. The proxy is a forwarder. If you want observability, wire Cloudflare AI Gateway in front — it's free and OpenAI-compatible, so nothing changes in this worker.
