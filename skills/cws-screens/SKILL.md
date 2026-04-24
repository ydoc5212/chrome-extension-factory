---
name: cws-screens
description: Interview the user to fill out Chrome Web Store screenshot config. Picks 5 screenshots (surface + copy per shot), writes to screenshots/config.ts, regenerates PNGs. ALSO produces the two promo tiles (440×280 small + 1400×560 marquee) by default, because skipping them disqualifies the extension from Featured-badge placement. Distinct from the iOS app-store-screenshots skill.
triggers:
  - chrome web store screenshots
  - cws screenshots
  - extension screenshots
  - 1280x800 screenshots
  - screenshots for chrome extension
  - generate store screenshots
  - screenshot config
  - promo tile
  - promo tiles
  - marquee tile
  - marquee promo tile
  - small promo tile
  - 1400x560
  - 440x280
  - listing images for CWS
  - featured badge images
invokes:
  - screenshots/config.ts
  - screenshots/capture.ts
  - npm run screenshots
  - npx tsx scripts/validate-cws.ts --ship --json
  - "<skill>app-store-screenshots</skill>"   # fallback pipeline for promo-tile dimensions when screenshots/ lacks routes
writes:
  - screenshots/config.ts
  - .output/promo-tiles/small.png            # 440×280 (Step 7)
  - .output/promo-tiles/marquee.png          # 1400×560 (Step 7)
---

# `cws-screens` — Chrome Web Store screenshot generator

You are helping the user produce Chrome Web Store listing imagery: **5 screenshots** (1280×800) AND **2 promo tiles** (440×280 small + 1400×560 marquee). All seven artifacts. Default plan, every session.

Screenshots are 1280×800 PNGs. They are the single biggest conversion asset on the CWS tile — especially the first one, which is the thumbnail in search results. Each screenshot is **one idea**, **one surface**, **one line of copy**.

The promo tiles are marketing imagery that goes in the dashboard's Store-listing tab. CWS does not require them, but Google's Featured-badge automation treats them as part of a "complete listing page with images" — so skipping them disqualifies the extension from Featured placement. They take under a minute each to produce and are the single cheapest lever on long-term discoverability.

Your job is to walk the user through picking the 5 screenshots, writing their choices into `screenshots/config.ts`, producing tile imagery that matches, and leaving them with all seven PNGs on disk. You do **not** do visual design yourself — the renderer handles that. You elicit intent and translate it to config entries.

**Do not let the user skip the promo tiles with the phrase "marquee is only shown if Google features me."** That takeaway is wrong and is the most common failure mode of this skill's upstream transcript. Missing the tiles is what prevents featuring in the first place. If the user pushes back, surface `docs/03-cws-best-practices.md` → Featured badge and the `ship-ready-promo-tiles` validator warning, then produce the tiles anyway.

---

## Ground truth

- Config lives at `screenshots/config.ts`. It is a typed array of `ScreenshotConfig` entries.
- Each entry has: `id`, `surface` (`popup` | `sidepanel` | `options` | `welcome` | `content-in-page`), `theme` (`light` | `dark`), `headline`, `subhead`, and optional `browserUrl`.
- CWS allows up to 5 screenshots. Target **exactly 5** — more isn't an option, and fewer leaves conversion on the table.
- Outputs land in `.output/screenshots/<id>.png`.
- One command generates all: `npm run screenshots` (from repo root).

The validator rule `ship-ready-screenshots` blocks `npm run check:cws:ship` until two things are true:
1. Factory placeholders (e.g. `"Your killer feature here"`, `"your-target-site.com"`) are gone from `screenshots/config.ts`.
2. `.output/screenshots/` has at least one PNG.

You should leave the user in a state where both are true.

---

## Flow

### Step 1 — Set context

Ask the user:

> What's your extension's one-sentence value proposition? Plain language, what it does for the user.

If they've already done the `cws-content` skill, you can read `wxt.config.ts`'s `manifest.description` and use it as a starting anchor instead of asking again.

### Step 2 — Pick 5 screenshots

A good CWS screenshot deck has this shape. Offer these five as a default; confirm, then adapt:

| # | Role | Surface | Why |
|---|---|---|---|
| 1 | Hero / thumbnail | `content-in-page` or `popup` | Shows the extension **doing something** on a real page. First impression. |
| 2 | Primary surface | `popup` or `sidepanel` | Where the user spends time. "This is what the product looks like." |
| 3 | Depth / settings | `options` | Signals maturity. "There's a real app behind this." |
| 4 | Onboarding | `welcome` | Shows the first-run story — lowers install anxiety. |
| 5 | Secondary feature | varies | The one other thing worth advertising. |

Ask:

> Here's a default deck of 5 — hero / primary surface / settings / welcome / one more feature. Does that match your extension, or do you want to swap any of them?

If their extension doesn't have one of the five surfaces (e.g. content-script-only extension with no popup), adapt on the fly — skip what doesn't apply, pick multiple angles on what does.

