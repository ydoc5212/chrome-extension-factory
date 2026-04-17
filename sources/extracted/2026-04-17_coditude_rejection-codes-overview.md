---
extracts:
  - sources/blogs/2026-04-17_coditude_rejection-codes-overview.md
extracted_at: 2026-04-17
title: "CWS rejection-code decoder: color→element→violation category mapping"
author: Coditude (Hrishikesh Kale et al.)
url: https://www.coditude.com/insights/chrome-web-store-rejection-codes/
evidence_class: c
topics:
  - cws-review
  - rejection-codes
  - policy-enforcement
  - quick-reference
feeds_docs:
  - docs/03-cws-best-practices.md
---

# Coditude — The systematic decoder table for CWS rejection codes (color → element → violation category → fix)

## TL;DR

Google assigns **color-element names** (Blue Argon, Purple Potassium, Yellow Zinc, etc.) to Chrome Web Store rejection codes. Coditude is the only public source that maps the common codes to their **violation category + common cause + quick-fix checklist** in table form. The color is the policy family (Blue = MV3/code, Purple = privacy, Red = single-purpose, Yellow = packaging/metadata, Grey = cryptomining, Blue-secondary = prohibited products); the element is the specific rule. This extraction is the canonical quick-reference for "what does this rejection email mean and what do I fix?"

## Signal

The single most useful artifact from Coditude is their decoder table. Reproduced here as a direct reference the factory can lift into `docs/09`:

| Code | Violation category | Common cause | Quick fix |
|---|---|---|---|
| **Blue Argon** | MV3 additional requirements | Remote-hosted code, `<script src>` from CDN, `eval` | Keep all logic in ZIP, bundle SDKs locally, remove `eval`/`new Function` |
| **Yellow Magnesium** | Functionality / packaging | Missing files, broken build, wrong manifest paths | Test packed build locally, verify all manifest.json references, add reviewer test steps |
| **Purple Potassium** | Excessive/unused permissions | Over-requesting host_permissions, unused APIs | Limit to `activeTab` or narrow scopes, remove unused, justify sensitive |
| **Yellow Zinc** | Metadata | Missing title, poor description, no screenshots/icons | Clear description, quality images, required icons |
| **Red Magnesium / Copper / Lithium / Argon** | Single-purpose | Multiple features, ad injection, NTP replacement with extras | Keep extension focused; split features into separate submissions |
| **Purple Lithium / Nickel / Copper / Magnesium** | User data privacy | No privacy policy, unclear consent, insecure handling | Publish privacy policy, disclose data use, HTTPS only, minimize collection |
| **Grey Silicon** | Cryptomining | Embedded miners, hidden mining scripts | Remove all mining functionality (disallowed) |
| **Blue Zinc / Copper / Lithium / Magnesium** | Prohibited products | Paywall bypass, piracy tools, IP violations | Remove violating functionality or unpublish |

**Reading a rejection email:**
1. Code appears in the email body (e.g., "White Lithium" — the overview didn't fully define this one; treat White as a catch-all code family for submissions that lack a clear violation match).
2. Developer Dashboard → Status tab gives additional detail.
3. Match color → policy family, element → specific rule, then go to the fix column.

**Coditude's "common causes" list** (which generalizes across the table):
1. Packing mistakes (untested .zip, wrong file names)
2. Permission creep (tabs/history/all-sites unnecessarily)
3. Vague metadata ("best extension for Chrome")
4. MV3 violations (remote code, `eval`)
5. Lack of privacy protection (collecting without consent/docs)
6. Multi-purpose packaging (ads + NTP + coupons in one extension)

**Coditude's pre-resubmission QA checklist** (factory should ship a version of this):
- Install the packed `.zip` locally in Chrome before resubmit
- Verify every file path in `manifest.json` (case-sensitive on some filesystems)
- Audit permissions: remove unnecessary, justify sensitive, prefer `optional_*` where possible
- Complete listing: title, description, screenshots, icons — all present and professional
- Active privacy-policy link, clear data-handling explanation, HTTPS-only
- Single purpose at maximum efficiency

**Coverage gap noted in the mining report:** Coditude does not have Red-family (deceptive/impersonation) or Grey/Gray-family individual posts — only a mention in the overview table. If a factory user gets a Red Nickel/Potassium/Silicon rejection, Coditude has no deep-dive; fall back to Palant's moderation posts and Google's docs.

## Key quotes

> "Google has made it easier by assigning color-element names like Blue Argon, Purple Potassium, Yellow Zinc to Chrome Web Store rejection codes. Each rejection code is mapped to a specific type of violation as well as hints regarding how to fix it."
> — Coditude overview

> "Before hitting 'Resubmit' in your dashboard, go through this mini-QA to avoid repeat rejections... The developer needs to test the complete functionality of the packed build by installing the .zip file in Chrome's local environment."
> — Coditude, on pre-resubmission checklist

## Implications for the factory

- **For `docs/03-cws-best-practices.md`:** add a dedicated "Rejection-code decoder" subsection. Paste the decoder table above (Coditude's table, with our citation) and reference this extraction. This is the single most useful quick-reference for a stressed developer reading a rejection email — put it front-and-center.
- **For `docs/03-cws-best-practices.md` (or a new `docs/12-rejection-recovery.md`):** build the full "you got rejected, what now?" playbook using Coditude's QA checklist as the starting point. Include the email-structure breakdown (code, description, next steps) and the Dashboard → Status-tab location.
- **For `scripts/validate-cws.ts`:** each validator rule should emit a likely **color-element code** in its failure message, not just a description. E.g., instead of "broad host permissions detected," emit "likely Purple Potassium: excessive/unused permissions — scope to activeTab or narrow patterns." This maps our local check to the CWS vocabulary reviewers use.
- **For the template itself:** the factory's `docs/templates/qa-checklist.md` should include Coditude's pre-resubmission items, especially "install the packed .zip locally in Chrome before resubmit" — that one catches packing mistakes that the unzipped dev build doesn't surface.

## Provenance

- **Raw capture:** [`../blogs/2026-04-17_coditude_rejection-codes-overview.md`](../blogs/2026-04-17_coditude_rejection-codes-overview.md)
- **Original URL:** https://www.coditude.com/insights/chrome-web-store-rejection-codes/
- **Wayback:** (see raw capture frontmatter)
- **Related captures** (individual color-family posts we also have, not yet extracted): `sources/blogs/2026-04-17_coditude_blue-series-prohibited-products.md`, `.../blue-argon-mv3.md`, `.../purple-family-privacy.md`, `.../purple-potassium-permissions.md`, `.../yellow-zinc-metadata.md`. No Coditude posts exist for Red or Grey families as of Apr 2026.
- **Related extracted:** `sources/extracted/2026-04-16_palant_01-13-chrome-web-store-is-a-mess.md` (the moderation-reality frame that Coditude's clean table doesn't capture).
