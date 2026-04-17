---
name: cws-video
description: |
  Generate a launch promo video for a Chrome extension — used both as the CWS
  listing's embedded promo (≤30s, YouTube) and as a launch asset for
  ProductHunt, Twitter, LinkedIn. Wraps `heygen-com/hyperframes` to do the
  actual generation. Interviews the user for hook, beats, and exports;
  writes `video/config.ts`; invokes hyperframes; verifies the exported video
  clears the `ship-ready-video` validator rule.
triggers:
  - "user wants to create a launch / promo video"
  - "ship-ready-video is firing in check:cws:ship"
  - "/cws-video"
  - "make a video for this extension"
invokes:
  - "npx skills list"
  - "npx skills add heygen-com/hyperframes"
  - "heygen-com/hyperframes (external skill — video generation)"
  - "npm run check:cws:ship -- --json"
writes:
  - "video/config.ts"
requires:
  - "heygen-com/hyperframes"
---

# cws-video

You are filling in the launch-video configuration for this Chrome extension and generating the actual video asset. The factory ships video on by default because extensions with a promo video convert better on CWS AND the same asset powers ProductHunt / Twitter / LinkedIn launches — one asset, many surfaces.

The validator rule `ship-ready-video` is the contract you clear. It is a binary gate: either `video/config.ts` has real content AND `.output/videos/` contains an exported file, or the rule fires and the factory refuses to ship. You don't interpret "real" — the rule greps for specific factory placeholder strings. You just help the user replace them with something better, then invoke hyperframes to generate the file.

You do **not** generate video frames yourself. Hyperframes does that. You are the interview-and-orchestration layer.

## Phase A — Verify hyperframes is installed

Before any interview, check that `heygen-com/hyperframes` is installed as a skill. Probe:

```bash
npx skills list 2>&1 | grep -i "heygen-com/hyperframes"
```

