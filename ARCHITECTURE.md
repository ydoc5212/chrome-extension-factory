# Architecture

Canonical design doc for the Chrome Extension Factory. **Read this before adding a feature, a skill, or a gate.** It explains how the repo thinks: where deterministic code belongs, where the model belongs, and how the plugin-with-sub-skills layer hangs off the factory.

This document is the source of truth. `CLAUDE.md` is a Claude-facing orientation that points here. When this doc and the code disagree, this doc is aspirational — update it or fix the code so they match.

---

## Core principle — lean on scripts, not on model recall

Rules that matter are encoded as scripts that pass or fail, not as prose a reader is expected to remember. The validator (`scripts/validate-cws.ts`) is the source of truth for *what's true*; `docs/09-cws-best-practices.md` is context for *why*. When in doubt, run the script.

This principle has two corollaries:

1. **If a rule exists only in prose, it only gets enforced by vibes.** Prose rots. Scripts fail loud.
2. **Don't ask the model to do what grep can do.** Pattern detection, presence checks, policy enforcement → scripts. Judgment, taste, synthesis, voice → model.

---

## The automation surface — the gates

The user (human or AI) interacts with a small, opinionated set of commands. Each has a clearly-defined passing/failing contract and a clearly-defined state on a fresh factory clone.

| Command | When it runs | What it enforces | Factory state |
|---|---|---|---|
| `npm run compile` | manual, CI | TypeScript correctness | ✓ green |
| `npm run check:cws` | every push to CI | well-formed extension structure (13 rules) | ✓ green |
| `npm run check:cws:ship` | manual | structural + listing/welcome content filled in (16 rules; 1 opt-in) | ✗ red (by design) |
| `npm run zip` | manual, to package for CWS upload | **gated on `check:cws:ship`** — no zip is produced until ship is green | ✗ refuses (by design) |
| `npm run version-sync` | manual, inside `ship` | local `package.json` version > live CWS version | ✓ skips cleanly without CWS secrets |
| `npm run ship` | manual, to publish to CWS | `check:cws:ship` → `version-sync` → `wxt zip` → `publish-cws` | halts at first red gate; publish step is opt-in on secrets |

The user never has to know "remember to run the validator." The ship path runs it automatically. The only way to produce a submittable artifact is through a gate that checks everything.

---

## Division of labor — deterministic vs. model

| Concern | Lives in | Why |
|---|---|---|
| Pattern detection (broad `*://*/*`, `eval()`, `unsafe-eval`, MAIN-world) | Script | Regex is deterministic; the model will sometimes miss. |
| Presence checks (name set, icon 128 present, listing fields real) | Script | Boolean; no judgment required. |
| Policy enforcement (no remote code, no unused permissions, CSP locked) | Script | The rule is stable; the answer is yes/no. |
| Side-effects (build, zip, submit, version bump) | Script | Must be reproducible; CI must be able to run it. |
| Orchestration (run validator, interpret output, loop until green) | Skill | The model can read, branch, decide "try this fix, re-run, move on." |
| Elicitation ("what's your one-sentence value prop?") | Skill | Conversational; the model is the only good interface. |
| Judgment ("is this name spammy / SEO-stuffed / trademark-risky?") | Skill | Contextual; regex is too coarse. |
| Synthesis ("write three candidate descriptions in different voices") | Skill | Creative; this is what the model is for. |
| Translating errors into conversation ("that rule fired because X, let's fix it by Y") | Skill | Rule ids are stable, but *how to help a user fix one* is a recipe, not a regex. |

**Rule of thumb:** if you can write a test for it, it belongs in a script. If the answer depends on context you have to ask the user, it belongs in a skill.

---

## Architecture — plugin with sub-skills over a scripted substrate

```
                  ┌────────────────────────────────────────┐
                  │  Plugin: chrome-extension-factory      │
                  │                                         │
                  │  Skills (conversational entry points):  │
                  │   • cws-init      scaffold & customize  │
                  │   • cws-content   draft copy/justifications│
                  │   • cws-screens   generate screenshots  │
                  │   • cws-ship      orchestrate submit    │
                  └─────────────────────┬───────────────────┘
                                        │
                                        │ skills invoke scripts
                                        ▼
                  ┌────────────────────────────────────────┐
                  │  Repo (deterministic substrate):        │
                  │   • scripts/validate-cws.ts             │
                  │     (pattern, presence, policy)         │
                  │   • scripts/cws-api.ts                  │
                  │     (shared OAuth client wrapper)       │
                  │   • scripts/publish-cws.ts              │
                  │     (CWS API submit + poll)             │
                  │   • scripts/version-sync.ts             │
                  │     (local manifest ↔ CWS dashboard)    │
                  │   • entrypoints/welcome/                │
                  │     (runtime permission pattern)        │
                  │   • CLAUDE.md, ARCHITECTURE.md, docs/   │
                  │     (orientation + rationale)           │
                  └────────────────────────────────────────┘
```

