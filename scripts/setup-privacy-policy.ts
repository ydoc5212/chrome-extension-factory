/**
 * Auto-generate and host a Chrome Web Store privacy policy.
 *
 * The factory's "tasteful no-frills default" for Purple Lithium prevention.
 * Replaces the manual "edit a template, host it on GitHub Pages, come back
 * with the URL" loop the cws-content skill used to perform.
 *
 * Default flow:
 *   1. Read `.output/chrome-mv3/manifest.json` (run `npm run build` first).
 *   2. Generate `store/PRIVACY.md` + `store/index.html` + `store/.nojekyll`
 *      derived from the manifest's permissions + a conservative "local-only,
 *      no third-party servers" baseline. Each declared permission gets a
 *      one-line plain-English explanation.
 *   3. Resolve the GitHub Pages URL via `gh` CLI. Enable Pages on
 *      `main` branch / `/store` path if not already enabled. Poll until
 *      the URL returns 200 (timeout: 90s).
 *   4. Write the resolved URL into `entrypoints/welcome/config.ts` →
 *      `links.privacy`. This is the only mutation outside `store/`.
 *
 * Self-host escape hatch:
 *   --self-host=<url>   Skip the gh-pages dance. Write `store/PRIVACY.md`
 *                       so the user has a customizable source, but use the
 *                       provided URL for `links.privacy`. Pings the URL
 *                       (warn-only) so a typo surfaces immediately.
 *
 * Flags:
 *   --self-host=<url>          Skip gh-pages, use the supplied URL.
 *   --contact-email=<addr>     Embed in policy. Defaults to `git config user.email`.
 *   --data-handling=<mode>     `local-only` (default) | `sends-data`.
 *   --json                     Line-delimited JSON events (for skill consumers).
 *   --yes                      Skip confirmation prompts.
 *   --force                    Overwrite existing `store/` files without asking.
 *   --no-publish               Generate files only; don't touch Pages or welcome config.
 *
 * Exit codes:
 *   0 — done (URL live, welcome config wired)
 *   1 — recoverable (gh auth, repo missing, polling timeout, etc.)
 *   2 — usage / build artifact missing
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createSetup } from './lib/setup.ts';

const ROOT = resolve(import.meta.dirname, '..');
const MANIFEST_PATH = join(ROOT, '.output', 'chrome-mv3', 'manifest.json');
const STORE_DIR = join(ROOT, 'store');
const WELCOME_CONFIG_PATH = join(ROOT, 'entrypoints', 'welcome', 'config.ts');

const s = createSetup();
const FORCE = s.flag('force');
const NO_PUBLISH = s.flag('no-publish');
const SELF_HOST_URL = s.option('self-host');
const CONTACT_EMAIL_ARG = s.option('contact-email');
const DATA_HANDLING =
  (s.option('data-handling') as 'local-only' | 'sends-data' | undefined) ?? 'local-only';

if (DATA_HANDLING !== 'local-only' && DATA_HANDLING !== 'sends-data') {
  s.fail('usage', `--data-handling must be "local-only" or "sends-data"`);
}

// ---------- Manifest + content generation ----------

interface Manifest {
  name?: string;
  description?: string;
  version?: string;
  permissions?: string[];
  optional_permissions?: string[];
  optional_host_permissions?: string[];
  host_permissions?: string[];
}

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) {
    s.fail(
      'manifest',
      `Built manifest not found at ${MANIFEST_PATH}`,
      'Run `npm run build` first.',
    );
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

// Plain-English purpose for each declared permission. Reviewers AND end-users
// read privacy policies; defaults must be honest, not generic. Add to this
// table when the factory adds new permission affordances.
const PERMISSION_REASONS: Record<string, string> = {
  activeTab: "Read the current tab's URL and content only when you click the extension.",
  alarms: 'Schedule background tasks (e.g., periodic refresh).',
  bookmarks: 'Read or modify your bookmarks.',
  clipboardRead: 'Read text you copy when the extension is active.',
  clipboardWrite: 'Copy text to your clipboard on your behalf.',
  contextMenus: 'Add items to the right-click menu.',
  cookies: 'Read or modify cookies for the sites you grant access to.',
  declarativeNetRequest: 'Filter or modify network requests using static rules.',
  downloads: 'Manage downloads on your behalf.',
  history: 'Read your browsing history.',
  identity: 'Sign you in via your browser account, when you initiate it.',
  notifications: 'Show desktop notifications.',
  scripting: 'Run scripts on pages you grant access to.',
  sidePanel: 'Open a side panel UI in your browser.',
  storage: 'Save your settings and extension data locally on your device.',
  tabs: "Read tab metadata (title, URL) to support the extension's features.",
  unlimitedStorage: 'Store more than 5MB of extension data locally.',
  webNavigation: 'Observe page navigation events.',
  webRequest: 'Observe network requests.',
};

function explainPermission(perm: string): string {
  return PERMISSION_REASONS[perm] ?? `Used by the extension. (No default explanation; please customize.)`;
}

interface PolicyInputs {
  extensionName: string;
  contactEmail: string;
  dataHandling: 'local-only' | 'sends-data';
  permissions: string[];
  hostPermissions: string[];
  date: string;
}

function renderMarkdown(p: PolicyInputs): string {
  const dataSection =
    p.dataHandling === 'local-only'
      ? `## What data this extension collects
${p.extensionName} **does not collect personal data**. The extension stores its settings and operational data locally on your device using the browser's built-in storage. Nothing is transmitted to external servers.`
      : `## What data this extension collects
${p.extensionName} processes data necessary for its features. **Edit this section** to describe exactly what data is read, processed, or transmitted, and where it goes. Generic language here will not pass Chrome Web Store review.`;

  const thirdPartySection =
    p.dataHandling === 'local-only'
      ? `## Third-party services
This extension does not communicate with any external servers, analytics providers, or third parties.`
      : `## Third-party services
**Edit this section** to list every third-party service this extension communicates with (analytics, APIs, sync providers, etc.) and what data is sent to each. Required for Chrome Web Store submission if the extension transmits any data.`;

  const permLines =
    p.permissions.length === 0 && p.hostPermissions.length === 0
      ? '_This extension declares no special permissions._'
      : [
          ...p.permissions.map((perm) => `- **${perm}** — ${explainPermission(perm)}`),
          ...p.hostPermissions.map(
            (h) => `- **Host access to \`${h}\`** — Read or modify pages on this origin to provide the extension's core feature.`,
          ),
        ].join('\n');

  return `# Privacy Policy for ${p.extensionName}

_Last updated: ${p.date}_

${dataSection}

## How data is stored
All extension data is stored locally on your device using the browser's storage APIs. It is not synced to the extension author's servers. (Browser-level sync, if you enable it on your browser account, is governed by your browser vendor's policy.)

${thirdPartySection}

## Permissions
This extension requests the following permissions:

${permLines}

## Changes to this policy
Material changes to this policy will be reflected in the "Last updated" date above and announced in the extension's release notes.

## Contact
If you have questions about this privacy policy, contact ${p.contactEmail}.
`;
}

function renderHtml(p: PolicyInputs, markdown: string): string {
  // Lightweight self-contained HTML so gh-pages serves a polished page
  // without needing a Jekyll theme. Markdown body is rendered server-side
  // by us (just paragraph + heading + list translation) so we don't ship a
  // markdown-it dependency for this single document.
  const safeName = escapeHtml(p.extensionName);
  const body = markdownToHtml(markdown);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy — ${safeName}</title>
<meta name="description" content="Privacy policy for the ${safeName} browser extension.">
<style>
  :root { color-scheme: light dark; }
  body {
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    max-width: 42rem; margin: 3rem auto; padding: 0 1.25rem;
    color: #1a1a1a; background: #fafafa;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e8e8e8; background: #111; }
    a { color: #8ab4f8; }
    code { background: #2a2a2a; }
  }
  h1 { font-size: 1.6rem; margin: 0 0 .5rem; }
  h2 { font-size: 1.05rem; margin: 2rem 0 .5rem; }
  p, ul { margin: .5rem 0; }
  ul { padding-left: 1.25rem; }
  code { background: #efefef; padding: .1em .3em; border-radius: 3px; font-size: .9em; }
  em { color: #666; }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: .85rem; color: #777; }
</style>
</head>
<body>
${body}
<footer>
This page is published from <code>store/PRIVACY.md</code> in the extension's source repository.
</footer>
</body>
</html>
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Minimal markdown → HTML for our generated document. Handles only what we
// emit: H1, H2, paragraphs, bullet lists, bold (**x**), italics (_x_), inline
// code (`x`). Not a general-purpose renderer — keep it that way.
function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) {
      flushList();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      flushList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ')) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line === '') {
      flushList();
    } else {
      flushList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return out.join('\n');

  function flushList(): void {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  }
  function inline(s: string): string {
    return escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<![a-zA-Z0-9_])_([^_]+)_(?![a-zA-Z0-9_])/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
}

// ---------- gh CLI helpers ----------

function ghAuthOk(): { account: string } | null {
  const r = s.run('gh', ['auth', 'status'], { allowNonZero: true });
  if (r.code !== 0) return null;
  // `gh auth status` writes to stderr. Look for "Logged in to github.com as <user>".
  const match = (r.stderr + r.stdout).match(/Logged in to github\.com (?:account|as) ([^\s]+)/);
  return { account: match?.[1] ?? '<unknown>' };
}

interface RepoInfo {
  owner: string;
  name: string;
  defaultBranch: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  url: string;
}

function ghRepoView(): RepoInfo | null {
  const r = s.run(
    'gh',
    ['repo', 'view', '--json', 'name,owner,defaultBranchRef,visibility,url'],
    { allowNonZero: true },
  );
  if (r.code !== 0) return null;
  const parsed = JSON.parse(r.stdout);
  return {
    owner: parsed.owner.login,
    name: parsed.name,
    defaultBranch: parsed.defaultBranchRef?.name ?? 'main',
    visibility: parsed.visibility,
    url: parsed.url,
  };
}

function pagesEnable(repo: RepoInfo): { url: string; created: boolean } {
  // First check if Pages is already enabled.
  const existing = s.run(
    'gh',
    ['api', `repos/${repo.owner}/${repo.name}/pages`, '-q', '.html_url'],
    { allowNonZero: true },
  );
  if (existing.code === 0 && existing.stdout.trim()) {
    // Already configured. We don't modify the existing source — assume the
    // user (or a previous run) set it up correctly. If they want to switch
    // sources they can do it explicitly.
    return { url: existing.stdout.trim().replace(/\/?$/, '/'), created: false };
  }

  // Not enabled. Create with source = main branch, /store path.
  const create = s.run(
    'gh',
    [
      'api',
      '-X',
      'POST',
      `repos/${repo.owner}/${repo.name}/pages`,
      '-f',
      `source[branch]=${repo.defaultBranch}`,
      '-f',
      'source[path]=/store',
    ],
    { allowNonZero: true },
  );
  if (create.code !== 0) {
    // Common: 422 if Pages is already configured but we missed it; 404 if
    // repo permissions aren't right; 403 on private+free.
    s.fail(
      'pages-enable',
      `Failed to enable GitHub Pages: ${create.stderr.trim() || create.stdout.trim()}`,
      repo.visibility === 'PRIVATE'
        ? 'Free GitHub accounts can only enable Pages on PUBLIC repos. Make the repo public or self-host with --self-host=<url>.'
        : 'Check that you have admin access to the repo: `gh repo view --json viewerPermission`.',
    );
  }
  // Re-read to get the canonical URL.
  const after = s.run(
    'gh',
    ['api', `repos/${repo.owner}/${repo.name}/pages`, '-q', '.html_url'],
    { allowNonZero: true },
  );
  const url = after.stdout.trim() || `https://${repo.owner}.github.io/${repo.name}/`;
  return { url: url.replace(/\/?$/, '/'), created: true };
}

async function pollUrl(url: string, opts: { timeoutMs: number; intervalMs: number }): Promise<boolean> {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < opts.timeoutMs) {
    attempt += 1;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (res.ok) return true;
    } catch {
      // network error, retry
    }
    if (!s.jsonMode) {
      process.stdout.write(`  poll #${attempt}: not ready yet (${Math.round((Date.now() - start) / 1000)}s)\r`);
    }
    await new Promise((r) => setTimeout(r, opts.intervalMs));
  }
  if (!s.jsonMode) process.stdout.write('\n');
  return false;
}

// ---------- Welcome config write ----------

function writeWelcomeConfigPrivacy(url: string): { changed: boolean; previous: string } {
  if (!existsSync(WELCOME_CONFIG_PATH)) {
    // Welcome page was stripped; nothing to wire.
    return { changed: false, previous: '<no welcome config>' };
  }
  const src = readFileSync(WELCOME_CONFIG_PATH, 'utf8');
  // Match the `privacy:` field inside `links`. Single or double quotes,
  // tolerate trailing comma. We only touch the value, not surrounding lines.
  const re = /(privacy:\s*)(['"`])([^'"`]*)\2/;
  const match = src.match(re);
  if (!match) {
    s.fail(
      'welcome-config',
      `Could not locate \`privacy:\` field in ${WELCOME_CONFIG_PATH}`,
      'The welcome config may have been edited unexpectedly. Add `privacy: \'<url>\'` inside `links` and re-run.',
    );
  }
  const previous = match![3];
  if (previous === url) return { changed: false, previous };
  const next = src.replace(re, `$1$2${url}$2`);
  writeFileSync(WELCOME_CONFIG_PATH, next);
  return { changed: true, previous };
}

// ---------- Main flow ----------

async function main(): Promise<void> {
  // 1. Manifest.
  const manifest = loadManifest();
  const extensionName =
    manifest.name && manifest.name !== 'My Extension'
      ? manifest.name
      : await s.prompt('Extension name (manifest.name is still default):', 'My Extension');
  s.emit({ type: 'manifest', status: 'ok', name: extensionName });

  // 2. Contact email.
  const gitEmail = s.run('git', ['config', '--get', 'user.email'], { allowNonZero: true }).stdout.trim();
  const contactEmail =
    CONTACT_EMAIL_ARG ?? (await s.prompt('Contact email for privacy questions:', gitEmail || 'you@example.com'));
  if (!contactEmail) s.fail('preflight', 'Contact email is required.');

  // 3. Generate policy content.
  const inputs: PolicyInputs = {
    extensionName,
    contactEmail,
    dataHandling: DATA_HANDLING,
    permissions: manifest.permissions ?? [],
    hostPermissions: [...(manifest.host_permissions ?? []), ...(manifest.optional_host_permissions ?? [])].filter(
      (h) => h !== 'https://example.com/*',
    ),
    date: new Date().toISOString().slice(0, 10),
  };
  const md = renderMarkdown(inputs);
  const html = renderHtml(inputs, md);

  // 4. Write to store/.
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  const mdPath = join(STORE_DIR, 'PRIVACY.md');
  const htmlPath = join(STORE_DIR, 'index.html');
  const nojekyllPath = join(STORE_DIR, '.nojekyll');

  if (existsSync(mdPath) && !FORCE) {
    const existing = readFileSync(mdPath, 'utf8');
    if (existing !== md) {
      const proceed = await s.prompt(`store/PRIVACY.md already exists and differs from generated content. Overwrite? (y/N)`, 'N');
      if (!proceed.toLowerCase().startsWith('y')) {
        s.emit({ type: 'generate', status: 'skipped', reason: 'user declined overwrite' });
        process.exit(0);
      }
    }
  }
  writeFileSync(mdPath, md);
  writeFileSync(htmlPath, html);
  if (!existsSync(nojekyllPath)) writeFileSync(nojekyllPath, '');
  s.emit({ type: 'generate', status: 'created', files: ['store/PRIVACY.md', 'store/index.html', 'store/.nojekyll'] });

  if (NO_PUBLISH) {
    s.emit({ type: 'done', status: 'ok', mode: 'no-publish', url: null });
    return;
  }

  // 5. Resolve final URL: self-host or gh-pages.
  let finalUrl: string;
  if (SELF_HOST_URL) {
    finalUrl = SELF_HOST_URL;
    s.emit({ type: 'self-host', status: 'ok', url: finalUrl });
    const reachable = await pollUrl(finalUrl, { timeoutMs: 10_000, intervalMs: 2_000 });
    s.emit({ type: 'pages-poll', status: reachable ? 'ok' : 'failed', url: finalUrl });
    if (!reachable && !s.jsonMode) {
      console.warn(`  warning: ${finalUrl} did not return 200 within 10s. Continuing anyway — the URL may not be live yet.`);
    }
  } else {
    // gh CLI preflight.
    const which = s.run('which', ['gh'], { allowNonZero: true });
    if (which.code !== 0) {
      s.fail(
        'preflight',
        '`gh` CLI not found on PATH.',
        'Install: `brew install gh` (macOS) or https://cli.github.com/. Or skip with --self-host=<url>.',
      );
    }
    const auth = ghAuthOk();
    if (!auth) {
      s.fail(
        'gh-auth',
        '`gh` is not authenticated.',
        'Run `gh auth login` once, then re-run this script. Or skip with --self-host=<url>.',
      );
    }
    s.emit({ type: 'gh-auth', status: 'ok', account: auth!.account });

    const repoInfo = ghRepoView();
    if (!repoInfo) {
      s.fail(
        'gh-repo',
        'No GitHub repo found for this directory.',
        'Either `gh repo create` first, or skip with --self-host=<url>.',
      );
    }
    const repo = repoInfo!;
    s.emit({
      type: 'gh-repo',
      status: 'ok',
      owner: repo.owner,
      name: repo.name,
      visibility: repo.visibility,
      defaultBranch: repo.defaultBranch,
    });

    if (repo.visibility === 'PRIVATE') {
      s.emit({
        type: 'gh-repo',
        status: 'failed',
        message: 'Free GitHub Pages requires a PUBLIC repo.',
        hint: 'Make the repo public (`gh repo edit --visibility public`), upgrade to Pro/Team, or use --self-host=<url>.',
      });
      process.exit(1);
    }

    // store/ files must be committed and pushed before Pages can serve them.
    // We leave that to the user — surface a clear next-step instead of doing
    // a silent commit/push (taste: never push code without consent).
    const status = s.run('git', ['status', '--porcelain', 'store/'], { allowNonZero: true });
    if (status.stdout.trim()) {
      s.emit({
        type: 'pages-enable',
        status: 'pending',
        message: 'Generated files in store/ are uncommitted. Commit and push before Pages can serve them.',
        hint: `git add store/ && git commit -m "chore: add privacy policy" && git push`,
      });
    }

    const pages = pagesEnable(repo);
    finalUrl = pages.url;
    s.emit({
      type: 'pages-enable',
      status: pages.created ? 'created' : 'exists',
      url: finalUrl,
      sourceBranch: repo.defaultBranch,
      sourcePath: '/store',
    });

    s.emit({ type: 'pages-poll', status: 'pending', url: finalUrl, timeoutMs: 90_000 });
    const reachable = await pollUrl(finalUrl, { timeoutMs: 90_000, intervalMs: 5_000 });
    s.emit({ type: 'pages-poll', status: reachable ? 'ok' : 'failed', url: finalUrl });
    if (!reachable && !s.jsonMode) {
      console.warn(
        `  warning: ${finalUrl} did not return 200 within 90s. GitHub Pages can take a few minutes on first enable. The validator will re-check on next \`npm run check:cws:ship\`.`,
      );
    }
  }

  // 6. Wire URL into welcome config.
  const wcResult = writeWelcomeConfigPrivacy(finalUrl);
  s.emit({
    type: 'welcome-config',
    status: wcResult.changed ? 'created' : 'exists',
    url: finalUrl,
    previous: wcResult.previous,
  });

  s.emit({ type: 'done', status: 'ok', url: finalUrl });
}

main().catch((err) => {
  s.emit({
    type: 'error',
    status: 'failed',
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(2);
});
