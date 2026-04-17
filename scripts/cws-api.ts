/**
 * Shared Chrome Web Store API helpers.
 *
 * Thin wrapper around the `chrome-webstore-upload` npm package. Exists so
 * `version-sync`, `publish-cws`, and the validator's `listing-drift` rule
 * all read from the same secret loader and the same authenticated client —
 * if one of them works, they all do.
 *
 * Opt-in pattern: every consumer calls `loadSecrets()` first and bails
 * cleanly if it returns null. The factory must stay green on a fresh clone
 * with no OAuth secrets configured.
 *
 * See docs/06-keepalive-publish.md for how to obtain the 4 secrets.
 */

import { createReadStream } from 'node:fs';
import chromeWebstoreUpload from 'chrome-webstore-upload';

export interface CwsSecrets {
  extensionId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/**
 * Item resource returned by CWS `items.get`. The documented API only
 * guarantees `id`, `publicKey`, `uploadState`, `itemError`. Some responses
 * include `crxVersion` (undocumented but observed) — callers must treat
 * that as optional.
 */
export interface CwsItemResource {
  kind?: string;
  id: string;
  publicKey?: string;
  uploadState?: 'FAILURE' | 'IN_PROGRESS' | 'NOT_FOUND' | 'SUCCESS';
  crxVersion?: string;
  itemError?: Array<{ error_code: string; error_detail: string }>;
}

export interface CwsListing {
  name?: string;
  summary?: string;
  description?: string;
  [key: string]: unknown;
}

export type PublishTarget = 'default' | 'trustedTesters';

export type PublishStatus =
  | 'OK'
  | 'NOT_AUTHORIZED'
  | 'INVALID_DEVELOPER'
  | 'DEVELOPER_NO_OWNERSHIP'
  | 'DEVELOPER_SUSPENDED'
  | 'ITEM_NOT_FOUND'
  | 'ITEM_PENDING_REVIEW'
  | 'ITEM_TAKEN_DOWN'
  | 'PUBLISHER_SUSPENDED';

export interface CwsPublishResponse {
  kind?: string;
  item_id?: string;
  status?: PublishStatus[];
  statusDetail?: string[];
}

const SECRET_NAMES: (keyof CwsSecrets)[] = [
  'extensionId',
  'clientId',
  'clientSecret',
  'refreshToken',
];

const ENV_NAME_MAP: Record<keyof CwsSecrets, string> = {
  extensionId: 'CWS_EXTENSION_ID',
  clientId: 'CWS_CLIENT_ID',
  clientSecret: 'CWS_CLIENT_SECRET',
  refreshToken: 'CWS_REFRESH_TOKEN',
};

/**
 * Read the 4 CWS secrets from process.env. Returns null if any is missing
 * or empty — callers should treat that as "no-op cleanly, factory is
 * un-configured" (NOT as an error).
 */
export function loadSecrets(): CwsSecrets | null {
  const out: Partial<CwsSecrets> = {};
  for (const key of SECRET_NAMES) {
    const envName = ENV_NAME_MAP[key];
    const value = process.env[envName];
    if (!value) return null;
    out[key] = value;
  }
  return out as CwsSecrets;
}

/**
 * Names of env vars the user must set to enable CWS API integration.
 * Exported for helpful error messages.
 */
export const SECRET_ENV_NAMES: readonly string[] = Object.values(ENV_NAME_MAP);

function client(secrets: CwsSecrets) {
  return chromeWebstoreUpload({
    extensionId: secrets.extensionId,
    clientId: secrets.clientId,
    clientSecret: secrets.clientSecret,
    refreshToken: secrets.refreshToken,
  });
}

/**
 * Exchanges the refresh token for an access token. Useful for callers that
 * need to make direct fetch() calls to CWS endpoints the library doesn't
 * wrap (e.g. the listings endpoint).
 */
export async function getAccessToken(secrets: CwsSecrets): Promise<string> {
  return client(secrets).fetchToken();
}

/**
 * Fetch the item resource from CWS. `projection` of 'PUBLISHED' returns
 * what's currently live; 'DRAFT' returns the last uploaded (possibly
 * un-published) state.
 *
 * The CWS Publish API is sparse — don't expect this to return listing
 * copy. Use `getListing` for that.
 */
export async function getItem(
  secrets: CwsSecrets,
  projection: 'DRAFT' | 'PUBLISHED' = 'PUBLISHED',
): Promise<CwsItemResource> {
  return (await client(secrets).get(projection)) as CwsItemResource;
}

/**
 * Returns the currently-live version string from CWS, or null if the API
 * response doesn't include it. The Chrome Web Store Publish API does not
 * officially expose the CRX version; we try a best-effort extraction
 * (observed field: `crxVersion`) and fall back gracefully.
 *
 * Callers should treat null as "cannot compare — proceed without blocking."
 */
export async function getPublishedVersion(
  secrets: CwsSecrets,
): Promise<string | null> {
  const item = await getItem(secrets, 'PUBLISHED');
  if (typeof item.crxVersion === 'string' && item.crxVersion.length > 0) {
    return item.crxVersion;
  }
  return null;
}

/**
 * Fetch the published listing metadata (name, summary, description) from
 * CWS. Uses the items/{id}/listings/{lang} endpoint, which exists in the
 * Publish API v1.1 but is lightly documented — callers should tolerate
 * missing fields.
 *
 * Returns null if the response is not a JSON object. Throws on auth /
 * network failures (same contract as `getItem`).
 */
export async function getListing(
  secrets: CwsSecrets,
  language = 'default',
): Promise<CwsListing | null> {
  const token = await getAccessToken(secrets);
  const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${encodeURIComponent(
    secrets.extensionId,
  )}/listings/${encodeURIComponent(language)}?projection=PUBLISHED`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2',
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      body && typeof body === 'object'
        ? JSON.stringify(body)
        : `HTTP ${response.status}`;
    throw new Error(`CWS getListing failed: ${detail}`);
  }
  if (!body || typeof body !== 'object') return null;
  return body as CwsListing;
}

/**
 * Upload a zip to CWS and (optionally) publish it.
 *
 * Returns the upload response plus — if `autoPublish` was set and the
 * upload succeeded — the publish response. Callers that want status
 * polling should pass the returned `itemId` to `pollStatus`.
 */
export async function submit(
  secrets: CwsSecrets,
  zipPath: string,
  options: { autoPublish?: boolean; target?: PublishTarget } = {},
): Promise<{
  upload: CwsItemResource;
  publish?: CwsPublishResponse;
}> {
  const { autoPublish = true, target = 'default' } = options;
  const api = client(secrets);
  const upload = (await api.uploadExisting(
    createReadStream(zipPath),
  )) as CwsItemResource;
  if (upload.uploadState === 'FAILURE') {
    return { upload };
  }
  if (!autoPublish) {
    return { upload };
  }
  const publish = (await api.publish(target)) as CwsPublishResponse;
  return { upload, publish };
}

export type TerminalState =
  | 'live'
  | 'in-review'
  | 'rejected'
  | 'failed'
  | 'timeout';

export interface PollResult {
  state: TerminalState;
  detail?: string;
  lastStatus?: PublishStatus[];
}

/**
 * Polls the item status until a terminal state is reached or timeout.
 *
 * The Chrome Web Store Publish API does not expose a rich "submission in
 * review" status — the publish() call returns immediately with either OK
 * (it's live or queued-for-review) or an error status. Polling here
 * re-reads the item resource and reports the upload state. `pollIntervalMs`
 * and `timeoutMs` let callers tune.
 *
 * Returns `live` if the ItemResource's uploadState lands on SUCCESS and
 * previous publish response was OK. Returns `in-review` if SUCCESS but
 * status included ITEM_PENDING_REVIEW. Returns `rejected` / `failed` /
 * `timeout` in the obvious cases.
 */
export async function pollStatus(
  secrets: CwsSecrets,
  initialPublish: CwsPublishResponse | undefined,
  options: { pollIntervalMs?: number; timeoutMs?: number } = {},
): Promise<PollResult> {
  const { pollIntervalMs = 30_000, timeoutMs = 15 * 60_000 } = options;
  const statusList = initialPublish?.status ?? [];
  if (statusList.includes('ITEM_PENDING_REVIEW')) {
    return {
      state: 'in-review',
      detail: initialPublish?.statusDetail?.join('; '),
      lastStatus: statusList,
    };
  }
  const nonOkStatuses = statusList.filter((s) => s !== 'OK');
  if (nonOkStatuses.length > 0) {
    return {
      state: 'rejected',
      detail: initialPublish?.statusDetail?.join('; '),
      lastStatus: statusList,
    };
  }
  const deadline = Date.now() + timeoutMs;
  // Best-effort check that the item resource transitions to SUCCESS.
  while (Date.now() < deadline) {
    const item = await getItem(secrets, 'PUBLISHED');
    if (item.uploadState === 'SUCCESS') {
      return { state: 'live', lastStatus: statusList };
    }
    if (item.uploadState === 'FAILURE') {
      return {
        state: 'failed',
        detail: (item.itemError ?? [])
          .map((e) => `${e.error_code}: ${e.error_detail}`)
          .join('; '),
        lastStatus: statusList,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return { state: 'timeout', lastStatus: statusList };
}
