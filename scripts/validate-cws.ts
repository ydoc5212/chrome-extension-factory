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

// ---------- Runner ----------

const STRUCTURAL_RULES = [
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
];

const SHIP_ONLY_RULES = [
  listingReadyForSubmission,
  welcomeConfigReadyForSubmission,
];

function main() {
  const manifest = loadManifest();
  const sources = loadSources();
  const backgroundSources = sources.filter((s) =>
    /entrypoints\/background\./.test(s.relPath),
  );

  const ctx: Context = { manifest, sources, backgroundSources };
  const rules = SHIP_MODE
    ? [...STRUCTURAL_RULES, ...SHIP_ONLY_RULES]
    : STRUCTURAL_RULES;
  const mode: 'structural' | 'ship' = SHIP_MODE ? 'ship' : 'structural';
  const findings = rules.flatMap((r) => r(ctx));
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

main();
