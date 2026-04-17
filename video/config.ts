/**
 * Chrome Web Store launch-video configuration.
 *
 * The factory ships video on by default. Taste decision (ARCHITECTURE.md →
 * Planned extensions → cws-video): extensions with a promo video convert
 * markedly better on CWS, and the same asset doubles as a launch asset for
 * ProductHunt, Twitter, LinkedIn, etc. One video, many surfaces.
 *
 * To generate: invoke the `/cws-video` skill (which wraps
 * `heygen-com/hyperframes`). Install the external skill with:
 *   npx skills add heygen-com/hyperframes
 *
 * To strip video entirely (you genuinely don't want one):
 *   rm -rf video/
 * The `ship-ready-video` validator rule no-ops on an absent `video/` folder,
 * matching how `screenshots/` is handled.
 *
 * Principles encoded in the type:
 *
 * - `hook` is the one-sentence line that appears on-screen in the first 3
 *   seconds AND is spoken (if you have a voiceover). Concrete benefit, not
 *   feature list. "Highlights PRs you've been asked to review" — not "GitHub
 *   productivity tool."
 * - `beats` is 3–5 timed segments. Classic 30-second structure:
 *     0–3s hook  ·  3–15s problem + solution  ·  15–25s key features  ·  25–30s CTA
 *   Longer launch videos (60–90s) stretch each beat, same arc.
 * - `exports` drives how many files hyperframes emits. Pick whichever targets
 *   you'll actually use — generating all four is fine (they reuse the same
 *   source) but keeps the output dir clean if you scope to just CWS at first.
 * - `brand` is optional. Leave empty to use hyperframes' reasonable defaults.
 *
 * The factory ships 1 placeholder entry with deliberately-bad copy ("Your
 * killer feature here", "your-extension-name"). The validator rule
 * `ship-ready-video` blocks ship mode until these placeholders are gone AND
 * at least one exported file sits in `.output/videos/`.
 */

export type VideoExportTarget = {
  /** CWS listing promo video embed. Cap: 30 seconds. Uploaded to YouTube. */
  cws?: boolean;
  /** ProductHunt launch video. Sweet spot: 60 seconds. MP4. */
  productHunt?: boolean;
  /** Twitter / LinkedIn horizontal (16:9). 60s MP4. */
  socialHorizontal?: boolean;
  /** Instagram / TikTok / Shorts vertical (9:16). 30s MP4. */
  socialVertical?: boolean;
};

export interface VideoBeat {
  /** Stable id. Used for referencing in hyperframes output / edits. */
  id: string;
  /** Seconds from start. Beats should be in strictly-increasing order. */
  startAt: number;
  /** On-screen caption / subtitle for this beat. One line, ~8 words. */
  caption: string;
  /**
   * What to show visually. Free text — hyperframes interprets this as a
   * direction (e.g., "popup opens over a GitHub PR page, yellow highlight
   * pulses on reviewer avatar"). Be specific enough that a human director
   * could shoot it.
   */
  visual: string;
  /**
   * Optional voiceover line. Omit for silent / captions-only video.
   * One sentence. Reads at ~2 words per second at a normal pace.
   */
  narration?: string;
}

export interface VideoBrand {
  /** Path to a logo image (SVG or PNG) relative to the repo root. */
  logoPath?: string;
  /** Primary brand color as a hex string (e.g., "#3B82F6"). */
  primaryColor?: string;
  /**
   * Hyperframes voice id for narration (e.g., "en-US-casual-female").
   * Leave undefined to use hyperframes' default.
   */
  voice?: string;
}

export interface VideoConfig {
  /**
   * Target length in seconds. CWS caps embedded promo at 30s. ProductHunt /
   * social usually works best at 60s. Longer than 90s starts losing attention.
   */
  targetLengthSeconds: 30 | 60 | 90;
  /**
   * Name of the extension as it should appear in the video. This is NOT
   * the manifest.name — it's the marketing form (often the same, sometimes
   * cleaner — e.g. manifest.name="PR Reviewer Highlighter" →
   * video.extensionName="PR Highlighter").
   */
  extensionName: string;
  /**
   * One-sentence hook. First 3 seconds of the video. Concrete benefit.
   * Good: "Highlights PRs you've been asked to review."
   * Bad: "The productivity tool you've been waiting for."
   */
  hook: string;
  /**
   * 3–5 beats covering the arc. See file header for the 30-second structure.
   */
  beats: VideoBeat[];
  /** Which export targets hyperframes should produce. */
  exports: VideoExportTarget;
  /** Optional brand customization. */
  brand?: VideoBrand;
}

/**
 * Factory-default placeholder. Change all of these before shipping.
 * The validator rule `ship-ready-video` greps for "Your killer feature here"
 * and "your-extension-name" (distinctive strings that survive partial edits)
 * and blocks `npm run check:cws:ship` until they are gone.
 */
export const video: VideoConfig = {
  targetLengthSeconds: 30,
  extensionName: 'your-extension-name',
  hook: 'Your killer feature here, in one sentence.',
  beats: [
    {
      id: 'hook',
      startAt: 0,
      caption: 'Your killer feature here',
      visual: 'Logo pulse; extension name appears. Replace this copy before shipping.',
      narration: 'Your one-sentence hook goes here.',
    },
    {
      id: 'problem',
      startAt: 3,
      caption: 'The specific problem your users have',
      visual: 'Show the user struggling without the extension — real screen recording preferred.',
      narration: 'Here is the exact pain point, described in one sentence.',
    },
    {
      id: 'solution',
      startAt: 12,
      caption: 'What your extension does about it',
      visual: 'Install the extension; show it activating on the same screen.',
      narration: 'The extension does this one thing; demonstrate it plainly.',
    },
    {
      id: 'feature',
      startAt: 20,
      caption: 'One secondary feature worth highlighting',
      visual: 'Zoom in on a specific UI element that delivers the secondary benefit.',
      narration: 'Plus: one more thing users will love.',
    },
    {
      id: 'cta',
      startAt: 26,
      caption: 'Get it on the Chrome Web Store',
      visual: 'Extension name, CWS badge, link / URL.',
      narration: 'Available on the Chrome Web Store.',
    },
  ],
  exports: {
    cws: true,
    productHunt: true,
    socialHorizontal: true,
    socialVertical: false,
  },
};
