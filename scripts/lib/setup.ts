/**
 * Shared runtime for `scripts/setup-*.ts` and similar interactive
 * multi-step bootstrap scripts. Owns:
 *
 *   - `emit()` — pretty line-per-step human output OR line-delimited JSON
 *     (one envelope per event, `schemaVersion: 1` — see ARCHITECTURE.md:109)
 *   - `fail()` — emit a structured error and exit 1
 *   - `run()` — spawnSync wrapper returning { stdout, stderr, code }
 *   - `prompt()` / `promptSecret()` — readline wrappers that refuse to prompt
 *     in --json mode (skills must pass values via flags)
 *   - Flag parsing: `--json`, `--yes`, arbitrary `--name=value`
 *
 * Consumers:
 *   const s = createSetup();
 *   s.emit({ type: 'preflight', status: 'ok', detail: '...' });
 *   if (!ok) s.fail('preflight', 'gcloud missing', 'brew install ...');
 *
 * Event envelope (what skills parse):
 *   {
 *     "schemaVersion": 1,
 *     "type": "preflight" | "auth" | "done" | "error" | ...,
 *     "status": "ok" | "skipped" | "failed" | "created" | "exists" | "pending",
 *     ...extra fields per step
 *   }
 */

import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export type EventStatus =
  | 'ok'
  | 'skipped'
  | 'failed'
  | 'created'
  | 'exists'
  | 'pending';

export interface SetupEvent {
  type: string;
  status: EventStatus;
  [key: string]: unknown;
}

export interface RunOptions {
  cwd?: string;
  input?: string;
  env?: NodeJS.ProcessEnv;
  allowNonZero?: boolean;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface SetupRunner {
  readonly jsonMode: boolean;
  readonly skipPrompts: boolean;
  /** Raw argv slice (everything after the script name). */
  readonly argv: readonly string[];
  /** True if argv contains `--<name>` (bare flag). */
  readonly flag: (name: string) => boolean;
  /** First value of `--<name>=<value>` in argv, or `undefined`. */
  readonly option: (name: string) => string | undefined;
  /** All values of `--<name>=<value>` (repeatable flags). */
  readonly options: (name: string) => string[];
  readonly emit: (event: SetupEvent) => void;
  /**
   * Emit an `error` event and exit(1). Typed as `never` so TypeScript
   * narrows post-guard values (e.g. `if (!x) s.fail(...)` narrows x
   * afterwards).
   */
  readonly fail: (step: string, message: string, hint?: string) => never;
  readonly run: (cmd: string, args: string[], options?: RunOptions) => RunResult;
  readonly prompt: (question: string, defaultValue?: string) => Promise<string>;
  readonly promptSecret: (question: string) => Promise<string>;
}

export interface CreateSetupOptions {
  /** Override process.argv.slice(2) (useful for tests). */
  argv?: string[];
}

export function createSetup(opts: CreateSetupOptions = {}): SetupRunner {
  const argv = opts.argv ?? process.argv.slice(2);
  const jsonMode = argv.includes('--json');
  const skipPrompts = argv.includes('--yes');

  function flag(name: string): boolean {
    return argv.includes(`--${name}`);
  }

  function option(name: string): string | undefined {
    const prefix = `--${name}=`;
    const hit = argv.find((a) => a.startsWith(prefix));
    return hit ? hit.slice(prefix.length) : undefined;
  }

  function options(name: string): string[] {
    const prefix = `--${name}=`;
    return argv
      .filter((a) => a.startsWith(prefix))
      .map((a) => a.slice(prefix.length))
      .filter(Boolean);
  }

  function emit(event: SetupEvent): void {
    if (jsonMode) {
      console.log(JSON.stringify({ schemaVersion: 1, ...event }));
      return;
    }
    const { type, status, ...rest } = event;
    const detail = Object.entries(rest)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' ');
    const icon =
      status === 'ok' || status === 'created' || status === 'exists'
        ? '✓'
        : status === 'skipped' || status === 'pending'
          ? '·'
          : '✗';
    console.log(`${icon} [${type}] ${status}${detail ? ' — ' + detail : ''}`);
  }

  function fail(step: string, message: string, hint?: string): never {
    emit({ type: 'error', status: 'failed', step, message, hint });
    process.exit(1);
  }

  function run(cmd: string, args: string[], options: RunOptions = {}): RunResult {
    const result = spawnSync(cmd, args, {
      cwd: options.cwd,
      input: options.input,
      env: options.env,
      encoding: 'utf8',
    });
    if (result.error) {
      return { stdout: '', stderr: result.error.message, code: 127 };
    }
    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      code: result.status ?? 1,
    };
  }

  async function prompt(question: string, defaultValue?: string): Promise<string> {
    if (jsonMode) {
      fail('prompt', 'Cannot prompt in --json mode', 'Pass all values via flags');
    }
    if (skipPrompts && defaultValue !== undefined) return defaultValue;
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
    // Callers that pipe to `wrangler secret put` get the hiding from wrangler.
    if (jsonMode) {
      fail('prompt', 'Cannot prompt in --json mode', 'Pass all values via flags');
    }
    const rl = createInterface({ input, output });
    try {
      return (await rl.question(`${question} `)).trim();
    } finally {
      rl.close();
    }
  }

  return {
    jsonMode,
    skipPrompts,
    argv: [...argv],
    flag,
    option,
    options,
    emit,
    fail,
    run,
    prompt,
    promptSecret,
  };
}
