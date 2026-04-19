/**
 * Types for the screenshot fallback ladder (docs/07-fallback-ladders.md).
 * Imported by screenshots/capture.ts (writes the status file) and
 * screenshots/app/[id]/page.tsx (renders the rung).
 *
 * scripts/validate-cws.ts owns its own minimal view of the JSON shape; the
 * snapshot test catches drift if these and that diverge.
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
 */

export type Rung = 'manual' | 'real-build' | 'concept-card';

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
