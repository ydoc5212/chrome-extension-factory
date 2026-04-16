# Skills

Conversational entry points for the Chrome Extension Factory. Skills are the model-facing layer over the deterministic scripts in `/scripts/`.

See [/ARCHITECTURE.md](../ARCHITECTURE.md) — especially the "Division of labor" table and the "Skill conventions" subsection — for why skills look the way they do.

## Convention

Each skill lives at:

```
/skills/<skill-name>/SKILL.md
```

The skill directory **may** contain additional files (templates, reference prompts, etc.) but `SKILL.md` is the canonical entry point that defines the skill's behavior.

### SKILL.md structure

Markdown with an optional YAML frontmatter block:

```yaml
---
name: <skill-name>                # matches the directory name
description: <one-paragraph>      # what the skill does and when to invoke it
triggers:                         # natural-language invocation hints
  - "user wants to fill in listing copy"
  - "ship mode validator is red with content errors"
invokes:                          # scripts/commands the skill runs
  - "npm run check:cws:ship -- --json"
writes:                           # files the skill is allowed to modify
  - "wxt.config.ts"
  - "entrypoints/welcome/config.ts"
---
```

The body of the file is the prompt Claude sees when the skill is invoked. Write it as instructions to Claude, not as documentation for humans.

### Rules for skill authors

- **Skills read `--json` output from scripts.** They do not re-implement deterministic checks. Pattern/presence/policy → scripts; judgment/synthesis/conversation → skills.
- **Skills key off stable `rule` ids** from `scripts/validate-cws.ts` findings, not human-readable messages. Messages are for humans; rule ids are the API.
- **Each skill has ONE conversational responsibility.** If you're tempted to add a second, write a second skill.
- **Recipe pattern:** one rule id → one conversational flow ("recipe"). Skills that handle multiple rule ids dispatch to named recipes, not nested if-else.
- **Skills must re-run the relevant validator after each write** to confirm the rule id is cleared before moving to the next recipe.
- **Declare `writes` in frontmatter.** The skill should not touch any file not listed there. This is the contract Session-aligned reviewers rely on.

## Skills in this repo

| Skill | Status | Entry point | Purpose |
|---|---|---|---|
| `cws-content` | shipped (Session 2) | `/skills/cws-content/SKILL.md` | Interview user to fill listing copy, origins, and welcome-page config. Clears the 4 content errors in ship-mode validator. |
| `cws-ship` | planned (Session 3) | — | Orchestrate full submission flow: delegate to cws-content, bump version, zip, submit, poll. |
| `cws-screens` | planned (Session 4) | — | Walk user through 5 CWS-compliant screenshots via the `screenshots/` subproject. |
| `cws-init` | planned (Session 5) | — | First-time onboarding: profile selection, initial cws-content pass, optional OAuth setup. |

Sessions 3-5 follow the same directory and frontmatter convention documented above.
