---
extracts:
  - sources/blogs/2026-04-17_coditude_blue-series-prohibited-products.md
extracted_at: 2026-04-17
title: "Blue Series (Zinc/Copper/Lithium/Magnesium): prohibited-products rejections are unfixable at the code level"
author: Hrishikesh Kale (Coditude)
url: https://www.coditude.com/insights/blue-series-prohibited-products-in-the-chrome-web-store/
evidence_class: c
topics:
  - cws-review
  - rejection-codes
  - prohibited-products
  - policy-enforcement
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Coditude — Blue Series (non-Argon) rejections are policy verdicts on the feature itself, not code problems

## TL;DR

**Blue Zinc / Blue Copper / Blue Lithium / Blue Magnesium** rejections categorize the extension as a **prohibited product**: paywall bypass, DRM circumvention, ad-revenue interference, unauthorized SaaS access, piracy/unlicensed content distribution. Unlike other color families, these cannot be fixed by trimming permissions or rewriting code — the *functionality itself* is against CWS policy. The only remedies are (a) remove the violating feature, (b) split the extension so compliant features survive, or (c) reposition to a distribution channel outside CWS (desktop app, self-hosted tool, enterprise deployment). Framing the feature as "educational" or "research" does not change the outcome.

## Signal

Coditude is explicit that the Blue Series (excluding Blue Argon, which is MV3/code) is an **informal reviewer classification** — not a public label — for functionality that attacks another party's monetization or content-access model. The test is intent-based: reviewers evaluate **what the feature does**, not how it's implemented.

The self-check Coditude offers is the cleanest single question for developers evaluating risk before they write the code:

> "Does my extension give access to something users normally must pay for?"

If the answer is yes — even partially — the extension is at risk. Supporting diagnostics: does it modify how a site earns revenue, extract non-public content, replicate paid-tier features, or remove restrictions meant to gate access?

Concrete patterns Coditude flags as reliable Blue Series triggers:
- "Premium article access" on media publisher sites
- Video downloaders for DRM-protected streaming platforms
- Replacing third-party ads with your own ads
- Unlocking paid SaaS tiers without payment
- Scraping behind member-login paywalls

Coditude's stance on repositioning is the nuanced part: the policy can't be circumvented within CWS, but the same code may be legitimate in **private enterprise, desktop, or self-hosted contexts** where CWS policies don't apply. That's the honest way to tell a user "this can't ship to the store" without telling them "your code is worthless."

## Key quotes

> "A Blue Series rejection (Blue Zinc / Blue Copper / Blue Lithium / Blue Magnesium) indicates that your extension has been categorized as a prohibited product. This is not one of those cases where metadata fixes, permission trimming, or code clean-up will make the extension pass. Here, the functionality itself is against Chrome Web Store policy."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Even if these features are positioned as 'educational,' 'research,' or 'for convenience,' the policy is enforced the same way."
> — Hrishikesh Kale, Coditude, 2026-04-17

> "Chrome reviewers may not look at how the feature is implemented, they evaluate what the feature does and whether that purpose aligns with legal use."
> — Hrishikesh Kale, Coditude, 2026-04-17

## Implications for the factory

- **For `docs/03-cws-best-practices.md` → "Spam & deceptive behavior" / prohibited-products coverage:** add a Blue Series subsection with Coditude's self-check question and the enumerated prohibited-functionality list. Call out explicitly that these rejections are **not code-fixable** — the factory's validator cannot detect intent, so this one is a pre-development conversation, not a pre-submission lint.
- **For `scripts/validate-cws.ts`:** no mechanical rule maps here. Consider a documentation-only "pre-build" checklist item that appears in README/init output: "Before building, confirm your extension does not bypass paywalls, DRM, or third-party monetization." Intent is out of scope for the validator.
- **For the template itself:** add a "prohibited-products smoke test" note to `docs/01-extension-type-profiles.md` so users pick a project profile after vetting policy alignment.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_coditude_blue-series-prohibited-products.md`](../blogs/2026-04-17_coditude_blue-series-prohibited-products.md)
- **Original URL:** https://www.coditude.com/insights/blue-series-prohibited-products-in-the-chrome-web-store/
- **Wayback:** https://web.archive.org/web/20260417001813/https://www.coditude.com/insights/blue-series-prohibited-products-in-the-chrome-web-store/
- **Related extracted:** `sources/extracted/2026-04-17_coditude_rejection-codes-overview.md` — the parent decoder table.
