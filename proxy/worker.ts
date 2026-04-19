/**
 * Credential proxy — Cloudflare Worker.
 *
 * Extension → this worker → upstream API.
 *
 * The extension holds a per-install UUID (stored in chrome.storage.local).
 * It never sees the real upstream credential. The Worker holds the real
 * credential as a secret (`wrangler secret put UPSTREAM_KEY_<name>`) and
 * rate-limits per UUID via KV.
 *
 * Why this exists:
 *   Extension bundles are public. Any credential shipped inside the .crx
 *   can be extracted by unzipping. Attackers scrape CWS for `sk-*` etc.
 *   See `docs/04-security.md` and the 2025-06 TheHackerNews writeup.
 *
 * Request shape (POST /v1/forward):
 *   headers:
 *     x-cce-install-id: <uuid v4>
 *     content-type:     application/json
 *   body (JSON):
 *     {
 *       upstream: "openai" | "anthropic" | "minimax" | ...,
 *       path:     "/v1/chat/completions",          // path on the upstream
 *       method?:  "POST" | "GET" | ...,             // default POST
 *       body?:    <json passed through verbatim>,
 *       headers?: { ... }                           // extra headers merged in
 *     }
 *
 * Response: the upstream response, streamed back verbatim.
 *
 * Configuration (Worker env bindings):
 *   RATE_LIMIT_PER_DAY          secret  — integer (default 50 if unset)
 *   UPSTREAM_BASE_<NAME>        secret  — e.g. https://api.openai.com
 *   UPSTREAM_KEY_<NAME>         secret  — bearer token; injected as
 *                                         `Authorization: Bearer $VALUE`.
 *   RATE_LIMITS                 KV ns   — counter storage for per-install UUIDs
 */

export interface Env {
  RATE_LIMITS: KVNamespace;
  RATE_LIMIT_PER_DAY?: string;
  [key: string]: unknown;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_RATE_LIMIT_PER_DAY = 50;
const WINDOW_SECONDS = 24 * 60 * 60;
const UPSTREAM_NAME_RE = /^[a-z][a-z0-9-]{0,31}$/;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function enforceRateLimit(
  env: Env,
  installId: string,
): Promise<{ ok: true } | { ok: false; resp: Response }> {
  const limit = Number(env.RATE_LIMIT_PER_DAY ?? DEFAULT_RATE_LIMIT_PER_DAY);
  const key = `rl:${installId}`;
  const raw = await env.RATE_LIMITS.get(key);
  const count = raw ? Number(raw) : 0;
  if (count >= limit) {
    return {
      ok: false,
      resp: json(429, {
        error: 'rate_limit_exceeded',
        limit,
        window_seconds: WINDOW_SECONDS,
      }),
    };
  }
  // Fire-and-forget increment. Exact accounting is fine; we're coarse-rate-limiting,
  // not billing.
  await env.RATE_LIMITS.put(key, String(count + 1), {
    expirationTtl: WINDOW_SECONDS,
  });
  return { ok: true };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
    const url = new URL(req.url);
    if (url.pathname !== '/v1/forward') return json(404, { error: 'not_found' });

    const installId = req.headers.get('x-cce-install-id') ?? '';
    if (!UUID_RE.test(installId)) {
      return json(400, { error: 'missing_or_invalid_install_id' });
    }

    const gate = await enforceRateLimit(env, installId);
    if (!gate.ok) return gate.resp;

    let payload: {
      upstream?: string;
      path?: string;
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
    };
    try {
      payload = await req.json();
    } catch {
      return json(400, { error: 'invalid_json' });
    }

    const { upstream, path } = payload;
    if (!upstream || !UPSTREAM_NAME_RE.test(upstream)) {
      return json(400, { error: 'invalid_upstream_name' });
    }
    if (!path || typeof path !== 'string' || !path.startsWith('/')) {
      return json(400, { error: 'invalid_path' });
    }

    const baseKey = `UPSTREAM_BASE_${upstream.toUpperCase().replace(/-/g, '_')}`;
    const keyKey = `UPSTREAM_KEY_${upstream.toUpperCase().replace(/-/g, '_')}`;
    const base = env[baseKey] as string | undefined;
    const credential = env[keyKey] as string | undefined;
    if (!base || !credential) {
      return json(502, {
        error: 'upstream_not_configured',
        hint: `Run: wrangler secret put ${baseKey}; wrangler secret put ${keyKey}`,
      });
    }

    const forwardUrl = new URL(path, base);
    const forwardHeaders = new Headers(payload.headers ?? {});
    forwardHeaders.set('authorization', `Bearer ${credential}`);
    if (payload.body !== undefined && !forwardHeaders.has('content-type')) {
      forwardHeaders.set('content-type', 'application/json');
    }

    const upstreamReq = new Request(forwardUrl.toString(), {
      method: payload.method ?? 'POST',
      headers: forwardHeaders,
      body: payload.body === undefined ? undefined : JSON.stringify(payload.body),
    });

    const upstreamResp = await fetch(upstreamReq);
    // Strip hop-by-hop / upstream auth echo headers before returning.
    const respHeaders = new Headers(upstreamResp.headers);
    respHeaders.delete('set-cookie');
    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  },
};

// Minimal KV typing so `tsc` is happy without @cloudflare/workers-types when
// this file is type-checked from the factory's tsconfig. Wrangler brings its
// own types in the Worker build.
declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(
      key: string,
      value: string,
      opts?: { expirationTtl?: number },
    ): Promise<void>;
  }
}
