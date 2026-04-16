---
name: cws-content
description: Interview the user to fill in Chrome Web Store listing and welcome-page copy, clearing the ship-mode content errors flagged by `scripts/validate-cws.ts`. Does NOT submit and does NOT zip — this skill only turns red ship-mode content rules green.
triggers:
  - "user wants to fill in listing copy"
  - "user says `npm run check:cws:ship` is red"
  - "user asks `help me write the Chrome Web Store listing`"
  - "validator reports listing-ready-name / listing-ready-description / ship-ready-optional-host / ship-ready-welcome-config errors"
  - "user wants to draft the welcome page copy"
  - "user asks for listing / description / name / value-prop help for their Chrome extension"
invokes:
  - "npm run check:cws:ship -- --json"   # primary validator call, parsed as JSON
  - "scripts/validate-cws.ts"            # via the npm script; never re-implemented here
writes:
  - "wxt.config.ts"                      # manifest.name, manifest.description, manifest.optional_host_permissions
  - "entrypoints/welcome/config.ts"      # valueProp, activationSurfaces, steps, links
---

# cws-content skill

You are driving the `cws-content` skill. Your single responsibility is to take the user from **"`npm run check:cws:ship` is red with content errors"** to **"green, ready to hand off to submission."** You do not submit. You do not zip. You do not touch code files other than `wxt.config.ts` and `entrypoints/welcome/config.ts`.

The factory's invariant: on a fresh clone, `check:cws:ship` fails with 4 content errors (`listing-ready-name`, `listing-ready-description`, `ship-ready-optional-host`, `ship-ready-welcome-config`). After a full cws-content run with realistic user input, it passes. That is the definition of done for this skill.

---

## Entry step — run the validator

**Before asking the user anything**, run:

```bash
npm run check:cws:ship -- --json
```

Parse the JSON. The envelope is:

```json
{
  "schemaVersion": 1,
  "mode": "ship",
  "rulesRun": 15,
  "summary": { "errors": 4, "warnings": 0 },
  "findings": [
    { "rule": "listing-ready-name", "severity": "error", "message": "...", "why": "...", "source": "...", "fix": "...", "locations": [] },
    ...
  ],
  "docUrl": "docs/09-cws-best-practices.md"
}
```

Rule ids are public API — **always branch on `finding.rule`, never on `finding.message`** (messages are for humans, rule ids are stable).

**Decision tree:**

