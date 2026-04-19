// Pops a styled Finder window after a build/zip so the user can drag the
// artifact onto the right place (chrome://extensions for local testing, or
// the CWS devconsole for publishing).
//
// Usage:
//   node scripts/install-window.mjs load      (after wxt build)
//   node scripts/install-window.mjs upload    (after wxt zip)
import path from 'node:path';
import os from 'node:os';
import { existsSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.resolve(process.cwd(), '.output');
const built = path.join(outputRoot, 'chrome-mv3');

const mode = process.argv[2] || 'load';
const platform = os.platform();

const CONFIG = {
  load: {
    stageRoot: path.join(outputRoot, 'install'),
    bgSrc: path.resolve(__dirname, '..', 'assets', 'finder-bg-load.png'),
    stageFn: (root) => stageFolder(root, built, 'chrome-mv3'),
    destUrl: 'chrome://extensions',
    openUrl: false, // user already has Chrome open usually; don't steal focus
    flowText: [
      'A big Finder window just opened with the chrome-mv3 folder + drag instructions.',
      '',
      'Drag chrome-mv3 onto chrome://extensions (Developer Mode must be on).',
    ],
  },
  upload: {
    stageRoot: path.join(outputRoot, 'publish'),
    bgSrc: path.resolve(__dirname, '..', 'assets', 'finder-bg-upload.png'),
    stageFn: (root) => stageZip(root),
    destUrl: 'https://chrome.google.com/webstore/devconsole/',
    openUrl: true, // user needs to navigate to devconsole — do it for them
    flowText: [
      'A Finder window opened with your .zip. Chrome is opening the CWS devconsole.',
      '',
      'In the devconsole: pick your extension → Package → Upload new package,',
      'then drop the .zip onto the upload modal.',
    ],
  },
};

const cfg = CONFIG[mode];
if (!cfg) {
  console.error(`install-window: unknown mode "${mode}" (use load | upload)`);
  process.exit(2);
}

// Find the newest .zip in .output (wxt zip writes with a versioned name)
function findLatestZip() {
  if (!existsSync(outputRoot)) return null;
  const zips = readdirSync(outputRoot)
    .filter((f) => f.endsWith('.zip') && !f.startsWith('.'))
    .map((f) => ({ f, m: statSync(path.join(outputRoot, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return zips[0] ? path.join(outputRoot, zips[0].f) : null;
}

function stageFolder(stageRoot, srcFolder, leafName) {
  rmSync(stageRoot, { recursive: true, force: true });
  mkdirSync(path.join(stageRoot, '.background'), { recursive: true });
  if (existsSync(cfg.bgSrc)) copyFileSync(cfg.bgSrc, path.join(stageRoot, '.background/bg.png'));
  const dest = path.join(stageRoot, leafName);
  const r = spawnSync('cp', ['-cR', srcFolder, dest]);
  if (r.status !== 0) spawnSync('cp', ['-R', srcFolder, dest]);
  return existsSync(dest) ? { leaf: leafName } : null;
}

function stageZip(stageRoot) {
  const zipSrc = findLatestZip();
  if (!zipSrc) return null;
  rmSync(stageRoot, { recursive: true, force: true });
  mkdirSync(path.join(stageRoot, '.background'), { recursive: true });
  if (existsSync(cfg.bgSrc)) copyFileSync(cfg.bgSrc, path.join(stageRoot, '.background/bg.png'));
  const leaf = path.basename(zipSrc);
  const dest = path.join(stageRoot, leaf);
  const r = spawnSync('cp', ['-c', zipSrc, dest]);
  if (r.status !== 0) copyFileSync(zipSrc, dest);
  return existsSync(dest) ? { leaf } : null;
}

function runAS(script, timeout = 12000) {
  return spawnSync('osascript', ['-e', script], { timeout, encoding: 'utf8' });
}

// Finder window geometry — matches the 700x480 bg image 1:1
const WIN_W = 700;
const WIN_H = 480;
const ICON_X = 200;
const ICON_Y = 240;
const ICON_SIZE = 200;

function openFinderFancy(stageDir, leaf, bgPath) {
  const script = `
    set stageDir to "${stageDir}"
    set bgPath to "${bgPath || ''}"
    tell application "Finder"
      try
        set stale to every Finder window whose target is (POSIX file stageDir as alias)
        repeat with w in stale
          close w
        end repeat
      end try
      reopen
      activate
      set deskBounds to bounds of window of desktop
      set screenW to (item 3 of deskBounds) - (item 1 of deskBounds)
      set screenH to (item 4 of deskBounds) - (item 2 of deskBounds)
      set winL to (screenW - ${WIN_W}) div 2
      set winT to (screenH - ${WIN_H}) div 2
      set winR to winL + ${WIN_W}
      set winB to winT + ${WIN_H}
      set containerFolder to (POSIX file stageDir as alias)
      open containerFolder
      delay 0.45
      tell front Finder window
        set current view to icon view
        set toolbar visible to false
        set statusbar visible to false
        set sidebar width to 0
        set bounds to {winL, winT, winR, winB}
        set index to 1
      end tell
      tell icon view options of front Finder window
        set arrangement to not arranged
        set icon size to ${ICON_SIZE}
        set text size to 13
        set label position to bottom
        if bgPath is not "" then
          try
            set background picture to (POSIX file bgPath as alias)
          end try
        end if
      end tell
      try
        set position of item "${leaf}" of containerFolder to {${ICON_X}, ${ICON_Y}}
      end try
      try
        update containerFolder without necessity
      end try
      try
        close front Finder window
      end try
      delay 0.3
      reopen
      activate
      open containerFolder
      delay 0.35
      tell front Finder window
        set bounds to {winL, winT, winR, winB}
        set toolbar visible to false
        set statusbar visible to false
        set index to 1
      end tell
      activate
    end tell
    try
      tell application "Finder" to set pathbar visible to false
    end try
    tell application "System Events"
      try
        set frontmost of process "Finder" to true
      end try
    end tell
  `;
  return runAS(script).status === 0;
}

function openUrlInChrome(url) {
  // Open in the existing Chrome if running; otherwise launch it. Don't force
  // window bounds — let the user arrange.
  const script = `
    set theUrl to "${url}"
    if application "Google Chrome" is running then
      tell application "Google Chrome"
        activate
        try
          set found to false
          repeat with w in windows
            repeat with t in tabs of w
              if URL of t starts with theUrl then
                set active tab index of w to (index of t)
                set index of w to 1
                set found to true
                exit repeat
              end if
            end repeat
            if found then exit repeat
          end repeat
          if not found then
            if (count of windows) is 0 then
              make new window
            end if
            tell front window to make new tab with properties {URL:theUrl}
          end if
        end try
      end tell
    else
      do shell script "open -na 'Google Chrome' --args " & quoted form of theUrl
    end if
    tell application "Finder" to activate
  `;
  runAS(script, 10000);
}

function revealFallback(target) {
  const [cmd, ...args] =
    platform === 'darwin' ? ['open', '-R', target] :
    platform === 'win32' ? ['explorer', `/select,${target}`] :
    ['xdg-open', path.dirname(target)];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}

// --- main ---

let staged = null;
if (platform === 'darwin') {
  staged = cfg.stageFn(cfg.stageRoot);
}

if (platform === 'darwin' && staged) {
  const bgPath = path.join(cfg.stageRoot, '.background/bg.png');
  openFinderFancy(cfg.stageRoot, staged.leaf, existsSync(bgPath) ? bgPath : null);
  if (cfg.openUrl) openUrlInChrome(cfg.destUrl);
} else {
  // non-macOS, or staging failed — just reveal the raw artifact
  const target = mode === 'upload' ? findLatestZip() : built;
  if (target) revealFallback(target);
}

const shownArtifact = staged
  ? path.join(cfg.stageRoot, staged.leaf)
  : (mode === 'upload' ? findLatestZip() : built);

console.log(`
  ✓ ${mode === 'upload' ? 'Ship artifact' : 'Build output'}:
    ${shownArtifact || '(not found)'}

  ${cfg.flowText.join('\n  ')}
`);
