# Sources — Knowledge Provenance Layer

> **➤ Next action:** open [`_mining-queue.md`](./_mining-queue.md) — the prioritized list of captures to make next. Discovery passes live in [`_discovery/`](./_discovery/).

Raw materials behind `docs/`. Everything under `docs/` makes claims; everything under `sources/` stores the evidence those claims came from, with enough fidelity to survive link rot.

The factory's moat is not the scaffolding (WXT generates that) — it's the **curated knowledge**: which permissions trip manual review, which CSP values pass, which lifecycle quirks bite. That knowledge is synthesized from official docs, Chrome DevRel posts, and community writeups. `sources/` is where those raw materials live so you can re-read them, cite them precisely, and regenerate the distilled `docs/` playbooks from primary evidence.

## Directory tour

```
sources/
  README.md               # you are here
  _mining-queue.md        # TODO list — what to capture next
  _templates/             # example captures, human reference for manual edits
    official.md
    forum-thread.md
    blog-post.md
  _scripts/
    capture.ts            # URL → markdown capture with frontmatter + Wayback
    build-index.ts        # regenerates _index/* from frontmatter
  _discovery/             # venue rankings (where is the signal? where is the noise?)
    2026-04-16_forum-ranking.md
    2026-04-16_blog-ranking.md
  _index/                 # generated — do not edit by hand
    by-topic.md
    by-date.md
  official/               # developer.chrome.com, MDN, Mozilla policies
  forums/                 # chromium-extensions Google Group, SO, Reddit threads
  blogs/                  # community writeups (Nearform, MacArthur, etc.)
```

`_templates/`, `_scripts/`, `_index/` are underscore-prefixed so they sort to the top of each directory listing and signal "tooling, not data."

## Filename convention

`YYYY-MM-DD_<source-id>_<slug>.md`

- **YYYY-MM-DD** — capture date (not publication date — capture date is what matters for link rot).
- **source-id** — short stable token: `chrome-developers`, `mdn`, `google-group`, `reddit`, `stackoverflow`, `nearform`, `stefan-vd`, `macarthur`, etc.
- **slug** — 3–6 lowercase hyphenated words describing the page subject.

Example: `2026-04-16_chrome-developers_permissions-api.md`.

A 2026 capture of the Chrome docs may diverge from a 2027 capture. Keep both — latest is typically authoritative for curation, but diffs over time are signal too.

## Frontmatter schema

Every capture file starts with YAML frontmatter:

```yaml
---
url: https://developer.chrome.com/docs/extensions/reference/api/permissions
captured_at: 2026-04-16
capture_method: script                # script | manual
source_type: official                  # official | forum | blog
source_id: chrome-developers           # matches filename token
title_at_capture: "chrome.permissions | API | Chrome for Developers"
author: null                           # or "Simeon Vincent", "Nearform", etc.
evidence_class: a                      # a | b | c | d (see below)
topics:
  - permissions
  - cws-review
wayback_url: https://web.archive.org/web/20260416000000/https://developer.chrome.com/...
related_docs:
  - docs/09-cws-best-practices.md
notes: |
  Free-form curator notes. Empty at capture time; fill in during synthesis.
---
```

### Evidence legend

Reuses the legend in `docs/09-cws-best-practices.md`:

- **(a)** officially documented
- **(b)** Chrome DevRel forum/blog (Simeon Vincent, Oliver Dunk, Deco, etc. posting on chromium-extensions or Chrome for Developers)
- **(c)** widely reported by community (multiple independent blogs, Stack Overflow consensus)
- **(d)** informed guess / single-source anecdote

When a `docs/` claim cites a capture, the doc and the capture agree on evidence class.

## Templates by type

Three captures, three optimizations:

### `official.md` — verbatim, minimal noise
- Frontmatter only, no preamble.
- Body is the page's main content, copied verbatim. Skip nav/footer/sidebar.
- Short "Curator notes" section at the end, empty at capture time.
- **Goal:** fidelity. The page will change; this file won't.

