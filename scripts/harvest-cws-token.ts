/**
 * Harvest the CWS OAuth refresh token.
 *
 * Shells out to `npx chrome-webstore-upload-keys` — a stable third-party
 * CLI that does the OAuth device-code dance correctly. That tool is
 * interactive (prompts for client id/secret, opens a browser, prints a
 * refresh token), so we run it in passthrough mode and then prompt the
 * user to paste the printed token back into our process for persistence.
 *
 * The alternative — reimplementing the OAuth flow inline — is ~40 lines
 * that are easy to get subtly wrong (scope list, redirect URI, polling
 * cadence). The fregante tool has been stable for 5 years. We delegate.
 *
 * Usage:
 *   npx tsx scripts/harvest-cws-token.ts [--json]
 *
 * Flags:
 *   --json   Cannot prompt in this mode; the skill handling --json must
 *            invoke the tool directly and pass the token via stdin.
 *
 * Exit codes:
 *   0 — refresh token captured and written to .secrets.local.json
 *   1 — tool spawn failure, or empty token
 *   2 — prerequisite missing (no CLIENT_ID / CLIENT_SECRET on file)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = resolve(import.meta.dirname, '..');
const SECRETS_PATH = resolve(ROOT, '.secrets.local.json');
const JSON_MODE = process.argv.includes('--json');

function readSecrets(): Record<string, string> {
  if (!existsSync(SECRETS_PATH)) return {};
  try {
    const parsed = JSON.parse(readFileSync(SECRETS_PATH, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSecrets(secrets: Record<string, string>): void {
  writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2) + '\n');
}

function emit(payload: Record<string, unknown>): void {
  if (JSON_MODE) {
    console.log(JSON.stringify(payload));
  } else {
    const { status, message, ...rest } = payload;
    const suffix = Object.keys(rest).length
      ? ' ' + Object.entries(rest).map(([k, v]) => `${k}=${v}`).join(' ')
      : '';
    console.log(`[${status}] ${message ?? ''}${suffix}`);
  }
}

async function main(): Promise<void> {
  const secrets = readSecrets();
  const clientId = secrets.CWS_CLIENT_ID;
  const clientSecret = secrets.CWS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    emit({
      status: 'error',
      message:
        'CWS_CLIENT_ID and CWS_CLIENT_SECRET must be in .secrets.local.json before harvesting a refresh token',
      hint: 'Run the setup-cws-credentials skill (or create the OAuth Desktop client in the Google Cloud Console first)',
    });
    process.exit(2);
  }

  if (JSON_MODE) {
    emit({
      status: 'error',
      message:
        'Interactive OAuth flow cannot run in --json mode; the skill must invoke `npx chrome-webstore-upload-keys` directly',
    });
    process.exit(1);
  }

  console.log('');
  console.log('=== CWS refresh-token harvest ===');
  console.log('About to launch `npx chrome-webstore-upload-keys`.');
  console.log('');
  console.log('When it asks for credentials, paste these:');
  console.log(`  Client ID:     ${clientId}`);
  console.log(`  Client Secret: ${clientSecret}`);
  console.log('');
  console.log('It will open a browser for consent, then print a refresh token.');
  console.log('Copy the token — this script will ask for it next.');
  console.log('');

  const result = spawnSync('npx', ['--yes', 'chrome-webstore-upload-keys'], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    emit({
      status: 'error',
      message: `chrome-webstore-upload-keys exited with code ${result.status}`,
    });
    process.exit(1);
  }

  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question('Paste the refresh token here: ')).trim();
    if (!answer) {
      emit({ status: 'error', message: 'No token provided' });
      process.exit(1);
    }
    secrets.CWS_REFRESH_TOKEN = answer;
    writeSecrets(secrets);
    emit({
      status: 'ok',
      message: 'Refresh token saved to .secrets.local.json',
    });
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  emit({
    status: 'error',
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
