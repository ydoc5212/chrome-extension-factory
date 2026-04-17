# CCE Entry UX Redesign — Design Spec

**Status:** Draft for review
**Date:** 2026-04-16
**Scope:** A — entry UX (skill-driven scaffold + npm wrapper). B (pipeline pivot) and C (ship polish) are separate.

## Problem

The factory ships as `git clone <repo>`. That's not the "CCE of CRA" experience. Create-React-App's value is the one-liner: type `npx create-react-app my-thing`, get a working thing. CCE has all the pieces — WXT template, validators, skills — but the entry UX is a manual clone + "invoke `/cws-init` in Claude Code."

The template also assumes "start with everything, delete what you don't need." The opposite of zero-config — it asks users to subtract.

## Goal

One-liner entry that produces a **tailored** scaffold: profile-matched, feature-correct, with bespoke first-run code for the user's specific idea. Skill-driven where judgment matters, CLI-thin where it doesn't.

## Non-goals

- Pipeline/knowledge-base redesign (B — separate spec).
- Ship flow polish, listing auto-generation, new validator rules beyond what already exist (C — phase 2).
- Replacing WXT, React, Tailwind, or any dep.
- Removing or restructuring existing scripts (`check:cws`, `ship`, `screenshots`).

## Architecture

Two entry points, one destination:

```
npx create-chrome-extension my-thing ──┐
                                        ├──► factory repo at ./my-thing
                                        │    + skill installed in Claude Code
                                        │    + /cce-init ready to run
npx skills add <this-repo>            ──┘
```

Either path converges on: factory repo exists, skill is installed, user runs `/cce-init` to do the real work.

### Entry point 1: `npx create-chrome-extension <name>`

Separate npm package (published from this repo or a tiny sibling repo). Thin wrapper:

1. `git clone <factory-repo> ./<name>`
2. `cd <name> && npm install`
3. Install the `/cce-init` skill into the user's Claude Code (shell out to `npx skills add` or equivalent, whatever convention this repo adopts)
4. Print a loud banner: "Open Claude Code in `./<name>/` and run `/cce-init`"
5. Exit

No prompts. No questions. All judgment deferred to the skill.

### Entry point 2: `npx skills add <this-repo>`

Hyperframes-style. Installs `/cce-init` globally in Claude Code. User invokes `/cce-init` wherever they want a new project; the skill handles cloning.

Both paths land the user at the same state: factory repo + skill ready + one command away from a tailored scaffold.

## The skill: `/cce-init`

Transformation of the existing `/cws-init`. Rename, expand scope.

### Detect

On invocation:
- If in a factory repo (detected by presence of `wxt.config.ts` + `scripts/validate-cws.ts`): continue to interview.
- Otherwise: offer to clone. Ask for a target directory. Use `git clone` or `gh repo create --template`. Skill continues in the new directory.

### Interview (front-loaded)

One conversational pass, no scaffolding yet. Claude asks:

1. **The pitch** (free-text): "What are you building? One or two sentences."
2. **Target sites**: URL patterns where the extension runs. Validates against review-trap patterns (no broad `<all_urls>` in `host_permissions` or `content_scripts.matches` — the existing validator would catch this anyway, but the skill flags it upfront to shape the scaffold).
3. **Surface**: popup / sidepanel / content-only / hybrid. Claude proposes a default from the pitch; user confirms or overrides.
4. **Features**: auth? storage (local vs sync vs IndexedDB)? keyboard shortcuts? welcome page? background alarms?
5. **Listing basics**: public name, one-line tagline. Used to populate the listing template stub.

Claude may ask clarifying follow-ups mid-interview where the pitch is ambiguous, but doesn't scaffold until the interview is done.

(Interleaved mode — scaffold after each answer, show progress, adjust — is deferred. We can switch if front-loaded proves wrong in practice.)

### Scaffold (one burst, after interview)

Judgment-heavy. Claude does it all in one pass:

- Delete unused entrypoints for the chosen profile (follows `docs/01-extension-type-profiles.md` rules).
- Tailor `wxt.config.ts` / manifest fields: `name`, `description`, `host_permissions`, `permissions`, `content_scripts.matches`, `action`, `side_panel`.
- Generate **bespoke** first-run code in the kept entrypoints — actual logic for the user's idea, not just boilerplate. E.g., "block tracker requests on news sites" gets a content-script skeleton that hooks the specific DOM patterns the user described, not a generic hello-world.
- Populate `docs/templates/store-listing.md` with a draft from the pitch + tagline.
- Populate `docs/templates/privacy-policy.md` reflecting the perms actually picked.
- Run `npm run check:cws` to confirm the scaffold passes structural validation.

### Handoff

- Run `npm run dev` (opens Chrome with the extension loaded).
- Print the next-steps list: "When you have UI, invoke `/cws-screens`. When ready to ship, `npm run ship`."
- Skill exits but remains available for follow-ups — rejection triage, feature adds, debugging.

