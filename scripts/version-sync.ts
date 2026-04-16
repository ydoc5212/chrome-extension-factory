/**
 * Compare the local `package.json` version against the CWS live version.
 *
 *   Local > remote → exits 0 (you're good to ship).
 *   Local ≤ remote → exits 1 with instructions to bump.
 *   No secrets    → exits 0 with a "skipped" note (factory invariant).
 *   CWS API does not expose crxVersion on this item → exits 0 with a
 *   "skipped" note (cannot reliably compare; don't block on this).
 *
 * Usage:
 *   npx tsx scripts/version-sync.ts [--json]
 *
 * Flags:
 *   --json   Emit a JSON envelope (schemaVersion: 1) and suppress
 *            human-readable output. Same schema shape as validate-cws.
 *
 * Exit codes:
 *   0 — local version is ahead of remote (or we skipped the check)
 *   1 — local version is behind or equal to remote; user must bump
 *   2 — fatal setup problem (e.g. cannot parse package.json)
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadSecrets, getPublishedVersion, SECRET_ENV_NAMES } from './cws-api.js';

const ROOT = resolve(import.meta.dirname, '..');
const ARGS = process.argv.slice(2);
const JSON_MODE = ARGS.includes('--json');

type Result =
  | {
      kind: 'skipped';
      reason: string;
      localVersion: string;
      exitCode: 0;
    }
  | {
      kind: 'ahead';
      localVersion: string;
      remoteVersion: string;
      exitCode: 0;
    }
  | {
      kind: 'behind-or-equal';
      localVersion: string;
      remoteVersion: string;
      exitCode: 1;
    };

function readLocalVersion(): string {
  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    version?: string;
  };
  if (!pkg.version || typeof pkg.version !== 'string') {
    console.error(`ERROR: package.json has no "version" field.`);
    process.exit(2);
  }
  return pkg.version;
}

/**
 * Compare semver-ish version strings. Returns:
 *   1  if a > b
 *   0  if a == b
 *  -1  if a < b
 * Falls back to lexical compare for non-numeric segments.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((s) => Number.parseInt(s, 10));
  const pb = b.split('.').map((s) => Number.parseInt(s, 10));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (Number.isNaN(av) || Number.isNaN(bv)) {
      // Non-numeric (prerelease) — lexical fallback.
      const as = a.split('.')[i] ?? '';
      const bs = b.split('.')[i] ?? '';
      if (as > bs) return 1;
      if (as < bs) return -1;
      continue;
    }
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

async function run(): Promise<Result> {
  const localVersion = readLocalVersion();
  const secrets = loadSecrets();
  if (!secrets) {
    return {
      kind: 'skipped',
      reason: `no CWS secrets configured (${SECRET_ENV_NAMES.join(', ')})`,
      localVersion,
      exitCode: 0,
    };
  }
  let remoteVersion: string | null;
  try {
    remoteVersion = await getPublishedVersion(secrets);
  } catch (err) {
    // Re-throw so the caller sees the real auth / network error. Per the
    // acceptance criteria, running with fake secrets must surface an auth
    // error (proving the script is making a real API call, not no-op'ing).
    throw err;
  }
  if (!remoteVersion) {
    return {
      kind: 'skipped',
      reason:
        'CWS API did not return a crxVersion for this extension; version-sync cannot compare.',
      localVersion,
      exitCode: 0,
    };
  }
  const cmp = compareVersions(localVersion, remoteVersion);
  if (cmp > 0) {
    return {
      kind: 'ahead',
      localVersion,
      remoteVersion,
      exitCode: 0,
    };
  }
  return {
    kind: 'behind-or-equal',
    localVersion,
    remoteVersion,
    exitCode: 1,
  };
}

function emitJson(result: Result): never {
  // schemaVersion: 1 — matches validate-cws. Additive-only.
  const payload = {
    schemaVersion: 1,
    script: 'version-sync',
    skipped: result.kind === 'skipped',
    status: result.kind,
    localVersion: result.localVersion,
    remoteVersion: 'remoteVersion' in result ? result.remoteVersion : null,
    reason: result.kind === 'skipped' ? result.reason : undefined,
    fix:
      result.kind === 'behind-or-equal'
        ? 'Run `npm version patch` (or `minor`/`major`) to bump, then retry.'
        : undefined,
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  process.exit(result.exitCode);
}

function emitHuman(result: Result): never {
  switch (result.kind) {
    case 'skipped':
      console.log(
        `version-sync: skipped — ${result.reason} (local version: ${result.localVersion})`,
      );
      break;
    case 'ahead':
      console.log(
        `version-sync: local ${result.localVersion} > live ${result.remoteVersion}. OK to ship.`,
      );
      break;
    case 'behind-or-equal':
      console.log(
        `version-sync: local ${result.localVersion} ≤ live ${result.remoteVersion}.`,
      );
      console.log(
        `  fix: run \`npm version patch\` (or minor/major) to bump the local version, then retry.`,
      );
      break;
  }
  process.exit(result.exitCode);
}

run()
  .then((result) => {
    if (JSON_MODE) emitJson(result);
    emitHuman(result);
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    if (JSON_MODE) {
      const payload = {
        schemaVersion: 1,
        script: 'version-sync',
        skipped: false,
        status: 'error',
        error: message,
      };
      process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      console.error(`version-sync: error — ${message}`);
      console.error(
        `  If you set fake secrets, this is expected: an auth error proves the script is hitting CWS.`,
      );
    }
    process.exit(1);
  });