### Step 3 — For each of the 5, interview + draft

For each screenshot:

#### 3a. Pick the surface

If the user is unsure which surface fits:
- "Where will this feature be visible to the user?"
- "Is it in the toolbar (popup), the sidepanel, a settings page (options), first-run (welcome), or overlaid on a real web page (content-in-page)?"

#### 3b. Draft the headline

The headline sells one idea. It goes at the bottom of the 1280×800 frame in large type. Keep it under ~60 characters.

Good headlines are:
- **Outcome-focused**: "Never miss a PR review again."
- **Concrete**: "Inbox zero, without a subscription."
- **Specific**: "Highlight the reviewers you're missing."

Bad headlines:
- **Feature-listy**: "GitHub tools"
- **Vague**: "Boost your productivity"
- **Abstract**: "Take control of your workflow"

Draft **3 candidate headlines** for the user and ask them to pick or edit. Example:

> For the hero screenshot, here are 3 options — pick one or tell me to redraft:
> - (A) "Never miss a PR review again."
> - (B) "See every reviewer you're waiting on."
> - (C) "Turns your PR backlog into a hit list."

#### 3c. Draft the subhead

One clarifying sentence under the headline. It fills in the mechanism. Keep under ~120 characters.

The subhead answers "how" or "when" to the headline's "what":
- Headline: "Never miss a PR review again."
- Subhead: "Highlights reviewers you've missed across every repo — right in the GitHub UI."

#### 3d. Pick the URL (if applicable)

For `popup`, `sidepanel`, `content-in-page`: the URL shows in the fake address bar. Make it representative. If the extension targets `github.com`, use `https://github.com/acme/repo/pull/42`, not `https://example.com`.

For `options`, `welcome`: the URL will be a `chrome-extension://...` URL. Leave the default or make it match the extension's name.

#### 3e. Pick the theme

Ask:

> Light or dark background for this shot?

Default to `light` unless the extension is dark-first. Mixing both across 5 shots is fine and often stronger visually.

### Step 4 — Write to config

Update `screenshots/config.ts` with all 5 entries. Keep the `id` kebab-case and descriptive (`hero-pr-alert`, `sidepanel-reviewers`, `options-filters`, `welcome-first-run`, `inline-badge`). Remove every factory placeholder string — the validator greps for them.

Re-read the file after editing and confirm all 5 entries are present.

### Step 5 — Generate

Run:

```bash
npm run screenshots
```

from the repo root. This installs deps in `screenshots/` (idempotent), builds the Next.js app, boots it, and captures 5 PNGs to `.output/screenshots/`.

### Step 6 — Report + validate (screenshots)

- List the 5 files written.
- Run `npx tsx scripts/validate-cws.ts --ship --json` and confirm `ship-ready-screenshots` is no longer in `findings`.
- If the user wants to tweak any shot, edit the relevant entry in `screenshots/config.ts` and re-run `npm run screenshots` — it's idempotent.
- `ship-ready-promo-tiles` will still show as a **warning** at this point — that clears in Step 7.

### Step 7 — Promo tiles (default-on; do not skip)

Two tiles, both derived from the same visual language as the hero screenshot:

| Tile | Dimensions | Filename | Role |
|---|---|---|---|
| Small | 440×280 | `.output/promo-tiles/small.png` | Shown in CWS category pages, collections, cross-sell strips. |
| Marquee | 1400×560 | `.output/promo-tiles/marquee.png` | Shown on the homepage, Featured collections, editor's-picks carousels. The "if this were a billboard" asset. |

The hero screenshot's headline + subhead are already strong. Reuse them — don't re-draft copy from scratch. The tile is cropped to **one line** (the headline, or a tightened version of it), the extension's logo, and a clean background.

**Production path.**

1. Read the hero entry from `screenshots/config.ts`. Confirm with the user:
   > I'll reuse your hero headline — *"Never miss a PR."* — on both promo tiles, with the extension's logo. Want a shorter variant for the tiles, or same copy?

2. If the `screenshots/` Next.js subproject has `promo-tile-small` and `promo-tile-marquee` routes (check `screenshots/app/` directory): run `npm run screenshots` — the existing capture script will render both tiles alongside the screenshots. Done.

3. If those routes do NOT exist yet (many older factory scaffolds): delegate to the `marketing/` sibling via:
   ```
   /app-store-screenshots
   ```
   Tell the user: "The factory's `screenshots/` pipeline doesn't have tile routes yet — the `marketing/` subproject does arbitrary dimensions. Scaffolding there." After `/app-store-screenshots` produces the two PNGs, copy them into `.output/promo-tiles/` (create the directory):
   ```bash
   mkdir -p .output/promo-tiles
   cp marketing/output/small-440x280.png .output/promo-tiles/small.png
   cp marketing/output/marquee-1400x560.png .output/promo-tiles/marquee.png
   ```

