/**
 * Credential proxy — Vercel Edge Function alternative.
 *
 * Same request/response contract as proxy/worker.ts (Cloudflare). Use one or
 * the other; the extension-side client (utils/proxy-client.ts) doesn't care.
 *
 * Rate limiting uses Upstash Redis via the Vercel Marketplace integration.
 * Install it once from the Vercel dashboard: it auto-provisions
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 *
 * Configure upstream credentials as Vercel environment variables:
 *   UPSTREAM_BASE_<NAME>   e.g. https://api.openai.com
 *   UPSTREAM_KEY_<NAME>    the real bearer token
 *   RATE_LIMIT_PER_DAY     optional, default 50
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const config = { runtime: 'edge' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UPSTREAM_NAME_RE = /^[a-z][a-z0-9-]{0,31}$/;

function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const LIMIT_PER_DAY = envNum('RATE_LIMIT_PER_DAY', 50);

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(LIMIT_PER_DAY, '24 h'),
  analytics: false,
  prefix: 'cce',
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const installId = req.headers.get('x-cce-install-id') ?? '';
  if (!UUID_RE.test(installId)) {
    return json(400, { error: 'missing_or_invalid_install_id' });
  }

  const { success, limit } = await ratelimit.limit(installId);
  if (!success) {
    return json(429, {
      error: 'rate_limit_exceeded',
      limit,
      window_seconds: 24 * 60 * 60,
    });
  }

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
  const base = process.env[`UPSTREAM_BASE_${suffix}`];
  const credential = process.env[`UPSTREAM_KEY_${suffix}`];
  if (!base || !credential) {
    return json(502, {
      error: 'upstream_not_configured',
      hint: `Set env vars UPSTREAM_BASE_${suffix} and UPSTREAM_KEY_${suffix} in the Vercel dashboard.`,
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
}
