/**
 * Bootstrap the credential proxy Cloudflare Worker.
 *
 * Takes the user from "fresh `proxy/` subproject" to "deployed Worker URL
 * in `.env.local`" without manual file edits. Shares the
 * `scripts/lib/setup.ts` runner with the other `setup-*.ts` scripts so
 * skills see a uniform `schemaVersion: 1` envelope in `--json` mode.
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
import { createSetup } from './lib/setup.ts';

const ROOT = resolve(import.meta.dirname, '..');
const PROXY_DIR = resolve(ROOT, 'proxy');
const WRANGLER_TOML = resolve(PROXY_DIR, 'wrangler.toml');
const ENV_LOCAL = resolve(ROOT, '.env.local');

const s = createSetup();
const UPSTREAM_ARGS = s.options('upstream');

function ensureWrangler(): void {
  const which = s.run('which', ['wrangler'], { allowNonZero: true });
  if (which.code === 0) {
    s.emit({ type: 'preflight', status: 'ok', wrangler: which.stdout.trim() });
    return;
  }
  // Fall back to npx — works even if wrangler isn't globally installed,
  // because proxy/package.json lists it.
  s.emit({
    type: 'preflight',
    status: 'ok',
    wrangler: 'npx (via proxy/package.json)',
  });
}

function wranglerCmd(): [string, string[]] {
  const which = s.run('which', ['wrangler'], { allowNonZero: true });
  if (which.code === 0) return ['wrangler', []];
  return ['npx', ['--yes', 'wrangler']];
}

function ensureAuth(): void {
  const [cmd, prefix] = wranglerCmd();
  const whoami = s.run(cmd, [...prefix, 'whoami'], {
    cwd: PROXY_DIR,
    allowNonZero: true,
  });
  if (whoami.code === 0 && /associated with the email/i.test(whoami.stdout)) {
    s.emit({
      type: 'auth',
      status: 'ok',
      account: whoami.stdout.match(/[\w.-]+@[\w.-]+/)?.[0] ?? 'authenticated',
    });
    return;
  }
  if (s.jsonMode) {
    s.fail(
      'auth',
      'Not logged in to Cloudflare',
      'Run `npx wrangler login` in an interactive terminal first',
    );
  }
  s.emit({ type: 'auth', status: 'skipped', note: 'running `wrangler login`' });
  const login = spawnSync(cmd, [...prefix, 'login'], {
    cwd: PROXY_DIR,
    stdio: 'inherit',
  });
  if ((login.status ?? 1) !== 0) {
    s.fail('auth', 'wrangler login failed', 'Retry manually from proxy/');
  }
  s.emit({ type: 'auth', status: 'ok', account: 'authenticated' });
}

function ensureKvNamespace(): string {
  const toml = readFileSync(WRANGLER_TOML, 'utf8');
  const existing = toml.match(/id\s*=\s*"([a-f0-9]{32})"/);
  if (existing) {
    s.emit({ type: 'kv', status: 'exists', id: existing[1] });
    return existing[1];
  }
  const [cmd, prefix] = wranglerCmd();
  const create = s.run(
    cmd,
    [...prefix, 'kv', 'namespace', 'create', 'RATE_LIMITS'],
    { cwd: PROXY_DIR },
  );
  if (create.code !== 0) {
    s.fail(
      'kv',
      `KV namespace create failed: ${create.stderr.trim() || create.stdout.trim()}`,
      'Retry manually: cd proxy && npx wrangler kv namespace create RATE_LIMITS',
    );
  }
  const idMatch = create.stdout.match(/id\s*=\s*"([a-f0-9]{32})"/);
  if (!idMatch) {
    s.fail(
      'kv',
      'Could not parse KV namespace id from wrangler output',
      `Check output manually:\n${create.stdout}`,
    );
  }
  const kvId = idMatch![1];
  const updated = toml.replace(/REPLACE_ME_WITH_KV_NAMESPACE_ID/, kvId);
  writeFileSync(WRANGLER_TOML, updated);
  s.emit({ type: 'wrangler-toml', status: 'ok', kvId });
  s.emit({ type: 'kv', status: 'created', id: kvId });
  return kvId;
}

function putSecret(name: string, value: string): void {
  const [cmd, prefix] = wranglerCmd();
  // `wrangler secret put` reads the value from stdin when stdin is not a TTY.
  const res = s.run(cmd, [...prefix, 'secret', 'put', name], {
    cwd: PROXY_DIR,
    input: value + '\n',
  });
  if (res.code !== 0) {
    s.fail(
      'secret',
      `Failed to set ${name}: ${res.stderr.trim() || res.stdout.trim()}`,
      `Retry manually: cd proxy && echo "<value>" | npx wrangler secret put ${name}`,
    );
  }
  s.emit({ type: 'secret', status: 'ok', name });
}

async function configureUpstream(name: string): Promise<void> {
  const suffix = name.toUpperCase().replace(/-/g, '_');
  const baseName = `UPSTREAM_BASE_${suffix}`;
  const keyName = `UPSTREAM_KEY_${suffix}`;
  const base = s.jsonMode
    ? ''
    : await s.prompt(
        `  base URL for '${name}' (e.g. https://api.openai.com):`,
      );
  const key = s.jsonMode ? '' : await s.promptSecret(`  API key for '${name}':`);
  if (!base || !key) {
    s.fail(
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
  if (s.jsonMode) {
    s.fail(
      'secret',
      'No --upstream= flags given in --json mode',
      'Pass one or more --upstream=<name> flags',
    );
  }
  const first = await s.prompt(
    "  which upstreams does your extension call? (e.g. 'openai' — comma-separated for multiple):",
    'openai',
  );
  return first.split(',').map((n) => n.trim()).filter(Boolean);
}

async function maybeSetRateLimit(): Promise<void> {
  if (s.skipPrompts || s.jsonMode) {
    s.emit({ type: 'rate-limit', status: 'skipped', default: 50 });
    return;
  }
  const answer = await s.prompt(
    '  RATE_LIMIT_PER_DAY override (press enter for default=50):',
    '',
  );
  if (!answer) {
    s.emit({ type: 'rate-limit', status: 'skipped', default: 50 });
    return;
  }
  const n = Number(answer);
  if (!Number.isFinite(n) || n <= 0) {
    s.fail('rate-limit', `not a positive integer: '${answer}'`);
  }
  putSecret('RATE_LIMIT_PER_DAY', String(n));
}

function deploy(): string {
  const [cmd, prefix] = wranglerCmd();
  const res = s.run(cmd, [...prefix, 'deploy'], { cwd: PROXY_DIR });
  if (res.code !== 0) {
    s.fail(
      'deploy',
      `wrangler deploy failed: ${res.stderr.trim() || res.stdout.trim()}`,
      'Retry manually: cd proxy && npx wrangler deploy',
    );
  }
  // wrangler prints the deployed URL on a line like: `https://<name>.<sub>.workers.dev`
  const urlMatch = res.stdout.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev/);
  if (!urlMatch) {
    s.fail(
      'deploy',
      'Could not find deployed URL in wrangler output',
      `Check output manually:\n${res.stdout}`,
    );
  }
  const deployedUrl = urlMatch![0];
  s.emit({ type: 'deploy', status: 'ok', url: deployedUrl });
  return deployedUrl;
}

function writeEnvLocal(proxyUrl: string): void {
  const line = `VITE_PROXY_URL=${proxyUrl}\n`;
  if (!existsSync(ENV_LOCAL)) {
    writeFileSync(ENV_LOCAL, line);
    s.emit({ type: 'env-local', status: 'created', path: '.env.local' });
    return;
  }
  const existing = readFileSync(ENV_LOCAL, 'utf8');
  if (/^VITE_PROXY_URL=/m.test(existing)) {
    const updated = existing.replace(/^VITE_PROXY_URL=.*$/m, line.trim());
    writeFileSync(ENV_LOCAL, updated);
    s.emit({ type: 'env-local', status: 'ok', note: 'updated existing line' });
    return;
  }
  appendFileSync(ENV_LOCAL, line);
  s.emit({ type: 'env-local', status: 'ok', note: 'appended' });
}

async function main(): Promise<void> {
  if (!existsSync(WRANGLER_TOML)) {
    s.fail(
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
    s.fail('secret', 'No upstreams configured', 'Pass --upstream=<name> or enter one interactively');
  }
  for (const name of upstreams) {
    if (!s.jsonMode) console.log(`\nConfiguring upstream: ${name}`);
    await configureUpstream(name);
  }

  await maybeSetRateLimit();

  const url = deploy();
  writeEnvLocal(url);
  s.emit({ type: 'done', status: 'ok', proxyUrl: url });

  if (!s.jsonMode) {
    console.log(`\nProxy deployed at ${url}`);
    console.log('VITE_PROXY_URL written to .env.local');
    console.log('Extension will pick it up on next `npm run build`.');
  }
}

main().catch((err) => {
  s.fail('preflight', err instanceof Error ? err.message : String(err));
});
