/**
 * Shared types for the screenshot fallback ladder
 * (docs/07-fallback-ladders.md). Imported by:
 *   - screenshots/capture.ts            (writes ladder-status.json)
 *   - screenshots/app/[id]/page.tsx     (renders the rung)
 *   - scripts/validate-cws.ts           (reads ladder-status.json)
 *
 * Rungs, top to bottom:
 *   - manual       — a hand-captured PNG at `screenshots/manual/<id>.png`
 *                    overrode the auto pipeline. Ship-acceptable; the user
 *                    took responsibility for the artifact.
 *   - real-build   — `.output/chrome-mv3/<surface>.html` exists and was
 *                    rendered into the BrowserFrame via iframe.
 *                    Ship-acceptable.
 *   - concept-card — typographic stub with extension name + tagline.
 *                    Diagonal STUB watermark applied. Not ship-acceptable.
 *
 * Status file location is repo-root-relative; both writers and the reader
 * resolve it the same way.
 */

export type Rung = 'manual' | 'real-build' | 'concept-card';

export const SHIP_ACCEPTABLE_RUNGS: ReadonlySet<Rung> = new Set([
  'manual',
  'real-build',
]);

export interface LadderEntry {
  artifactId: string;
  landedRung: Rung;
  shipAcceptable: boolean;
  reason: string | null;
}

export interface LadderStatus {
  schemaVersion: 1;
  generatedAt: string;
  screenshots: LadderEntry[];
}

export const LADDER_STATUS_RELATIVE_PATH = '.factory/ladder-status.json';
