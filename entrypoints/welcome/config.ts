/**
 * Welcome page configuration.
 *
 * This is the form you fill out per-extension. Everything the welcome page
 * renders comes from here — the page itself is generic.
 *
 * Principles encoded in the type:
 *
 * - `valueProp` is one short sentence. If you need a paragraph, your
 *   extension is doing too many things or your copy needs work.
 * - `activationSurfaces` is the "where this runs" list. It frames the
 *   permission asks as narrow rather than scary.
 * - Each step has a REQUIRED `justification`. There is no escape hatch
 *   for "Grant access" copy with no reason — the type forbids it.
 * - `links` are required (repo + issues + privacy). They make up the trust
 *   footer; without them, the page renders as if shipped by a stranger.
 *
 * To strip the welcome flow entirely (smart-defaults extensions where
 * onboarding is friction), delete `entrypoints/welcome/` and the
 * `tabs.create` block in `entrypoints/background.ts`.
 * See docs/10-onboarding.md.
 */

import type { PermissionsRequest } from '@/utils/permissions';

export type PermissionStep = {
  /** Stable id used as the React key and storage discriminator. */
  id: string;
  /** Short label shown next to the checkbox. e.g. "Access to github.com" */
  label: string;
  /**
   * One specific sentence: "So we can highlight your PR reviews."
   * Never "Grant access." If you can't articulate the why, don't ask.
   */
  justification: string;
  /** What chrome.permissions.request() receives when the user clicks. */
  permissions: PermissionsRequest;
  /** Optional reassurance shown next to the button. e.g. "Nothing leaves your device." */
  privacyNote?: string;
  /** Button label. Defaults to "Allow" if omitted. Keep it specific. */
  cta?: string;
};

export type WelcomeConfig = {
  /** One sentence. Plain language. Shown as the page subhead. */
  valueProp: string;
  /**
   * "Where this extension activates." Bullets render verbatim.
   * Empty array = no activation list (rare; leave the section out).
   */
  activationSurfaces: string[];
  /**
   * Optional single image or muted-loop webm above the checklist.
   * No carousels — one demo, one story.
   */
  demoMedia?: { src: string; alt: string; type?: 'image' | 'video' };
  /**
   * Permission requests, rendered as an always-visible checklist.
   * Empty array = no permission asks (welcome page becomes a thank-you).
   */
  steps: PermissionStep[];
  /** Trust footer links. All three required. */
  links: {
    repo: string;
    issues: string;
    privacy: string;
  };
};

export const welcomeConfig: WelcomeConfig = {
  valueProp:
    'A brief one-sentence description of what this extension does for the user.',
  activationSurfaces: [
    'example.com pages',
    // Add the actual URLs/surfaces this extension touches.
  ],
  steps: [
    {
      id: 'host-example',
      label: 'Access to example.com',
      justification:
        'So the extension can read and modify pages on example.com to provide its core feature.',
      permissions: { origins: ['https://example.com/*'] },
      privacyNote: 'Nothing leaves your device.',
      cta: 'Allow on example.com',
    },
  ],
  links: {
    repo: 'https://github.com/your-org/your-extension',
    issues: 'https://github.com/your-org/your-extension/issues',
    privacy: 'https://your-org.example/privacy',
  },
};
