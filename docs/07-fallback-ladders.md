# Fallback ladders

## Why this exists

The factory's other gates (`compile`, `check:cws`, `check:cws:ship`, `zip`) refuse to lie — they pass or fail and `zip` won't produce an artifact until ship-mode is green. Screenshots used to break that contract: they cheerfully rendered a structurally-valid PNG that was *semantically* a fake screenshot of a different extension, and nothing flagged it.

The fallback ladder pattern fixes that asymmetry. Each artifact-type-that-can-degrade has an explicit ranked list of how to produce it; the factory lands on the highest rung that works without user input; the rung that landed is recorded so the validator can gate on it.

The deeper goal: **asking the user a question is a defect.** Every place the model running the factory has to stop and ask is a place we didn't think of in advance. The ladder pattern lets the factory always produce *something honest* without asking, and surfaces what's missing in one readable place when the user comes back.

## What does and doesn't get a ladder

Most of the factory is binary — code compiles or it doesn't, manifest is valid or it isn't, permission is in the allowlist or it isn't. Adding rungs to binary checks would be complexity for nothing.

**Has a ladder** (one artifact-type, today):
- **Screenshots** — the only artifact whose ideal output (real built UI) and honest stub (concept card) are both reachable without user input.

**Stays binary** (no useful intermediate state):
- TypeScript / build / manifest / permissions / CSP / structural CWS rules — correctness gates, no middle ground.
- Listing copy, welcome content, store description — placeholder text would defeat the existing `listing-drift` gate. The honest middle is "field is empty and validator says so."
- Icon — `assets/icon.svg` ships with a default the factory considers acceptable. Delete it = binary failure.
- **Promo video** — the only way to a real video is the external hyperframes skill; the only honest middle is "no video yet, here's the one command to fix it." That's a binary check, not a ladder. The existing `ship-ready-video` rule already does this; it doesn't write to ladder-status.json.

**Scope check:** if a future artifact wants a ladder, justify it against this list. Bar: "is there a useful, honest intermediate output reachable *without user input* between ideal and missing?" If not, keep it binary. One ladder is not a framework — extract a generic shape only when a third artifact earns one.

## Screenshots ladder

Three rungs. capture.ts attempts each per-shot; different shots in the set may land on different rungs.

| # | Rung | Ship-acceptable | What it does |
|---|---|---|---|
| 0 | `manual` | ✓ | A hand-captured PNG at `screenshots/manual/<id>.png` exists → copy it through untouched. The user took responsibility for the artifact. |
| 1 | `real-build` | ✓ | `.output/chrome-mv3/<surface>.html` exists → render it inside `BrowserFrame` via iframe and screenshot. |
| 2 | `concept-card` | ✗ | Typographic card showing extension name + tagline + surface label, on a fixed branded background. Stub-watermarked. |

**Manual override is the escape hatch.** Any shot that the auto pipeline can't satisfy (notably `content-in-page`, where there's no built HTML to load and the only honest screenshot is a real capture of the script running on a real page) gets a working path: drop a PNG at `screenshots/manual/<id>.png`, re-run, done. capture.ts uses it untouched and records `landedRung: 'manual'`. No validator surgery, no JSON editing.

**Stub watermark.** Rung 2 produces PNGs with a diagonal `STUB — NOT FOR SUBMISSION` banner across the full image, semi-transparent so the layout is still readable. Removed only on rungs 0 and 1. Diagonal-banner over corner-ribbon because a tired user can crop or overlook a corner; the factory's whole bet is not lying, so the watermark is loud on purpose.

**Surface support.** Any surface WXT emits as `<name>.html` works at rung 1 — popup, sidepanel, options, welcome, newtab, devtools, future additions. No code changes needed when WXT adds a surface kind.

## Status file

`.factory/ladder-status.json` is a small structured file written by `screenshots/capture.ts` after each run. The shape:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-04-19T20:52:47.607Z",
  "screenshots": [
    { "artifactId": "hero-popup", "landedRung": "real-build", "shipAcceptable": true, "reason": null },
    { "artifactId": "in-page-action", "landedRung": "concept-card", "shipAcceptable": false, "reason": "..." }
  ]
}
```

Types live in `screenshots/ladder.ts` — single source of truth, imported by capture.ts, the page renderer, and the validator.

`.factory/` is gitignored. Not co-located with `.output/` because that gets blown away by WXT builds; not under `node_modules/.cache/` because that's opaque. One conventional dot-dir is the right cost for a single source of truth the validators can read.

## Validator integration

`scripts/validate-cws.ts` (`shipReadyScreenshots`) reads `.factory/ladder-status.json` in `--ship` mode. **Trust contract:** only an explicit stub entry blocks ship mode. PNGs without a recorded entry — or with a ship-acceptable entry — pass. This means:

- The user can override the auto pipeline with a manual PNG (handled by capture.ts → `manual` rung → ship-acceptable).
- Stale PNGs from before the ladder system existed pass — fine, because the placeholder check on `screenshots/config.ts` catches factory-template copy, and the watermark on real stubs is loud enough that anything stale is visibly real-or-broken on inspection.

When stubs exist, the validator emits one finding per stub with the recorded reason and a fix path that always works: drop a hand-captured PNG at `screenshots/manual/<id>.png` and re-run.

`zip` is unchanged — still gated on `check:cws:ship` green. The ladder makes failures more legible without changing the zip gate.

## The asks-log

A separate, lighter mechanism: `docs/asks-log.md`. Every time the model running the factory has to stop and ask the user a question that *could plausibly have been automated or had a fallback*, it adds an entry. Closing notes cite the commit / spec / skill that addressed it.

The asks-log is **prose, manually maintained by the model**. Not a machine-checked artifact. The point is to make the defect class visible, not to formalize it.

## Out of scope (intentionally)

- Generalizing the ladder pattern to a framework. One ladder is not a framework. If a second artifact ever earns one, *then* extract a generic shape from the two concrete examples.
- Model-generated stub aesthetics. Rung 2 for screenshots is a fixed typographic template — no model judgment in the rendering. Determinism over taste here, because the factory's bet is determinism.
- Auto-installing external skills (hyperframes). The user runs `npx skills add ...`; the existing `ship-ready-video` rule makes the absence honest.