4. **Manual fallback.** If neither pipeline is available and the user insists on moving fast: tell them to drop two PNGs at exactly `.output/promo-tiles/small.png` (440×280) and `.output/promo-tiles/marquee.png` (1400×560), produced in any tool they like (Figma export, CleanShot, etc.). The validator only checks presence and filename, not dimensions — but upload will fail on wrong dimensions, so the user must size correctly.

**After Step 7:** re-run the validator. `ship-ready-promo-tiles` should no longer appear in findings (or appear with 0 entries).

### Step 8 — Final report

- List all 7 files written (5 screenshots + 2 tiles).
- Confirm both `ship-ready-screenshots` (error → clear) and `ship-ready-promo-tiles` (warn → clear) are absent from the latest validator output.
- Note that the user uploads all seven PNGs manually to the CWS dashboard — there is no API for screenshot or promo-tile upload.
- Remind: the first screenshot = thumbnail, the marquee = Featured-placement asset. Both matter.

---

## Worked example (end-to-end)

**User:** "I built a GitHub PR reviewer highlighter."

**You:**

> Got it. Here's a default deck — tell me if it matches:
> 1. Hero: content-in-page overlay on a real GitHub PR — headline pitches the outcome.
> 2. Primary: the popup listing all repos with pending reviews.
> 3. Settings: options page showing filter rules.
> 4. Welcome: the first-run page explaining what it does.
> 5. Secondary: sidepanel showing per-reviewer timelines.
>
> Does that match, or do you want to swap?

**User:** "Yes, but drop the sidepanel — I don't have one. Use a second content-in-page shot instead, showing the badge on the repo list page."

**You:** "Done. Let's work through each.

**Screenshot 1 — hero (`content-in-page`, light)**

URL in frame: `https://github.com/acme/awesome-app/pulls`

Headline drafts:
- (A) "Never miss a PR review again."
- (B) "Spots the PRs your team forgot about."
- (C) "Your PR backlog, triaged automatically."

Which one (or should I redraft)?"

**User:** "A, but punchier. 'Never miss a PR.'"

**You:** "Good — shorter wins. Subhead drafts:
- (A) "Shows every open review assigned to your team — right on the pulls page."
- (B) "Highlights stale PRs before they rot."
- (C) "Pulls overdue reviews into a single inline badge on the repo page."

Pick one?"

**User:** "B."

**You:** "Writing screenshot 1 now."

*(Update `screenshots/config.ts`:)*

```ts
{
  id: 'hero-never-miss-a-pr',
  surface: 'content-in-page',
  theme: 'light',
  headline: 'Never miss a PR.',
  subhead: 'Highlights stale PRs before they rot.',
  browserUrl: 'https://github.com/acme/awesome-app/pulls',
},
```

*(Continue for 4 more screenshots in the same rhythm: surface → 3 headlines → pick → 3 subheads → pick → write. Keep user latency low — don't over-explain between picks.)*

Once all 5 are written:

```bash
npm run screenshots
```

**Output:**

```
  ✓ hero-never-miss-a-pr         → .output/screenshots/hero-never-miss-a-pr.png
  ✓ popup-reviewer-list          → .output/screenshots/popup-reviewer-list.png
  ✓ options-filters              → .output/screenshots/options-filters.png
  ✓ welcome-first-run            → .output/screenshots/welcome-first-run.png
  ✓ inline-repo-badge            → .output/screenshots/inline-repo-badge.png
```

**You:** "5 PNGs written. Re-running the ship validator to confirm `ship-ready-screenshots` clears…" — then run the validator. If clear, report success. If not, surface the message and loop.

---

## Anti-patterns (do not do these)

- **Do not scaffold new Next.js config** — `screenshots/` already exists. Just edit `screenshots/config.ts`.
- **Do not offer more or fewer than 5 screenshots** unless the user has a strong reason — CWS caps at 5, and the deck shape above is the reason.
- **Do not write copy the user didn't pick.** Present 3 candidates, let the user choose. Single-author first-draft copy goes in the trash on review.
- **Do not try to replicate the iOS `app-store-screenshots` aesthetic** — this is a desktop browser frame, not a phone mockup. The visual language is restrained; decorative blobs and gradient-heavy backgrounds don't belong here.
- **Do not submit or zip.** That's `cws-ship`. Your job ends at "5 screenshots + 2 promo tiles generated, validator shows neither `ship-ready-screenshots` nor `ship-ready-promo-tiles`."
- **Do not deprioritize the promo tiles by saying "marquee only shows when you're Featured."** That inverts cause and effect. Missing the tiles is what disqualifies the extension from Featured automation in the first place. See `docs/03-cws-best-practices.md` → Featured badge. This is the single most common wrong takeaway in upstream transcripts — do not repeat it.
- **Do not ask the user whether they want promo tiles.** They are default-on. Ask only if they want to customize copy or trust you to reuse the hero screenshot's headline.
