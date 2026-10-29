# Vivlica — visual and content design direction

This document describes an existing multi-product comparison interface, **not** a license to change verified prices or hide ads.

## Design intent
An editorial comparison desk, not a SaaS landing-page template. Prioritize scannability of evidence, actual totals, source links, and the choice a visitor can take next. The interface should feel precise and quietly confident, not generic or theatrical.

## Layout and hierarchy
- Give one task per main section: input condition → compared result → explanation of calculation → official confirmation.
- Use substantial whitespace to separate major sections, but avoid multiple nested card shells. Cards are for distinct comparable offers only; evidence, FAQs, and disclosures can be plain ruled lists or two-column editorial text.
- Put the **basis** of a price close to the number: per night vs total, before/after points, tax inclusion, data provider and observed date.
- Put a real call to action next to the result, not an arbitrary "Start now" button.
- On mobile, labels stay readable, tap targets are at least 44px, tables scroll, and one primary action remains clear.

## Visual direction
- Warm off-white page grounds, paper-white reading surfaces, deep pine/ink text (#162b28), evergreen actions (#14664f) and restrained neutral dividers.
- A sage or cream section can identify a distinct category, not merely decorate a statistic.
- Prefer Japanese-appropriate **Noto Sans JP** for UI and readable text and a restrained typographic contrast for editorial articles where needed. Avoid imposing Inter/Roboto on every element.
- Reserve dark-to-light contrast for actual meaning; never use muted gray text on saturated backgrounds.
- Avoid purple-blue gradients, glow/bounce animation, excessive rounded icon tiles, gratuitous "01/02/03" process cards, badges for obvious facts, and gratuitous oversized Latin buzzwords.
- Prefer horizontal rules, small metadata, and ordinary text headings over decorative card grids.
- Respect keyboard focus, legible line lengths and reduced motion. Never make focus outlines depend only on hover.

## Voice / writing
- Lead with the actual comparison question and answer, not "未来を変える" or "最先端の体験".
- Say "この候補に限り" rather than "業界最安". Say "初泊参考額" rather than "旅行総額".
- Explain who may rationally choose a costlier option: return policy, location, support, cancellation, data quality.
- Show one concrete and verifiable example instead of six interchangeable generalities.
- When the text was AI-assisted, do not cosmetically launder it. Rewrite using documented calculations, exclusions, sourcing and operator decisions.
- Clearly label sponsored links and never imply affiliate approval from a badge or a provider logo.

## Cross-site interaction patterns
Products: user model/name search and source-backed item detail.
Travel: exact party/dates/room/meal/cancellation terms and displayed "total" vs night price.
Telecom: monthly plan base vs extra service/discount and address eligibility.
IT tools: declared fit score with published rubric; missing prices stay missing.
Enterprise data: explicit provenance and separation from investment advice.

## Current limitations
Existing CSS predates this guide and may contain small text, Inter declarations, card nesting and decorative labels. Do not mark the entire existing site "clean" until the actual Impeccable detector report and visual mobile checks confirm it. Narrow, evidenced exceptions only.

Impeccable: https://github.com/pbakaus/impeccable (Apache-2.0). Read PRODUCT.md for source of truth.
