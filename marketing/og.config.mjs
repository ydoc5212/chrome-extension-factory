// marketing/og.config.mjs — configuration for the og-card skill.
//
// Edit these fields, then run:
//   ${CLAUDE_PLUGIN_ROOT}/skills/og-card/scripts/render.sh marketing/og.config.mjs
//
// Output lands at `assets/og.png` (1200×630, the standard social-preview size
// used by Twitter / Slack / iMessage / LinkedIn / GitHub's social-preview slot).

export default {
  name: "create-chrome-extension",
  label: "CLAUDE PLUGIN",
  taglineLine1: "Ship Chrome extensions",
  taglineLine2: "in one Claude session.",
  subtitle: "Scaffold, fill the listing, render screenshots, wire OAuth, submit to the Web Store.",
  footer: "github.com/codyhxyz/create-chrome-extension",
  theme: "dark",
  accent: "#34A853",
};
