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
}

function randomUuidV4(): string {
  return crypto.randomUUID();
}

let cachedInstallId: string | null = null;

export async function getInstallId(): Promise<string> {
  if (cachedInstallId) return cachedInstallId;
  const stored = await browser.storage.local.get(INSTALL_ID_KEY);
  let id = stored[INSTALL_ID_KEY] as string | undefined;
  if (!id) {
    id = randomUuidV4();
    await browser.storage.local.set({ [INSTALL_ID_KEY]: id });
  }
  cachedInstallId = id;
  return id;
}

export async function proxyFetch(init: ProxyFetchInit): Promise<Response> {
  if (!PROXY_URL) {
    throw new Error(
      'proxyFetch: VITE_PROXY_URL is not set. Deploy proxy/ (or proxy/vercel/) and set VITE_PROXY_URL in .env.local.',
    );
  }
  const installId = await getInstallId();
  return fetch(`${PROXY_URL.replace(/\/$/, '')}/v1/forward`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-cce-install-id': installId,
    },
    body: JSON.stringify(init),
  });
}
