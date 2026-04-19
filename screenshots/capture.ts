/**
 * Headless-Chrome screenshot export.
 *
 * Reads `screenshots/config.ts`, runs each shot through the fallback ladder
 * (docs/07-fallback-ladders.md), boots the Next.js production server, hits
 * each `/<id>?rung=...` route, and writes PNGs to `.output/screenshots/<id>.png`
 * at exactly 1280×800.
 *
 * Per-shot ladder:
 *   1. manual       — `screenshots/manual/<id>.png` exists → copy it through
 *                     untouched. Ship-acceptable; the user took responsibility.
 *   2. real-build   — `.output/chrome-mv3/<surface>.html` exists → render it
 *                     inside the BrowserFrame via iframe. Ship-acceptable.
 *   3. concept-card — fallback. Renders extension name + tagline in a fixed
 *                     typographic card with a diagonal STUB watermark.
 *                     Not ship-acceptable; watermark makes accidental upload
 *                     visually impossible.
 *
 * The rung that landed for each shot is recorded in `.factory/ladder-status.json`,
 * which `scripts/validate-cws.ts` reads in `--ship` mode.
 *
 * Run via the root-level script:
 *   npm run screenshots
 *
 * Why two HTTP servers: Next.js renders the frame; a tiny static server
 * (port 3636) hands out the built extension HTML for the iframe to load.
 * Loading from `file://` doesn't work for cross-origin iframes; rewriting
 * Next config to serve `.output/` adds more code than the static server.
 */

import { chromium, type Browser, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import {
  mkdirSync,
  existsSync,
  rmSync,
  readFileSync,
  writeFileSync,
  statSync,
  createReadStream,
  copyFileSync,
} from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { screenshots, type ScreenshotConfig, type ScreenshotSurface } from './config';
import {
  type Rung,
  type LadderEntry,
  type LadderStatus,
} from './ladder';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const SCREENSHOTS_DIR = resolve(HERE);
const OUT_DIR = join(REPO_ROOT, '.output', 'screenshots');
const BUILD_DIR = join(REPO_ROOT, '.output', 'chrome-mv3');
const MANUAL_DIR = join(SCREENSHOTS_DIR, 'manual');
const LADDER_STATUS_PATH = join(REPO_ROOT, '.factory', 'ladder-status.json');
const NEXT_PORT = 3535;
const BUILD_PORT = 3636;
const NEXT_HOST = `http://127.0.0.1:${NEXT_PORT}`;
const BUILD_HOST = `http://127.0.0.1:${BUILD_PORT}`;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/**
 * Tiny static file server scoped to BUILD_DIR. Used as the iframe origin
 * for rung-1 shots. Refuses path-traversal and only serves files under
 * BUILD_DIR.
 */
function startBuildServer(): Server {
  const root = resolve(BUILD_DIR);
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', BUILD_HOST);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/' || pathname.endsWith('/')) {
        pathname = pathname + 'index.html';
      }
      const full = resolve(root, '.' + pathname);
      if (!full.startsWith(root)) {
        res.statusCode = 403;
        res.end('forbidden');
        return;
      }
      if (!existsSync(full) || !statSync(full).isFile()) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      res.setHeader(
        'Content-Type',
        MIME[extname(full).toLowerCase()] ?? 'application/octet-stream',
      );
      // Loosen for the iframe + asset loads. This server only ever runs
      // inside the capture script, never exposed.
      res.setHeader('Access-Control-Allow-Origin', '*');
      createReadStream(full).pipe(res);
    } catch (err) {
      res.statusCode = 500;
      res.end(err instanceof Error ? err.message : 'error');
    }
  });
  server.listen(BUILD_PORT, '127.0.0.1');
  return server;
}

async function waitForServer(host: string, timeoutMs = 30_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(host);
      if (res.ok || res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not respond at ${host} within ${timeoutMs}ms`);
}

function startNextServer(): ChildProcess {
  const proc = spawn('npx', ['next', 'start', '-p', String(NEXT_PORT)], {
    cwd: SCREENSHOTS_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  proc.stdout?.on('data', (d) => process.stderr.write(`[next] ${d}`));
  proc.stderr?.on('data', (d) => process.stderr.write(`[next] ${d}`));
  return proc;
}

function loadManifest(): { name: string; description: string } {
  const manifestPath = join(BUILD_DIR, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { name: 'Your extension', description: 'A short description of what it does.' };
  }
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
    return {
      name: typeof raw.name === 'string' && raw.name ? raw.name : 'Your extension',
      description:
        typeof raw.description === 'string' && raw.description
          ? raw.description
          : 'A short description of what it does.',
    };
  } catch {
    return { name: 'Your extension', description: 'A short description of what it does.' };
  }
}

interface RungDecision {
  rung: Rung;
  iframeSrc?: string;
  manualSrc?: string;
  reason: string | null;
}

/**
 * Decide the highest rung this shot can reach without user dialogue.
 * Manual override wins; then real-build (if WXT emitted matching HTML);
 * else concept-card stub.
 */
function decideRung(shot: ScreenshotConfig): RungDecision {
  const manualPath = join(MANUAL_DIR, `${shot.id}.png`);
  if (existsSync(manualPath)) {
    return { rung: 'manual', manualSrc: manualPath, reason: null };
  }
  if (shot.surface === 'content-in-page') {
    return {
      rung: 'concept-card',
      reason:
        "surface 'content-in-page' has no built HTML — content-script overlays must be hand-captured",
    };
  }
  const builtFile = `${shot.surface}.html`;
  const builtPath = join(BUILD_DIR, builtFile);
  if (existsSync(builtPath)) {
    return {
      rung: 'real-build',
      iframeSrc: `${BUILD_HOST}/${builtFile}`,
      reason: null,
    };
  }
  return {
    rung: 'concept-card',
    reason: `no built HTML at .output/chrome-mv3/${builtFile} — run \`npm run build\` and confirm the ${shot.surface} entrypoint exists`,
  };
}

