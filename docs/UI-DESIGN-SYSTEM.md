# Hikaku Labo — Unified UI/UX design system

## Scope (all currently published entrypoints in this repository)

- [商品・ショッピング](/) — search, categorized product discovery, product detail cards, comparison table, affiliate disclosure.
- [ITツール診断](/tools/) — criteria form, ranked explanation cards, comparisons, official/advertising links.
- [旅行予算](/travel/) — total-budget calculator, costs, reservation advice and exact A8.net creative slots.

The project does **not** redesign unconnected GitHub repositories.

## Design sources (and what is actually reused)

1. **Tabler** (MIT): [tabler/tabler](https://github.com/tabler/tabler) — visual design-system references for cards, navigation, dense information and responsive admin/consulting-style layouts. This project's styles are original CSS implementations, not a wholesale vendor copy.
2. **Tabler Icons** (MIT): [tabler/tabler-icons](https://github.com/tabler/tabler-icons) — **actual unmodified source SVGs** used for shopping, services, travel, search, CTAs. Vendor files and the complete original MIT license are at `public/icons/tabler/`.
3. **IBM Carbon Design System**: [carbon-design-system/carbon](https://github.com/carbon-design-system/carbon) — reference for accessible content hierarchy, table density, form control consistency and interaction guidelines, not embedded source code.
4. **shadcn/ui** (MIT): [shadcn-ui/ui](https://github.com/shadcn-ui/ui) — reference for neutral surfaces, interaction states and accessible component composition. Not an installed dependency; avoid suggesting it is imported.

Because only the Tabler icons were copied, the original MIT license is carried with them. Styling is intentionally dependency-light. This avoids introducing heavy Bootstrap/Tailwind bundles into an existing Vite/React storefront.

## Tokens and layout

Shared entrypoint chrome and tokens in `src/shared/foundation.css`:

- Ink `#162b28`, forest `#14664f`, border `#dce5e1`, neutral background `#f6f8f7`.
- 12–16px small controls and labels, 15px base paragraph, larger heading contrast; user-form helper text is >=12px in refreshed layouts.
- Navigation persists and uses `aria-current=page`; mobile nav stays horizontally accessible (never hidden).
- Main-content skip link for keyboard navigation on **all three entrypoints**.
- Product comparison tables stay horizontally scrollable and remain usable from keyboard.
- Actual external affiliate links / pixel tracking HTML are unmodified. The presentation of PR advertising is retained.

Page-specific overlays:

- `src/shared/home-refresh.css`: consulting directory, product cards, search, comparisons.
- `src/shared/tools-refresh.css`: selection form, rank cards, reasoning hierarchy, responsive comparison.
- `src/shared/travel-refresh.css`: trip budget inputs, costs, FAQ and A8 ads.

## Visual and interaction validation checklist

- Desktop viewport 1440px, tablet 768px, small mobile 375px: no horizontal clipping in main text or buttons.
- Tab through the shared nav, search, category controls, comparison buttons, calculator inputs and FAQ summaries. Verify focus ring, skip link and operation without a mouse.
- Home: search results, compare 2+ products, change sort, test pagination, scroll comparison table on narrow view.
- Tools: choose 3 different purposes, budgets and priorities, compare two candidates, inspect disclosure and advertiser labels.
- Travel: change all 7 budget controls; verify total and per-person values. Confirm A8 **original HTML snippet** is still present; do not change tracking parameters or pixels.
- Check `npm run test:all`, `npm run lint`, `npm run build`, then check live HTTP 200 for `/`, `/tools/`, `/travel/`.

## Revenue disclaimer

A beautiful interface and an affiliate link cannot prove actual earnings. A8.net and other ASP approvals, valid click tracking, conversions and **settled commission** must be confirmed in their own dashboards. Do not fabricate testimonials, awards, rankings or conversions.
