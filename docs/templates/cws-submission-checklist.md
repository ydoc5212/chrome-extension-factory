# Chrome Web Store Submission Checklist

## Before submitting
- [ ] Version bumped in package.json
- [ ] `npm run compile` passes (no TypeScript errors)
- [ ] `npm run build` succeeds
- [ ] `npm run check:cws:ship` passes (zero errors — see [09-cws-best-practices.md](../09-cws-best-practices.md))
- [ ] Extension tested as unpacked (load from .output/chrome-mv3/)
- [ ] QA checklist passed (see qa-checklist.md)
- [ ] Privacy policy URL is live and reachable
- [ ] Support URL or email is valid

## CWS Privacy Section
- Personal or sensitive user data collected: [Yes/No]
- Data sold to third parties: No
- Data used for purposes unrelated to core functionality: No
- Creditworthiness or lending use: No

## URLs
- Homepage: [URL]
- Privacy policy: [URL]
- Support: [URL or email]

## Build & Upload
- [ ] `npm run zip` to create submission package
- [ ] Upload .output/[name]-[version]-chrome.zip to CWS dashboard
- [ ] Fill all listing fields
- [ ] Upload screenshots (1280x800)
- [ ] Submit for review
