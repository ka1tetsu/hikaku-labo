# Vivlica agents / design & editorial instructions

Read `PRODUCT.md` and `DESIGN.md` before changing any public-facing UI or copy.

The site assistant is a **rules engine**: do not advertise it as a generative LLM. Cite actual source URLs for numeric claims and label mathematical examples as fictional. Do not claim all-price coverage, first-hand testing, earned commission, or guaranteed cheapest rates. Do not remove A8 affiliate disclosure or alter the supplied advertisement HTML.

**Impeccable**: from a trusted local checkout, use `npx impeccable@4.7.0 install -y --providers=codex --scope=project --no-hooks`, then run `/impeccable init` in a supported AI coding harness to revise product/design context as needed. The repository already includes hand-authored PRODUCT.md and DESIGN.md for the current project. For inspections without installing agent skills, use `npx impeccable@4.7.0 detect --json src/ guides/`; scan source *and* a mobile-width rendered page where browser access is available. `DO_NOT_TRACK=1` disables optional telemetry.

For CI, see `.github/workflows/impeccable.yml`: all site UI sources get a full report. New primary findings relative to the base commit are blocked; existing findings must be reduced gradually, never suppressed with broad ignore-rules.

The detector alone does not verify visual quality: check source-data correctness, screen readers, keyboard navigation, long Japanese strings, form labels, 375px mobile layouts, clear source/price disclaimers, and monetization placement.
