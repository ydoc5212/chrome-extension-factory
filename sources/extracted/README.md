# Extracted — Stage 2 of the Knowledge Pipeline

Synthesized signal from raw captures in `sources/{official,forums,blogs}/`. Each extracted file is a one-page distillation: the key insight, 2–3 verbatim quotes, implications for the factory, and a provenance pointer back to the raw capture.

**Why separate from the raw capture?** Captures are noisy by design (a Google Group thread might be 80+ posts, 85 KB). Extracted files are scannable — open the directory, read the TL;DRs, find the signal without re-reading the scrape every time. Docs get built from extracted files; captures remain as the tamper-evident primary source.

## The 3-stage pipeline

```
Stage 1: CAPTURE           Stage 2: EXTRACT           Stage 3: DISTILL
─────────────────          ─────────────────          ─────────────────
sources/{blogs,             sources/extracted/         docs/*.md
  forums,official}/                                    (playbooks)
                                                      
raw scrape,        ➡       curator's synthesis  ➡    multi-source
full fidelity              per-capture signal        knowledge piece
(KB–MB)                    (~100 lines each)         (one topic, many
                                                     extracted sources)
npm run capture:source     (human or subagent)       (human author)
```

- **Stage 1 is mechanical.** `capture:source` does it. One URL → one raw file.
- **Stage 2 is interpretive.** You read the capture, decide what the signal is, quote the load-bearing parts, spell out the implications. One raw capture → one extracted file (usually).
- **Stage 3 is editorial.** You look across many extracted files on the same topic, synthesize the playbook. Many extracted files → one `docs/` piece.

Each stage is independently versioned. If `docs/09-cws-best-practices.md` needs an update, you can rewrite it from `sources/extracted/` without re-scraping. If `sources/extracted/` has a bad synthesis, you can re-extract from the still-intact raw capture.

## Filename convention

Mirror the raw capture's basename — if the capture is `sources/blogs/2026-04-16_palant_cws-is-a-mess.md`, the extraction is `sources/extracted/2026-04-16_palant_cws-is-a-mess.md`. This makes the mapping obvious at a glance and lets you diff the directory contents.

## Frontmatter schema

```yaml
---
extracts:
  - sources/blogs/2026-04-16_palant_01-13-chrome-web-store-is-a-mess.md
extracted_at: 2026-04-16
title: "Chrome Web Store is a mess"
author: Wladimir Palant
url: https://palant.info/2025/01/13/chrome-web-store-is-a-mess/
evidence_class: c                  # a | b | c | d (same legend as docs/09)
topics:
  - cws-review
  - policy-enforcement
  - moderation
feeds_docs:
  - docs/09-cws-best-practices.md
---
```

- **`extracts`** is a list — usually one raw capture, occasionally many when you're consolidating a series into one synthesis.
- **`feeds_docs`** is the `docs/` files this extracted synthesis informs. Grep for the extraction path in `docs/` to sanity-check the relationship is bidirectional.

## Body structure

```markdown
# <Short title — what the insight IS, not the post title>

## TL;DR

One sentence. What a reader of `docs/` would need to know.

## Signal

2–4 paragraphs of synthesis: the load-bearing claims, what they mean for
someone shipping a Chrome extension, how they fit the factory's mental
model. This is the part that actually feeds `docs/` — write it so a future
docs-author can paste-and-adapt.

## Key quotes

> "verbatim excerpt 1"
> — author, date

> "verbatim excerpt 2"
> — author, date

## Implications for the factory

- **For `docs/09`:** specific claim to add, contradiction to resolve, caveat to note.
- **For the validator (`scripts/validate-cws.ts`):** specific rule to add/change.
- **For the template itself:** manifest key to flip, entrypoint pattern to ship.
- **Not applicable:** fine — many extracts inform only docs, not code.

## Provenance

- **Raw capture:** [`../blogs/2026-04-16_palant_...md`](../blogs/2026-04-16_palant_...md)
- **Original URL:** https://palant.info/...
- **Wayback:** https://web.archive.org/web/...
```

## How to extract

1. Open the raw capture.
2. Read it. (Yes, all of it — especially forum threads. Post #14 is often the gem.)
3. Decide: **what is the one insight a reader of `docs/` needs from this?** That's the TL;DR.
4. Identify 2–3 load-bearing quotes and paste them verbatim into Key quotes. Attribute with author + date.
5. Write Signal: 2–4 paragraphs that would make sense to someone who has never read the raw capture.
6. Write Implications: concrete, specific, actionable. "Update `docs/09` section X to add Y" beats "Consider reviewing permissions."
7. Set frontmatter. Evidence class should match the raw capture's. `feeds_docs` is your best guess at which playbook files consume this.

## The extraction backlog

Any capture under `sources/{official,forums,blogs}/` that doesn't have a matching `sources/extracted/<same-basename>.md` is in the extraction backlog.

Quick audit:
```bash
diff <(ls sources/blogs sources/forums sources/official) <(ls sources/extracted) | grep '^<'
```

Work the backlog when you have focus; batch it during a curation session. Mining and extracting can run in parallel — the queue tracks both.
