/**
 * Bootstrap the credential proxy Cloudflare Worker.
 *
 * Takes the user from "fresh `proxy/` subproject" to "deployed Worker URL
 * in `.env.local`" without manual file edits. Mirrors
 * `scripts/bootstrap-gcp.ts` in shape: `run()` wraps spawn, `emit()` speaks
 * human or `--json`, `fail()` exits with a hint.
 *
 * What it does (each step is idempotent):
 *   1. `wrangler` installed + authenticated
 *   2. Create the RATE_LIMITS KV namespace, write its id into wrangler.toml
 *   3. Prompt for each upstream's base URL + key, run `wrangler secret put`
 *      for each
 *   4. Prompt for RATE_LIMIT_PER_DAY override (optional)
 *   5. `wrangler deploy`
 *   6. Write VITE_PROXY_URL=<deployed-url> into `.env.local`
 *
 * Usage:
 *   npm run setup:proxy
 *   npx tsx scripts/setup-proxy.ts [--upstream=<name>] [--yes] [--json]
 *
 * Flags:
 *   --upstream=<name>  Configure this upstream non-interactively. Repeat for
 *                      multiple. Prompts for base URL and key for each.
 *   --yes              Accept defaults (no RATE_LIMIT_PER_DAY override, etc.)
 *   --json             Emit line-delimited JSON events for skill consumers.
 *                      Prompts become errors in this mode.
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = resolve(import.meta.dirname, '..');
const PROXY_DIR = resolve(ROOT, 'proxy');
const WRANGLER_TOML = resolve(PROXY_DIR, 'wrangler.toml');
const ENV_LOCAL = resolve(ROOT, '.env.local');

const ARGS = process.argv.slice(2);
const JSON_MODE = ARGS.includes('--json');
const SKIP_PROMPTS = ARGS.includes('--yes');
const UPSTREAM_ARGS = ARGS.filter((a) => a.startsWith('--upstream='))
  .map((a) => a.split('=')[1])
  .filter((s): s is string => Boolean(s));

type EventType =
  | 'preflight'
  | 'auth'
  | 'kv'
  | 'wrangler-toml'
  | 'secret'
  | 'rate-limit'
  | 'deploy'
  | 'env-local'
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
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' ');
  const icon =
    status === 'ok' || status === 'created' || status === 'exists'
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
  options: { cwd?: string; input?: string; allowNonZero?: boolean } = {},
): { stdout: string; stderr: string; code: number } {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: 'utf8',
  });
  if (result.error) {
    return { stdout: '', stderr: result.error.message, code: 127 };
  }
  const code = result.status ?? 1;
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', code };
}

async function prompt(question: string, defaultValue?: string): Promise<string> {
  if (JSON_MODE) {
    fail('prompt', 'Cannot prompt in --json mode', 'Pass all values via flags');
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

async function promptSecret(question: string): Promise<string> {
  // Not truly hidden — TTY echo-off isn't portable enough to bother.
  // `wrangler secret put` hides its own input anyway, but we need the value
  // *before* calling wrangler so we can pipe it in. Accept visible input here;
  // the shell history is the risk the user was already taking.
  if (JSON_MODE) {
    fail('prompt', 'Cannot prompt in --json mode', 'Pass all values via flags');
  }
  const rl = createInterface({ input, output });
  try {
    return (await rl.question(`${question} `)).trim();
  } finally {
    rl.close();
  }
}

function ensureWrangler(): void {
  const which = run('which', ['wrangler'], { allowNonZero: true });
  if (which.code === 0) {
    emit({ type: 'preflight', status: 'ok', wrangler: which.stdout.trim() });
    return;
  }
  // Fall back to npx — works even if wrangler isn't globally installed,
  // because proxy/package.json lists it.
  emit({
    type: 'preflight',
    status: 'ok',
    wrangler: 'npx (via proxy/package.json)',
  });
}

function wranglerCmd(): [string, string[]] {
  const which = run('which', ['wrangler'], { allowNonZero: true });
  if (which.code === 0) return ['wrangler', []];
  return ['npx', ['--yes', 'wrangler']];
}

function ensureAuth(): void {
  const [cmd, prefix] = wranglerCmd();
  const whoami = run(cmd, [...prefix, 'whoami'], {
    cwd: PROXY_DIR,
    allowNonZero: true,
  });
  if (whoami.code === 0 && /associated with the email/i.test(whoami.stdout)) {
    emit({
      type: 'auth',
      status: 'ok',
      account: whoami.stdout.match(/[\w.-]+@[\w.-]+/)?.[0] ?? 'authenticated',
    });
    return;
  }
  if (JSON_MODE) {
    fail(
      'auth',
      'Not logged in to Cloudflare',
      'Run `npx wrangler login` in an interactive terminal first',
    );
  }
  emit({ type: 'auth', status: 'skipped', note: 'running `wrangler login`' });
  const login = spawnSync(cmd, [...prefix, 'login'], {
    cwd: PROXY_DIR,
    stdio: 'inherit',
  });
  if ((login.status ?? 1) !== 0) {
    fail('auth', 'wrangler login failed', 'Retry manually from proxy/');
  }
  emit({ type: 'auth', status: 'ok', account: 'authenticated' });
}

function ensureKvNamespace(): string {
  const toml = readFileSync(WRANGLER_TOML, 'utf8');
  const existing = toml.match(/id\s*=\s*"([a-f0-9]{32})"/);
  if (existing) {
    emit({ type: 'kv', status: 'exists', id: existing[1] });
    return existing[1];
  }
  const [cmd, prefix] = wranglerCmd();
  const create = run(
    cmd,
    [...prefix, 'kv', 'namespace', 'create', 'RATE_LIMITS'],
    { cwd: PROXY_DIR },
  );
  if (create.code !== 0) {
    fail(
      'kv',
      `KV namespace create failed: ${create.stderr.trim() || create.stdout.trim()}`,
      'Retry manually: cd proxy && npx wrangler kv namespace create RATE_LIMITS',
    );
  }
  const idMatch = create.stdout.match(/id\s*=\s*"([a-f0-9]{32})"/);
  if (!idMatch) {
    fail(
      'kv',
      'Could not parse KV namespace id from wrangler output',
      `Check output manually:\n${create.stdout}`,
    );
  }
  const updated = toml.replace(/REPLACE_ME_WITH_KV_NAMESPACE_ID/, idMatch[1]);
  writeFileSync(WRANGLER_TOML, updated);
  emit({ type: 'wrangler-toml', status: 'ok', kvId: idMatch[1] });
  emit({ type: 'kv', status: 'created', id: idMatch[1] });
  return idMatch[1];
}

function putSecret(name: string, value: string): void {
  const [cmd, prefix] = wranglerCmd();
  // `wrangler secret put` reads the value from stdin when stdin is not a TTY.
  const res = run(cmd, [...prefix, 'secret', 'put', name], {
    cwd: PROXY_DIR,
    input: value + '\n',
  });
  if (res.code !== 0) {
    fail(
      'secret',
      `Failed to set ${name}: ${res.stderr.trim() || res.stdout.trim()}`,
      `Retry manually: cd proxy && echo "<value>" | npx wrangler secret put ${name}`,
    );
  }
  emit({ type: 'secret', status: 'ok', name });
}

async function configureUpstream(name: string): Promise<void> {
  const suffix = name.toUpperCase().replace(/-/g, '_');
  const baseName = `UPSTREAM_BASE_${suffix}`;
  const keyName = `UPSTREAM_KEY_${suffix}`;
  const base = JSON_MODE
    ? ''
    : await prompt(
        `  base URL for '${name}' (e.g. https://api.openai.com):`,
      );
  const key = JSON_MODE ? '' : await promptSecret(`  API key for '${name}':`);
  if (!base || !key) {
    fail(
      'secret',
      `missing base or key for '${name}'`,
      `Set manually: cd proxy && npx wrangler secret put ${baseName} && npx wrangler secret put ${keyName}`,
    );
  }
  putSecret(baseName, base);
  putSecret(keyName, key);
}

async function collectUpstreams(): Promise<string[]> {
  if (UPSTREAM_ARGS.length > 0) return UPSTREAM_ARGS;
  if (JSON_MODE) {
    fail(
      'secret',
      'No --upstream= flags given in --json mode',
      'Pass one or more --upstream=<name> flags',
    );
  }
  const names: string[] = [];
  const first = await prompt(
    "  which upstreams does your extension call? (e.g. 'openai' — comma-separated for multiple):",
    'openai',
  );
  for (const n of first.split(',').map((s) => s.trim()).filter(Boolean)) {
    names.push(n);
  }
  return names;
}

async function maybeSetRateLimit(): Promise<void> {
  if (SKIP_PROMPTS || JSON_MODE) {
    emit({ type: 'rate-limit', status: 'skipped', default: 50 });
    return;
  }
  const answer = await prompt(
    '  RATE_LIMIT_PER_DAY override (press enter for default=50):',
    '',
  );
  if (!answer) {
    emit({ type: 'rate-limit', status: 'skipped', default: 50 });
    return;
  }
  const n = Number(answer);
  if (!Number.isFinite(n) || n <= 0) {
    fail('rate-limit', `not a positive integer: '${answer}'`);
  }
  putSecret('RATE_LIMIT_PER_DAY', String(n));
}

function deploy(): string {
  const [cmd, prefix] = wranglerCmd();
  const res = run(cmd, [...prefix, 'deploy'], { cwd: PROXY_DIR });
  if (res.code !== 0) {
    fail(
      'deploy',
      `wrangler deploy failed: ${res.stderr.trim() || res.stdout.trim()}`,
      'Retry manually: cd proxy && npx wrangler deploy',
    );
  }
  // wrangler prints the deployed URL on a line like: `https://<name>.<sub>.workers.dev`
  const urlMatch = res.stdout.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev/);
  if (!urlMatch) {
    fail(
      'deploy',
      'Could not find deployed URL in wrangler output',
      `Check output manually:\n${res.stdout}`,
    );
  }
  emit({ type: 'deploy', status: 'ok', url: urlMatch[0] });
  return urlMatch[0];
}

function writeEnvLocal(proxyUrl: string): void {
  const line = `VITE_PROXY_URL=${proxyUrl}\n`;
  if (!existsSync(ENV_LOCAL)) {
    writeFileSync(ENV_LOCAL, line);
    emit({ type: 'env-local', status: 'created', path: '.env.local' });
    return;
  }
  const existing = readFileSync(ENV_LOCAL, 'utf8');
  if (/^VITE_PROXY_URL=/m.test(existing)) {
    const updated = existing.replace(/^VITE_PROXY_URL=.*$/m, line.trim());
    writeFileSync(ENV_LOCAL, updated);
    emit({ type: 'env-local', status: 'ok', note: 'updated existing line' });
    return;
  }
  appendFileSync(ENV_LOCAL, line);
  emit({ type: 'env-local', status: 'ok', note: 'appended' });
}

async function main(): Promise<void> {
  if (!existsSync(WRANGLER_TOML)) {
    fail(
      'preflight',
      `proxy/ subproject missing (looked for ${WRANGLER_TOML})`,
      'Did you delete it? Restore from the factory template.',
    );
  }
  ensureWrangler();
  ensureAuth();
  ensureKvNamespace();

  const upstreams = await collectUpstreams();
  if (upstreams.length === 0) {
    fail('secret', 'No upstreams configured', 'Pass --upstream=<name> or enter one interactively');
  }
  for (const name of upstreams) {
    if (!JSON_MODE) console.log(`\nConfiguring upstream: ${name}`);
    await configureUpstream(name);
  }

  await maybeSetRateLimit();

  const url = deploy();
  writeEnvLocal(url);
  emit({ type: 'done', status: 'ok', proxyUrl: url });

  if (!JSON_MODE) {
    console.log(`\nProxy deployed at ${url}`);
    console.log('VITE_PROXY_URL written to .env.local');
    console.log('Extension will pick it up on next `npm run build`.');
  }
}

main().catch((err) => {
  fail('preflight', err instanceof Error ? err.message : String(err));
});