### Composability

`/cce-init` is the orchestrator. It should **delegate to existing skills** rather than reimplement:

- `/cws-screens` — screenshots. Not inlined.
- `/cws-video` — launch video. Not inlined.
- Any listing-refinement skill (future) — not inlined.

`/cce-init` calls them by reference at handoff time. This keeps each skill narrow and independently testable, and lets users invoke any sub-skill directly without going through init.

## Changes to the repo

1. **Rename** `.claude/skills/cws-init/` → `.claude/skills/cce-init/` (or wherever the skill file lives in this repo's convention). Update references in `README.md` and `CLAUDE.md`.
2. **Expand** the skill body:
   - Add detect-and-clone preamble.
   - Swap profile menu → pitch-driven recommendation.
   - Add bespoke-code generation step with clear prompts to Claude about what "tailored" means.
   - Ensure it calls `/cws-screens` and `/cws-video` by reference, not inline.
3. **Create** a new `create-chrome-extension` npm package (in a separate directory or sibling repo — TBD during implementation). ~50–100 LOC: clone, install, skills-add, banner, exit.
4. **Update** `README.md`:
   - Replace the current "Quick Start" with the one-liner.
   - Keep `git clone` as a documented alternative for transparency.
   - Move the "strip what you don't need" language into `/cce-init`'s skill description; it's no longer the user-facing story.
5. **Verify** skill discoverability:
   - Confirm `npx skills add <this-repo>` finds and installs `/cce-init` given this repo's skill directory layout. If layout doesn't match the convention (hyperframes uses a specific structure), move the skill file.

## Testing

End-to-end:

- **Cold path 1**: `npx create-chrome-extension demo-a` in a scratch dir → verify repo cloned, deps installed, skill registered, banner printed.
- **Cold path 2**: `npx skills add <repo>` in Claude Code → `/cce-init` in a non-factory dir → skill offers to clone.
- **Warm path**: inside a factory repo already, run `/cce-init` → skill detects state and skips to interview.
- **Interview smoke**: run the interview with a realistic pitch ("ad blocker for specific news sites"); verify Claude picks a reasonable profile, asks the right follow-ups, scaffolds code that isn't boilerplate.
- **Scaffold correctness**: `npm run check:cws` green post-scaffold for each profile × feature combination. No broad host patterns ever land in `host_permissions` or `content_scripts.matches`.
- **Composability**: `/cws-screens` invokable standalone (not just through init). `/cws-video` same.

No unit tests for the skill content itself — skills are prompts, and prompts are validated by end-to-end runs.

## Error handling

- **Clone fails** (network, auth): skill reports the error, doesn't leave a partial directory.
- **Skill install fails** (Claude Code not installed, wrong version): CLI degrades to "repo cloned, deps installed, but couldn't install the skill — here's how to install manually."
- **Scaffold fails** (`check:cws` red after scaffold): skill reports which rule failed and offers to correct. User can re-interview or exit and hand-edit.
- **Interview abandoned mid-flow**: skill exits gracefully; repo remains in full-template state (reversible: user can re-invoke later).

## Migration / rollout

1. Land the renamed `/cce-init` skill in a PR. Keep `/cws-init` as an alias for one release so existing users aren't broken.
2. Publish `create-chrome-extension` v0.1.0 to npm. Test both paths.
3. Update `README.md`.
4. Announce.
5. Next release: drop the `/cws-init` alias.

## Risks

- **Bespoke code quality.** Claude-generated "tailored" code could be worse than template-strip. Mitigation: always run `check:cws` post-scaffold; fall back to template-strip with menu if bespoke fails validation. If this risk materializes across several users, we switch interview to offer "use the template" escape at each step.
- **Skill discoverability convention drift.** `npx skills add` convention may shift. Mitigation: pin to whatever this repo's ecosystem standardizes on; revisit if the convention changes.
- **Two-package maintenance.** Syncing the factory repo with the `create-chrome-extension` npm package is overhead. Mitigation: keep the npm package minimal (<100 LOC); it has no reason to change except when the clone target or skill-install mechanism changes.

## Open questions (to resolve at implementation time, not now)

- Exact layout for `npx skills add` compatibility — depends on which convention we adopt (hyperframes `.skills/`, Claude Code plugin manifest, etc.).
- Should the npm package live in this repo (as a `packages/cli/` subdir) or a sibling repo? Monorepo is simpler; sibling is cleaner. Default: start as a subdir, extract later if it grows.
- Does `/cce-init` need a `--resume` mode for abandoned interviews? Probably not in v1.

## Deferred to later specs

- **B (pipeline pivot)** — footnote-library recommendation drafted by subagent; user reviewing separately.
- **C (ship polish)** — validator rule additions (Red Titanium etc.), listing auto-generation, `npm run ship` consolidation.
