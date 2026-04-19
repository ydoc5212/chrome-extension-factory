/**
 * Credential proxy — *authed* variant.
 *
 * Use this instead of proxy/ when your extension has user sign-in. Same
 * `POST /v1/forward` contract as proxy/, but:
 *
 *   - Instead of trusting `x-cce-install-id: <uuid>` (forgeable at infinite
 *     scale), this worker requires `Authorization: Bearer <jwt>` and verifies
 *     the JWT against a provider JWKS (Clerk, Auth0, Google, Supabase —
 *     anything with a JWKS URL).
 *   - Rate limit is keyed on the JWT `sub` claim (the provider's stable user
 *     id), not a client-generated UUID. Abusers can't mint fresh identities
 *     by clearing chrome.storage.local.
 *   - Ban list support: if an install gets abusive, add the sub to
 *     BANNED_SUBS (a KV entry with value `"1"`). Next request from that sub
 *     gets 403.
 *
 * Why two workers instead of one with a flag:
 *   - Different deps (this one needs `jose` for JWT verification).
 *   - Different configuration surface (JWKS URL, audience, issuer).
 *   - Confusion cost of mixing modes exceeds DRY savings.
 *
 * Configuration (Worker env):
 *   JWKS_URL                    secret   — e.g. https://your-tenant.clerk.accounts.dev/.well-known/jwks.json
 *   JWT_ISSUER                  secret   — expected `iss` claim (e.g. https://your-tenant.clerk.accounts.dev)
 *   JWT_AUDIENCE                secret   — optional; if set, enforced
 *   RATE_LIMIT_PER_DAY          secret   — default 200 (higher than anonymous;
 *                                           authed users are higher-trust)
 *   UPSTREAM_BASE_<NAME>        secret
 *   UPSTREAM_KEY_<NAME>         secret
 *   RATE_LIMITS                 KV ns    — per-sub counters
 *   BANNED_SUBS                 KV ns    — ban list (sub → "1")
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface Env {
  RATE_LIMITS: KVNamespace;
  BANNED_SUBS: KVNamespace;
  JWKS_URL?: string;
  JWT_ISSUER?: string;
  JWT_AUDIENCE?: string;
  RATE_LIMIT_PER_DAY?: string;
  [key: string]: unknown;
}

const DEFAULT_RATE_LIMIT_PER_DAY = 200;
const WINDOW_SECONDS = 24 * 60 * 60;
const UPSTREAM_NAME_RE = /^[a-z][a-z0-9-]{0,31}$/;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Cache JWKS resolver per Worker isolate. jose's createRemoteJWKSet already
// caches keys internally; we just avoid building the resolver object twice.
let jwksResolver: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks(env: Env): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksResolver) {
    if (!env.JWKS_URL) throw new Error('JWKS_URL not configured');
    jwksResolver = createRemoteJWKSet(new URL(env.JWKS_URL));
  }
  return jwksResolver;
}

async function verifyToken(req: Request, env: Env): Promise<
  { ok: true; sub: string } | { ok: false; resp: Response }
> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, resp: json(401, { error: 'missing_bearer_token' }) };
  if (!env.JWKS_URL || !env.JWT_ISSUER) {
    return {
      ok: false,
      resp: json(500, {
        error: 'proxy_not_configured',
        hint: 'Set JWKS_URL and JWT_ISSUER secrets',
      }),
    };
  }
  try {
    const { payload } = await jwtVerify(m[1], getJwks(env), {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) return { ok: false, resp: json(401, { error: 'token_missing_sub' }) };
    return { ok: true, sub };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid_token';
    return { ok: false, resp: json(401, { error: 'invalid_token', detail: message }) };
  }
}

async function enforceRateLimit(
  env: Env,
  sub: string,
): Promise<{ ok: true } | { ok: false; resp: Response }> {
  const banned = await env.BANNED_SUBS.get(`ban:${sub}`);
  if (banned) {
    return { ok: false, resp: json(403, { error: 'banned' }) };
  }
  const limit = Number(env.RATE_LIMIT_PER_DAY ?? DEFAULT_RATE_LIMIT_PER_DAY);
  const key = `rl:${sub}`;
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

    const verified = await verifyToken(req, env);
    if (!verified.ok) return verified.resp;

    const gate = await enforceRateLimit(env, verified.sub);
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

    const suffix = upstream.toUpperCase().replace(/-/g, '_');
    const base = env[`UPSTREAM_BASE_${suffix}`] as string | undefined;
    const credential = env[`UPSTREAM_KEY_${suffix}`] as string | undefined;
    if (!base || !credential) {
      return json(502, {
        error: 'upstream_not_configured',
        hint: `Run: wrangler secret put UPSTREAM_BASE_${suffix}; wrangler secret put UPSTREAM_KEY_${suffix}`,
      });
    }

    const forwardUrl = new URL(path, base);
    const forwardHeaders = new Headers(payload.headers ?? {});
    forwardHeaders.set('authorization', `Bearer ${credential}`);
    if (payload.body !== undefined && !forwardHeaders.has('content-type')) {
      forwardHeaders.set('content-type', 'application/json');
    }

    const upstreamResp = await fetch(forwardUrl.toString(), {
      method: payload.method ?? 'POST',
      headers: forwardHeaders,
      body: payload.body === undefined ? undefined : JSON.stringify(payload.body),
    });

    const respHeaders = new Headers(upstreamResp.headers);
    respHeaders.delete('set-cookie');
    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  },
};

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
