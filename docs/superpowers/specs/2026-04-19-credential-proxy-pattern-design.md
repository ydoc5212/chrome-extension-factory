# Credential proxy pattern — no keys in the bundle

**Status:** approved 2026-04-19. Implementation in progress on `feat/proxy-pattern`.

## Problem

Chrome extensions that talk to third-party APIs (LLMs, analytics, geocoding) frequently bundle credentials into the extension build. The factory teaches exactly this anti-pattern today — `docs/04-security.md` and `scripts/inject-secrets.ts` describe a build-time placeholder-replacement flow that bakes real keys into `.output/chrome-mv3/*.js`.

Extension bundles are trivially unpacked. Attackers scrape the CWS store for `sk-*` and similar strings at scale. The June 2025 public writeup (TheHackerNews) lists household-name extensions caught doing this: Avast Online Security (7M users, leaked GA4 secret), AVG Online Security (600K), Watch2Gether (1M, Tenor), Trust Wallet (fiat-ramps), Browsec VPN (6M). The blast radius for a leaked LLM key is a billed-against account.

## Principle

Same as the rest of the factory: encode the rule as a gate that fails loud, not as prose a contributor is expected to remember. No credentials in the built bundle — ever — enforced by the validator. Paired with a proxy scaffold that makes the right thing easy.

## Architecture

**Four pieces, one PR:**

### 1. Validator rule: `no-bundled-credentials`

- Structural rule (always runs, including CI). Error severity.
- Scans built `.output/chrome-mv3/` for credential patterns:
  - OpenAI / Anthropic: `sk-[A-Za-z0-9_-]{20,}` and `sk-ant-[A-Za-z0-9_-]{20,}`
  - Google API keys: `AIza[0-9A-Za-z_-]{35}`
  - Slack tokens: `xox[baprs]-[0-9A-Za-z-]{20,}`
  - GitHub tokens: `gh[pousr]_[A-Za-z0-9]{36}`
  - AWS access key ids: `AKIA[0-9A-Z]{16}`
  - Stripe live keys: `sk_live_[A-Za-z0-9]{24,}`
  - Generic JWT-ish bearer: long `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` literals in hardcoded string contexts (warn, not error — too many false positives for dev tokens)
- Because the rule runs on the *built bundle*, it catches credentials regardless of how they got there. No privileged knowledge of `inject-secrets.ts`.
- Rule id is public API: `no-bundled-credentials`.

### 2. `proxy/` subproject — Cloudflare Worker (default)

- Parallel to existing `screenshots/` and `video/` subprojects.
- Single endpoint: `POST /v1/forward`.
- Request shape:
  - Header `x-cce-install-id: <uuid>` (per-install token generated client-side)
  - Body: `{ upstream: string, path: string, method?: string, body?: unknown, headers?: Record<string,string> }`