function buildShotUrl(
  shot: ScreenshotConfig,
  rung: Rung,
  iframeSrc: string | undefined,
  manifestInfo: { name: string; description: string },
): string {
  const params = new URLSearchParams({ rung });
  if (iframeSrc) params.set('iframeSrc', iframeSrc);
  if (rung === 'concept-card') {
    params.set('name', manifestInfo.name);
    params.set('tagline', manifestInfo.description);
  }
  return `${NEXT_HOST}/${shot.id}?${params.toString()}`;
}

async function captureOne(
  page: Page,
  shot: ScreenshotConfig,
  manifestInfo: { name: string; description: string },
): Promise<LadderEntry> {
  const decision = decideRung(shot);
  const outPath = join(OUT_DIR, `${shot.id}.png`);

  if (decision.rung === 'manual' && decision.manualSrc) {
    copyFileSync(decision.manualSrc, outPath);
    return {
      artifactId: shot.id,
      landedRung: 'manual',
      shipAcceptable: true,
      reason: null,
    };
  }

  const url = buildShotUrl(shot, decision.rung, decision.iframeSrc, manifestInfo);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width: 1280, height: 800 },
    omitBackground: false,
  });
  return {
    artifactId: shot.id,
    landedRung: decision.rung,
    shipAcceptable: decision.rung === 'real-build',
    reason: decision.reason,
  };
}

function writeLadderStatus(entries: LadderEntry[]): void {
  const dir = dirname(LADDER_STATUS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const status: LadderStatus = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    screenshots: entries,
  };
  writeFileSync(LADDER_STATUS_PATH, JSON.stringify(status, null, 2) + '\n');
}

function reportLanding(entries: LadderEntry[]): void {
  const w = Math.max(...entries.map((e) => e.artifactId.length), 12);
  console.log('');
  console.log('Ladder landings:');
  for (const e of entries) {
    const badge = e.shipAcceptable ? '✓ ship-ok' : '⚠ stub   ';
    const reason = e.reason ? `  (${e.reason})` : '';
    console.log(`  ${badge}  ${e.artifactId.padEnd(w)}  rung: ${e.landedRung}${reason}`);
  }
  const stubCount = entries.filter((e) => !e.shipAcceptable).length;
  if (stubCount > 0) {
    console.log('');
    console.log(
      `${stubCount} of ${entries.length} screenshot(s) landed on a non-ship-acceptable rung.`,
    );
    console.log(
      'To fix: drop a hand-captured PNG at `screenshots/manual/<id>.png` and re-run, or',
    );
    console.log('       address the reason printed above so the auto path can reach rung 1.');
  }
}

async function main() {
  if (screenshots.length === 0) {
    console.log('No screenshots configured in screenshots/config.ts — nothing to do.');
    return;
  }

  if (existsSync(OUT_DIR)) {
    rmSync(OUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const manifestInfo = loadManifest();
  console.log(
    `Rendering ${screenshots.length} screenshot${screenshots.length === 1 ? '' : 's'} → ${OUT_DIR}`,
  );

  // Only spin up the rendering stack if at least one shot needs the browser.
  // A fully manually-overridden config skips both servers and Playwright.
  const needsBrowser = screenshots.some(
    (s) => decideRung(s).rung !== 'manual',
  );

  let nextServer: ChildProcess | undefined;
  let buildServer: Server | undefined;
  let browser: Browser | undefined;
  const entries: LadderEntry[] = [];
  try {
    let page: Page | undefined;
    if (needsBrowser) {
      nextServer = startNextServer();
      buildServer = startBuildServer();
      await waitForServer(NEXT_HOST);
      browser = await chromium.launch();
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      });
      page = await context.newPage();
    }
    for (const shot of screenshots) {
      const entry = await captureOne(page!, shot, manifestInfo);
      entries.push(entry);
      const badge = entry.shipAcceptable ? '✓' : '⚠';
      console.log(
        `  ${badge} ${shot.id.padEnd(24)} → rung: ${entry.landedRung}`,
      );
    }
  } finally {
    if (browser) await browser.close();
    nextServer?.kill('SIGTERM');
    buildServer?.close();
  }

  writeLadderStatus(entries);
  reportLanding(entries);
  console.log(
    `\nDone. ${entries.length} PNG${entries.length === 1 ? '' : 's'} written to .output/screenshots/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
