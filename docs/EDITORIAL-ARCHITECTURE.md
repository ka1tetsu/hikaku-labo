# Architecture of Vivlica comparison UX (2026-10-29)

## Decision
Keep the current multipage React/Vite and Vercel APIs. It already supports prerendered distinct routes, preserves direct affiliate tracking and isolates shopping, telecom, software, travel and corporate-data logic. Converting everything to Next.js or one large SPA would increase deployment risk without an identified user benefit.

## Shared layers
1. **Verified information**: `src/shared/evidenceContent.js` explains sources, calculations, exclusions, and next checks in the shared header; no engine claims a missing price or availability.
2. **Shared presentation**: `src/shared/DecisionEvidence.jsx` reads `editorialPanels.js` and uses `DecisionEvidence.css` on the tools/travel hero. Both present three practical conditions rather than fake visualizations. The content is separately verified per section, so a unified component does not falsely unify data.
3. **Global identity**: `foundation.css` supplies ink, evergreen, paper, line, focus and spacing tokens; section CSS only owns product-specific widgets. Home choices are ruled editorial entries; product cards remain boxed when displaying actual offers.
4. **Commercial boundary**: Business calculation, external URLs, scripts, affiliate snippets, source disclosures and event payloads are not rewritten to make the UI prettier.
5. **Quality evidence**: Impeccable 4.8.0 with full-site baseline comparisons (rule from `antipattern` JSON); Chromium tests run 16 entrypoints × mobile/tablet/desktop and five real user journeys. Screenshots are saved as artifacts. No test result implies actual ASP commissions.

## Verification and rollout
- `npm run test:all`
- `npm run lint`
- `npm run build` and `npm run verify:build`
- `npm run audit:affiliate`
- `npm run audit:design` (a nonzero code may mean existing findings: consult the CI baseline comparison)
- `.github/workflows/browser-design-qa.yml` screenshots + overflow and journey report.

Release only after green CI and meaningful mobile/desktop screenshot review. These changes are prepared on a branch, not automatically pushed to production. The former PR #31 was created against an earlier main and should not be blindly merged over the newer evidence-first work.