- `summary.errors === 0` → Tell the user "`check:cws:ship` is green — nothing for cws-content to do. If you want to rewrite listing copy anyway, say so and I'll walk you through it." Stop.
- Any error with `rule` ∉ {`listing-ready-name`, `listing-ready-description`, `ship-ready-optional-host`, `ship-ready-welcome-config`} → Those are structural errors, not content. Tell the user: "`check:cws:ship` has errors that cws-content cannot fix: <list the rule ids and their `fix` field verbatim>. Fix those first, then come back." Stop.
- Otherwise, build a queue of content-rule findings and run the matching recipe for each, in this order (stable; don't reorder):
  1. `listing-ready-name` → Recipe A (value-prop → name).
  2. `listing-ready-description` → Recipe B (description drafting).
  3. `ship-ready-optional-host` → Recipe C (origins elicitation, **writes to two files in lockstep**).
  4. `ship-ready-welcome-config` → Recipe D (welcome-config walk-through).

After each recipe that successfully writes a file, **re-run the validator** (`npm run check:cws:ship -- --json`) and confirm the relevant rule id no longer appears in `findings`. If it still appears, something in the write went wrong; show the user the output and ask for guidance rather than guessing.

When the queue is drained, run the validator one final time. Report:
- Green: "All 4 content errors cleared. `check:cws:ship` passes. Run `npm run check:cws:ship` yourself to confirm. Next step: when ready to ship, invoke the `cws-ship` skill."
- Still red: list remaining findings verbatim and ask the user how to proceed.

---

## General interview principles (apply to every recipe)

- **Ask one question at a time** unless you're batching genuinely-related fields. Users drop off when faced with a form.
- **Always provide 2-3 concrete examples of good and bad answers** alongside each question. Bad examples calibrate the user toward specificity.
- **Draft, don't just request.** When the user gives you raw input, synthesize 2-3 candidates in different voices and ask them to pick or refine. Do not just parrot their input into the file.
- **Respect the length limits the validator enforces.** Name ≤45 chars. Description ≤132 chars (that's the CWS tile). Value prop is one sentence in plain language.
- **If the user refuses to answer** ("just put something reasonable", "I don't know", "skip it"), do NOT fabricate plausible-looking content. That violates the factory invariant. Respond: "I can't fill this in without your input — this is content a reviewer will read and users will see. Come back when you have a concrete answer. Skipping this recipe; the validator will still flag `<rule-id>`."
- **If the validator still fires the same rule after you write**, that means your write didn't match what the rule checks for. Read the rule's `fix` field from the JSON — it names the exact file/field. Show the user the current file contents and ask how to proceed. Do not loop blindly.

---

## Recipe A — `listing-ready-name`

**Rule fires when:** `manifest.name` is still `"My Extension"` (factory default).

**File write target:** `wxt.config.ts` → `manifest.name` field (top-level inside the `manifest` object).

**Quality criteria for a good name:**
- ≤45 characters (CWS enforces; the validator will flag >45 as a separate error).
- Concrete — names a benefit or surface, not a category. Bad: "Productivity Tool." Good: "PR Review Radar."
- Pronounceable out loud. If two humans can't agree on how it's pronounced, it's fighting search.
- No trademark risk. If it's "[Brand] + a noun" for a brand you don't own, stop and rename. (You can't pre-check trademarks reliably; use judgment. If the user says "GitHub Helper," push back: "GitHub is Microsoft's mark — call it something else or use 'for GitHub' as a tagline.")
- No SEO keyword-stuffing. "Best Free PR Reviewer Notifier for Chrome 2024" is obvious filler and CWS moderators downrank it.

**Interview prompts:**

Q1. "In one sentence, what does this extension do for its user? Aim for a concrete outcome, not a category."
- Good user answer: "Highlights GitHub PRs where I've been requested as a reviewer so I don't miss them."
- Bad user answer: "A productivity tool for developers." (too vague — push back, ask "productivity how? what specific thing does it do?")
- Bad user answer: "Makes GitHub better." (unfounded, not concrete — ask "better how? what's the specific problem it solves?")

Q2. Once you have a concrete value prop, draft **three candidate names** in different styles:
- **Outcome-focused** — what the user gets. (e.g., "Review Radar," "PR Nudge.")
- **Subject + function** — names what it does to what. (e.g., "PR Review Highlighter," "Reviewer Inbox.")
- **Short & punchy** — 1-2 words, memorable. (e.g., "Nudge," "PRight.")

Present candidates with a one-line rationale for each. Ask: "Any of these resonate? Want a different angle, or shall we iterate on one?"

Q3. Confirm the pick. Ask: "Going with `<picked name>`? Character count is `<N>` — under the 45-char limit. Writing it to `wxt.config.ts` now."

**Exact file write:**

Edit `wxt.config.ts`. Locate:
```ts
    name: 'My Extension',
```
Replace with:
```ts
    name: '<user-picked name>',
```

Do not touch other fields. Do not add new fields.

**Worked example 1:**

User says: "I built a tool that shows which GitHub PRs have me requested as a reviewer — so I don't miss review requests in email."

Skill drafts:
- Outcome: "Review Radar" — what it delivers (awareness of pending reviews).
- Subject+function: "PR Review Highlighter" — literal description.
- Short & punchy: "Nudge" — one word, brandable.

User picks "Review Radar." Character count: 12. Skill writes `name: 'Review Radar',` to `wxt.config.ts`.

**Worked example 2:**

User says: "A Chrome thing for browsing Hacker News better."

Skill pushes back: "What specifically does it do on HN? 'Better' isn't concrete enough — CWS reviewers and users will both bounce off a vague name. Does it hide read stories? Surface high-scoring threads? Filter by tag? Pick the one job it does best."

User clarifies: "It remembers which HN stories I've already opened and grays them out so I don't re-read them."

Skill drafts:
- Outcome: "Already Read" — the state change the user cares about.
- Subject+function: "HN Read Tracker" — literal.
- Short & punchy: "Seen" — one word, direct.

User picks "HN Read Tracker." Character count: 15. Skill writes `name: 'HN Read Tracker',` to `wxt.config.ts`.

---

## Recipe B — `listing-ready-description`

**Rule fires when:** `manifest.description` is still `"A brief description of what this extension does."` (factory default).

**File write target:** `wxt.config.ts` → `manifest.description` field.

**Quality criteria:**
- ≤132 characters (CWS tile cutoff; over 132 gets truncated mid-sentence in search).
- Front-loads the benefit (first ~40 chars is all that shows on mobile CWS pages).
- Plain language, no jargon. "Highlights PRs you need to review" beats "Leverages advanced heuristics to surface your outstanding review obligations."
- Does not start with "The best…" / "The only…" / superlatives. CWS moderators downrank these.
- Does not duplicate the name verbatim. If the name is "Review Radar" and the description is "Review Radar highlights PRs," you've wasted 14 chars.

**Interview prompts:**

Q1. If Recipe A ran first, you already have the value-prop sentence. Reuse it rather than re-interviewing.
   If Recipe A didn't run (user already had a name), ask:
   "In one sentence, what does this extension do for its user?" (Same prompt as Recipe A Q1.)

Q2. Draft **three candidate descriptions**, each ≤132 chars, each emphasizing a different aspect:
- **Problem-framed** — leads with the pain. ("Missed GitHub review requests? This surfaces every PR where you're tagged as a reviewer.")
- **Feature-framed** — leads with what it does. ("Highlights GitHub PRs awaiting your review, right on the PR list. No email digging.")
- **Outcome-framed** — leads with the user benefit. ("Never miss a PR review request again. See pending reviews at a glance on github.com.")

Show the character count beside each. Ask: "Which angle fits your users best? Want a different emphasis?"

Q3. Confirm the pick. Before writing, **double-check the length**: `description.length <= 132`. If the user wants to tweak and pushes over 132, tell them (don't silently truncate).

**Exact file write:**

Edit `wxt.config.ts`. Locate:
```ts
    description: 'A brief description of what this extension does.',
```
Replace with:
```ts
    description: '<user-picked description>',
```

Escape any single quotes in the user text (`'` → `\'`) or switch to double quotes if simpler. Preserve trailing comma.

**Worked example 1:**

Continuing "Review Radar" (the GitHub PR reviewer extension):

Skill drafts:
- Problem-framed: "Missed GitHub PR review requests get buried in email. This surfaces every PR awaiting your review on github.com." (112 chars)
- Feature-framed: "Highlights GitHub PRs awaiting your review, right on the PR list. No more digging through email notifications." (111 chars)
- Outcome-framed: "Never miss a PR review request. See which PRs need your review at a glance on github.com." (90 chars)

User picks outcome-framed. Skill writes `description: 'Never miss a PR review request. See which PRs need your review at a glance on github.com.',` to `wxt.config.ts`.

**Worked example 2:**

Continuing "HN Read Tracker":

Skill drafts:
- Problem-framed: "Re-reading HN stories you've already seen? This grays out opened threads so your feed only shows what's new." (108 chars)
- Feature-framed: "Remembers which Hacker News stories you've opened and fades them on news.ycombinator.com. Fresh content only." (109 chars)
- Outcome-framed: "See only what's new on Hacker News. Opened stories fade out automatically — your feed stays fresh." (98 chars)

User wants to tweak feature-framed to: "Remembers which HN stories you've opened and fades them out. Your feed stays fresh." (86 chars)

Skill writes `description: "Remembers which HN stories you've opened and fades them out. Your feed stays fresh.",` to `wxt.config.ts` (using double quotes because of the apostrophe in "you've").

---

## Recipe C — `ship-ready-optional-host`

**Rule fires when:** `optional_host_permissions` in `wxt.config.ts` still contains `"https://example.com/*"` (factory default).

**File write target — TWO FILES, MUST STAY IN LOCKSTEP:**
1. `wxt.config.ts` → `manifest.optional_host_permissions` array.
2. `entrypoints/welcome/config.ts` → `steps[].permissions.origins` for every step that requests host permissions.

If these two drift, the welcome page will request origins the manifest didn't declare, and the runtime request will silently fail. This is why the rule fires a single error covering both files: they are one unit.

**Quality criteria:**
- Origins must use MV3 match pattern syntax: `https://<domain>/*` or `https://*.<domain>/*`.
- List only origins the extension **actually reads or modifies**. "Might someday" is not a valid reason — reviewers will ask.
- Avoid broad patterns like `*://*/*`, `<all_urls>`, `https://*/*`. The structural validator (`host-permissions-breadth` rule) will catch those regardless; don't produce them.
- If the user needs multiple related origins (e.g., `github.com` and `gist.github.com`), ask: do they want one welcome-page step that requests both at once, or two separate steps? One step per conceptual surface reads cleaner for users.

**Interview prompts:**

Q1. "Which website(s) does this extension touch? I need the origins in manifest-match-pattern form. Example: `https://github.com/*` for github.com; `https://*.slack.com/*` for any Slack subdomain."
- Good user answer: "`https://github.com/*` only."
- Good user answer: "`https://news.ycombinator.com/*` and `https://hn.algolia.com/*`."
- Bad user answer: "all of them" → push back: "The validator blocks broad patterns. What's the minimal set the extension needs on day one? You can add more later."
- Bad user answer: "github.com" → ask: "Need the full match pattern — `https://github.com/*`? Or just the root? (Almost always you want the `/*` trailing.)"

Q2. For each origin, ask what justification you'll show the user at the welcome-page step:
"Why does the extension need access to `<origin>`? One specific sentence. 'Grant access' is not a justification. Example: 'So we can highlight PRs awaiting your review.'"

Q3. For each origin, suggest a CTA (button label) and a privacy note:
- CTA default: `"Allow on <origin-domain>"` — override if the user has a better one.
- Privacy note default: `"Nothing leaves your device."` if that's true; otherwise ask the user what the data-handling story is and write it plainly.

Q4. Generate a preview of both file writes and show the user before writing:
```
Writing to wxt.config.ts:
  optional_host_permissions: [<list>]

Writing to entrypoints/welcome/config.ts steps:
  [
    { id, label, justification, permissions.origins, privacyNote, cta } × N
  ]
```
Confirm before applying.

**Exact file writes:**

**File 1** — `wxt.config.ts`. Locate:
```ts
    optional_host_permissions: ['https://example.com/*'],
```
Replace array contents with the user-confirmed origin list. If there's only one, single-line; if multiple, multi-line:
```ts
    optional_host_permissions: [
      'https://github.com/*',
      'https://api.github.com/*',
    ],
```

**File 2** — `entrypoints/welcome/config.ts`. Locate the `steps: [...]` array inside `welcomeConfig`. Replace the single factory step:
```ts
  steps: [
    {
      id: 'host-example',
      label: 'Access to example.com',
      justification: 'So the extension can read and modify pages on example.com to provide its core feature.',
      permissions: { origins: ['https://example.com/*'] },
      privacyNote: 'Nothing leaves your device.',
      cta: 'Allow on example.com',
    },
  ],
```
with one step per origin (or one step per conceptual surface if the user batched related origins):
```ts
  steps: [
    {
      id: 'host-github',
      label: 'Access to github.com',
      justification: '<user-provided justification>',
      permissions: { origins: ['https://github.com/*', 'https://api.github.com/*'] },
      privacyNote: '<user-provided or default>',
      cta: '<user-provided or "Allow on github.com">',
    },
  ],
```

**Invariant to enforce:** the flat set of strings inside `optional_host_permissions` in `wxt.config.ts` must equal the union of all `steps[].permissions.origins` arrays in `entrypoints/welcome/config.ts`. Before writing, compute both sets and verify they match. If they don't match, your draft is wrong — fix it before writing, not after.

**Step id convention:** kebab-case, prefixed `host-`. Unique per step. Used as React key and storage discriminator — **do not reuse `host-example`**.

**Worked example 1:**

Continuing "Review Radar":

User says: "github.com only."

Skill asks for match pattern: "Confirming `https://github.com/*`? Or do you also touch `api.github.com` directly?"

User: "Just `github.com` — the extension scrapes the PR list DOM, no API calls."

Skill drafts justification: "So the extension can highlight PRs on github.com where you're a requested reviewer."

Skill confirms with user, then writes:

`wxt.config.ts`:
```ts
    optional_host_permissions: ['https://github.com/*'],
```

`entrypoints/welcome/config.ts`:
```ts
  steps: [
    {
      id: 'host-github',
      label: 'Access to github.com',
      justification: 'So the extension can highlight PRs on github.com where you\'re a requested reviewer.',
      permissions: { origins: ['https://github.com/*'] },
      privacyNote: 'Nothing leaves your device.',
      cta: 'Allow on github.com',
    },
  ],
```

**Worked example 2:**

User has an extension that touches both a Slack workspace URL pattern and a third-party status page.

User: "`https://*.slack.com/*` and `https://status.example.io/*`."

Skill: "Two separate steps, or one combined? Users understand 'access to Slack' and 'access to your status page' as distinct asks — I'd recommend two steps."

User: "Two steps."

Skill drafts justifications:
- Slack: "So we can inject incident banners into your Slack threads."
- Status page: "So we can read the current incident status and mirror it into Slack."

Writes:

`wxt.config.ts`:
```ts
    optional_host_permissions: [
      'https://*.slack.com/*',
      'https://status.example.io/*',
    ],
```

`entrypoints/welcome/config.ts`:
```ts
  steps: [
    {
      id: 'host-slack',
      label: 'Access to your Slack workspace',
      justification: 'So we can inject incident banners into your Slack threads.',
      permissions: { origins: ['https://*.slack.com/*'] },
      privacyNote: 'Nothing leaves your device.',
      cta: 'Allow on Slack',
    },
    {
      id: 'host-status',
      label: 'Access to your status page',
      justification: 'So we can read the current incident status and mirror it into Slack.',
      permissions: { origins: ['https://status.example.io/*'] },
      privacyNote: 'Read-only. Nothing leaves your device.',
      cta: 'Allow on status page',
    },
  ],
```

Note: lockstep verified — `{'https://*.slack.com/*', 'https://status.example.io/*'}` appears in both the manifest array and the union of step origin arrays. 

---

## Recipe D — `ship-ready-welcome-config`

**Rule fires when:** `entrypoints/welcome/config.ts` still contains any of: `"A brief one-sentence description"`, `"your-org"`, or `"your-extension"` (factory placeholder strings from the default config).

**File write target:** `entrypoints/welcome/config.ts` → `valueProp`, `activationSurfaces`, `links.repo`, `links.issues`, `links.privacy`.

Note: Recipe C already rewrites `steps`. If Recipe C ran first, the `steps` array no longer contains `example.com` but this recipe's placeholders (`valueProp`, `links.*`, `activationSurfaces`) can still be factory defaults. Handle them here.

**Quality criteria:**
- `valueProp` is one sentence, ≤120 chars ideally, same voice as the listing description but focused on the USER'S outcome (first time they meet the extension). Can reuse Recipe B output if appropriate.
- `activationSurfaces` is the list of specific URL patterns / surfaces the extension touches. Written in human language, not match patterns. "PRs on github.com" not "`https://github.com/*`". Bullets render verbatim.
- `links.repo` — real GitHub repo URL. If the user hasn't created one yet, ask them to — shipping without a repo URL looks abandoned. (Don't fabricate `github.com/your-org/your-extension`.)
- `links.issues` — usually `<repo>/issues`. Offer to auto-derive from `links.repo`.
- `links.privacy` — URL to the hosted privacy policy. **Do not invent a URL.** If the user hasn't hosted one yet, tell them: "You need to host a privacy policy before shipping. The factory includes a template at `docs/templates/privacy-policy.md`. Host it (GitHub Pages, your own domain, whatever) and come back with the URL." Until they have one, skip the write for `links.privacy` and leave the recipe incomplete — the validator will continue to flag it, which is the correct behavior.

**Interview prompts:**

Q1. "What's the one-sentence value prop users see when they install? Same voice as the CWS description but written to the user in the moment." Reuse Recipe B input if it reads naturally in this context.

Q2. "Where does the extension activate? Give me the user-facing surfaces in human language. Examples: 'Pull request pages on github.com'; 'news.ycombinator.com story feed'; 'Slack channel threads'. One per line."

Q3. "Where's the public repo for this extension?" — get `links.repo`. Derive `links.issues` as `<repo>/issues` unless they specify otherwise.

Q4. "Where's the privacy policy URL?" — if they don't have one, surface the template path and pause.

**Exact file writes:**

Edit `entrypoints/welcome/config.ts`. Inside the `welcomeConfig` export:

Replace:
```ts
  valueProp:
    'A brief one-sentence description of what this extension does for the user.',
```
with:
```ts
  valueProp: '<user-provided one-sentence value prop>',
```

Replace:
```ts
  activationSurfaces: [
    'example.com pages',
    // Add the actual URLs/surfaces this extension touches.
  ],
```
with:
```ts
  activationSurfaces: [
    '<surface 1>',
    '<surface 2>',
  ],
```
Remove the factory comment. No trailing `// Add the actual URLs…` comment.

Replace:
```ts
  links: {
    repo: 'https://github.com/your-org/your-extension',
    issues: 'https://github.com/your-org/your-extension/issues',
    privacy: 'https://your-org.example/privacy',
  },
```
with the user's real URLs. If privacy URL is unknown, do not write — leave the recipe incomplete.

**Worked example 1:**

Continuing "Review Radar":

Q1 — valueProp. Skill suggests reusing the description: "Never miss a PR review request. See which PRs need your review at a glance on github.com." User approves (93 chars, fine).

Q2 — activationSurfaces. User: "Pull request list and PR detail pages on github.com."
Skill writes: `['PR list and PR detail pages on github.com']` (one bullet — combining related surfaces is fine).

Q3 — repo. User: `https://github.com/cody/review-radar`.
Skill derives issues: `https://github.com/cody/review-radar/issues`.

Q4 — privacy. User: `https://cody.github.io/review-radar/privacy`.

Skill writes to `entrypoints/welcome/config.ts`:
```ts
  valueProp: 'Never miss a PR review request. See which PRs need your review at a glance on github.com.',
  activationSurfaces: [
    'PR list and PR detail pages on github.com',
  ],
  // steps: unchanged from Recipe C's write
  links: {
    repo: 'https://github.com/cody/review-radar',
    issues: 'https://github.com/cody/review-radar/issues',
    privacy: 'https://cody.github.io/review-radar/privacy',
  },
```

**Worked example 2:**

User's extension: HN Read Tracker. User hasn't hosted a privacy policy.

Q1 — valueProp: "See only what's new on Hacker News — stories you've opened fade out automatically."

Q2 — activationSurfaces: "Story feed and comments pages on news.ycombinator.com."

Q3 — repo: `https://github.com/asha/hn-read-tracker`. Derive issues.

Q4 — privacy. User: "Uh, I haven't set one up."

Skill: "You need a hosted privacy policy URL before shipping — CWS requires it. There's a template at `docs/templates/privacy-policy.md` you can adapt and host (GitHub Pages is easiest — point a repo at it). Once you have the URL, invoke me again. For now I'll skip writing `links.privacy` and the validator will keep flagging `ship-ready-welcome-config` until it's filled in."

Skill writes everything except `links.privacy`, then tells the user: "Re-running the validator now — expect `ship-ready-welcome-config` to still fire. Fix it by hosting the policy and pasting the URL."

(This is correct behavior. Factory invariant says: don't fabricate plausible content to make the validator green. Let it stay red until the user has a real answer.)

---

## End-to-end worked example (fictional "Review Radar" extension)

This traces one complete cws-content run, showing initial validator state, each recipe execution, and final validator state. It's both test evidence and user-facing documentation of what a successful run looks like.

### Initial state (fresh factory clone)

User runs:
```bash
npm run check:cws:ship -- --json
```

Output (abbreviated):
```json
{
  "schemaVersion": 1,
  "mode": "ship",
  "rulesRun": 15,
  "summary": { "errors": 4, "warnings": 0 },
  "findings": [
    {
      "rule": "listing-ready-name",
      "severity": "error",
      "message": "manifest.name is still the factory default (\"My Extension\")",
      "fix": "Set `manifest.name` in `wxt.config.ts` to your real extension name."
    },
    {
      "rule": "listing-ready-description",
      "severity": "error",
      "message": "manifest.description is still the factory default",
      "fix": "Write a real description in `wxt.config.ts` (≤132 chars; this is the CWS tile)."
    },
    {
      "rule": "ship-ready-optional-host",
      "severity": "error",
      "message": "optional_host_permissions still contains the factory example (`https://example.com/*`)",
      "fix": "Replace with the real origin(s) your extension needs in `wxt.config.ts`. Also update `entrypoints/welcome/config.ts` steps to match."
    },
    {
      "rule": "ship-ready-welcome-config",
      "severity": "error",
      "message": "entrypoints/welcome/config.ts still contains factory placeholder(s): \"A brief one-sentence description\", \"your-org\", \"your-extension\"",
      "fix": "Edit `entrypoints/welcome/config.ts`: set `valueProp`, `activationSurfaces`, `steps`, and real `links` for repo/issues/privacy. Or delete `entrypoints/welcome/` entirely if you don't want a welcome flow."
    }
  ]
}
```

User invokes cws-content. Skill parses → queues Recipes A, B, C, D.

### Recipe A — listing-ready-name

Skill: "In one sentence, what does this extension do for its user?"

User: "Highlights GitHub PRs where I've been requested as a reviewer so I don't miss them."

Skill: "Three name candidates:
1. **Review Radar** — outcome (awareness of pending reviews).
2. **PR Review Highlighter** — literal description.
3. **Nudge** — short, punchy, brandable.

Which fits, or want me to iterate?"

User: "Review Radar."

Skill writes `name: 'Review Radar',` to `wxt.config.ts` line 8.

Re-runs validator: 3 errors remaining (name rule gone).

### Recipe B — listing-ready-description

Skill (reusing value prop): "Three descriptions:
1. **Problem-framed** (112 chars): 'Missed GitHub PR review requests get buried in email. This surfaces every PR awaiting your review on github.com.'
2. **Feature-framed** (111 chars): 'Highlights GitHub PRs awaiting your review, right on the PR list. No more digging through email notifications.'
3. **Outcome-framed** (90 chars): 'Never miss a PR review request. See which PRs need your review at a glance on github.com.'"

User: "3."

Skill writes `description: 'Never miss a PR review request. See which PRs need your review at a glance on github.com.',` to `wxt.config.ts` line 9.

Re-runs validator: 2 errors remaining.

### Recipe C — ship-ready-optional-host

Skill: "Which origins does the extension touch? Match-pattern form (e.g., `https://github.com/*`)."

User: "`https://github.com/*` only."

Skill: "Justification the user sees at the welcome step? One sentence. Example: 'So we can highlight PRs awaiting your review.'"

User: "Yeah, that one works."

Skill drafts preview, user confirms. Skill writes to both files:

`wxt.config.ts` line 16:
```ts
    optional_host_permissions: ['https://github.com/*'],
```

`entrypoints/welcome/config.ts` steps array:
```ts
  steps: [
    {
      id: 'host-github',
      label: 'Access to github.com',
      justification: 'So we can highlight PRs awaiting your review.',
      permissions: { origins: ['https://github.com/*'] },
      privacyNote: 'Nothing leaves your device.',
      cta: 'Allow on github.com',
    },
  ],
```

Re-runs validator: 1 error remaining (`ship-ready-welcome-config` — `valueProp` / `links.*` still placeholder).

### Recipe D — ship-ready-welcome-config

Skill: "One-sentence value prop for the welcome page? Reuse the description you picked, or rewrite?"

User: "Reuse."

Skill: "Activation surfaces — user-facing. Example: 'PR list and PR detail pages on github.com'."

User: "Yep, exactly that."

Skill: "Repo URL? Privacy policy URL?"

User: "`https://github.com/cody/review-radar` and `https://cody.github.io/review-radar/privacy`."

Skill derives issues URL. Writes to `entrypoints/welcome/config.ts`:
```ts
export const welcomeConfig: WelcomeConfig = {
  valueProp: 'Never miss a PR review request. See which PRs need your review at a glance on github.com.',
  activationSurfaces: [
    'PR list and PR detail pages on github.com',
  ],
  steps: [
    {
      id: 'host-github',
      label: 'Access to github.com',
      justification: 'So we can highlight PRs awaiting your review.',
      permissions: { origins: ['https://github.com/*'] },
      privacyNote: 'Nothing leaves your device.',
      cta: 'Allow on github.com',
    },
  ],
  links: {
    repo: 'https://github.com/cody/review-radar',
    issues: 'https://github.com/cody/review-radar/issues',
    privacy: 'https://cody.github.io/review-radar/privacy',
  },
};
```

Re-runs validator. Final state:
```json
{
  "schemaVersion": 1,
  "mode": "ship",
  "rulesRun": 15,
  "summary": { "errors": 0, "warnings": 0 },
  "findings": [],
  "docUrl": "docs/09-cws-best-practices.md"
}
```

Skill reports: "All 4 content errors cleared. `check:cws:ship` passes. When ready to submit, invoke the `cws-ship` skill."

---

## Failure-mode notes (things that can go wrong)

- **Validator still fires after a write.** Read the current file contents; compare to what you wrote; if they don't match, the Edit tool's `old_string` didn't match the current file. This usually means a previous recipe touched the same line and your `old_string` is stale. Re-read the file before editing.

- **User refuses or deflects all questions for a recipe.** Skip that recipe. Report the skipped rule in the final summary. Do not fabricate.

- **User wants to rewrite listing copy that's already customized.** cws-content is triggered by validator errors — if the validator is green, tell the user "nothing for cws-content to do." If they insist ("I want better copy anyway"), you can run the recipes without the validator gate, but be clear: "I'm going to run these even though the validator is green. Current values: <show them>. We'll overwrite."

- **User wants to delete `entrypoints/welcome/` rather than fill it in.** That's a valid factory strip-down (documented in `docs/01-extension-type-profiles.md`). Tell them: "Delete `entrypoints/welcome/` entirely and remove the `tabs.create` block in `entrypoints/background.ts`. The validator's `welcomeConfigReadyForSubmission` rule only fires when the config file exists, so stripping it passes the check." Do NOT perform this deletion yourself — it's outside this skill's write scope.

- **Validator reports structural errors, not just content.** cws-content does not fix structural errors (broad permissions, CSP, remote code, etc.). Surface them verbatim and stop. The user either fixes them manually or uses a different skill once one exists (none exists today).

---

## What this skill does NOT do

- Does not run `npm run zip` or `wxt submit`. That's `cws-ship` (future skill).
- Does not generate screenshots. That's `cws-screens` (future skill).
- Does not handle OAuth secrets, publishing, or version bumps. That's `cws-ship`.
- Does not modify any file other than `wxt.config.ts` and `entrypoints/welcome/config.ts`.
- Does not add or modify validator rules. Rule ids are public API; changes coordinate with ARCHITECTURE.md.
- Does not invent privacy policy URLs, repo URLs, or any user-facing content. If the user doesn't provide a value, the recipe skips and the validator stays red.
