/**
 * Submit the built CWS zip and poll until a terminal state.
 *
 * Emits structured state transitions on stdout: `uploading`, `uploaded`,
 * `publishing`, `in-review`, `live`, `rejected`, `failed`, `timeout`.
 * Consumers (skills) can parse these line-by-line or use `--json` for a
 * single envelope.
 *
 * Usage:
 *   npx tsx scripts/publish-cws.ts [zip-path] [--json] [--no-auto-publish]
 *                                  [--target=default|trustedTesters]
 *
 * Args:
 *   zip-path           Path to the zip to upload. Defaults to the first
 *                      *-chrome.zip in .output/ (WXT's default location).
 *
 * Flags:
 *   --json             Emit a single JSON envelope (schemaVersion: 1).
 *   --no-auto-publish  Upload only; don't publish. Useful for manual QA.
 *   --target=...       Publish target: default (public) or trustedTesters.
 *
 * Exit codes:
 *   0 — live, or skipped due to no secrets
 *   1 — rejected / failed / upload error / auth error
 *   2 — setup error (no zip found, no .output/ directory)
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  loadSecrets,
  submit,
  pollStatus,
  SECRET_ENV_NAMES,
  type CwsItemResource,
  type CwsPublishResponse,
  type PollResult,
  type PublishTarget,
} from './cws-api.js';

const ROOT = resolve(import.meta.dirname, '..');
const ARGS = process.argv.slice(2);
const JSON_MODE = ARGS.includes('--json');
const AUTO_PUBLISH = !ARGS.includes('--no-auto-publish');
const TARGET_ARG = ARGS.find((a) => a.startsWith('--target='));
const TARGET: PublishTarget =
  TARGET_ARG?.split('=')[1] === 'trustedTesters' ? 'trustedTesters' : 'default';
const POSITIONAL = ARGS.filter((a) => !a.startsWith('--'));
const ZIP_PATH_ARG = POSITIONAL[0];

interface Transition {
  at: string; // ISO timestamp
  state: string;
  detail?: string;
}

function log(transitions: Transition[], state: string, detail?: string) {
  const t: Transition = { at: new Date().toISOString(), state, detail };
  transitions.push(t);
  if (!JSON_MODE) {
    const suffix = detail ? ` — ${detail}` : '';
    console.log(`[${t.at}] ${state}${suffix}`);
  }
}

function findDefaultZip(): string | null {
  const outputDir = join(ROOT, '.output');
  if (!existsSync(outputDir)) return null;
  const zips = readdirSync(outputDir).filter((f) => f.endsWith('-chrome.zip'));
  if (zips.length === 0) return null;
  // Prefer the newest if multiple (e.g. successive zips at different versions).
  zips.sort();
  return join(outputDir, zips[zips.length - 1]);
}

type Outcome =
  | {
      kind: 'skipped';
      reason: string;
    }
  | {
      kind: 'terminal';
      poll: PollResult;
      upload: CwsItemResource;
      publish?: CwsPublishResponse;
    }
  | {
      kind: 'upload-failed';
      upload: CwsItemResource;
    };

async function run(transitions: Transition[]): Promise<Outcome> {
  const secrets = loadSecrets();
  if (!secrets) {
    const reason = `no CWS secrets configured — set ${SECRET_ENV_NAMES.join(', ')} to enable automated publish. See docs/06-keepalive-publish.md for setup.`;
    log(transitions, 'skipped', reason);
    return { kind: 'skipped', reason };
  }
  const zipPath = ZIP_PATH_ARG ?? findDefaultZip();
  if (!zipPath || !existsSync(zipPath)) {
    console.error(
      `publish-cws: no zip found${ZIP_PATH_ARG ? ` at ${ZIP_PATH_ARG}` : ' in .output/'}. Run \`npm run zip\` first.`,
    );
    process.exit(2);
  }
  log(transitions, 'uploading', `path=${zipPath}`);
  const { upload, publish } = await submit(secrets, zipPath, {
    autoPublish: AUTO_PUBLISH,
    target: TARGET,
  });
  if (upload.uploadState === 'FAILURE') {
    const detail = (upload.itemError ?? [])
      .map((e) => `${e.error_code}: ${e.error_detail}`)
      .join('; ');
    log(transitions, 'upload-failed', detail);
    return { kind: 'upload-failed', upload };
  }
  log(
    transitions,
    'uploaded',
    `state=${upload.uploadState ?? 'unknown'}${upload.crxVersion ? ` version=${upload.crxVersion}` : ''}`,
  );
  if (!AUTO_PUBLISH) {
    log(transitions, 'skipped-publish', '--no-auto-publish set');
    // Treat as a non-terminal success: we did what the user asked.
    return {
      kind: 'terminal',
      poll: { state: 'live' },
      upload,
      publish,
    };
  }
  log(transitions, 'publishing', `target=${TARGET}`);
  const pollResult = await pollStatus(secrets, publish);
  log(transitions, pollResult.state, pollResult.detail);
  return { kind: 'terminal', poll: pollResult, upload, publish };
}

function exitCodeFor(outcome: Outcome): number {
  if (outcome.kind === 'skipped') return 0;
  if (outcome.kind === 'upload-failed') return 1;
  switch (outcome.poll.state) {
    case 'live':
    case 'in-review':
      return 0;
    case 'rejected':
    case 'failed':
    case 'timeout':
      return 1;
  }
}

function emit(outcome: Outcome, transitions: Transition[]): never {
  const exitCode = exitCodeFor(outcome);
  if (JSON_MODE) {
    const payload = {
      schemaVersion: 1,
      script: 'publish-cws',
      skipped: outcome.kind === 'skipped',
      status: outcome.kind === 'skipped' ? 'skipped' : outcome.kind,
      state:
        outcome.kind === 'terminal' ? outcome.poll.state : outcome.kind,
      detail:
        outcome.kind === 'skipped'
          ? outcome.reason
          : outcome.kind === 'upload-failed'
            ? (outcome.upload.itemError ?? [])
                .map((e) => `${e.error_code}: ${e.error_detail}`)
                .join('; ')
            : outcome.poll.detail,
      transitions,
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else if (outcome.kind === 'skipped') {
    // Already logged as a transition, but also print a human-visible hint.
    console.log('publish-cws: no-op (see message above).');
  } else if (outcome.kind === 'upload-failed') {
    console.log('publish-cws: upload failed.');
  } else {
    console.log(`publish-cws: terminal state — ${outcome.poll.state}.`);
  }
  process.exit(exitCode);
}

const transitions: Transition[] = [];

run(transitions)
  .then((outcome) => emit(outcome, transitions))
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    log(transitions, 'error', message);
    if (JSON_MODE) {
      const payload = {
        schemaVersion: 1,
        script: 'publish-cws',
        skipped: false,
        status: 'error',
        state: 'error',
        detail: message,
        transitions,
      };
      process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      console.error(`publish-cws: error — ${message}`);
      console.error(
        `  If you set fake secrets, an auth error is expected — proves the script reaches CWS.`,
      );
    }
    process.exit(1);
  });
