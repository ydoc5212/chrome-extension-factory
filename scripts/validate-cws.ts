/**
 * Chrome Web Store "taste validator".
 *
 * Two tiers (see docs/09-cws-best-practices.md → "Design philosophy"):
 *
 *   STRUCTURAL — "is this extension well-formed?"
 *     Always passes on the factory template. Runs in CI. Catches regressions
 *     you introduce: broad host patterns, unused permissions, CSP holes,
 *     remote code, SW keepalives, missing icons, length limits, etc.
 *
 *   SHIP      — "am I ready to submit to the Chrome Web Store?"
 *     Structural + content readiness (real name, real description, no
 *     factory placeholders). Runs before submission. Fails on a fresh
 *     template — by design.
 *
 * Usage:
 *   npm run check:cws              # structural only (CI-safe, default)
 *   npm run check:cws:ship         # structural + submission-readiness
 *   npx tsx scripts/validate-cws.ts [--ship] [--json] [output-dir]
 *
 * Flags:
 *   --ship   enable submission-readiness rules
 *   --json   emit structured findings to stdout for skill consumers
 *            (suppresses human-readable output)
 *
 * Exit codes:
 *   0 — no errors (warnings may still print)
 *   1 — one or more errors
 *   2 — validator setup problem (no build output)
 *
 * Rule ids are public API — skills key off `finding.rule`. See ARCHITECTURE.md.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';
import { loadSecrets, getListing } from './cws-api.js';

const ROOT = resolve(import.meta.dirname, '..');
const ARGS = process.argv.slice(2);
const SHIP_MODE = ARGS.includes('--ship');
const JSON_MODE = ARGS.includes('--json');
const POSITIONAL = ARGS.filter((a) => !a.startsWith('--'));
const OUTPUT_DIR = POSITIONAL[0] || join(ROOT, '.output', 'chrome-mv3');
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json');
const DOC_URL = 'docs/09-cws-best-practices.md';

const BROAD_PATTERNS = new Set([
  '<all_urls>',
  '*://*/*',
  'https://*/*',
  'http://*/*',
  '*://*',
]);

const SENSITIVE_PERMS = new Set([
  'tabs',
  'cookies',
  'downloads',
  'webRequest',
  'webRequestBlocking',
]);

// Permissions used via manifest fields, not chrome.<perm>.* calls.
const DECLARATIVE_PERMS = new Set(['sidePanel']);

type Severity = 'error' | 'warn';

interface Finding {
  rule: string;
  severity: Severity;
  message: string;
  why: string;
  source?: string;
  fix: string;
  locations?: string[];
}

interface SourceFile {
  relPath: string;
  content: string;
}

interface Context {
  manifest: Record<string, any>;
  sources: SourceFile[];
  backgroundSources: SourceFile[];
}

function loadManifest(): Record<string, any> {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`ERROR: No built manifest at ${relative(ROOT, MANIFEST_PATH)}`);
    console.error('Run `npm run build` first.');
    process.exit(2);
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