- Worker:
  - Validates install id is a well-formed UUID.
  - Rate-limits per install id via Workers KV. Default **50 requests / 24h rolling window**. Tunable via `wrangler secret put RATE_LIMIT_PER_DAY` (single env var; matches user's ship-the-default-reassess-later posture).
  - Forwards to `UPSTREAM_BASE_<upstream>` (e.g. `UPSTREAM_BASE_OPENAI=https://api.openai.com`), injecting `Authorization: Bearer $UPSTREAM_KEY_<upstream>` from Worker secrets.
  - Streams the response back.
- Supports multiple upstreams (openai, anthropic, minimax, gemini, …) via `UPSTREAM_BASE_*` / `UPSTREAM_KEY_*` pairs. One deployed Worker can serve an extension that talks to several APIs.
- ~120 LOC. `proxy/wrangler.toml`, `proxy/worker.ts`, `proxy/package.json`, `proxy/README.md`.

### 3. `proxy/vercel/` — Vercel Edge Function alternative

- Same request/response contract.
- `proxy/vercel/api/forward.ts` (Edge runtime) + `proxy/vercel/vercel.json` + `proxy/vercel/README.md`.
- Rate limiting via Upstash Redis (`@upstash/ratelimit`) — the canonical pattern Vercel docs reference.
- Documented as a drop-in alternative for users who prefer Vercel (matches `screenshots/` ecosystem).

### 4. `utils/proxy-client.ts` — extension-side helper

- Auto-imported by WXT (lives in `utils/`).
- API: `proxyFetch({ upstream, path, body?, method?, headers? })` → `Promise<Response>`.
- Reads proxy base URL from `import.meta.env.VITE_PROXY_URL` (or a single `proxy-config.ts` that mirrors the screenshots/video pattern).
- Generates a UUID v4 on first call into `chrome.storage.local['cce-install-id']`; reuses on subsequent calls.
- Sends `x-cce-install-id` header with every request.

### 5. Retire `scripts/inject-secrets.ts`; rewrite `docs/04-security.md`

- Delete the script and any npm wiring.
- Remove the `.secrets.local.json.example` placeholder if it exists, or repurpose it for non-credential config only with a loud comment.
- Rewrite `docs/04-security.md`: lead with "never bundle credentials", cite the 2025 writeups, present the proxy pattern as the answer, link `proxy/README.md` for deploy steps.
- Delete the `.gitattributes` clean/smudge section — it's a bandaid on top of the wrong pattern.

## Non-goals

- **Identity-bound auth** (Google sign-in, etc.). The proxy is anonymous-UUID auth, good enough for rate-limiting abuse. Users who need identity can layer it in their own extension; the factory doesn't ship a login flow.
- **Abuse defense beyond rate limits.** Proof-of-install HMAC tokens and `chrome.instanceID.getID()` attestation are mentioned as "layer on later if you get raided," but not shipped in v1.
- **Billing / plan tiers.** Out of scope.
- **Backwards compat.** No factory extension has shipped using the old inject-secrets pattern; clean break.

## Rate-limit default — the "unclear" question

User answered "unclear" on the default. Choice: **50 req / 24h rolling, per install id, env-tunable.** Rationale:
- User's own research suggested 20–50/day for a free tier.
- 50 is enough for meaningful use of a summarizer / analyzer extension; too low for casual abuse to matter if it leaks.
- Env-var override means tightening or loosening is `wrangler secret put` away — no code change.
- Documented in `proxy/README.md` under "tuning."

## Validator test update

`scripts/__tests__/validator-snapshot.ts`:
- Structural `rulesRun`: 14 → **15**.
- Structural errors on factory: 0 → 0 (factory has no bundled credentials, by construction).
- Ship `rulesRun`: 19 → **20**.
- Ship errors unchanged at 6 (the new rule passes on the factory).

No new ship-mode expected-error enters the snapshot.

## File inventory

**New:**
- `proxy/worker.ts`
- `proxy/wrangler.toml`
- `proxy/package.json`
- `proxy/README.md`
- `proxy/vercel/api/forward.ts`
- `proxy/vercel/vercel.json`
- `proxy/vercel/package.json`
- `proxy/vercel/README.md`
- `utils/proxy-client.ts`
- `docs/superpowers/specs/2026-04-19-credential-proxy-pattern-design.md` (this file)

**Modified:**
- `scripts/validate-cws.ts` — add `noBundledCredentials` rule function, add to `STRUCTURAL_RULES`.
- `scripts/__tests__/validator-snapshot.ts` — bump structural/ship `rulesRun` counts.
- `docs/04-security.md` — rewrite.
- `ARCHITECTURE.md` — mention the proxy subproject under "Division of labor" and "Planned extensions" (mark done).
- `CLAUDE.md` — add a one-liner under Key files.
- `.gitignore` — add `proxy/node_modules`, `proxy/.wrangler`.
- `package.json` — no change; proxy is its own subproject with its own install flow.

**Deleted:**
- `scripts/inject-secrets.ts`
- `.secrets.local.json.example` (if present)

## Out of scope for this PR — followups tracked

- A `/cws-proxy` skill that walks users through deploy and `proxy-client.ts` wiring. V1 ships as docs + scaffold; skill can follow.
- A validator rule that flags `fetch('https://api.openai.com/...')` (direct upstream calls) as a warn — "you probably want proxyFetch." Secondary signal; current `no-bundled-credentials` already catches the concrete harm.