**Skills handle the conversation. Scripts handle correctness and side-effects.** A skill invokes scripts; it does not re-implement what they do. Each skill is a thin orchestration layer keyed off the validator's structured output.

Example flow — user says "ship this":

1. Skill runs `npm run check:cws:ship -- --json`.
2. Skill parses findings. For each rule id that fired, the skill has a conversational recipe (interview the user, draft candidates, edit the file).
3. Skill re-runs the validator until green.
4. Skill offers to `npm run ship` (or equivalent) to submit.

The validator doesn't know Claude exists. It emits stable rule ids. The skill maps rule ids → recipes.

---

## Conventions that make this work

- **Rule ids are public API.** Skills key off `finding.rule`. Renaming a rule is a breaking change for every skill that uses it. If you must rename, update skill mappings in the same PR.
- **Scripts emit structured output.** `--json` mode is not optional for anything a skill consumes. Human-readable output is for humans; JSON is for skills and other tools.
- **Gates must fail loudly.** Non-zero exit, `✗ error` in output, clear "fix:" line. A silent-failure gate is worse than no gate.
- **Features requiring external auth are opt-in.** If the secret isn't set, the script no-ops cleanly — it does not fail. Contributors don't want a red CI badge because they didn't paste OAuth tokens. Pattern: see `.github/workflows/keepalive-publish.yml`'s "enabled" gate.
- **The factory must be pre-ship by default.** `check:cws:ship` fails on a fresh clone because the user hasn't customized yet. That's the forcing function. Don't "fix" it by populating real-looking placeholders.
- **Validator rules may be async.** A rule function returns `Finding[] | Promise<Finding[]>`. Async rules exist for checks that hit the network (`listing-drift`). If the network call fails, the rule should return `[]` with a note to stderr — never fail the validator on a transient CWS / connectivity issue.
- **`--json` envelope shape is shared across scripts.** `scripts/validate-cws.ts`, `scripts/version-sync.ts`, and `scripts/publish-cws.ts` all emit `schemaVersion: 1` envelopes. Additive-only: new fields OK, renaming / removing requires a `schemaVersion` bump.

### Skill conventions

Conventions for how skills are laid out, what they can assume, and how they interact with the scripted substrate. Established in Session 2 (cws-content) and applies to every subsequent skill.

- **Location.** Skills live at `/skills/<skill-name>/SKILL.md`. The directory may hold extra files (templates, reference prompts) but `SKILL.md` is the canonical entry point. See `/skills/README.md` for the browsable index.
- **Frontmatter.** Each `SKILL.md` opens with an optional YAML frontmatter block. Recognized fields:
  - `name` — matches the directory name. Used as the skill's public identifier.
  - `description` — one-paragraph summary of what the skill does and when it applies.
  - `triggers` — list of natural-language invocation hints ("user wants to fill in listing copy", "ship mode validator is red"). Not regex; guidance for the model deciding whether to invoke.
  - `invokes` — scripts/commands the skill calls. Documents the skill's dependencies on the scripted substrate.
  - `writes` — files the skill is permitted to modify. The skill must not touch any file not in this list.
  The body of the file is the prompt presented to Claude when the skill is invoked. Write it as instructions to Claude, not as documentation for humans.
- **Skills read `--json` from scripts; they never re-implement deterministic checks.** If you're tempted to re-derive "is this ship-ready" inside a skill, stop — that logic belongs in `scripts/validate-cws.ts` and the skill consumes its findings.
- **Skills key off stable `rule` ids, not human-readable messages.** `finding.rule` is the contract; `finding.message` is for humans and may be reworded. Branching on message text is a latent bug.
- **Recipe pattern.** When a skill handles multiple related errors, it dispatches to named recipes — one rule id maps to one conversational flow. Recipes are the unit of reuse: `cws-ship` (Session 3) invokes the same recipe definitions as `cws-content` rather than duplicating them.
- **Skills must re-run the relevant validator after each file write.** If the rule id that triggered the recipe still appears in findings, the write didn't match what the rule checks. Show the user the output and ask — don't loop blindly.
- **One conversational responsibility per skill.** Sub-skills are cheap; mega-skills become dumping grounds. Splitting cws-content (fills copy) from cws-ship (submits) keeps each coherent.

---

## How to extend

### Add a new validator rule

1. Write a `(ctx: Context) => Finding[]` function in `scripts/validate-cws.ts`.
2. Pick a stable, kebab-case rule id (`host-permissions-breadth`, `ship-ready-welcome-config`). Rule ids become part of the skill API.
3. Each finding must have: `rule`, `severity` (`error` | `warn`), `message`, `why`, `source` (URL preferred), `fix` (actionable; should reference specific files or commands).
4. Add the function to either `STRUCTURAL_RULES` (always runs, must pass on factory) or `SHIP_ONLY_RULES` (runs in ship mode, may fail on factory by design).
5. Document the rule in `docs/09-cws-best-practices.md` under the relevant category with evidence label (a/b/c/d).