const SKIP_DIRS = new Set(['node_modules', '.output', '.wxt', '.git', 'dist']);
const FILE_RE = /\.(ts|tsx|js|jsx|html)$/;

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (FILE_RE.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function loadSources(): SourceFile[] {
  const roots = ['entrypoints', 'utils', 'components'];
  const files: SourceFile[] = [];
  for (const r of roots) {
    for (const full of walk(join(ROOT, r))) {
      files.push({
        relPath: relative(ROOT, full),
        content: readFileSync(full, 'utf8'),
      });
    }
  }
  const config = join(ROOT, 'wxt.config.ts');
  if (existsSync(config)) {
    files.push({
      relPath: 'wxt.config.ts',
      content: readFileSync(config, 'utf8'),
    });
  }
  return files;
}

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

// ---------- Rules ----------

function hostPermissionsBreadth(ctx: Context): Finding[] {
  const hp: string[] = ctx.manifest.host_permissions ?? [];
  const broad = hp.filter((p) => BROAD_PATTERNS.has(p));
  if (broad.length === 0) return [];
  return [
    {
      rule: 'host-permissions-breadth',
      severity: 'error',
      message: `Broad host_permissions declared: ${broad.join(', ')}`,
      why: 'Broad host patterns trigger the developer-console "in-depth review" banner and significantly delay approval.',
      source: 'https://developer.chrome.com/docs/webstore/review-process',
      fix: 'Move these origins to `optional_host_permissions` and request at runtime from a user gesture. See `entrypoints/welcome/App.tsx`.',
    },
  ];
}

function contentScriptsMatchesBreadth(ctx: Context): Finding[] {
  const cs: any[] = ctx.manifest.content_scripts ?? [];
  const findings: Finding[] = [];
  cs.forEach((entry, i) => {
    const broad = (entry.matches ?? []).filter((m: string) =>
      BROAD_PATTERNS.has(m),
    );
    if (broad.length > 0) {
      findings.push({
        rule: 'content-scripts-matches-breadth',
        severity: 'error',
        message: `content_scripts[${i}].matches uses broad pattern(s): ${broad.join(', ')}`,
        why: 'Broad content-script matches count as broad host permissions for review purposes (Simeon Vincent, Chrome DevRel).',
        source:
          'https://groups.google.com/a/chromium.org/g/chromium-extensions/c/S1_uqpDFVzY',
        fix: 'Narrow `matches` to specific origins, or remove `content_scripts` and inject programmatically via `chrome.scripting.executeScript` + `activeTab`.',
      });
    }
  });
  return findings;
}

function unusedPermission(ctx: Context): Finding[] {
  const perms: string[] = ctx.manifest.permissions ?? [];
  const findings: Finding[] = [];
  const corpus = ctx.sources.map((s) => s.content).join('\n');
  for (const p of perms) {
    if (DECLARATIVE_PERMS.has(p)) {
      if (p === 'sidePanel' && !ctx.manifest.side_panel) {
        findings.push({
          rule: 'unused-permission',
          severity: 'error',
          message: `'sidePanel' declared but no \`side_panel\` manifest field`,
          why: 'Unused permissions extend review time and can cause rejection.',
          source:
            'https://nearform.com/digital-community/extension-reviews/',
          fix: 'Remove `sidePanel` from `permissions`, or add a sidepanel entrypoint.',
        });
      }
      continue;
    }
    const used =
      new RegExp(`\\b(?:browser|chrome)\\.${p}\\b`).test(corpus);
    if (!used) {
      findings.push({
        rule: 'unused-permission',
        severity: 'error',
        message: `'${p}' declared in manifest.permissions but no chrome.${p}.* / browser.${p}.* call found in source`,
        why: 'Unused permissions extend review time and can cause rejection.',
        source: 'https://nearform.com/digital-community/extension-reviews/',
        fix: `Remove '${p}' from \`wxt.config.ts\` permissions, or add the usage if intentional.`,
      });
    }
  }
  return findings;
}

function sensitivePermissionDeclared(ctx: Context): Finding[] {
  const perms: string[] = ctx.manifest.permissions ?? [];
  const sensitive = perms.filter((p) => SENSITIVE_PERMS.has(p));
  if (sensitive.length === 0) return [];
  return [
    {
      rule: 'sensitive-permission-declared',
      severity: 'warn',
      message: `Sensitive permission(s) declared: ${sensitive.join(', ')}`,
      why: '`tabs`, `cookies`, `downloads`, `webRequest` get extra verification and slow review.',
      source: 'https://developer.chrome.com/docs/webstore/review-process',
      fix: 'Confirm each is actually needed. Prefer `activeTab` over `tabs`; prefer `declarativeNetRequest` over `webRequest`. Be ready to justify each in the CWS dashboard.',
    },
  ];
}

function cspExtensionPages(ctx: Context): Finding[] {
  const csp = ctx.manifest.content_security_policy;
  if (!csp) return [];
  const policy =
    typeof csp === 'string' ? csp : csp.extension_pages ?? '';
  if (!policy) return [];
  const findings: Finding[] = [];
  if (/unsafe-eval/.test(policy)) {
    findings.push({
      rule: 'csp-extension-pages',
      severity: 'error',
      message: `content_security_policy.extension_pages contains 'unsafe-eval'`,
      why: 'MV3 disallows `unsafe-eval` in `extension_pages`; will be rejected.',
      source:
        'https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy',
      fix: 'Remove `unsafe-eval`. For WebAssembly use `wasm-unsafe-eval`.',
    });
  }
  const scriptSrc = policy.match(/script-src\s+([^;]+)/);
  if (scriptSrc) {
    const values: string[] = scriptSrc[1].trim().split(/\s+/);
    const disallowed = values.filter(
      (v) =>
        !v.startsWith(`'`) &&
        !v.startsWith('http://localhost') &&
        !v.startsWith('http://127.0.0.1'),
    );
    if (disallowed.length > 0) {
      findings.push({
        rule: 'csp-extension-pages',
        severity: 'error',
        message: `content_security_policy.extension_pages script-src has external origin(s): ${disallowed.join(', ')}`,
        why: 'Only `self`, `wasm-unsafe-eval`, and (unpacked) localhost are allowed in `extension_pages` script-src.',
        source:
          'https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy',
        fix: 'Remove external origins. Bundle dependencies locally via Vite.',
      });
    }
  }
  return findings;
}

function remoteCodePatterns(ctx: Context): Finding[] {
  const findings: Finding[] = [];
  const patterns: Array<[RegExp, string]> = [
    [/\beval\s*\(/g, 'eval() call'],
    [/\bnew\s+Function\s*\(/g, 'new Function() call'],
    [/<script[^>]+src\s*=\s*["']https?:/gi, '<script src="http..."> tag'],
    [/\bimport\s*\(\s*["'`]https?:/g, 'dynamic import() of remote URL'],
  ];
  for (const src of ctx.sources) {
    for (const [re, label] of patterns) {
      for (const match of src.content.matchAll(re)) {
        findings.push({
          rule: 'remote-code-patterns',
          severity: 'error',
          message: `Remote-code pattern detected: ${label}`,
          why: 'MV3 and CWS policy ban remote code execution (Blue Argon).',
          source:
            'https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements',
          fix: 'Remove the dynamic-code pattern; bundle all logic locally. If this is a string or comment, rephrase to avoid the literal pattern.',
          locations: [`${src.relPath}:${lineOf(src.content, match.index ?? 0)}`],
        });
      }
    }
  }
  return findings;
}

function swKeepaliveHack(ctx: Context): Finding[] {
  const findings: Finding[] = [];
  for (const src of ctx.backgroundSources) {
    for (const match of src.content.matchAll(/\bsetInterval\s*\(/g)) {
      findings.push({
        rule: 'sw-keepalive-hack',
        severity: 'warn',
        message: `setInterval() in background service worker`,
        why: 'Periodic timers used to keep the SW alive are an anti-pattern and may be flagged. Service workers are designed to wake on events.',
        source:
          'https://groups.google.com/a/chromium.org/g/chromium-extensions/c/k5upFLVnPqE',
        fix: 'Use `chrome.alarms` for scheduled work; use event listeners for reactive work.',
        locations: [`${src.relPath}:${lineOf(src.content, match.index ?? 0)}`],
      });
    }
  }
  return findings;
}

function offscreenMissingJustification(ctx: Context): Finding[] {
  const findings: Finding[] = [];
  const re = /\.offscreen\.createDocument\s*\(([^)]*)\)/gs;
  for (const src of ctx.sources) {
    for (const match of src.content.matchAll(re)) {
      const arg = match[1] ?? '';
      const hasJustification = /justification\s*:/i.test(arg);
      const isEmpty = /justification\s*:\s*['"`]\s*['"`]/.test(arg);
      if (!hasJustification || isEmpty) {
        findings.push({
          rule: 'offscreen-missing-justification',
          severity: 'error',
          message: `chrome.offscreen.createDocument() with missing or empty \`justification\``,
          why: 'Reviewers read the `justification` string; empty values cause rejection.',
          source:
            'https://developer.chrome.com/blog/Offscreen-Documents-in-Manifest-v3',
          fix: 'Provide a specific, human-readable justification describing why this offscreen document is necessary.',
          locations: [`${src.relPath}:${lineOf(src.content, match.index ?? 0)}`],
        });
      }
    }
  }
  return findings;
}

function warMatchesBreadth(ctx: Context): Finding[] {
  const war: any[] = ctx.manifest.web_accessible_resources ?? [];
  const findings: Finding[] = [];
  war.forEach((entry, i) => {
    const broad = (entry.matches ?? []).filter((m: string) =>
      BROAD_PATTERNS.has(m),
    );
    if (broad.length > 0) {
      findings.push({
        rule: 'war-matches-breadth',
        severity: 'warn',
        message: `web_accessible_resources[${i}].matches is broad: ${broad.join(', ')}`,
        why: 'Broad `web_accessible_resources` makes your extension resources addressable by any site; reviewers flag this.',
        source:
          'https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources',
        fix: 'Scope `matches` to the specific origins that need access to these resources.',
      });
    }
  });
  return findings;
}

function contentScriptMainWorld(ctx: Context): Finding[] {
  const cs: any[] = ctx.manifest.content_scripts ?? [];
  const findings: Finding[] = [];
  cs.forEach((entry, i) => {
    if (entry.world === 'MAIN') {
      findings.push({
        rule: 'content-script-main-world',
        severity: 'warn',
        message: `content_scripts[${i}] uses \`world: "MAIN"\``,
        why: 'MAIN world shares JS with the host page: no `chrome.*` APIs, and the host can tamper with your script.',
        source:
          'https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts',
        fix: 'Use `ISOLATED` (the default) unless you specifically need to share the page\'s execution context.',
      });
    }
  });
  return findings;
}

// Structural: manifest has name/description/icons and they're within length limits.
// Template default values are fine here — that's a ship-time concern.
function listingFieldsPresent(ctx: Context): Finding[] {
  const findings: Finding[] = [];
  const { name, description, icons } = ctx.manifest;
  if (!name) {
    findings.push({
      rule: 'listing-fields-present',
      severity: 'error',
      message: `manifest.name is missing`,
      why: 'Missing title is a Yellow Zinc rejection.',
      source: 'https://developer.chrome.com/docs/webstore/troubleshooting',
      fix: 'Set `manifest.name` in `wxt.config.ts` (≤45 chars).',
    });
  } else if (name.length > 45) {
    findings.push({
      rule: 'listing-fields-present',
      severity: 'error',
      message: `manifest.name is ${name.length} chars (max 45)`,
      why: 'CWS enforces a 45-char limit on name.',
      source: 'https://developer.chrome.com/docs/webstore/best-listing',
      fix: 'Shorten the name.',
    });
  }
  if (!description) {
    findings.push({
      rule: 'listing-fields-present',
      severity: 'error',
      message: `manifest.description is missing`,
      why: 'Missing description is a Yellow Zinc rejection.',
      source: 'https://developer.chrome.com/docs/webstore/troubleshooting',
      fix: 'Set `manifest.description` in `wxt.config.ts` (≤132 chars).',
    });
  } else if (description.length > 132) {
    findings.push({
      rule: 'listing-fields-present',
      severity: 'warn',
      message: `manifest.description is ${description.length} chars (CWS tile shows ~132)`,
      why: 'Long descriptions get truncated in the CWS tile.',
      source: 'https://developer.chrome.com/docs/webstore/best-listing',
      fix: 'Front-load the critical info into the first 132 chars.',
    });
  }
  if (!icons || !icons['128']) {
    findings.push({
      rule: 'listing-fields-present',
      severity: 'error',
      message: `manifest.icons['128'] is missing`,
      why: '128×128 icon is required; missing icon is a Yellow Zinc rejection.',
      source: 'https://developer.chrome.com/docs/webstore/troubleshooting',
      fix: 'Ensure `assets/icon.svg` exists (@wxt-dev/auto-icons generates all sizes from it).',
    });
  }
  return findings;
}

// Ship-only: catches the factory-template placeholders. Intentionally fails
// on a fresh template — that's the forcing function.
const TEMPLATE_DEFAULTS = {
  name: 'My Extension',
  description: 'A brief description of what this extension does.',
  exampleOrigin: 'https://example.com/*',
  welcomePlaceholders: [
    'A brief one-sentence description',
    'your-org',
    'your-extension',
  ],
} as const;

function listingReadyForSubmission(ctx: Context): Finding[] {
  const findings: Finding[] = [];
  const { name, description, optional_host_permissions } = ctx.manifest;
  if (name === TEMPLATE_DEFAULTS.name) {
    findings.push({
      rule: 'listing-ready-name',
      severity: 'error',
      message: `manifest.name is still the factory default ("${TEMPLATE_DEFAULTS.name}")`,
      why: 'Shipping with the template name will fail review AND make your extension unfindable.',
      source: 'https://developer.chrome.com/docs/webstore/troubleshooting',
      fix: 'Set `manifest.name` in `wxt.config.ts` to your real extension name.',
    });
  }
  if (description === TEMPLATE_DEFAULTS.description) {
    findings.push({
      rule: 'listing-ready-description',
      severity: 'error',
      message: `manifest.description is still the factory default`,
      why: 'Shipping with the template description will fail review AND misrepresent the extension.',
      source: 'https://developer.chrome.com/docs/webstore/troubleshooting',
      fix: 'Write a real description in `wxt.config.ts` (≤132 chars; this is the CWS tile).',
    });
  }
  if (
    Array.isArray(optional_host_permissions) &&
    optional_host_permissions.includes(TEMPLATE_DEFAULTS.exampleOrigin)
  ) {
    findings.push({
      rule: 'ship-ready-optional-host',
      severity: 'error',
      message: `optional_host_permissions still contains the factory example (\`${TEMPLATE_DEFAULTS.exampleOrigin}\`)`,
      why: 'Shipping with `example.com` as a permission means your welcome flow requests access to a site you don\'t actually use — reviewers will notice.',
      source: 'https://developer.chrome.com/docs/extensions/reference/api/permissions',
      fix: 'Replace with the real origin(s) your extension needs in `wxt.config.ts`. Also update `entrypoints/welcome/config.ts` steps to match.',
    });
  }
  return findings;
}

function welcomeConfigReadyForSubmission(ctx: Context): Finding[] {
  const configFile = ctx.sources.find(
    (s) => s.relPath === 'entrypoints/welcome/config.ts',
  );
  if (!configFile) return []; // welcome page was stripped — nothing to check
  const placeholders = TEMPLATE_DEFAULTS.welcomePlaceholders.filter((p) =>
    configFile.content.includes(p),
  );
  if (placeholders.length === 0) return [];
  return [
    {
      rule: 'ship-ready-welcome-config',
      severity: 'error',
      message: `entrypoints/welcome/config.ts still contains factory placeholder(s): ${placeholders.map((p) => `"${p}"`).join(', ')}`,
      why: 'The welcome page is the first thing your users see. Shipping with "your-org" / template copy signals an abandoned extension and erodes trust.',
      source: 'docs/09-cws-best-practices.md',
      fix: 'Edit `entrypoints/welcome/config.ts`: set `valueProp`, `activationSurfaces`, `steps`, and real `links` for repo/issues/privacy. Or delete `entrypoints/welcome/` entirely if you don\'t want a welcome flow.',
    },
  ];
}

function optionalHostSuggestion(ctx: Context): Finding[] {
  const hp: string[] = ctx.manifest.host_permissions ?? [];
  if (hp.length === 0) return [];
  const alreadyFlaggedBroad = hp.some((p) => BROAD_PATTERNS.has(p));
  if (alreadyFlaggedBroad) return [];
  return [
    {
      rule: 'optional-host-suggestion',
      severity: 'warn',
      message: `host_permissions declared: ${hp.join(', ')}`,
      why: 'Any declared host access shows as an install-time warning. Runtime requests via `optional_host_permissions` leave the install prompt empty and install faster.',
      source:
        'https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings',
      fix: 'Consider moving these to `optional_host_permissions` and requesting at runtime. See `entrypoints/welcome/App.tsx`.',
    },
  ];
}

function swListenerTopLevel(ctx: Context): Finding[] {
  const findings: Finding[] = [];
  for (const src of ctx.backgroundSources) {
    const hasTopLevelAwait = /^\s*await\s+/m.test(src.content);
    const hasAddListener = /\.addListener\s*\(/.test(src.content);
    if (hasTopLevelAwait && hasAddListener) {
      findings.push({
        rule: 'sw-listener-top-level',
        severity: 'warn',
        message: `Background file uses top-level \`await\` and also registers \`addListener\``,
        why: 'Event listeners must register synchronously at top level. Top-level awaits delay registration past SW startup and cause missed events.',
        source:
          'https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle',
        fix: 'Register all listeners before any `await`. Move awaited setup inside listener callbacks instead.',
        locations: [src.relPath],
      });
    }
  }
  return findings;
}

// Structural (warn): scans built JS for string-concatenated URL patterns that
// CWS automated review has flagged as potential obfuscation (Red Titanium).
// Evidence class: c (forum-reported). Source:
//   sources/extracted/2026-04-17_google-group_red-titanium-obfuscation-minify-confusion.md
//
// Heuristic: a string literal beginning with "http://" or "https://" immediately
// followed by `+` — the canonical pattern that triggered Red Titanium in the
// reported case. Severity is warn, not error: the heuristic can fire on comments
// or log messages, and Chrome team acknowledged this as a known false-positive
// source. Fix is to replace with a hardcoded domain array.
function redTitaniumDynamicUrlConcat(_ctx: Context): Finding[] {
  if (!existsSync(OUTPUT_DIR)) return [];
  const findings: Finding[] = [];
  // Match both single- and double-quoted http(s):// literals followed by +
  const re = /(?:"https?:\/\/"|'https?:\/\/')\s*\+/g;
  for (const entry of readdirSync(OUTPUT_DIR)) {
    if (!entry.endsWith('.js')) continue;
    const full = join(OUTPUT_DIR, entry);
    if (!statSync(full).isFile()) continue;
    const content = readFileSync(full, 'utf8');
    for (const match of content.matchAll(re)) {
      const line = lineOf(content, match.index ?? 0);
      findings.push({
        rule: 'red-titanium-dynamic-url-concat',
        severity: 'warn',
        message: `Dynamic URL construction via string concatenation in built JS`,
        why: 'CWS automated review (Red Titanium) has flagged string-concatenated URL construction as potential obfuscation, even when the intent is legitimate domain allowlisting. Chrome team acknowledged this as a source of false positives.',
        source:
          'https://groups.google.com/a/chromium.org/g/chromium-extensions/c/2cO2apjQe5s',
        fix: 'Replace concatenated URL strings with a hardcoded domain array: `const ALLOWED_HOSTS = ["https://api.example.com"] as const;` — then reference `ALLOWED_HOSTS[0]` directly. See docs/09-cws-best-practices.md → "Red Titanium".',
        locations: [`.output/chrome-mv3/${entry}:${line}`],
      });
    }
  }
  return findings;
}

// Ship-only, async: compares the local manifest to the live CWS listing.
// Opt-in — returns [] cleanly when CWS secrets are not configured, so the
// factory stays green-on-structural and red-with-exactly-4-errors on ship
// for fresh clones. When secrets ARE set, an API / auth failure also
// no-ops (with a warning to stderr) rather than poisoning the report with
// a spurious rule firing.
async function listingDrift(ctx: Context): Promise<Finding[]> {
  const secrets = loadSecrets();
  if (!secrets) return [];
  let listing: Awaited<ReturnType<typeof getListing>>;
  try {
    listing = await getListing(secrets);
  } catch (err) {
    // Don't crash the validator on transient CWS errors; surface a note
    // so the user knows the drift check couldn't run.
    const message = err instanceof Error ? err.message : String(err);
    if (!JSON_MODE) {
      console.error(
        `  (note: listing-drift check skipped — CWS API call failed: ${message})`,
      );
    }
    return [];
  }
  if (!listing) return [];
  const findings: Finding[] = [];
  const localName: string | undefined = ctx.manifest.name;
  const localDescription: string | undefined = ctx.manifest.description;
  const liveName =
    typeof listing.name === 'string' ? listing.name : undefined;
  const liveDescription =
    typeof listing.summary === 'string'
      ? listing.summary
      : typeof listing.description === 'string'
        ? listing.description
        : undefined;
  if (liveName && localName && liveName !== localName) {
    findings.push({
      rule: 'listing-drift',
      severity: 'warn',
      message: `manifest.name ("${localName}") differs from live CWS listing ("${liveName}")`,
      why: 'A divergent name is a common oversight when listing edits happen in the CWS dashboard but never make it back to the repo. Users see the live name; your repo sees the local name. Sync before shipping.',
      source: 'https://developer.chrome.com/docs/webstore/best-listing',
      fix: 'Update `manifest.name` in `wxt.config.ts` to match the live CWS listing, or update the CWS dashboard to match the local manifest.',
    });
  }
  if (
    liveDescription &&
    localDescription &&
    liveDescription !== localDescription
  ) {
    findings.push({
      rule: 'listing-drift',
      severity: 'warn',
      message: `manifest.description differs from live CWS listing summary`,
      why: 'A divergent description usually means the CWS dashboard was edited directly. The manifest description is what ships in the next upload; if you ship without syncing you will overwrite the live copy.',
      source: 'https://developer.chrome.com/docs/webstore/best-listing',
      fix: 'Update `manifest.description` in `wxt.config.ts` to match the live listing, or update the CWS dashboard to match the local manifest.',
    });
  }
  return findings;
}

// Ship-only: the `screenshots/` subproject is the declarative CWS screenshot
// generator (see `screenshots/config.ts`). Two things must be true before
// submission:
//   1. `screenshots/config.ts` no longer contains factory-default placeholders.
//   2. `.output/screenshots/` exists and contains at least one `.png`.
// If the user deleted `screenshots/` entirely (chose to ship without it), the
// rule no-ops — returning [] — so the factory invariant holds for that profile.
const SCREENSHOTS_CONFIG_PATH = join(ROOT, 'screenshots', 'config.ts');
const SCREENSHOTS_OUTPUT_DIR = join(ROOT, '.output', 'screenshots');
const SCREENSHOT_PLACEHOLDERS = [
  'Your killer feature here',
  'your-target-site.com',
  'Replace this copy before shipping',
] as const;

function shipReadyScreenshots(_ctx: Context): Finding[] {
  // Subproject removed entirely → no-op. This is the "I don't need this
  // pipeline" escape hatch, matching how welcomeConfigReadyForSubmission
  // handles a deleted welcome entrypoint.
  if (!existsSync(SCREENSHOTS_CONFIG_PATH)) return [];

  // The rule surfaces ONE finding at a time so the skill has a single thing
  // to fix per validator run. Ordering is intentional:
  //   (a) If PNGs are missing, say so first — the user has to run the
  //       generator at least once regardless of config state.
  //   (b) Once PNGs exist, if the config still contains placeholders, those
  //       PNGs are still factory-template output and need regeneration with
  //       real copy.
  const hasPng =
    existsSync(SCREENSHOTS_OUTPUT_DIR) &&
    readdirSync(SCREENSHOTS_OUTPUT_DIR).some((f) =>
      f.toLowerCase().endsWith('.png'),
    );

  if (!hasPng) {
    return [
      {
        rule: 'ship-ready-screenshots',
        severity: 'error',
        message: `.output/screenshots/ has no PNGs`,
        why: 'CWS requires at least one screenshot for submission. A listing with zero screenshots cannot publish.',
        source: 'https://developer.chrome.com/docs/webstore/best-listing',
        fix: 'Run `npm run screenshots` from the repo root to generate PNGs from `screenshots/config.ts`. Or delete `screenshots/` if you\'re producing them elsewhere.',
      },
    ];
  }

  const configSource = readFileSync(SCREENSHOTS_CONFIG_PATH, 'utf8');
  const stuckPlaceholders = SCREENSHOT_PLACEHOLDERS.filter((p) =>
    configSource.includes(p),
  );

  if (stuckPlaceholders.length > 0) {
    return [
      {
        rule: 'ship-ready-screenshots',
        severity: 'error',
        message: `screenshots/config.ts still has factory placeholder(s): ${stuckPlaceholders
          .map((p) => `"${p}"`)
          .join(', ')}`,
        why: 'Shipping with factory-default screenshot copy produces CWS tiles that read as abandoned / template. The first screenshot is the search-result thumbnail — it must be real.',
        source: 'https://developer.chrome.com/docs/webstore/best-listing',
        fix: 'Edit `screenshots/config.ts` with your real headlines, subheads, and URLs, then re-run `npm run screenshots`. Or delete `screenshots/` entirely if you\'re producing screenshots elsewhere.',
      },
    ];
  }

  return [];
}

// Ship-only: the `video/` subproject is the declarative CWS launch-video
// generator (see `video/config.ts`). Parallels shipReadyScreenshots exactly.
// Taste decision: video is on by default — extensions with a promo video
// convert markedly better, and the same asset doubles for ProductHunt /
// Twitter / LinkedIn launches. Users who genuinely don't want a video delete
// `video/` entirely — the rule no-ops on absent directory, same escape-hatch
// as screenshots. See ARCHITECTURE.md → "Planned extensions" → cws-video.
const VIDEO_CONFIG_PATH = join(ROOT, 'video', 'config.ts');
const VIDEO_OUTPUT_DIR = join(ROOT, '.output', 'videos');
const VIDEO_PLACEHOLDERS = [
  'Your killer feature here',
  'your-extension-name',
  'Replace this copy before shipping',
] as const;
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'] as const;

function shipReadyVideo(_ctx: Context): Finding[] {
  // Subproject removed entirely → no-op. Explicit opt-out, same as
  // shipReadyScreenshots / welcomeConfigReadyForSubmission.
  if (!existsSync(VIDEO_CONFIG_PATH)) return [];

  // One finding at a time, same ordering as shipReadyScreenshots:
  //   (a) No exported video in .output/videos/ → tell the user to run
  //       `/cws-video` (the skill that wraps heygen-com/hyperframes).
  //   (b) Video exists but config still has placeholders → those videos are
  //       factory-template output; regenerate with real copy.
  const hasVideo =
    existsSync(VIDEO_OUTPUT_DIR) &&
    readdirSync(VIDEO_OUTPUT_DIR).some((f) => {
      const lower = f.toLowerCase();
      return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
    });

  if (!hasVideo) {
    return [
      {
        rule: 'ship-ready-video',
        severity: 'error',
        message: `.output/videos/ has no exported video (${VIDEO_EXTENSIONS.join(', ')})`,
        why: 'A launch video substantially lifts CWS install conversion, and doubles as a launch asset for ProductHunt / Twitter / LinkedIn. The factory ships video on by default because the same asset pays off on multiple surfaces.',
        source: 'https://developer.chrome.com/docs/webstore/best-listing',
        fix: 'Invoke the `/cws-video` skill to generate a video from `video/config.ts` (wraps `heygen-com/hyperframes`). Or delete `video/` if you genuinely don\'t want a promo video.',
      },
    ];
  }

  const configSource = readFileSync(VIDEO_CONFIG_PATH, 'utf8');
  const stuckPlaceholders = VIDEO_PLACEHOLDERS.filter((p) =>
    configSource.includes(p),
  );

  if (stuckPlaceholders.length > 0) {
    return [
      {
        rule: 'ship-ready-video',
        severity: 'error',
        message: `video/config.ts still has factory placeholder(s): ${stuckPlaceholders
          .map((p) => `"${p}"`)
          .join(', ')}`,
        why: 'Shipping with factory-default video copy produces a promo video with placeholder narration — worse than no video at all. The video is the first impression on CWS detail pages.',
        source: 'https://developer.chrome.com/docs/webstore/best-listing',
        fix: 'Edit `video/config.ts` with real hook, beats, and extension name, then re-invoke `/cws-video` to regenerate.',
      },
    ];
  }

  return [];
}

// ---------- Runner ----------

// Rule functions may be sync OR async. Async rules are used for checks
// that hit the network (listing-drift). Skill consumers don't see the
// difference — findings are collected before JSON is emitted.
type RuleFn = (ctx: Context) => Finding[] | Promise<Finding[]>;

const STRUCTURAL_RULES: RuleFn[] = [
  hostPermissionsBreadth,
  contentScriptsMatchesBreadth,
  unusedPermission,
  sensitivePermissionDeclared,
  cspExtensionPages,
  remoteCodePatterns,
  swKeepaliveHack,
  offscreenMissingJustification,
  warMatchesBreadth,
  contentScriptMainWorld,
  listingFieldsPresent,
  optionalHostSuggestion,
  swListenerTopLevel,
  redTitaniumDynamicUrlConcat,
];

const SHIP_ONLY_RULES: RuleFn[] = [
  listingReadyForSubmission,
  welcomeConfigReadyForSubmission,
  listingDrift,
  shipReadyScreenshots,
  shipReadyVideo,
];

async function main() {
  const manifest = loadManifest();
  const sources = loadSources();
  const backgroundSources = sources.filter((s) =>
    /entrypoints\/background\./.test(s.relPath),
  );

  const ctx: Context = { manifest, sources, backgroundSources };
  const rules: RuleFn[] = SHIP_MODE
    ? [...STRUCTURAL_RULES, ...SHIP_ONLY_RULES]
    : STRUCTURAL_RULES;
  const mode: 'structural' | 'ship' = SHIP_MODE ? 'ship' : 'structural';
  const results = await Promise.all(rules.map((r) => r(ctx)));
  const findings = results.flat();
  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warn');

  if (JSON_MODE) {
    // Stable schema consumed by skills. Additive changes only; do not rename
    // or remove fields without coordinating with skill consumers.
    const payload = {
      schemaVersion: 1,
      mode,
      rulesRun: rules.length,
      summary: {
        errors: errors.length,
        warnings: warnings.length,
      },
      findings,
      docUrl: DOC_URL,
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    process.exit(errors.length > 0 ? 1 : 0);
  }

  console.log(
    `CWS validator — mode: ${mode} (${rules.length} rule${rules.length === 1 ? '' : 's'})`,
  );

  if (findings.length === 0) {
    if (SHIP_MODE) {
      console.log(`✓ Ready to submit. All ${rules.length} checks passed.`);
    } else {
      console.log(`✓ Structural checks passed.`);
      console.log(`  Next: run \`npm run check:cws:ship\` before submitting.`);
    }
    console.log(`  Full rationale: ${DOC_URL}`);
    process.exit(0);
  }

  for (const f of findings) {
    const badge = f.severity === 'error' ? '✗ error' : '⚠ warn ';
    console.log(`\n${badge} ${f.rule}: ${f.message}`);
    console.log(`  why: ${f.why}`);
    if (f.source) console.log(`  src: ${f.source}`);
    console.log(`  fix: ${f.fix}`);
    for (const loc of f.locations ?? []) console.log(`    ${loc}`);
  }

  console.log(
    `\n— ${errors.length} error(s), ${warnings.length} warning(s) across ${rules.length} ${mode} rule${rules.length === 1 ? '' : 's'}`,
  );
  if (!SHIP_MODE && errors.length > 0) {
    console.log(
      'These are structural errors — they mean the extension has code-level problems, not just unfilled listing fields.',
    );
  }
  console.log(`Full rationale: ${DOC_URL}`);

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`CWS validator: fatal — ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
});
