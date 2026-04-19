/**
 * Bootstrap the Google Cloud side of Chrome Web Store API publishing.
 *
 * Automates the steps Google exposes programmatically:
 *   1. `gcloud` installed + authenticated
 *   2. Create a GCP project (idempotent)
 *   3. Enable `chromewebstore.googleapis.com`
 *   4. Best-effort: create an IAP OAuth brand (Workspace-only, fails
 *      silently for personal Google accounts)
 *
 * The one step that is NOT automated — creating an OAuth 2.0 Desktop
 * client ID — has no public Google API. See `docs/07-google-cloud-setup.md`
 * and the `setup-cws-credentials` skill for the handholding flow that
 * covers that part.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-gcp.ts [--project-id=<id>] [--json] [--yes]
 *
 * Flags:
 *   --project-id=<id>  Use this project ID instead of prompting.
 *   --json             Emit line-delimited JSON events (one per step) for
 *                      skill consumption. Prompts become errors instead.
 *   --yes              Skip interactive confirmation (use defaults).
 *
 * Exit codes:
 *   0 — success (all automatable steps done, or already-done)
 *   1 — recoverable failure (gcloud missing, auth failed, API call failed)
 *   2 — usage error (missing project ID in --json mode)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = resolve(import.meta.dirname, '..');
const SECRETS_PATH = resolve(ROOT, '.secrets.local.json');

const ARGS = process.argv.slice(2);
const JSON_MODE = ARGS.includes('--json');
const SKIP_PROMPTS = ARGS.includes('--yes');
const PROJECT_ARG = ARGS.find((a) => a.startsWith('--project-id='))?.split('=')[1];

type EventType =
  | 'preflight'
  | 'auth'
  | 'project'
  | 'api-enable'
  | 'oauth-brand'
  | 'done'
  | 'error';

interface Event {
  type: EventType;
  status: 'ok' | 'skipped' | 'failed' | 'created' | 'exists';
  [key: string]: unknown;
}

function emit(event: Event): void {
  if (JSON_MODE) {
    console.log(JSON.stringify(event));
    return;
  }
  const { type, status, ...rest } = event;
  const detail = Object.entries(rest)
    .filter(([k]) => k !== 'at')
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' ');
  const icon = status === 'ok' || status === 'created' || status === 'exists'
    ? '✓'
    : status === 'skipped'
      ? '·'
      : '✗';
  console.log(`${icon} [${type}] ${status}${detail ? ' — ' + detail : ''}`);
}

function fail(step: string, message: string, hint?: string): never {
  emit({ type: 'error', status: 'failed', step, message, hint });
  process.exit(1);
}

function run(
  cmd: string,
  args: string[],
  options: { allowNonZero?: boolean } = {},
): { stdout: string; stderr: string; code: number } {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  if (result.error) {
    return { stdout: '', stderr: result.error.message, code: 127 };
  }
  const code = result.status ?? 1;
  if (code !== 0 && !options.allowNonZero) {
    return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', code };
  }
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', code };
}

async function prompt(question: string, defaultValue?: string): Promise<string> {
  if (JSON_MODE) {
    fail(
      'prompt',
      'Cannot prompt in --json mode',
      'Pass --project-id=<id> explicitly',
    );
  }
  if (SKIP_PROMPTS && defaultValue !== undefined) return defaultValue;
  const rl = createInterface({ input, output });
  try {
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    const answer = await rl.question(`${question}${suffix} `);
    return answer.trim() || defaultValue || '';
  } finally {
    rl.close();
  }
}

function readSecrets(): Record<string, string> {
  if (!existsSync(SECRETS_PATH)) return {};
  try {
    const parsed = JSON.parse(readFileSync(SECRETS_PATH, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeSecrets(secrets: Record<string, string>): void {
  writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2) + '\n');
}

async function checkGcloud(): Promise<void> {
  const which = run('which', ['gcloud'], { allowNonZero: true });
  if (which.code !== 0) {
    fail(
      'preflight',
      'gcloud CLI not found on PATH',
      'Install: `brew install --cask google-cloud-sdk` (macOS) or https://cloud.google.com/sdk/docs/install',
    );
  }
  emit({ type: 'preflight', status: 'ok', gcloudPath: which.stdout.trim() });
}

async function ensureAuth(): Promise<string> {
  const list = run('gcloud', [
    'auth',
    'list',
    '--filter=status:ACTIVE',
    '--format=value(account)',
  ]);
  const account = list.stdout.trim().split('\n').filter(Boolean)[0];
  if (account) {
    emit({ type: 'auth', status: 'ok', account });
    return account;
  }
  if (JSON_MODE) {
    fail(
      'auth',
      'No active gcloud account',
      'Run `gcloud auth login` once, then re-run this script',
    );
  }
  console.log('No active gcloud account. Launching `gcloud auth login`...');
  const login = run('gcloud', ['auth', 'login', '--update-adc'], { allowNonZero: true });
  if (login.code !== 0) {
    fail('auth', `gcloud auth login failed: ${login.stderr.trim()}`);
  }
  const retry = run('gcloud', [
    'auth',
    'list',
    '--filter=status:ACTIVE',
    '--format=value(account)',
  ]);
  const newAccount = retry.stdout.trim().split('\n').filter(Boolean)[0];
  if (!newAccount) {
    fail('auth', 'Still no active account after login');
  }
  emit({ type: 'auth', status: 'ok', account: newAccount });
  return newAccount;
}

function sanitizeProjectId(raw: string): string {
  // GCP project IDs: 6-30 chars, lowercase letters/digits/hyphens, start with letter.
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  if (cleaned.length < 6) return `cws-upload-${cleaned || 'me'}`.slice(0, 30);
  return cleaned;
}

async function resolveProjectId(account: string): Promise<string> {
  if (PROJECT_ARG) return PROJECT_ARG;
  const saved = readSecrets().GCP_PROJECT_ID;
  if (saved) return saved;
  const userPart = account.split('@')[0] || 'me';
  const suggestion = sanitizeProjectId(`cws-upload-${userPart}`);
  const answer = await prompt(
    'GCP project ID (6–30 chars, lowercase/digits/hyphens, must be globally unique):',
    suggestion,
  );
  return sanitizeProjectId(answer);
}

function projectExists(projectId: string): boolean {
  const result = run(
    'gcloud',
    ['projects', 'describe', projectId, '--format=value(projectId)'],
    { allowNonZero: true },
  );
  return result.code === 0 && result.stdout.trim() === projectId;
}

async function ensureProject(projectId: string): Promise<void> {
  if (projectExists(projectId)) {
    emit({ type: 'project', status: 'exists', projectId });
    return;
  }
  const create = run(
    'gcloud',
    ['projects', 'create', projectId, '--name=CWS Upload'],
    { allowNonZero: true },
  );
  if (create.code !== 0) {
    fail(
      'project',
      `gcloud projects create failed: ${create.stderr.trim() || create.stdout.trim()}`,
      'Project IDs are globally unique — try a different ID, or check your org policies',
    );
  }
  emit({ type: 'project', status: 'created', projectId });
}

async function enableCwsApi(projectId: string): Promise<void> {
  const result = run(
    'gcloud',
    [
      'services',
      'enable',
      'chromewebstore.googleapis.com',
      `--project=${projectId}`,
    ],
    { allowNonZero: true },
  );
  if (result.code !== 0) {
    fail(
      'api-enable',
      `Failed to enable chromewebstore.googleapis.com: ${result.stderr.trim()}`,
      'Ensure your account has serviceusage.services.enable on the project',
    );
  }
  emit({
    type: 'api-enable',
    status: 'ok',
    service: 'chromewebstore.googleapis.com',
  });
}

async function tryCreateOAuthBrand(projectId: string, account: string): Promise<void> {
  // IAP OAuth brand creation is Workspace-internal only. For personal
  // Google accounts it fails with PERMISSION_DENIED or INVALID_ARGUMENT.
  // We attempt it anyway because it's idempotent and harmless — if it
  // works, we skip one manual step.
  const result = run(
    'gcloud',
    [
      'iap',
      'oauth-brands',
      'create',
      `--application_title=CWS Upload`,
      `--support_email=${account}`,
      `--project=${projectId}`,
    ],
    { allowNonZero: true },
  );
  if (result.code === 0) {
    emit({ type: 'oauth-brand', status: 'created' });
    return;
  }
  // Check if a brand already exists.
  const list = run(
    'gcloud',
    ['iap', 'oauth-brands', 'list', `--project=${projectId}`, '--format=value(name)'],
    { allowNonZero: true },
  );
  if (list.code === 0 && list.stdout.trim()) {
    emit({ type: 'oauth-brand', status: 'exists' });
    return;
  }
  emit({
    type: 'oauth-brand',
    status: 'skipped',
    reason: 'IAP brand creation requires Google Workspace; fine for personal accounts — configure via console',
  });
}

async function main(): Promise<void> {
  await checkGcloud();
  const account = await ensureAuth();
  const projectId = await resolveProjectId(account);
  if (!projectId) fail('project', 'No project ID provided');
  await ensureProject(projectId);
  await enableCwsApi(projectId);
  await tryCreateOAuthBrand(projectId, account);

  const secrets = readSecrets();
  secrets.GCP_PROJECT_ID = projectId;
  writeSecrets(secrets);

  const consoleUrl = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;
  emit({
    type: 'done',
    status: 'ok',
    projectId,
    account,
    consoleUrl,
    nextStep: 'Create an OAuth 2.0 Client ID (Desktop app type) at the consoleUrl — no Google API exists for this step',
  });
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  fail('unknown', message);
});
