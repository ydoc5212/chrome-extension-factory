/**
 * Client for the credential proxy.
 *
 * Never call third-party APIs directly from the extension — any credential
 * that lands in the built bundle is public (the validator's
 * `no-bundled-credentials` rule will flag it). Route calls through a proxy
 * you deploy; see `proxy/README.md`.
 *
 * Usage:
 *   const resp = await proxyFetch({
 *     upstream: 'openai',
 *     path: '/v1/chat/completions',
 *     body: { model: 'gpt-4o-mini', messages: [...] },
 *   });
 *   const data = await resp.json();
 *
 * Errors:
 *   try {
 *     const resp = await proxyFetch({ ... });
 *   } catch (e) {
 *     if (e instanceof ProxyError) {
 *       // e.kind: 'not-configured' | 'network' | 'rate-limited' | 'upstream' | 'unknown'
 *       // e.status, e.retryAfterMs, e.body
 *     }
 *   }
 *
 * Configuration: set VITE_PROXY_URL in `.env.local` (WXT picks it up at build
 * time). Example: VITE_PROXY_URL=https://your-worker.workers.dev
 */

const INSTALL_ID_KEY = 'cce-install-id';
const PROXY_URL =
  (import.meta as { env?: { VITE_PROXY_URL?: string } }).env?.VITE_PROXY_URL ??
  '';

export interface ProxyFetchInit {
  /** Logical upstream name (matches UPSTREAM_BASE_<NAME>/UPSTREAM_KEY_<NAME> on the proxy). */
  upstream: string;
  /** Path on the upstream, e.g. '/v1/chat/completions'. */
  path: string;
  /** HTTP method. Defaults to POST. */
  method?: string;
  /** JSON-serializable body. */
  body?: unknown;
  /** Extra headers to forward (Authorization is set by the proxy). */
  headers?: Record<string, string>;
  /**
   * Retry policy for transient failures (rate limits, network errors, 5xx).
   * Defaults:
   *   maxAttempts=3, baseBackoffMs=500, maxBackoffMs=10_000
   * Set `maxAttempts: 1` to disable retries.
   */
  retry?: RetryOptions;
}

export interface RetryOptions {
  /** Including the initial attempt. Default 3. */
  maxAttempts?: number;
  /** Base backoff in ms, doubled each attempt. Default 500. */
  baseBackoffMs?: number;
  /** Cap on per-sleep. Default 10_000. */
  maxBackoffMs?: number;
  /**
   * Statuses that should be retried. Defaults to 429 + 5xx.
   * 4xx (other than 429) surface to the caller — they're config/auth bugs,
   * not transient.
   */
  retryableStatuses?: ReadonlySet<number>;
}

const DEFAULT_RETRY: Required<Omit<RetryOptions, 'retryableStatuses'>> & {
  retryableStatuses: ReadonlySet<number>;
} = {
  maxAttempts: 3,
  baseBackoffMs: 500,
  maxBackoffMs: 10_000,
  retryableStatuses: new Set([429, 500, 502, 503, 504]),
};

export type ProxyErrorKind =
  | 'not-configured'
  | 'network'
  | 'rate-limited'
  | 'upstream'
  | 'unknown';

export class ProxyError extends Error {
  readonly kind: ProxyErrorKind;
  readonly status?: number;
  readonly retryAfterMs?: number;
  readonly body?: unknown;

  constructor(
    kind: ProxyErrorKind,
    message: string,
    opts: { status?: number; retryAfterMs?: number; body?: unknown; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'ProxyError';
    this.kind = kind;
    this.status = opts.status;
    this.retryAfterMs = opts.retryAfterMs;
    this.body = opts.body;
    if (opts.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = opts.cause;
    }
  }
}

let cachedInstallId: string | null = null;

export async function getInstallId(): Promise<string> {
  if (cachedInstallId) return cachedInstallId;
  const stored = await browser.storage.local.get(INSTALL_ID_KEY);
  let id = stored[INSTALL_ID_KEY] as string | undefined;
  if (!id) {
    id = crypto.randomUUID();
    await browser.storage.local.set({ [INSTALL_ID_KEY]: id });
  }
  cachedInstallId = id;
  return id;
}

/**
 * Parse `Retry-After` header (seconds or HTTP-date) into ms from now.
 * The proxies' 429 body also carries `window_seconds` as a fallback signal.
 */
function parseRetryAfter(resp: Response, body: unknown): number | undefined {
  const header = resp.headers.get('retry-after');
  if (header) {
    const asInt = Number(header);
    if (Number.isFinite(asInt) && asInt >= 0) return asInt * 1000;
    const asDate = Date.parse(header);
    if (Number.isFinite(asDate)) {
      const delta = asDate - Date.now();
      return delta > 0 ? delta : 0;
    }
  }
  if (body && typeof body === 'object' && 'window_seconds' in body) {
    const w = (body as { window_seconds?: unknown }).window_seconds;
    if (typeof w === 'number' && w > 0) return w * 1000;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function readBodySafe(resp: Response): Promise<unknown> {
  try {
    const clone = resp.clone();
    const text = await clone.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

export async function proxyFetch(init: ProxyFetchInit): Promise<Response> {
  if (!PROXY_URL) {
    throw new ProxyError(
      'not-configured',
      'VITE_PROXY_URL is not set. Deploy proxy/ (or proxy/vercel/) and set VITE_PROXY_URL in .env.local.',
    );
  }
  const retry = { ...DEFAULT_RETRY, ...(init.retry ?? {}) };
  const installId = await getInstallId();
  const url = `${PROXY_URL.replace(/\/$/, '')}/v1/forward`;

  const payload = JSON.stringify({
    upstream: init.upstream,
    path: init.path,
    method: init.method,
    body: init.body,
    headers: init.headers,
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= retry.maxAttempts; attempt++) {
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-cce-install-id': installId,
        },
        body: payload,
      });
    } catch (err) {
      lastError = err;
      if (attempt === retry.maxAttempts) {
        throw new ProxyError('network', `Proxy fetch failed: ${(err as Error)?.message ?? String(err)}`, {
          cause: err,
        });
      }
      await sleep(backoff(retry, attempt));
      continue;
    }

    if (resp.ok) return resp;

    if (!retry.retryableStatuses.has(resp.status) || attempt === retry.maxAttempts) {
      const body = await readBodySafe(resp);
      const retryAfterMs = parseRetryAfter(resp, body);
      const kind: ProxyErrorKind = resp.status === 429 ? 'rate-limited' : 'upstream';
      throw new ProxyError(kind, `Proxy returned ${resp.status}`, {
        status: resp.status,
        retryAfterMs,
        body,
      });
    }

    const body = await readBodySafe(resp);
    const serverWait = parseRetryAfter(resp, body);
    await sleep(Math.min(serverWait ?? backoff(retry, attempt), retry.maxBackoffMs));
  }

  throw new ProxyError(
    'unknown',
    'Proxy fetch exhausted retries without response',
    { cause: lastError },
  );
}

function backoff(
  retry: Required<Omit<RetryOptions, 'retryableStatuses'>>,
  attempt: number,
): number {
  // Exponential with full jitter — avoids thundering-herd on shared rate limits.
  const exp = retry.baseBackoffMs * 2 ** (attempt - 1);
  const capped = Math.min(exp, retry.maxBackoffMs);
  return Math.random() * capped;
}