### Add a new skill

1. Identify the user intent the skill serves ("help me write listing copy," "help me generate screenshots"). If it overlaps an existing skill, prefer extension over duplication.
2. Skill invokes scripts via `--json` and branches on rule ids / script output. Skills do not re-implement deterministic checks.
3. Skill has ONE conversational responsibility. Sub-skills are cheap; mega-skills become dumping grounds.
4. Document the skill's scripts dependencies: if it calls `scripts/publish-cws.ts`, note that the script is required and lives in the repo.

### Add a new automation gate

1. Decide which question the gate answers. Name it after the question: `check:cws` answers "is this well-formed"; `check:cws:ship` answers "am I ready to submit."
2. Gates run scripts. If a gate needs new logic, that logic goes in a script first.
3. Wire the gate into the command that should trigger it. Example: `zip` gating on `check:cws:ship` means the ship gate runs whenever someone tries to produce a submission artifact. Users don't have to remember it exists.
4. Update the automation-surface table in this doc.

---

## Planned extensions

Each of these follows the principle above: the deterministic piece lives in a script; the conversational piece (if any) lives in a skill.

| Item | Kind | Notes |
|---|---|---|
| ~~`--json` output mode on validator~~ | Script extension | **Done.** `validate-cws.ts --json` emits `schemaVersion: 1` envelope consumed by skills. |
| ~~`scripts/version-sync.ts`~~ | Script | **Done (Session 1).** Reads CWS live version via OAuth. No-ops without secrets; exits 1 only when local ≤ remote. `--json` supported. |
| ~~`scripts/publish-cws.ts`~~ | Script | **Done (Session 1).** Uploads zip, publishes, polls status, emits structured state transitions. No-ops without secrets. `--json` supported. |
| ~~`npm run ship`~~ | Gate | **Done (Session 1).** `check:cws:ship && version-sync && wxt zip && publish-cws`. First halt wins. |
| ~~`listing-drift` validator rule~~ | Script rule | **Done (Session 1).** Warn-severity; ship-only; returns `[]` without secrets (factory invariant preserved). |
| `cws-ship` skill | Skill | Orchestrates the full submission flow using `--json` output. Maps each rule id to a conversational fix recipe. |
| `cws-content` skill | Skill | **Done (Session 2).** Lives at `/skills/cws-content/SKILL.md`. Elicits name, description, value prop, justifications, privacy policy URL. Writes to `wxt.config.ts` + `entrypoints/welcome/config.ts`. Runs validator to confirm. See "Skill conventions" above for the `/skills/<name>/SKILL.md` layout Sessions 3-5 will follow. |
| `cws-screens` skill + repo infrastructure | Skill + Script | Next.js page with browser-chrome frame, 1280×800 export. Distinct from the iOS `app-store-screenshots` skill. Separate conversation — screenshots iterate independently of listing copy. |
| `cws-init` skill | Skill | First-time setup: clone, name, OAuth secrets walkthrough, first `cws-content` pass. |

---

## Known limitations / deferred

- **Privacy policy hosting.** Users need a publicly-accessible privacy policy URL. The factory provides a template but does not publish it. Auto-publishing via GitHub Pages is possible but out of scope; users host their own.
- **Draft vs. live listing state.** CWS distinguishes draft from published listing changes. `listing-drift` will need to read draft state to avoid false positives on in-progress listing edits.
- **Updates workflow vs. first submission.** Subsequent versions of a published extension hit different review rules (change-of-functionality re-review, etc.). `cws-ship` skill will need an "update" mode that reads the current published listing and diffs against local.
- **Cross-browser parallel.** The repo supports Firefox builds (`build:firefox`). AMO (addons.mozilla.org) submission has its own rules and API; a `amo-ship` parallel is possible but deferred. The validator's rules are currently Chrome-specific.
- **CWS rollback.** CWS has limited rollback. If a bad version ships, the remedy is to submit an emergency patch. No automation here; the skill should warn when shipping and surface a clear rollback recipe if review fails post-publish.
- **Trademark / spam pre-checks for names and descriptions.** Currently judgment-level (skill responsibility). Could be scripted against a blocklist but likely low value.
- **Smoke tests of the built extension.** `npm run build` verifies the bundler succeeded; nothing verifies the extension actually runs. Manual QA via `npm run dev` is the only check today. A headless Chrome smoke test is possible but deferred.

---

## If you're a contributor

- Before adding a feature, ask: does this belong in a script or a skill?
- If you're writing prose as the enforcement mechanism, stop — write a script.
- If you're asking the model to pattern-match, stop — write a script.
- If you're writing a grep-like script to ask the user questions, stop — that's a skill.
- Update this doc when you add a new gate, skill, or convention. Stale architecture docs are worse than no architecture docs.
