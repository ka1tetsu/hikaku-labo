# DESIGN — Vivlica editorial visual system

A credible Japanese comparison journal, not a generic AI-generated SaaS dashboard.

## Identity
Deep forest green (#14664f) for actions, ink (#162b28), secondary copy (#536860 on light surfaces), neutral paper (#ffffff), canvas (#f6f8f5), and dividers (#dce5e1). Maintain recognizable existing Vivlica branding.

## Typography
Noto Sans JP with Japanese OS fallbacks is the shared body face. Establish hierarchy through size, weight, line-height and column proportions. Inter, Roboto, ornamental gradient lettering, and oversized English microcopy are not part of the visual direction.

## Layout and interaction
- Prefer editorial rows, divider rules, aligned data columns and concise annotations to nested cards.
- Reserve enclosed surfaces for forms, comparison results, products and clear disclosures; avoid decorative shadows and unnecessary icon tiles.
- Favor flat, high-contrast hero colors over stock gradients, purple-to-cyan palettes, and glows.
- Keep controls comfortably touchable (target approximately 44px), visible :focus-visible, semantic headings and reduced-motion support.
- Preserve source attribution, advertiser labels, affiliate links and actual commercial workflows.

## Scope
Home, /compare/, /sim/, /hikari/, /card/, /hoken/, /life/, /tools/, /travel/, hotel search/detail, guides, company information, and the source Next.js prototype.

## QA
Review desktop 1440px, tablet 768px, mobile 375px. Check tab navigation, search/filter/sort, comparison, affiliate disclosures, travel forms, hotel pages and long guides. Run tests, lint, build and Impeccable detection. New primary findings fail CI; inherited findings remain visible until addressed.