### `forum-thread.md` — nested, signal up top
- Thread-level frontmatter with extra fields: `thread_url`, `post_count`, `accepted_answer`.
- Body has a prominent `## Signal extracted` block at the top (curator-filled — often empty at first capture).
- Then `## Post N — <author> — <date>` sections with per-post URL anchor and verbatim post content.
- **Goal:** keep all posts (sometimes post #14 is the gem) but let the curator surface the insight without re-reading the full thread.

### `blog-post.md` — between the two
- Verbatim body like official, plus a `## Signal extracted` block like forums.
- Community blogs often bury one killer insight in a long post. This template surfaces it.

## How to capture

### Automated (official docs, blog posts)

```bash
npm run capture:source -- https://developer.chrome.com/docs/extensions/reference/api/permissions \
  --type=official \
  --topics=permissions,cws-review
```

The script will:
1. Fetch the page.
2. Extract main content via `@mozilla/readability` + `turndown`.
3. POST to `https://web.archive.org/save/<url>` to trigger a Wayback snapshot.
4. Write the file to `sources/<type>/YYYY-MM-DD_<source-id>_<slug>.md` with frontmatter pre-filled.
5. Print the filepath so you can open and annotate.

Opt out of Wayback with `--no-snapshot`. Wayback failures (rate limits, timeouts) log a warning and set `wayback_url: null` without blocking the capture — you can re-snapshot later.

### Rendered (JS-rendered sites — Google Groups, Reddit, SO, Substack, etc.)

Add `--render` to launch headless Chromium (via Playwright), wait for the page to finish rendering, then dump the fully-hydrated HTML through the same extractor. Works for any site that renders content client-side.

```bash
npm run capture:source -- \
  https://groups.google.com/a/chromium.org/g/chromium-extensions/c/S1_uqpDFVzY \
  --type=forum \
  --render \
  --topics=permissions,cws-review \
  --slug=content-scripts-matches-review
```

Requires a one-time `npx playwright install chromium` (installs ~150MB Chrome binary under `~/Library/Caches/ms-playwright/`). The script lazy-imports Playwright so non-rendered captures stay fast.

The `--slug` flag lets you override the URL-derived filename slug — useful when replacing a stub or when the URL is ugly (`c/S1_uqpDFVzY` → `content-scripts-matches-review`).

Capture method annotation (stored in frontmatter as `capture_method`): `script-rendered` when `--render` is used vs `script` for plain fetch.

### Fallback (login-walled or anti-bot)

Some venues (Chromium issue tracker while logged out, Cloudflare-protected blogs, X/Twitter) resist both fetch and headless browsers. For those:

1. Open the URL in your logged-in browser.
2. `File → Save As...` → Webpage, HTML only.
3. Run with `--from-file`:
   ```bash
   npm run capture:source -- \
     --url <original-url> \
     --type=forum \
     --from-file ./thread.html \
     --topics=...
   ```

The script parses your local file but records the original URL in frontmatter. Wayback is still pinged against the original URL.

### Manual

Copy a template from `_templates/`, fill it out by hand. Use this for paywalled content, content-behind-login, or anything the script can't reach.

## How to curate (the signal extraction step)

Captures are raw. `docs/` wants synthesized. Between them:

1. **Read the capture.** For forums, read every post — the insight is often not in the accepted answer.
2. **Fill `## Signal extracted`.** One sentence: what is the insider trick? Optionally quote the key post verbatim.
3. **Update `notes`** in frontmatter with why this capture matters.
4. **Cite in `docs/`.** When a `docs/` file makes a claim, link to the capture:
   ```md
   Content-script `matches` count as host permissions for review purposes
   ([source](../sources/forums/2026-04-16_google-group_content-scripts-matches-review.md)).
   ```

## How to regenerate indices

```bash
npm run index:sources
```

Reads frontmatter from every `*.md` under `sources/` (ignoring `_*`), groups by `topics[]` and `captured_at`, writes:

- `sources/_index/by-topic.md` — topic → captures (link + source_type + evidence_class).
- `sources/_index/by-date.md` — reverse-chronological capture timeline.

Run manually after adding captures; consider wiring into a pre-commit hook when the volume justifies it.

## Integration with `docs/`

- **Don't retrofit `docs/09-cws-best-practices.md` all at once.** Its existing inline URLs are fine. Migrate citations as you touch each section.
- **New claims → new captures.** Before adding a non-obvious claim to any `docs/` file, capture the source. If the claim has no capture, it's evidence class **(d)** — informed guess — and should be labeled as such.
- **Evidence class propagates.** A claim's evidence class in `docs/` should match the capture's `evidence_class` in frontmatter. Mismatches indicate either a capture that needs re-classification or a claim that's outrun its evidence.

## What NOT to put here

- `/private/` scratch notes, competitor research — use the existing gitignored `/private/` directory.
- Copyright-sensitive content (full ebooks, paid research reports). Capture the URL and an excerpt with citation; skip the full dump.
- Your own notes about what to build — those belong in issues, PR descriptions, or `docs/`.

Captures should be things you'd want a fork of this repo to inherit.
