// Generates Finder-window background PNGs for the install-flow window.
// Usage:
//   node scripts/generate-finder-bg.mjs load    -> assets/finder-bg-load.png
//   node scripts/generate-finder-bg.mjs upload  -> assets/finder-bg-upload.png
//   node scripts/generate-finder-bg.mjs         -> regenerates both
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'assets');

const VARIANTS = {
  load: {
    eyebrow: 'Ready to load',
    dotColor: '#1fb83b',
    headlineTop: 'Drag onto',
    headlineEmph: null,
    urlText: 'chrome://extensions',
    hintPre: 'With',
    hintKbd: 'Developer mode',
    hintPost: 'on (top-right toggle)',
    cornerTag: 'local install flow',
    gradientA: '#4a6cff',
    gradientB: '#7b3ff2',
    arrowTop: '#4a6cff',
  },
  upload: {
    eyebrow: 'Ready to ship',
    dotColor: '#ff8a3b',
    headlineTop: 'Drop into the',
    headlineEmph: 'Chrome Web Store',
    urlText: 'devconsole →',
    hintPre: 'Click',
    hintKbd: 'Upload new package',
    hintPost: "then release it on the drop zone",
    cornerTag: 'chrome web store upload',
    gradientA: '#ff6b3b',
    gradientB: '#c33764',
    arrowTop: '#ff6b3b',
  },
};

function html(v) {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 700px; height: 480px;
    background:
      radial-gradient(ellipse at 28% 38%, rgba(88,120,255,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 78%, rgba(255,120,90,0.14) 0%, transparent 55%),
      linear-gradient(135deg, #f7f9fc 0%, #e6ecf4 100%);
    font-family: -apple-system, 'SF Pro Display', 'Inter', sans-serif;
    position: relative; overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(15,21,35,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,21,35,0.04) 1px, transparent 1px);
    background-size: 24px 24px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  }
  .text { position: absolute; left: 410px; top: 80px; width: 270px; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 10px; text-transform: uppercase; letter-spacing: 2.5px;
    color: #4a5364; font-weight: 700; margin-bottom: 14px;
    background: rgba(255,255,255,0.7);
    padding: 5px 9px; border-radius: 999px;
    border: 1px solid rgba(15,21,35,0.08);
  }
  .eyebrow::before {
    content: ''; width: 5px; height: 5px; border-radius: 50%;
    background: ${v.dotColor}; box-shadow: 0 0 0 3px ${v.dotColor}33;
  }
  .headline-top {
    font-size: 26px; font-weight: 700; line-height: 1;
    color: #0f1523; margin-bottom: 4px; letter-spacing: -0.4px;
  }
  .headline-emph {
    font-size: 30px; font-weight: 800; line-height: 1;
    margin-bottom: 18px; letter-spacing: -0.8px;
    background: linear-gradient(90deg, ${v.gradientA}, ${v.gradientB});
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .url-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'SF Mono', 'JetBrains Mono', 'Menlo', monospace;
    background: #0f1523; color: #fff;
    padding: 9px 14px; border-radius: 9px;
    font-size: 14px; font-weight: 500;
    box-shadow: 0 10px 28px rgba(15,21,35,0.26), 0 2px 6px rgba(15,21,35,0.12);
    letter-spacing: 0.2px;
  }
  .url-pill::before {
    content: '↳'; color: ${v.gradientA}; font-weight: 700;
    font-family: -apple-system; font-size: 16px;
  }
  .hint {
    font-size: 11px; color: #6b7382; margin-top: 16px; line-height: 1.55;
    font-weight: 500;
  }
  .hint kbd {
    display: inline-block; font-family: inherit; font-size: 10px;
    padding: 1px 6px; background: rgba(255,255,255,0.9);
    border: 1px solid rgba(15,21,35,0.12); border-radius: 4px;
    box-shadow: 0 1px 0 rgba(15,21,35,0.08);
    color: #0f1523; font-weight: 600;
  }
  .arrow {
    position: absolute; left: 290px; top: 290px;
    width: 190px; height: 130px; overflow: visible;
  }
  .corner {
    position: absolute; left: 24px; bottom: 18px;
    font-family: 'SF Mono', monospace;
    font-size: 9px; color: #aeb5c2;
    letter-spacing: 1.2px; text-transform: uppercase;
  }
  .corner::before { content: '⌂ '; opacity: 0.6; }
</style></head><body>
  <div class="grid"></div>
  <svg class="arrow" viewBox="0 0 190 130" xmlns="http://www.w3.org/2000/svg" fill="none">
    <defs>
      <marker id="head" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
        <path d="M0,0 L0,6 L7.5,3 z" fill="#0f1523"/>
      </marker>
      <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${v.arrowTop}"/>
        <stop offset="100%" stop-color="#0f1523"/>
      </linearGradient>
    </defs>
    <path d="M 8 115 C 40 115, 80 40, 175 16"
          stroke="url(#arrowGrad)" stroke-width="3"
          stroke-linecap="round" fill="none" marker-end="url(#head)"/>
  </svg>
  <div class="text">
    <div class="eyebrow">${v.eyebrow}</div>
    <div class="headline-top">${v.headlineTop}</div>
    ${v.headlineEmph ? `<div class="headline-emph">${v.headlineEmph}</div>` : ''}
    <div class="url-pill">${v.urlText}</div>
    <div class="hint">${v.hintPre} <kbd>${v.hintKbd}</kbd> ${v.hintPost}</div>
  </div>
  <div class="corner">${v.cornerTag}</div>
</body></html>`;
}

async function render(mode) {
  const variant = VARIANTS[mode];
  if (!variant) throw new Error(`unknown mode: ${mode}`);
  const outPath = path.join(assetsDir, `finder-bg-${mode}.png`);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 700, height: 480 } });
    await page.setContent(html(variant), { waitUntil: 'load' });
    await page.screenshot({ path: outPath, omitBackground: false });
    console.log(`  ✓ wrote ${outPath}`);
  } finally {
    await browser.close();
  }
}

const mode = process.argv[2];
const modes = mode ? [mode] : Object.keys(VARIANTS);
for (const m of modes) await render(m);