(If the `skills` CLI uses a different subcommand — `ls`, `installed`, etc. — search for the right one. Don't assume.)

If hyperframes is **missing**, do NOT silently proceed. It is a Required dep for this skill (classified in `skills/README.md`). Print this exact message to the user, then stop and wait:

> `heygen-com/hyperframes` is required to generate the video. It's a one-time install:
>
> ```bash
> npx skills add heygen-com/hyperframes
> ```
>
> Run that in your terminal, then re-invoke me. If you've decided you don't want a video at all, delete the `video/` directory instead — the ship-ready-video validator rule no-ops when the directory is absent.

When the user confirms they've installed it (or you re-probe and find it), continue to Phase B.

## Phase B — Interview the user for video content

The goal of this phase is to replace every factory placeholder in `video/config.ts` with real content. Read `video/config.ts` first so you understand the shape: `extensionName`, `hook`, `beats[]` (3–5 timed segments with id/startAt/caption/visual/narration), `exports` (which targets hyperframes should produce), optional `brand`.

### B.1 — Target length

Ask the user which length they want:

- **30 seconds** — CWS listing cap. Tighter constraint forces discipline. Pick if you want exactly one asset that works everywhere (CWS embeds the full 30s; socials use it as a short clip).
- **60 seconds** — ProductHunt / social sweet spot. Longer breathing room for problem setup. You'll also need to cut a 30s version for CWS embed (hyperframes can generate both from one config).
- **90 seconds** — only if the extension genuinely needs context (complex flow, multiple personas). Most don't. Don't default here.

Default suggestion: 30 seconds. One asset, everywhere.

### B.2 — Extension name

Ask: "What name should appear in the video? Often the same as your manifest name, but sometimes a cleaner marketing form."

Read `wxt.config.ts` for the current `manifest.name`. Suggest it as the default. If it's still `"My Extension"` or any cws-content placeholder, redirect: "Your manifest.name is still the factory default. Invoke `/cws-content` first to set it, then come back — the video should use a real name." (Do NOT proceed with a placeholder name.)

### B.3 — The hook

This is the single most important field. It appears on-screen in the first 3 seconds AND is spoken if there's narration. It is the reason users keep watching.

Elicit by example. Say:

> The hook is one sentence. Concrete benefit, not feature category. Compare:
>
> | Good | Bad |
> |---|---|
> | Highlights PRs you've been asked to review | The GitHub productivity tool |
> | Cuts your writing time in half with Claude | AI-powered writing assistant |
> | Never miss a price drop on your wishlist | Smart shopping companion |
>
> The good ones name a *specific* benefit a user would say out loud. The bad ones are category descriptions. Your turn: in one sentence, what does this extension do for the user?

Take their answer. If it reads like a category ("productivity tool", "AI assistant", "smart X"), push back once: "That's a category, not a benefit. What does the extension actually *do* that a user would notice on day one?" Accept the second answer.

### B.4 — The 3–5 beats

Classic 30-second structure:

- **0–3s: Hook.** Logo pulse, extension name appears, hook line. You already have the hook.
- **3–15s: Problem + solution.** Show the pain, then show the extension solving it. Real screen recording is ideal; a staged mock is fine. One concrete scenario, not a feature list.
- **15–25s: Key features.** One secondary thing worth highlighting. One. Not a grid of 8 icons.
- **25–30s: CTA.** Extension name, CWS badge, "Available on the Chrome Web Store."

For 60-second and 90-second versions, stretch each beat but keep the arc.

Walk the user through each beat. For each, ask:

1. **Visual:** what should be on screen during this beat? Be specific enough that a human director could shoot it. "A GitHub PR page loads; the extension popup slides in from the right; yellow pulse on the reviewer avatar you were asked to review." — not "show the extension working."
2. **Caption:** one short line of on-screen text. ~8 words. Don't repeat what the visual already shows.
3. **Narration (optional):** one sentence spoken over this beat. Omit if the video is captions-only.

### B.5 — Exports

Ask which export targets they want hyperframes to produce. Recommend:

- `cws: true` — always. The 30s version goes on YouTube and embeds in the CWS listing detail.
- `productHunt: true` — if they plan to launch on PH. Usually yes.
- `socialHorizontal: true` — Twitter/LinkedIn 16:9. Usually yes.
- `socialVertical: false` — TikTok/Shorts 9:16. Only if they're targeting those channels specifically.

If unsure, ship `{cws: true, productHunt: true, socialHorizontal: true, socialVertical: false}` and move on. They can re-generate with different exports later.

### B.6 — Brand (optional, fast)

Ask only if the user has opinions:

- Logo path? (path under `assets/` or leave undefined for hyperframes default)
- Primary brand color as hex? (leave undefined for hyperframes default)
- Voice preference for narration? (hyperframes uses a default voice id — only override if they have a specific sound in mind)

If they shrug, skip all three. Hyperframes' defaults are fine.

## Phase C — Write `video/config.ts`

Generate the new config. Preserve the TypeScript shape (`import`s, type annotations, exported `video` constant). Replace factory values with real ones from the interview.

After writing, **re-run the validator**:

```bash
npm run check:cws:ship -- --json
```

Confirm `ship-ready-video`'s message has shifted from "config still has placeholders" to "`.output/videos/` has no exported video" (or disappeared, if videos already existed from a previous run). If the rule still says "placeholders," you missed one — read the validator's findings and re-edit.

## Phase D — Delegate to hyperframes

Hand off to the hyperframes skill. State the handoff plainly:

> Config written. Invoking `heygen-com/hyperframes` to generate the video from `video/config.ts`. It will write exports to `.output/videos/`.

Then invoke the external skill. Wait for it to complete. Hyperframes owns the details of the generation — you do not interpret or filter its progress. If hyperframes reports an error (config shape mismatch, API limit, etc.), surface the error verbatim and ask the user how they want to proceed. Do not guess.

## Phase E — Verify and close

After hyperframes returns, check the output:

```bash
ls -la .output/videos/
```

There should be at least one file with a `.mp4` / `.webm` / `.mov` extension. The validator also accepts those.

Re-run the validator one more time:

```bash
npm run check:cws:ship -- --json | jq '.findings | map(.rule)'
```

`ship-ready-video` must no longer appear. If it does, read the message — probably `.output/videos/` doesn't exist yet (hyperframes wrote elsewhere) or the exports didn't complete. Fix before declaring done.

Report to the user:

- Paths of generated video files.
- Which exports were produced.
- Next step: `/cws-ship` is the skill that takes them from ship-green to submitted-to-CWS. Or if they want to iterate on the video content, re-invoke `/cws-video` and change specific beats.

## Worked example (end-to-end)

A user has a GitHub PR-review extension. Their manifest.name is `"PR Reviewer Highlighter"` (already customized via `/cws-content`).

**Phase A:** Probe — hyperframes not installed. Print install command. User runs `npx skills add heygen-com/hyperframes`, confirms. Re-probe: found.

**Phase B:**

- *Length:* user picks 30s.
- *Name:* "PR Highlighter" (cleaner marketing form than manifest name).
- *Hook:* user says "GitHub productivity tool." Push back. User says "Highlights PRs you've been asked to review." Accept.
- *Beats* (walked one at a time):
  - 0–3s: Caption "Highlights PRs you've been asked to review" / Visual "PR Highlighter logo pulse on dark background; extension name appears in caption" / Narration "Highlights PRs you've been asked to review."
  - 3–15s: Caption "When you've been added as a reviewer — you know instantly" / Visual "GitHub PR list page; without extension, all PRs look the same. Extension installs; PRs where user is a reviewer get a yellow pulse highlight." / Narration "When you're added as a reviewer, you know instantly — no more digging through the notifications tab."
  - 15–25s: Caption "Keyboard-first: jump between review-requested PRs" / Visual "User presses `g r` hotkey; popup shows queue of PRs awaiting their review." / Narration "Jump between them with a single keyboard shortcut."
  - 25–30s: Caption "Get it on the Chrome Web Store" / Visual "PR Highlighter logo; CWS badge; URL text" / Narration "PR Highlighter, available on the Chrome Web Store."
- *Exports:* `{cws: true, productHunt: true, socialHorizontal: true, socialVertical: false}`.
- *Brand:* user skips.

**Phase C:** Write `video/config.ts` with the above. Re-run validator: `ship-ready-video` now says "`.output/videos/` has no exported video" (placeholders cleared; files not generated yet).

**Phase D:** Invoke hyperframes. It generates three MP4 files (cws, productHunt, socialHorizontal) in `.output/videos/`.

**Phase E:** Verify files exist. Re-run validator: `ship-ready-video` clears. Report paths to user. Suggest next: `/cws-ship` when ready to submit, or regenerate by re-invoking `/cws-video` and editing specific beats.

## What this skill does NOT do

- Does not generate video frames itself. Hyperframes does all rendering.
- Does not write to files other than `video/config.ts`.
- Does not touch `wxt.config.ts`, `entrypoints/`, `scripts/`, or the validator.
- Does not pick the hook for the user — they own the marketing. Push back once on vague answers; accept the second.
- Does not submit, zip, or publish. That's `/cws-ship`.
- Does not attempt to recover from hyperframes errors — surfaces them verbatim and asks the user.
- Does not modify `package.json`. Invocation is skill-only; if hyperframes grows a CLI entrypoint later, a follow-up session can add `npm run video`.

## Failure modes

- **Validator still says "placeholders" after Phase C.** You missed a factory string. Read `npm run check:cws:ship -- --json` output — the `message` names which placeholder survived. Re-edit `video/config.ts` and re-run.
- **Hyperframes produces 0 files.** The config shape probably doesn't match hyperframes' current expected shape. Surface the error to the user and ask them to check hyperframes' docs / version. Do not guess a fix.
- **User insists on a placeholder-adjacent hook ("productivity tool").** Push back once. If they insist twice, write it — they own the marketing. The validator only greps for the specific factory strings, so a weak-but-non-factory hook will pass the rule. That's fine. Rule deterministically measures presence of placeholders, not copy quality.
- **User wants to skip video entirely mid-flow.** Tell them to `rm -rf video/` and re-run `npm run check:cws:ship` — the rule no-ops on an absent directory, same escape-hatch as `screenshots/`. Do not try to persist "I skipped video" state anywhere else.
